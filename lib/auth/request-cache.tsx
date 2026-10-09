// @ts-nocheck
import { cache } from 'react';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_ROLES, STAFF_ROLES } from './constants';
import { getMfaAssuranceLevel, needsMfaVerification } from './mfa';
import { MFA_STEPUP_COOKIE, readMfaStepUpCookie } from './mfa-stepup-cookie';
import { getActiveElevationUntil, getStaffCapabilities, reconcileExpiredElevation } from './elevation';
import type { AccessCapabilities } from './capabilities';
import {
  clearSessionDeadlineCookie,
  getSessionDeadlineMs,
  isDashboardSessionExpired,
} from './session-lifetime';

export type StaffProfileRow = {
  role: string;
  full_name: string | null;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
};

export type GuardFailure = { ok: false; response: NextResponse };

export type GuardAuthSuccess = {
  ok: true;
  user: User;
  supabase: SupabaseClient;
};

export type GuardStaffSuccess = GuardAuthSuccess & {
  profile: StaffProfileRow;
  elevatedUntil: string | null;
  capabilities: AccessCapabilities;
};

export type GuardAdminSuccess = GuardAuthSuccess & {
  profile: StaffProfileRow;
};

function guardFail(response: NextResponse): GuardFailure {
  return { ok: false as const, response };
}

/** Deduplicate getUser() within a single server request. */
export const getRequestUser = cache(async () => {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    if (
      error.code === 'refresh_token_not_found'
      || /refresh token/i.test(error.message || '')
    ) {
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
    }
    return null;
  }
  if (!user) return null;
  return { user, supabase };
});

/** Deduplicate staff profile lookup within a single server request. */
export const getRequestStaffProfile = cache(async (userId) => {
  await reconcileExpiredElevation(userId);
  const { data: profile, error } = await createAdminClient()
    .from('profiles')
    .select('role, full_name, email, username, avatar_url')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return profile;
});

export const getRequestStaffAccess = cache(async (userId: string) => {
  const profile = await getRequestStaffProfile(userId);
  if (!profile) {
    return { profile: null, elevatedUntil: null as string | null, capabilities: getStaffCapabilities('viewer', null) };
  }
  const elevatedUntil = await getActiveElevationUntil(userId);
  const capabilities = getStaffCapabilities(profile.role, elevatedUntil);
  return { profile, elevatedUntil, capabilities };
});

export async function guardAuthenticated(): Promise<GuardFailure | GuardAuthSuccess> {
  const session = await getRequestUser();
  if (!session) {
    return guardFail(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  if (isDashboardSessionExpired(session.user)) {
    await session.supabase.auth.signOut();
    const response = NextResponse.json(
      { error: 'Session expired. Please sign in again.', sessionExpired: true },
      { status: 401 },
    );
    clearSessionDeadlineCookie(response);
    return guardFail(response);
  }

  return { ok: true as const, user: session.user, supabase: session.supabase };
}

export function getAuthenticatedSessionMeta(user) {
  const deadlineMs = getSessionDeadlineMs(user);
  return {
    sessionExpiresAt: deadlineMs != null ? new Date(deadlineMs).toISOString() : null,
  };
}

export async function guardStaff(): Promise<GuardFailure | GuardStaffSuccess> {
  const auth = await guardAuthenticated();
  if (auth.ok === false) return auth;

  const access = await getRequestStaffAccess(auth.user.id);
  const profile = access.profile;
  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    return guardFail(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
  }

  return {
    ok: true as const,
    user: auth.user,
    profile,
    supabase: auth.supabase,
    elevatedUntil: access.elevatedUntil,
    capabilities: access.capabilities as AccessCapabilities,
  };
}

export async function guardAdmin(): Promise<GuardFailure | GuardAdminSuccess> {
  const auth = await guardAuthenticated();
  if (auth.ok === false) return auth;

  const profile = await getRequestStaffProfile(auth.user.id);
  if (!profile || !ADMIN_ROLES.includes(profile.role)) {
    return guardFail(NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 }));
  }

  return { ok: true as const, user: auth.user, profile, supabase: auth.supabase };
}

export async function guardSuperAdmin(): Promise<GuardFailure | GuardAdminSuccess> {
  const auth = await guardAdmin();
  if (auth.ok === false) return auth;
  if (auth.profile.role !== 'super_admin') {
    return guardFail(NextResponse.json({ error: 'Forbidden — super admin access required' }, { status: 403 }));
  }
  return auth;
}

/** Requires password session plus TOTP step-up (or signed step-up cookie after backup/TOTP login). */
export async function guardAal2(): Promise<GuardFailure | GuardAuthSuccess> {
  const auth = await guardAuthenticated();
  if (auth.ok === false) return auth;

  try {
    const aal = await getMfaAssuranceLevel(auth.supabase);
    if (!needsMfaVerification(aal)) return auth;
  } catch {
    return auth;
  }

  const cookieStore = await cookies();
  const stepUp = readMfaStepUpCookie(
    cookieStore.get(MFA_STEPUP_COOKIE)?.value,
    auth.user.id,
  );
  if (stepUp) return auth;

  return guardFail(
    NextResponse.json({ error: 'MFA verification required.', needsMfa: true }, { status: 403 }),
  );
}

/** Staff with write access — blocks read-only viewer unless temporarily elevated. */
export async function guardEditor(): Promise<GuardFailure | GuardStaffSuccess> {
  const auth = await guardStaff();
  if (auth.ok === false) return auth;

  if (!auth.capabilities.canManageContent) {
    return guardFail(NextResponse.json({ error: 'Forbidden — read-only access' }, { status: 403 }));
  }

  return auth;
}
