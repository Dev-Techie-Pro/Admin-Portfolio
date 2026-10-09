// @ts-nocheck
import { createHmac, randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

function admin() {
  return createAdminClient();
}

function pepper(): string {
  const value = process.env.BACKUP_CODE_PEPPER?.trim()
    || process.env.SESSION_SIGNING_SECRET?.trim()
    || process.env.CRON_SECRET?.trim();
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error('BACKUP_CODE_PEPPER or CRON_SECRET must be set in production.');
  }
  return value || 'dev-only-backup-pepper';
}

function hashCode(code: string) {
  return createHmac('sha256', pepper())
    .update(String(code).trim().toUpperCase())
    .digest('hex');
}

function formatCode(bytes: Buffer) {
  const raw = bytes.toString('hex').toUpperCase();
  return `${raw.slice(0, 6)}-${raw.slice(6, 12)}-${raw.slice(12, 18)}-${raw.slice(18, 24)}`;
}

export function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i += 1) {
    codes.push(formatCode(randomBytes(12)));
  }
  return codes;
}

export async function replaceUserBackupCodes(userId, plainCodes) {
  const client = admin();
  const { error: deleteError } = await client
    .from('two_factor_backup_codes')
    .delete()
    .eq('user_id', userId);
  if (deleteError) throw deleteError;

  const rows = plainCodes.map((code) => ({
    user_id: userId,
    code_hash: hashCode(code),
  }));

  const { error } = await client.from('two_factor_backup_codes').insert(rows);
  if (error) throw error;
  return plainCodes;
}

export async function countUnusedBackupCodes(userId) {
  const { count, error } = await admin()
    .from('two_factor_backup_codes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('used_at', null);
  if (error) throw error;
  return count || 0;
}

export async function consumeBackupCode(userId, code) {
  const client = admin();
  const codeHash = hashCode(code);
  const { data, error } = await client.rpc('pa_consume_backup_code', {
    p_user_id: userId,
    p_code_hash: codeHash,
  });
  if (error) throw error;
  return data === true;
}

export async function clearUserBackupCodes(userId) {
  const { error } = await admin()
    .from('two_factor_backup_codes')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}
