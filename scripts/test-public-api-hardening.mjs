/**
 * Verifies public API hardening migration expectations (static + optional live anon probe).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const migrationPath = path.join(
  root,
  'supabase/migrations/20261005120000_public_api_hardening.sql',
);

if (!fs.existsSync(migrationPath)) {
  console.error('Missing migration: 20261005120000_public_api_hardening.sql');
  process.exit(1);
}

const migrationSql = fs.readFileSync(migrationPath, 'utf8');
if (!/drop policy if exists "Anyone can submit contact messages"/i.test(migrationSql)) {
  console.error('Migration must drop anon contact_messages insert policy.');
  process.exit(1);
}
if (!/pa_rate_limit_allow/.test(migrationSql)) {
  console.error('Migration must define pa_rate_limit_allow RPC.');
  process.exit(1);
}

const migrationsDir = path.join(root, 'supabase/migrations');
const migrationCount = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).length;
if (migrationCount < 53) {
  console.error(`Expected at least 53 migrations, found ${migrationCount}.`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

async function liveAnonInsertBlocked() {
  if (!url || !anonKey) {
    console.log('OK: static public API hardening checks (skipped live anon probe — no Supabase URL/anon key).');
    return;
  }

  let siteId = process.env.TEST_SITE_ID?.trim();
  if (!siteId && serviceKey) {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data, error } = await admin.from('sites').select('id').eq('slug', 'default').maybeSingle();
    if (error) throw new Error(`Could not load default site: ${error.message}`);
    siteId = data?.id;
  }

  if (!siteId) {
    console.log('OK: static checks; live anon probe skipped (set TEST_SITE_ID or SUPABASE_SERVICE_ROLE_KEY).');
    return;
  }

  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error } = await anon.from('contact_messages').insert({
    site_id: siteId,
    legacy_id: 999999991,
    sender_name: 'Hardening Probe',
    sender_email: 'probe@example.com',
    subject: 'Probe',
    body: 'This insert must be denied by RLS after migration 20261005120000.',
    status: 'new',
  });

  if (!error) {
    console.error('FAIL: anon client could INSERT into contact_messages — apply migration 20261005120000.');
    process.exit(1);
  }

  const code = error.code || '';
  const msg = (error.message || '').toLowerCase();
  const denied = code === '42501' || msg.includes('row-level security') || msg.includes('permission');
  if (!denied) {
    console.error('FAIL: unexpected error on anon insert (expected RLS denial):', error.message);
    process.exit(1);
  }

  console.log('OK: static + live anon contact_messages insert blocked.');
}

liveAnonInsertBlocked().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
