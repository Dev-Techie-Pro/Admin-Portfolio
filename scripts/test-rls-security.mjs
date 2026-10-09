/**
 * Static + optional live RLS probes for security migration (C1, H2, H4).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const migPath = path.join(root, 'supabase/migrations/20261013120000_security_rls_hardening.sql');

if (!fs.existsSync(migPath)) {
  console.error('Missing security migration: 20261013120000_security_rls_hardening.sql');
  process.exit(1);
}

const sql = fs.readFileSync(migPath, 'utf8');
const required = [
  /revoke update on public\.profiles/i,
  /pa_profiles_block_privileged_update/i,
  /drop policy if exists "Users manage own 2fa backup codes"/i,
  /pa_consume_backup_code/i,
  /pa_next_contact_legacy_id/i,
  /drop policy if exists "Anyone can submit contact messages"/i,
];

for (const re of required) {
  if (!re.test(sql)) {
    console.error(`FAIL: migration missing expected pattern ${re}`);
    process.exit(1);
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

async function liveProbes() {
  if (!url || !anonKey) {
    console.log('OK: static RLS security checks (live probes skipped — no Supabase URL/anon key).');
    return;
  }

  let siteId = process.env.TEST_SITE_ID?.trim();
  if (!siteId && serviceKey) {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data, error } = await admin.from('sites').select('id').eq('slug', 'default').maybeSingle();
    if (error) throw new Error(`Could not load default site: ${error.message}`);
    siteId = data?.id;
  }

  const anon = createClient(url, anonKey, { auth: { persistSession: false } });

  const { error: contactErr } = await anon.from('contact_messages').insert({
    site_id: siteId || '00000000-0000-4000-8000-000000000001',
    legacy_id: 999999992,
    sender_name: 'RLS Probe',
    sender_email: 'probe@example.com',
    subject: 'Probe',
    body: 'This insert must be denied.',
    status: 'new',
  });
  if (!contactErr) {
    console.error('FAIL: anon could INSERT contact_messages');
    process.exit(1);
  }

  const testUserEmail = process.env.TEST_USER_EMAIL?.trim();
  const testUserPassword = process.env.TEST_USER_PASSWORD?.trim();
  let probeUserId = null;
  if (testUserEmail && testUserPassword) {
    const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword,
    });
    if (signInErr) {
      console.warn('WARN: could not sign in TEST_USER for profile probe:', signInErr.message);
    } else if (signIn?.user?.id) {
      probeUserId = signIn.user.id;
      const { error: roleErr } = await anon
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', probeUserId);
      if (!roleErr) {
        console.error('FAIL: authenticated user could UPDATE own profiles.role');
        process.exit(1);
      }
      const { error: backupErr } = await anon.from('two_factor_backup_codes').insert({
        user_id: probeUserId,
        code_hash: 'deadbeef',
      });
      if (!backupErr) {
        console.error('FAIL: client could INSERT two_factor_backup_codes');
        process.exit(1);
      }
      await anon.auth.signOut();
    }
  }

  console.log('OK: static + live RLS security probes.');
}

liveProbes().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
