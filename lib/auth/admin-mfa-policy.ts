// @ts-nocheck
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_ROLES } from '@/lib/auth/constants';
import { listTotpFactors } from '@/lib/auth/mfa';

async function requireMfaForAdminsEnabled(): Promise<boolean> {
  if (process.env.REQUIRE_MFA_ADMINS === 'true') return true;
  try {
    const { warmRuntimeSettings, getRuntimeSettingSync } = await import(
      '@/lib/config/runtime-settings'
    );
    await warmRuntimeSettings();
    return getRuntimeSettingSync('REQUIRE_MFA_ADMINS') === 'true';
  } catch {
    return false;
  }
}

export async function adminMustCompleteMfa(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  if (!await requireMfaForAdminsEnabled()) return null;

  const { data: profile } = await createAdminClient()
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  if (!profile || !ADMIN_ROLES.includes(profile.role)) return null;

  const { verified } = await listTotpFactors(supabase);
  if (verified) return null;

  return 'Two-factor authentication is required for admin accounts.';
}
