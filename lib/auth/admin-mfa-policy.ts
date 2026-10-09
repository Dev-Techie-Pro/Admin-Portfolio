// @ts-nocheck
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_ROLES } from '@/lib/auth/constants';
import { warmRuntimeSettings, getRuntimeSettingSync } from '@/lib/config/runtime-settings';
import { listTotpFactors } from '@/lib/auth/mfa';

export async function adminMustCompleteMfa(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  await warmRuntimeSettings();
  if (getRuntimeSettingSync('REQUIRE_MFA_ADMINS') !== 'true') return null;

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
