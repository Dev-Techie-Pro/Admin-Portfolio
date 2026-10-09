/**
 * Regression for audit M1: MFA AAL fail-closed helper.
 */
import assert from 'node:assert/strict';
// Mirror lib/auth/mfa-aal.ts logic for CI without ts-node.
function needsMfaFromAal(aal) {
  return aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2';
}

assert.equal(needsMfaFromAal({ nextLevel: 'aal2', currentLevel: 'aal1' }), true);
assert.equal(needsMfaFromAal({ nextLevel: 'aal2', currentLevel: 'aal2' }), false);
assert.equal(needsMfaFromAal(null), false);
assert.equal(needsMfaFromAal(undefined), false);

const middlewareSrc = await import('node:fs').then((fs) =>
  fs.readFileSync(new URL('../middleware.ts', import.meta.url), 'utf8'),
);
if (/catch\s*\{[^}]*needsMfa\s*=\s*false/s.test(middlewareSrc)) {
  console.error('FAIL: middleware still sets needsMfa = false on AAL error (M1).');
  process.exit(1);
}
if (!middlewareSrc.includes('NEEDS_MFA_ON_AAL_ERROR')) {
  console.error('FAIL: middleware must use NEEDS_MFA_ON_AAL_ERROR on AAL catch (M1).');
  process.exit(1);
}
if (/signOut\(\);\s*return\s+supabaseResponse/s.test(middlewareSrc)) {
  console.error('FAIL: middleware still returns supabaseResponse after refresh-token signOut (M2).');
  process.exit(1);
}

console.log('OK: MFA AAL middleware regression (M1/M2).');
