import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nexusApi } from '../../src/services/nexusApi.js';

describe('Unit: NexusApiClient Contract Verification & TDD Fixes', () => {
  it('TEST-01: transitionHandoff must call PATCH /handoffs/:id/status with status payload', async () => {
    // Intercept fetch
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: any = null;

    const originalFetch = global.fetch;
    global.fetch = async (url: any, init?: any) => {
      capturedUrl = String(url);
      capturedMethod = init?.method || 'GET';
      capturedBody = init?.body ? JSON.parse(init.body) : null;
      return new Response(JSON.stringify({
        id: 'h_100',
        status: 'in_progress',
        updated_at: new Date().toISOString()
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    try {
      await nexusApi.transitionHandoff('h_100', 'in_progress');
      assert.ok(capturedUrl.includes('/handoffs/h_100/status'), `Expected URL to target /handoffs/h_100/status, got: ${capturedUrl}`);
      assert.equal(capturedMethod, 'PATCH', `Expected method to be PATCH, got: ${capturedMethod}`);
      assert.equal(capturedBody?.status, 'in_progress', `Expected body status to be in_progress, got: ${capturedBody?.status}`);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('TEST-02: getSignals must supply signalType query parameter for backend router compatibility', async () => {
    let capturedUrl = '';

    const originalFetch = global.fetch;
    global.fetch = async (url: any) => {
      capturedUrl = String(url);
      return new Response(JSON.stringify({ signals: [], count: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    try {
      await nexusApi.getSignals({ type: 'adoption_spike', severity: 'critical' });
      assert.ok(capturedUrl.includes('signalType=adoption_spike'), `Expected signalType query param in URL, got: ${capturedUrl}`);
      assert.ok(capturedUrl.includes('severity=critical'), `Expected severity query param in URL, got: ${capturedUrl}`);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('TEST-03: getEnrichmentJobs without domain must return empty array without triggering backend 400', async () => {
    let fetchCalled = false;
    const originalFetch = global.fetch;
    global.fetch = async () => {
      fetchCalled = true;
      return new Response(JSON.stringify({ error: 'Query parameter "domain" is required' }), { status: 400 });
    };

    try {
      const result = await nexusApi.getEnrichmentJobs();
      assert.equal(fetchCalled, false, 'Fetch should not be called when domain is missing');
      assert.deepEqual(result, [], 'Expected empty array result');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('TEST-04: getEnrichmentJobs with domain supplies domain parameter correctly', async () => {
    let capturedUrl = '';
    const originalFetch = global.fetch;
    global.fetch = async (url: any) => {
      capturedUrl = String(url);
      return new Response(JSON.stringify({ jobs: [], count: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    try {
      await nexusApi.getEnrichmentJobs({ domain: 'acme.com' });
      assert.ok(capturedUrl.includes('domain=acme.com'), `Expected domain=acme.com in URL, got: ${capturedUrl}`);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('TEST-05: operator bearer token takes precedence over static API key', async () => {
    let capturedHeaders: any = null;
    const originalFetch = global.fetch;
    global.fetch = async (url: any, init?: any) => {
      capturedHeaders = init?.headers;
      return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
    };
    try {
      nexusApi.setOperatorToken('v1.operator.dGVzdEBjb21wYW55LmNvbQ==.abc123sig');
      await nexusApi.getMetrics();
      assert.equal(capturedHeaders['Authorization'], 'Bearer v1.operator.dGVzdEBjb21wYW55LmNvbQ==.abc123sig');
    } finally {
      nexusApi.clearOperatorToken();
      global.fetch = originalFetch;
    }
  });

  it('TEST-06: default base URL is relative /api/v1 for reverse proxy compatibility', async () => {
    let capturedMetricsUrl = '';
    let capturedHealthUrl = '';
    const originalFetch = global.fetch;
    global.fetch = async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/health')) {
        capturedHealthUrl = urlStr;
        return new Response(JSON.stringify({ status: 'ok', uptimeSeconds: 10 }), { status: 200 });
      }
      capturedMetricsUrl = urlStr;
      return new Response(JSON.stringify({
        timestamp: new Date().toISOString(),
        events: { totalIngested: 0, processed: 0, duplicatesSuppressed: 0, failed: 0 },
        signals: { totalDetected: 0, byType: {} },
        handoffs: { totalCreated: 0, byStatus: {}, avgFirstResponseMinutes: null, slaCompliancePercentage: 100 },
        integrity: { openIssues: 0, resolvedIssues: 0, rejectedIssues: 0, proposedActions: 0, approvedActions: 0 }
      }), { status: 200 });
    };

    try {
      nexusApi.setBaseUrl(null);
      await nexusApi.getMetrics();
      await nexusApi.getHealth();
      assert.equal(capturedMetricsUrl, '/api/v1/metrics', `Expected relative URL /api/v1/metrics, got: ${capturedMetricsUrl}`);
      assert.equal(capturedHealthUrl, '/health', `Expected relative URL /health, got: ${capturedHealthUrl}`);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('TEST-07: backend errors are propagated honestly with status, code, and message intact', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => {
      return new Response(JSON.stringify({
        error: 'Policy approval failed: invalid decision token',
        code: 'INVALID_DECISION_TOKEN'
      }), { status: 403, statusText: 'Forbidden', headers: { 'Content-Type': 'application/json' } });
    };

    try {
      nexusApi.setBaseUrl(null);
      await assert.rejects(
        async () => {
          await nexusApi.executeAction('act_123', 'invalid_tok');
        },
        (err: any) => {
          assert.equal(err.status, 403);
          assert.equal(err.code, 'INVALID_DECISION_TOKEN');
          assert.equal(err.message, 'Policy approval failed: invalid decision token');
          return true;
        }
      );
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('TEST-08: ingestEvent maps domain to accountDomain and properties to payload for backend schema compatibility', async () => {
    let capturedBody: any = null;
    let capturedHeaders: any = null;
    const originalFetch = global.fetch;
    global.fetch = async (url: any, init?: any) => {
      capturedHeaders = init?.headers;
      capturedBody = init?.body ? JSON.parse(init.body) : null;
      return new Response(JSON.stringify({
        eventId: 'evt_123',
        status: 'processed',
        signalsCount: 1,
        newLifecycleStage: 'active_evaluation'
      }), { status: 201 });
    };

    try {
      nexusApi.setBaseUrl(null);
      await nexusApi.ingestEvent({
        idempotencyKey: 'key_123',
        domain: 'acme.com',
        eventName: 'workspace_created',
        properties: { plan: 'enterprise', seats_invited: 50 }
      });

      assert.equal(capturedHeaders['Idempotency-Key'], 'key_123');
      assert.equal(capturedBody?.accountDomain, 'acme.com', 'Expected body to contain accountDomain');
      assert.equal(capturedBody?.domain, undefined, 'Raw domain field should be mapped to accountDomain');
      assert.equal(capturedBody?.eventName, 'workspace_created');
      assert.deepEqual(capturedBody?.payload, { plan: 'enterprise', seats_invited: 50 }, 'properties should be mapped to payload');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
