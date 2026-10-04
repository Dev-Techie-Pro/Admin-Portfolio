/**
 * Local / CI deployment readiness checks (host env only).
 * Does not contact Supabase. For DB migration state use GET /api/health/supabase?detailed=1.
 *
 * Strict mode: VERIFY_DEPLOYMENT_STRICT=1 (fails on missing required vars in production).
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const strict = process.env.VERIFY_DEPLOYMENT_STRICT === '1';
const isProd = process.env.NODE_ENV === 'production' || strict;

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const prodRecommended = [
  'NEXT_PUBLIC_SITE_URL',
  'CRON_SECRET',
  'PORTFOLIO_PUBLIC_ORIGINS',
  'PREVIEW_TOKEN_SECRET',
];

const warnings = [];
const errors = [];

for (const key of required) {
  if (!process.env[key]?.trim()) {
    const msg = `Missing required env: ${key}`;
    if (isProd) errors.push(msg);
    else warnings.push(msg);
  }
}

if (isProd) {
  for (const key of prodRecommended) {
    if (!process.env[key]?.trim()) {
      if (key === 'PORTFOLIO_PUBLIC_ORIGINS' && process.env.NEXT_PUBLIC_PORTFOLIO_URL?.trim()) continue;
      warnings.push(`Recommended in production: ${key}`);
    }
  }
  if (!process.env.CRON_SECRET?.trim()) {
    errors.push('CRON_SECRET is required in production for /api/cron/*');
  }
}

const checklist = path.join(root, 'docs', 'DEPLOYMENT_CHECKLIST.md');
const migration = path.join(
  root,
  'supabase',
  'migrations',
  '20261005120000_public_api_hardening.sql',
);
if (!fs.existsSync(checklist)) warnings.push('docs/DEPLOYMENT_CHECKLIST.md is missing.');
if (!fs.existsSync(migration)) warnings.push('Public API hardening migration file is missing.');

console.log('Deployment env verification');
console.log('  strict:', strict, '| NODE_ENV:', process.env.NODE_ENV || '(unset)');
for (const w of warnings) console.warn('  warn:', w);
for (const e of errors) console.error('  error:', e);

if (errors.length) {
  console.error('\nFix host environment variables (see .env.example and docs/DEPLOYMENT_CHECKLIST.md).');
  console.error('Supabase: apply migrations (npm run db:push), disable public signup in Dashboard.');
  process.exit(1);
}

console.log('OK: host env checks passed (DB/signup/Turnstile — verify in admin System → Deployment).');
process.exit(0);
