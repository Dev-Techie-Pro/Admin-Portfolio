import { cache } from 'react';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_ROLES, STAFF_ROLES } from './constants';
import { getActiveElevationUntil, getStaffCapabilities, reconcileExpiredElevation } from './elevation';
import type { AccessCapabilities } from './capabilities';
import {
  clearSessionDeadlineCookie,
  getSessionDeadlineMs,
  isDashboardSessionExpired,
} from './session-lifetime';

/** Deduplicate getUser() within a single server request. */
export const getRequestUser = cache(async () => {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
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

export async function guardAuthenticated() {
  const session = await getRequestUser();
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (isDashboardSessionExpired(session.user)) {
    await session.supabase.auth.signOut();
    const response = NextResponse.json(
      { error: 'Session expired. Please sign in again.', sessionExpired: true },
      { status: 401 },
    );
    clearSessionDeadlineCookie(response);
    return { ok: false, response };
  }

  return { ok: true, user: session.user, supabase: session.supabase };
}

export function getAuthenticatedSessionMeta(user) {
  const deadlineMs = getSessionDeadlineMs(user);
  return {
    sessionExpiresAt: deadlineMs != null ? new Date(deadlineMs).toISOString() : null,
  };
}

export async function guardStaff() {
  const auth = await guardAuthenticated();
  if (!auth.ok) return auth;

  const access = await getRequestStaffAccess(auth.user.id);
  const profile = access.profile;
  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return {
    ok: true,
    user: auth.user,
    profile,
    supabase: auth.supabase,
    elevatedUntil: access.elevatedUntil,
    capabilities: access.capabilities as AccessCapabilities,
  };
}

export async function guardAdmin() {
  const auth = await guardAuthenticated();
  if (!auth.ok) return auth;

  const profile = await getRequestStaffProfile(auth.user.id);
  if (!profile || !ADMIN_ROLES.includes(profile.role)) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 }) };
  }

  return { ok: true, user: auth.user, profile, supabase: auth.supabase };
}

/** Staff with write access — blocks read-only viewer unless temporarily elevated. */
export async function guardEditor() {
  const auth = await guardStaff();
  if (!auth.ok) return auth;

  if (!auth.capabilities.canManageContent) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden — read-only access' }, { status: 403 }) };
  }

  return auth;
}
