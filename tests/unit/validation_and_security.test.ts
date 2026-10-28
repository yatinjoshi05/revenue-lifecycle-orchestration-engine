import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Domain validation rule (RFC-1035 compatible, lowercase, trimmed)
 */
export function validateDomain(rawDomain: string): { valid: boolean; normalized: string; error?: string } {
  if (!rawDomain || typeof rawDomain !== 'string') {
    return { valid: false, normalized: '', error: 'Domain must be a non-empty string' };
  }
  const normalized = rawDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;
  if (!domainRegex.test(normalized)) {
    return { valid: false, normalized, error: 'Invalid domain format. Must be an RFC-1035 valid hostname (e.g., acme.com)' };
  }
  return { valid: true, normalized };
}

/**
 * CSV Formula Injection Sanitizer (prevents DDE / CSV injection in Excel/Sheets)
 */
export function sanitizeCsvCell(value: string): string {
  if (!value || typeof value !== 'string') return value;
  // If cell starts with formula trigger characters: = + - @ \t \r
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value.trim();
}

/**
 * Safe text escaper for rendering untrusted strings
 */
export function sanitizeUntrustedText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

describe('Unit: Input Validation, Sanitization & Data Safety', () => {
  it('VAL-01: validates and normalizes RFC-1035 domains', () => {
    assert.equal(validateDomain('  ACME.COM/path  ').valid, true);
    assert.equal(validateDomain('  ACME.COM/path  ').normalized, 'acme.com');
    assert.equal(validateDomain('https://stripe.com').normalized, 'stripe.com');
    assert.equal(validateDomain('invalid_domain_with_underscores').valid, false);
    assert.equal(validateDomain('').valid, false);
    assert.equal(validateDomain('-badstart.com').valid, false);
  });

  it('SEC-01: CSV formula injection sanitizer neutralizes formula execution triggers', () => {
    // Excel formula execution vector
    assert.equal(sanitizeCsvCell('=cmd|"/C calc"!A0'), '\'=cmd|"/C calc"!A0');
    assert.equal(sanitizeCsvCell('+12345'), '\'+12345');
    assert.equal(sanitizeCsvCell('-5000'), '\'-5000');
    assert.equal(sanitizeCsvCell('@SUM(A1:A10)'), '\'@SUM(A1:A10)');
    assert.equal(sanitizeCsvCell('\tmalicious_tab'), '\'\tmalicious_tab');
    // Normal text is untouched
    assert.equal(sanitizeCsvCell('acme.com'), 'acme.com');
    assert.equal(sanitizeCsvCell('Acme Corp'), 'Acme Corp');
  });

  it('SEC-02: untrusted text sanitizer neutralizes XSS vectors', () => {
    const malicious = '<script>alert(1)</script><img src=x onerror=alert(2)>';
    const sanitized = sanitizeUntrustedText(malicious);
    assert.ok(!sanitized.includes('<script>'), 'Must not contain unescaped script tag');
    assert.ok(!sanitized.includes('<img'), 'Must not contain unescaped img tag');
    assert.ok(sanitized.includes('&lt;script&gt;'));
  });

  it('VAL-02: JSON syntax validator detects malformed payloads cleanly', () => {
    const validJson = '{"eventName":"workspace_created","properties":{"tier":"enterprise"}}';
    const invalidJson = '{"eventName":"workspace_created", properties:}';

    let parseError: string | null = null;
    try {
      JSON.parse(validJson);
    } catch (e: any) {
      parseError = e.message;
    }
    assert.equal(parseError, null);

    let caughtInvalid = false;
    try {
      JSON.parse(invalidJson);
    } catch (e: any) {
      caughtInvalid = true;
    }
    assert.equal(caughtInvalid, true);
  });
});
