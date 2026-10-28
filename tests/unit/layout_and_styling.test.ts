import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Unit: Visual Layout & Styling Integrity', () => {
  const pagesDir = path.resolve(process.cwd(), 'src/pages');
  const componentsDir = path.resolve(process.cwd(), 'src/components');

  const stickyHeaderPages = [
    'DashboardOverviewPage.tsx',
    'SignalsExplorerPage.tsx',
    'HandoffsPage.tsx',
    'Account360Page.tsx',
    'RevenueIntegrityPage.tsx',
    'EnrichmentPage.tsx',
    'TagInspectorPage.tsx',
  ];

  it('DEF-LAYOUT-01: GTM Control Plane sticky headers must use opaque backgrounds without translucent bleed', () => {
    for (const pageName of stickyHeaderPages) {
      const filePath = path.join(pagesDir, pageName);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Extract the <header className="sticky..."> tag
      const headerMatch = content.match(/<header\s+className=["']([^"']+)["']/);
      assert.ok(headerMatch, `${pageName} must have a <header> element`);

      const classList = headerMatch[1];

      // Must be sticky top-0
      assert.ok(classList.includes('sticky top-0'), `${pageName} header must be sticky top-0`);

      // Must NOT use translucent 80% alpha card background
      assert.ok(
        !classList.includes('bg-card/80'),
        `${pageName} header contains translucent "bg-card/80" which causes content bleed-through on scroll`
      );

      // Must NOT use backdrop-blur which reveals high-contrast text behind it
      assert.ok(
        !classList.includes('backdrop-blur-xs'),
        `${pageName} header contains "backdrop-blur-xs" on sticky header`
      );

      // Must use opaque bg-card
      assert.ok(
        classList.includes('bg-card'),
        `${pageName} header must use opaque "bg-card"`
      );
    }
  });

  it('DEF-LAYOUT-02: Sticky table headers must be opaque without translucent bleed-through', () => {
    const tableHeaderFiles = [
      path.join(pagesDir, 'TelemetryPage.tsx'),
      path.join(componentsDir, 'RloeTelemetryTable.tsx'),
    ];

    for (const filePath of tableHeaderFiles) {
      const fileName = path.basename(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');

      const theadMatches = content.match(/<thead\s+className=["']([^"']+)["']/g) || [];
      assert.ok(theadMatches.length > 0, `${fileName} must contain at least one <thead className="...">`);

      for (const theadStr of theadMatches) {
        if (theadStr.includes('sticky')) {
          assert.ok(
            !theadStr.includes('bg-muted/80'),
            `${fileName} sticky thead contains translucent "bg-muted/80" which causes table row bleed-through`
          );
          assert.ok(
            !theadStr.includes('backdrop-blur'),
            `${fileName} sticky thead contains "backdrop-blur"`
          );
          assert.ok(
            theadStr.includes('bg-muted') || theadStr.includes('bg-background'),
            `${fileName} sticky thead must use opaque background`
          );
        }
      }
    }
  });

  it('DEF-LAYOUT-03: OpportunityTable sticky name column must have opaque base background to prevent horizontal scroll bleed', () => {
    const oppTablePath = path.join(componentsDir, 'OpportunityTable.tsx');
    const content = fs.readFileSync(oppTablePath, 'utf-8');

    // Sticky name td must have opaque background, not bare bg-inherit on transparent rows
    const stickyTdMatch = content.match(/<td\s+className=[{"'`][^>]*sticky left-0[^>]*[}"'`]/);
    assert.ok(stickyTdMatch, 'OpportunityTable must have a sticky left-0 td');

    // The sticky column cell must ensure an opaque background so horizontal scroll does not show behind it
    assert.ok(
      !stickyTdMatch[0].includes('bg-inherit'),
      'OpportunityTable sticky left-0 td uses bg-inherit which inherits transparent table background'
    );
    assert.ok(
      stickyTdMatch[0].includes('bg-background'),
      'OpportunityTable sticky left-0 td must include bg-background for opaque rendering'
    );
  });
});
