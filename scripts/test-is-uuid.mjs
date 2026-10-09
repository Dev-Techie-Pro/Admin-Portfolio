/**
 * Smoke test for lib/validation/uuid.ts (H6) — logic mirrored for zero-dep CI.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  if (value == null || value === '') return false;
  return UUID_RE.test(String(value).trim());
}

const valid = '550e8400-e29b-41d4-a716-446655440000';
if (!isUuid(valid)) {
  console.error('FAIL: valid UUID rejected');
  process.exit(1);
}
if (isUuid('not-a-uuid')) {
  console.error('FAIL: invalid UUID accepted');
  process.exit(1);
}
if (isUuid('123')) {
  console.error('FAIL: legacy id mistaken for UUID');
  process.exit(1);
}

console.log('OK: isUuid validation (H6).');
