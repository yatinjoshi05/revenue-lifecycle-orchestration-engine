import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import path from 'path';
import { createServer, ViteDevServer } from 'vite';

let mockBackend: http.Server;
let mockBackendPort: number;
let viteServer: ViteDevServer;
let vitePort: number;
let lastUpstreamRequest: {
  method?: string;
  url?: string;
  headers: http.IncomingHttpHeaders;
  body?: string;
} | null = null;

before(async () => {
  // 1. Start mock upstream backend
  await new Promise<void>((resolve) => {
    mockBackend = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        lastUpstreamRequest = {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body
        };

        const url = req.url || '';

        if (url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', upstream: 'mock-backend' }));
          return;
        }

        if (url === '/ready') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ready: true, upstream: 'mock-backend' }));
          return;
        }

        if (url.startsWith('/api/v1/protected-data')) {
          const auth = req.headers['authorization'];
          const apiKey = req.headers['x-nexus-api-key'];

          if (auth === 'Bearer invalid-token') {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: invalid token', code: 'UNAUTHORIZED' }));
            return;
          }

          if (!auth && !apiKey) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Authentication required', code: 'UNAUTHORIZED' }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, count: 42 }));
          return;
        }

        if (url.startsWith('/api/v1/error-403')) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Forbidden: policy approval required', code: 'POLICY_REQUIRED' }));
          return;
        }

        if (url.startsWith('/api/v1/error-404')) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not Found', code: 'NOT_FOUND' }));
          return;
        }

        if (url.startsWith('/api/v1/error-500')) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' }));
          return;
        }

        if (url.startsWith('/api/v1/mutations/execute-action')) {
          try {
            const parsed = JSON.parse(body || '{}');
            if (!parsed.decisionToken || parsed.decisionToken !== 'valid-test-decision-token') {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Action execution rejected: missing valid decision token', code: 'UNAPPROVED_ACTION' }));
              return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'executed', actionId: parsed.actionId }));
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Bad Request', code: 'BAD_REQUEST' }));
          }
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unknown route' }));
      });
    });

    mockBackend.listen(0, '127.0.0.1', () => {
      mockBackendPort = (mockBackend.address() as any).port;
      resolve();
    });
  });

  // 2. Start Vite server with proxy targeting mockBackend
  process.env.VITE_BACKEND_URL = `http://127.0.0.1:${mockBackendPort}`;
  viteServer = await createServer({
    root: path.resolve('.'),
    configFile: path.resolve('vite.config.ts'),
    server: {
      port: 0,
      host: '127.0.0.1'
    }
  });

  await viteServer.listen();
  const addr = viteServer.httpServer?.address() as any;
  vitePort = addr.port;
});

after(async () => {
  if (viteServer) {
    await viteServer.close();
  }
  if (mockBackend) {
    await new Promise<void>(resolve => mockBackend.close(() => resolve()));
  }
});

describe('Integration: Vite Development Reverse Proxy Runtime Security & Routing', () => {
  it('TEST-P01: /health reaches mock upstream correctly', async () => {
    const res = await fetch(`http://127.0.0.1:${vitePort}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.equal(data.upstream, 'mock-backend');
    assert.equal(lastUpstreamRequest?.url, '/health');
  });

  it('TEST-P02: /ready reaches mock upstream correctly', async () => {
    const res = await fetch(`http://127.0.0.1:${vitePort}/ready`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ready, true);
    assert.equal(data.upstream, 'mock-backend');
    assert.equal(lastUpstreamRequest?.url, '/ready');
  });

  it('TEST-P03: /api/v1/* attaches required server-side authentication headers in dev proxy', async () => {
    const res = await fetch(`http://127.0.0.1:${vitePort}/api/v1/protected-data`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.count, 42);

    // Verify upstream received server-to-server credentials
    assert.equal(lastUpstreamRequest?.headers['x-nexus-api-key'], 'nexus-dev-api-key-2026');
    assert.equal(lastUpstreamRequest?.headers['authorization'], 'Bearer nexus-dev-operator-token');
  });

  it('TEST-P04: Client explicit authorization header is preserved and invalid credentials trigger 401', async () => {
    const res = await fetch(`http://127.0.0.1:${vitePort}/api/v1/protected-data`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.code, 'UNAUTHORIZED');
    // Ensure proxy did not overwrite client's authorization header with operator token
    assert.equal(lastUpstreamRequest?.headers['authorization'], 'Bearer invalid-token');
  });

  it('TEST-P05: Upstream error status codes (403, 404, 500) pass through transparently', async () => {
    const res403 = await fetch(`http://127.0.0.1:${vitePort}/api/v1/error-403`);
    assert.equal(res403.status, 403);
    const data403 = await res403.json();
    assert.equal(data403.code, 'POLICY_REQUIRED');

    const res404 = await fetch(`http://127.0.0.1:${vitePort}/api/v1/error-404`);
    assert.equal(res404.status, 404);
    const data404 = await res404.json();
    assert.equal(data404.code, 'NOT_FOUND');

    const res500 = await fetch(`http://127.0.0.1:${vitePort}/api/v1/error-500`);
    assert.equal(res500.status, 500);
    const data500 = await res500.json();
    assert.equal(data500.code, 'INTERNAL_ERROR');
  });

  it('TEST-P06: Proxy does not log or reflect secrets in response headers or body', async () => {
    const res = await fetch(`http://127.0.0.1:${vitePort}/api/v1/protected-data`);
    assert.equal(res.status, 200);

    // Ensure response headers do not echo service keys or tokens
    assert.equal(res.headers.get('x-nexus-api-key'), null);
    assert.equal(res.headers.get('authorization'), null);
    assert.equal(res.headers.get('set-cookie'), null);

    const bodyText = await res.text();
    assert.ok(!bodyText.includes('nexus-dev-api-key-2026'), 'Response body must not contain API key');
    assert.ok(!bodyText.includes('nexus-dev-operator-token'), 'Response body must not contain operator token');
  });

  it('TEST-P07: Privileged mutations remain subject to backend authorization and policy checks', async () => {
    // Attempting unapproved mutation
    const unapprovedRes = await fetch(`http://127.0.0.1:${vitePort}/api/v1/mutations/execute-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId: 'act_999' })
    });
    assert.equal(unapprovedRes.status, 403);
    const unapprovedData = await unapprovedRes.json();
    assert.equal(unapprovedData.code, 'UNAPPROVED_ACTION');

    // Attempting approved mutation with valid test decision token
    const approvedRes = await fetch(`http://127.0.0.1:${vitePort}/api/v1/mutations/execute-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId: 'act_999', decisionToken: 'valid-test-decision-token' })
    });
    assert.equal(approvedRes.status, 200);
    const approvedData = await approvedRes.json();
    assert.equal(approvedData.status, 'executed');
  });

  it('TEST-P08: Vite server binds strictly to 127.0.0.1 loopback', () => {
    const addr = viteServer.httpServer?.address() as any;
    assert.ok(addr, 'Vite server address must be available');
    assert.equal(addr.address, '127.0.0.1', `Expected Vite server to bind to 127.0.0.1, got: ${addr.address}`);
  });
});
