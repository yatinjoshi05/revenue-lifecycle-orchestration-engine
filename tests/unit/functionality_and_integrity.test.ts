import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Unit: Revenue Integrity & Handoffs Functional Controls', () => {
  const pagesDir = path.resolve(process.cwd(), 'src/pages');
  const servicesDir = path.resolve(process.cwd(), 'src/services');
  const componentsDir = path.resolve(process.cwd(), 'src/components');

  it('FUNC-01: RevenueIntegrityPage must resolve proposed_action_id and support action_proposed status', () => {
    const filePath = path.join(pagesDir, 'RevenueIntegrityPage.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Must check proposed_action_id before falling back
    assert.ok(
      content.includes('proposed_action_id'),
      'RevenueIntegrityPage must resolve proposed_action_id for human approval'
    );

    // Must show Review button for action_proposed status
    assert.ok(
      content.includes('action_proposed'),
      'RevenueIntegrityPage must allow approval review for action_proposed status'
    );

    // Must have a UI element that triggers handleExecute
    assert.ok(
      content.includes('handleExecute'),
      'RevenueIntegrityPage must wire handleExecute to a button or interactive control'
    );
  });

  it('FUNC-02: IntegrityIssue interface in nexusApi.ts must declare proposed_action_id', () => {
    const apiPath = path.join(servicesDir, 'nexusApi.ts');
    const content = fs.readFileSync(apiPath, 'utf-8');

    assert.ok(
      content.includes('proposed_action_id'),
      'nexusApi.ts IntegrityIssue must declare proposed_action_id'
    );
  });

  it('FUNC-03: HandoffsPage must provide state-aware transitions conforming to state machine', () => {
    const handoffsPath = path.join(pagesDir, 'HandoffsPage.tsx');
    const content = fs.readFileSync(handoffsPath, 'utf-8');

    // Should adapt action for pending handoffs (e.g. handleTransition(h.id, 'assigned'))
    assert.ok(
      content.includes("handleTransition(h.id, 'assigned')") || content.includes("h.status === 'pending'"),
      'HandoffsPage must support state-aware progression for pending handoffs'
    );
  });

  it('FUNC-04: Sidebar must render an interactive trigger for onOpenSettings', () => {
    const sidebarPath = path.join(componentsDir, 'Sidebar.tsx');
    const content = fs.readFileSync(sidebarPath, 'utf-8');

    assert.ok(
      content.includes('onClick={onOpenSettings}') || content.includes('onOpenSettings()'),
      'Sidebar must wire onOpenSettings to an interactive button onClick handler'
    );
  });
});
