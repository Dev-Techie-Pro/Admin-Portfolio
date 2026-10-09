// @ts-nocheck
import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { STAFF_ROLES } from '@/lib/auth/constants';
import { ensureProfileForUser } from '@/lib/auth/profile';
import {
  acceptStaffInviteForUser,
  hasPendingStaffInvite,
} from '@/lib/auth/staff-invites';

function safeNextPath(raw: string | null | undefined) {
  const next = raw ?? '/';
  if (!next.startsWith('/') || next.startsWith('//')) return '/';
  return next;
}

export type CompleteAuthCallbackResult =
  | { ok: true; redirect: string }
  | { ok: false; error: string; errorDescription?: string };

export async function completeAuthCallbackAfterSignIn(
  user: User,
  options: { otpType?: string | null; next?: string | null } = {},
): Promise<CompleteAuthCallbackResult> {
  const next = safeNextPath(options.next);
  const otpType = options.otpType ?? null;
  const email = user.email ?? '';

  const needsPasswordSetup =
    otpType === 'invite'
    || otpType === 'recovery'
    || (email ? await hasPendingStaffInvite(email) : false);

  try {
    await ensureProfileForUser(user);
    if (email) {
      await acceptStaffInviteForUser(user.id, email);
    }
  } catch (err) {
    console.warn('[auth/callback] profile/invite sync failed:', err);
  }

  const { data: profile } = await createAdminClient()
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    return {
      ok: false,
      error: 'no_dashboard_access',
      errorDescription: 'This account does not have access to the dashboard.',
    };
  }

  const redirect = needsPasswordSetup ? '/reset-password' : next;
  return { ok: true, redirect };
}
