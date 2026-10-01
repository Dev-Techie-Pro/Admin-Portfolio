import crypto from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_ID } from '@/lib/cms/constants';
import { ASSIGNABLE_STAFF_ROLES, ALL_STAFF_ROLES } from '@/lib/auth/constants';

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function listPendingStaffInvites() {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('staff_invites')
    .select('id, email, role, expires_at, created_at, invited_by')
    .eq('site_id', SITE_ID)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createStaffInvite(
  email: string,
  role: string,
  invitedBy: string | null,
) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('A valid email is required.');
  }
  if (!ASSIGNABLE_STAFF_ROLES.includes(role) && !ALL_STAFF_ROLES.includes(role)) {
    throw new Error('Invalid role for invite.');
  }

  const sb = createAdminClient();
  const token = crypto.randomBytes(24).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: inviteRow, error: inviteError } = await sb
    .from('staff_invites')
    .insert({
      site_id: SITE_ID,
      email: normalizedEmail,
      role,
      token_hash: tokenHash,
      invited_by: invitedBy,
      expires_at: expiresAt,
    })
    .select('id, email, role, expires_at')
    .single();
  if (inviteError) throw inviteError;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, '') || 'http://localhost:3000';
  const redirectTo = `${siteUrl}/auth/callback`;
  const { data: authData, error: authError } = await sb.auth.admin.inviteUserByEmail(
    normalizedEmail,
    { redirectTo },
  );
  if (authError) {
    await sb.from('staff_invites').delete().eq('id', inviteRow.id);
    throw authError;
  }

  const userId = authData.user?.id;
  if (userId) {
    await sb.from('profiles').update({ role, email: normalizedEmail }).eq('id', userId);
  }

  return {
    invite: inviteRow,
    inviteToken: token,
    userId,
  };
}

export async function acceptStaffInviteForUser(userId: string, email: string) {
  const sb = createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  const tokenCandidates = await sb
    .from('staff_invites')
    .select('id, role, token_hash')
    .eq('site_id', SITE_ID)
    .eq('email', normalizedEmail)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .limit(1);
  const invite = tokenCandidates.data?.[0];
  if (!invite) return null;

  await sb.from('staff_invites').update({ accepted_at: new Date().toISOString() }).eq('id', invite.id);
  await sb.from('profiles').update({ role: invite.role }).eq('id', userId);
  return invite.role;
}
