import fs from 'node:fs';
import path from 'node:path';

const apiRoot = path.join(process.cwd(), 'app', 'api');
const allowlist = new Set([
  'auth/login/route.ts',
  'auth/forgot-password/route.ts',
  'auth/reset-password/route.ts',
  'auth/callback/complete/route.ts',
  'health/supabase/route.ts',
  'public/contact/route.ts',
  'public/config/route.ts',
  'public/blog/[slug]/comments/route.ts',
  'public/blog/[slug]/likes/route.ts',
  'public/blog/[slug]/engagement/route.ts',
  'public/content/[resource]/route.ts',
  'public/sitemap/route.ts',
  'public/rss/route.ts',
  'public/preview/route.ts',
  'cron/purge-activities/route.tsx',
  'cron/prune-sessions/route.tsx',
  'cron/publish-scheduled/route.tsx',
]);

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/route\.(ts|tsx)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

const routes = walk(apiRoot);
const missing = [];

for (const file of routes) {
  const rel = path.relative(apiRoot, file).replace(/\\/g, '/');
  if (allowlist.has(rel)) continue;
  const text = fs.readFileSync(file, 'utf8');
  const protectedRoute = /\bguard(Authenticated|Staff|Admin|Editor)\b/.test(text)
    || /\bwithStaffGet\b/.test(text)
    || /\bwithEditorGet\b/.test(text)
    || (/\bgetUser\(\)/.test(text) && /Unauthorized/.test(text));
  if (!protectedRoute) {
    missing.push(rel);
  }
}

if (missing.length) {
  console.error('API routes missing guard* imports/calls:\n', missing.join('\n'));
  process.exit(1);
}

console.log(`OK: ${routes.length} route files; ${allowlist.size} public exceptions.`);
