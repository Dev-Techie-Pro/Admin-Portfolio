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

const prodScaleRecommended = ['KV_REST_API_URL', 'KV_REST_API_TOKEN'];

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
  if (!process.env.PREVIEW_TOKEN_SECRET?.trim()) {
    if (strict) errors.push('PREVIEW_TOKEN_SECRET is required when VERIFY_DEPLOYMENT_STRICT=1');
    else warnings.push('Recommended in production: PREVIEW_TOKEN_SECRET');
  }
  const portfolioOk = Boolean(
    process.env.PORTFOLIO_PUBLIC_ORIGINS?.trim() || process.env.NEXT_PUBLIC_PORTFOLIO_URL?.trim(),
  );
  if (!portfolioOk) {
    if (strict) {
      errors.push('PORTFOLIO_PUBLIC_ORIGINS or NEXT_PUBLIC_PORTFOLIO_URL is required in strict production checks');
    }
  }
  const kvUrl = process.env.KV_REST_API_URL?.trim();
  const kvToken = process.env.KV_REST_API_TOKEN?.trim();
  if (!kvUrl || !kvToken) {
    const msg = 'KV_REST_API_URL and KV_REST_API_TOKEN (shared cache across serverless instances)';
    if (strict) warnings.push(`Recommended for production scale: ${msg}`);
    else warnings.push(`Optional at low traffic; recommended at scale: ${msg}`);
  }
}

const vendorApex = path.join(root, 'public', 'js', 'vendor', 'apexcharts.min.js');
if (!fs.existsSync(vendorApex)) {
  warnings.push('public/js/vendor/apexcharts.min.js is missing — run npm run build:client');
}

const checklist = path.join(root, 'docs', 'DEPLOYMENT_CHECKLIST.md');
const migration = path.join(
  root,
  'supabase',
  'migrations',
  '20261011120000_portfolio_admin_baseline.sql',
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
