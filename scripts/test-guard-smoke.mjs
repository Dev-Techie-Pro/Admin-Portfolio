/**
 * Static smoke checks for auth guards on sensitive routes (no server required).
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const mustGuardEditor = [
  'app/api/blog-posts/[id]/preview-token/route.ts',
  'app/api/content-revisions/route.ts',
  'app/api/content-revisions/[id]/restore/route.ts',
];

const mustGuardStaff = [
  'app/api/health/supabase/route.ts',
];

const mustGuardAdminPut = [
  'app/api/settings/route.ts',
  'app/api/preferences/contact-columns/route.ts',
];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

for (const rel of mustGuardEditor) {
  const text = read(rel);
  if (!/\bguardEditor\b/.test(text)) {
    console.error(`Expected guardEditor in ${rel}`);
    process.exit(1);
  }
  if (!/\bisGuardFailure\b/.test(text) && !/auth\.ok === false/.test(text)) {
    console.warn(`warn: ${rel} may not narrow guard failure (isGuardFailure recommended)`);
  }
}

for (const rel of mustGuardAdminPut) {
  const text = read(rel);
  if (!/\bguardAdmin\b/.test(text)) {
    console.error(`Expected guardAdmin in ${rel}`);
    process.exit(1);
  }
}

const settingsModule = read('client/modules/settings/SettingsModule.ts');
if (!/\bcanManageSiteSettings\b/.test(settingsModule)) {
  console.error('Expected canManageSiteSettings in client/modules/settings/SettingsModule.ts');
  process.exit(1);
}

const capabilities = read('lib/auth/capabilities.ts');
if (!/\bcanManageSiteSettings:\s*isAdmin\b/.test(capabilities)) {
  console.error('Expected canManageSiteSettings derived from isAdmin in lib/auth/capabilities.ts');
  process.exit(1);
}

const health = read('app/api/health/supabase/route.ts');
if (!/\bguardStaff\b/.test(health)) {
  console.error('Expected guardStaff in health detailed path');
  process.exit(1);
}

const previewPublic = read('app/api/public/preview/route.ts');
if (/\bguard(Staff|Editor|Admin)\b/.test(previewPublic)) {
  console.error('public/preview must stay unauthenticated (token-gated)');
  process.exit(1);
}
if (!/verifyContentPreviewToken/.test(previewPublic)) {
  console.error('public/preview must verify token');
  process.exit(1);
}

console.log('OK: guard smoke checks');
