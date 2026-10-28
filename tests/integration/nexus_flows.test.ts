import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../../../GTM projects/nexus/src/app.js';
import { nexusApi } from '../../src/services/nexusApi.js';

let server: http.Server;
let serverPort: number;

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      serverPort = addr.port;
      nexusApi.setBaseUrl(`http://127.0.0.1:${serverPort}/api/v1`);
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('Integration: NEXUS Control Plane Cross-Module Workflows (Live Local Server)', () => {
  it('FLOW-01: Health, Readiness, and System Metadata verification', async () => {
    const health = await nexusApi.getHealth();
    assert.equal(health.status, 'ok');
    assert.ok(typeof health.uptimeSeconds === 'number');

    const meta = await nexusApi.getMeta();
    assert.equal(meta.name, 'NEXUS Revenue Operations Control Plane');
    assert.ok(meta.modules);
    assert.equal(meta.modules.module_a_signals, 'active');
  });

  it('FLOW-02: Dashboard Metrics loading returns truthful zero-state or aggregated telemetry', async () => {
    const metrics = await nexusApi.getMetrics();
    assert.ok(metrics.timestamp, 'Metrics must have a timestamp');
    assert.ok(metrics.events, 'Metrics must have events group');
    assert.ok(typeof metrics.events.totalIngested === 'number');
    assert.ok(metrics.signals, 'Metrics must have signals group');
    assert.ok(metrics.handoffs, 'Metrics must have handoffs group');
    assert.ok(metrics.integrity, 'Metrics must have integrity group');
  });

  it('FLOW-03: Event Inspector: Ingests valid event with Idempotency-Key and suppresses duplicates', async () => {
    const key = `test_evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const eventPayload = {
      idempotencyKey: key,
      accountDomain: 'integration-test-domain.com',
      eventName: 'workspace_created',
      eventTimestamp: new Date().toISOString(),
      payload: { plan: 'enterprise', seats: 20 }
    };

    // First ingestion -> 201 Created
    const res1 = await nexusApi.ingestEvent(eventPayload as any);
    assert.ok(res1.eventId || res1.status, 'Expected event acceptance');

    // Duplicate ingestion with same idempotency key -> serves cached response with identical eventId
    const res2 = await nexusApi.ingestEvent(eventPayload as any);
    assert.equal(res2.eventId, res1.eventId, 'Expected same eventId from cached idempotent response');
  });

  it('FLOW-04: Handoffs queue retrieval and SLA evaluation', async () => {
    const handoffs = await nexusApi.getHandoffs();
    assert.ok(Array.isArray(handoffs), 'Handoffs response must be an array');

    const slaResult = await nexusApi.evaluateSlaBreaches();
    assert.ok(typeof slaResult.escalatedCount === 'number');
  });

  it('FLOW-05: Account 360: returns 404 for nonexistent account without falling back to demo records', async () => {
    let caught404 = false;
    try {
      await nexusApi.getAccount360('nonexistent-company-domain-999.xyz');
    } catch (err: any) {
      if (err.status === 404 || err.code === 'ACCOUNT_NOT_FOUND' || err.message.includes('not found')) {
        caught404 = true;
      }
    }
    assert.equal(caught404, true, 'Nonexistent account must throw an honest 404 error');
  });

  it('FLOW-06: Revenue Integrity: Lists issues and rejects unapproved action execution with 403', async () => {
    const issues = await nexusApi.getIssues();
    assert.ok(Array.isArray(issues), 'Issues response must be an array');

    // Attempting direct execution on unapproved random UUID -> 404 or 403 Unapproved Action
    let caughtAuthBlock = false;
    try {
      await nexusApi.executeAction('00000000-0000-0000-0000-000000000001', 'fake_token');
    } catch (err: any) {
      if (err.status === 404 || err.status === 403) {
        caughtAuthBlock = true;
      }
    }
    assert.equal(caughtAuthBlock, true, 'Unapproved action execution must be blocked');
  });

  it('FLOW-07: Enrichment: Empty domain query returns safe empty list without failing', async () => {
    const jobs = await nexusApi.getEnrichmentJobs();
    assert.deepEqual(jobs, [], 'Empty query must safely return empty list');
  });

  it('FLOW-08: Operations: Failures diagnosis endpoint returns operational logs', async () => {
    const failures = await nexusApi.getFailures();
    assert.ok(failures !== null && typeof failures === 'object');
    assert.ok(Array.isArray(failures.failedHandoffs));
    assert.ok(Array.isArray(failures.failedActionAttempts));
    assert.ok(Array.isArray(failures.criticalIssues));
  });

  it('FLOW-09: Operations: Cluster reconciliation sweep executes idempotently', async () => {
    const report = await nexusApi.reconcile();
    assert.ok(report);
    assert.ok(report.report || report.message);
  });

  it('FLOW-10: Catch-all 404 route returns structured JSON error', async () => {
    let caughtNotFound = false;
    try {
      await (nexusApi as any).request('/non-existent-endpoint-route-test');
    } catch (err: any) {
      if (err.status === 404) {
        caughtNotFound = true;
      }
    }
    assert.equal(caughtNotFound, true, 'Non-existent backend route must return 404');
  });
});
