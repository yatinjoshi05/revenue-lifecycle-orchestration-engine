import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

describe('Unit: Development Server Proxy Security & Architecture', () => {
  it('PROXY-01: vite.config.ts defines reverse proxy for /api, /health, and /ready', () => {
    const configContent = fs.readFileSync(path.resolve('vite.config.ts'), 'utf8');
    assert.ok(configContent.includes("'/api':"), 'Must configure /api proxy route');
    assert.ok(configContent.includes("'/health':"), 'Must configure /health proxy route');
    assert.ok(configContent.includes("'/ready':"), 'Must configure /ready proxy route');
    assert.ok(configContent.includes('proxy.on(\'proxyReq\''), 'Must configure proxyReq header injection');
  });

  it('PROXY-02: Server credentials are kept exclusively on proxy process and never in client define map', () => {
    const configContent = fs.readFileSync(path.resolve('vite.config.ts'), 'utf8');
    // Ensure define block does NOT expose NEXUS_API_KEY or DEV_OPERATOR_TOKEN
    assert.ok(!configContent.includes("'import.meta.env.VITE_NEXUS_API_KEY'"), 'Must not expose VITE_NEXUS_API_KEY in client define');
    assert.ok(!configContent.includes("'import.meta.env.DEV_OPERATOR_TOKEN'"), 'Must not expose DEV_OPERATOR_TOKEN in client define');
    assert.ok(!configContent.includes("'import.meta.env.APPROVAL_HMAC_SECRET'"), 'Must not expose APPROVAL_HMAC_SECRET in client define');
  });

  it('PROXY-03: Client bundle does not contain leaked dev secrets or keys', () => {
    const distAssetsDir = path.resolve('dist/assets');
    if (fs.existsSync(distAssetsDir)) {
      const files = fs.readdirSync(distAssetsDir);
      const jsFiles = files.filter(f => f.endsWith('.js'));
      for (const file of jsFiles) {
        const content = fs.readFileSync(path.join(distAssetsDir, file), 'utf8');
        assert.ok(!content.includes('nexus-dev-operator-token'), `Bundle file ${file} must not contain dev operator token`);
        assert.ok(!content.includes('nexus-dev-api-key-2026'), `Bundle file ${file} must not contain dev API key`);
      }
    }
  });

  it('PROXY-04: vite.config.ts restricts host binding strictly to 127.0.0.1 loopback', () => {
    const configContent = fs.readFileSync(path.resolve('vite.config.ts'), 'utf8');
    assert.ok(configContent.includes("host: '127.0.0.1'"), 'Host must be restricted to 127.0.0.1');
    assert.ok(!configContent.includes("host: true"), 'Host must not be set to true (no 0.0.0.0 binding)');
    assert.ok(!configContent.includes("host: '0.0.0.0'"), 'Host must not bind to 0.0.0.0');
  });
});
