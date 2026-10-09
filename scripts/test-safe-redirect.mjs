import assert from 'node:assert/strict';

function sanitizeRedirectPath(raw, fallback = '/') {
  if (raw == null || raw === '') return fallback;
  const path = String(raw).trim();
  if (!path.startsWith('/') || path.startsWith('//')) return fallback;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(path)) return fallback;
  if (path.includes('\\')) return fallback;
  if (path.includes('\0')) return fallback;
  return path;
}

assert.equal(sanitizeRedirectPath('/dashboard'), '/dashboard');
assert.equal(sanitizeRedirectPath('//evil.com'), '/');
assert.equal(sanitizeRedirectPath('https://evil.com'), '/');
assert.equal(sanitizeRedirectPath('/foo?bar=1'), '/foo?bar=1');
assert.equal(sanitizeRedirectPath(null), '/');
assert.equal(sanitizeRedirectPath('  /projects  '), '/projects');

console.log('OK: safe redirect path regression (P2).');
