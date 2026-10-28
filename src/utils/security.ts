/**
 * NEXUS GTM Control Plane Security & Sanitization Utilities
 */

/**
 * Validates and normalizes RFC-1035 hostnames/domains.
 * Strips protocols and paths, lowercases and trims.
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
 * CSV Formula Injection Sanitizer (protects Excel/Sheets against formula code execution via DDE)
 * Prepends a single quote to cells beginning with =, +, -, @, \t, or \r.
 */
export function sanitizeCsvCell(value: string): string {
  if (!value || typeof value !== 'string') return value;
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value.trim();
}

/**
 * Escapes HTML entities to render untrusted strings safely.
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
