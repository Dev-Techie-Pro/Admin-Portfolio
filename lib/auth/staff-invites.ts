import crypto from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_ID } from '@/lib/cms/constants';
import { ASSIGNABLE_STAFF_ROLES } from '@/lib/auth/constants';
import { buildInviteAuthCallbackUrl } from '@/lib/auth/callback-url';
import { normalizeStaffInviteActionLink } from '@/lib/auth/invite-action-link';
import { getSiteUrlFromEnv } from '@/lib/site-url';

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function formatInviteDbError(error: { code?: string; message?: string }) {
  if (error?.code === '23505') {
    return new Error('A pending invite already exists for this email.');
  }
  return new Error(error?.message || 'Could not save invite.');
}

function isEmailRateLimitError(error: { message?: string; code?: string }) {
  const msg = (error.message || '').toLowerCase();
  const code = (error.code || '').toLowerCase();
  return (
    code === 'over_email_send_rate_limit'
    || /email rate limit|rate limit exceeded|too many emails/i.test(msg)
  );
}

function formatAuthInviteError(error: { message?: string; code?: string }) {
  const msg = error?.message || 'Could not send invitation email.';
  if (isEmailRateLimitError(error)) {
    return new Error(
      'Supabase email rate limit exceeded. Wait about an hour before sending again, or use the invite link returned for this request.',
    );
  }
  if (/already been registered|already exists|already registered|duplicate/i.test(msg)) {
    return new Error(
      'This email is already registered. Open the user on the Users page or use a different address.',
    );
  }
  return new Error(msg);
}

async function generateInviteActionLink(
  sb: ReturnType<typeof createAdminClient>,
  email: string,
  redirectTo: string,
  role: string,
) {
  const { data, error } = await sb.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      redirectTo,
      data: { invited_role: role },
    },
  });
  const rawLink = data?.properties?.action_link;
  if (error || !rawLink) {
    return null;
  }
  const actionLink = normalizeStaffInviteActionLink(String(rawLink));
  if (!actionLink) return null;
  return {
    actionLink,
    userId: data.user?.id ?? null,
  };
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
  options: { siteUrl?: string } = {},
) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('A valid email is required.');
  }
  const normalizedRole = String(role ?? 'editor').trim().toLowerCase();
  if (!ASSIGNABLE_STAFF_ROLES.includes(normalizedRole)) {
    throw new Error('Invite role must be editor or viewer.');
  }

  const sb = createAdminClient();

  const { data: existingProfile } = await sb
    .from('profiles')
    .select('id')
    .ilike('email', normalizedEmail)
    .maybeSingle();
  if (existingProfile?.id) {
    throw new Error(`Email "${normalizedEmail}" is already registered.`);
  }

  const { error: clearPendingError } = await sb
    .from('staff_invites')
    .delete()
    .eq('site_id', SITE_ID)
    .eq('email', normalizedEmail)
    .is('accepted_at', null);
  if (clearPendingError) {
    throw new Error(clearPendingError.message || 'Could not replace the existing pending invite.');
  }

  const token = crypto.randomBytes(24).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: inviteRow, error: inviteError } = await sb
    .from('staff_invites')
    .insert({
      site_id: SITE_ID,
      email: normalizedEmail,
      role: normalizedRole,
      token_hash: tokenHash,
      invited_by: invitedBy,
      expires_at: expiresAt,
    })
    .select('id, email, role, expires_at')
    .single();
  if (inviteError) throw formatInviteDbError(inviteError);

  const siteUrl = options.siteUrl?.trim() || getSiteUrlFromEnv();
  const redirectTo = buildInviteAuthCallbackUrl(siteUrl);
  const { data: authData, error: authError } = await sb.auth.admin.inviteUserByEmail(
    normalizedEmail,
    {
      redirectTo,
      data: { invited_role: normalizedRole },
    },
  );
  if (authError) {
    if (isEmailRateLimitError(authError)) {
      const generated = await generateInviteActionLink(sb, normalizedEmail, redirectTo, normalizedRole);
      if (generated?.actionLink) {
        if (generated.userId) {
          await sb
            .from('profiles')
            .update({ role: normalizedRole, email: normalizedEmail })
            .eq('id', generated.userId);
        }
        return {
          invite: inviteRow,
          inviteToken: token,
          userId: generated.userId ?? authData?.user?.id ?? null,
          actionLink: generated.actionLink,
          emailSkipped: 'rate_limit' as const,
        };
      }
    }
    await sb.from('staff_invites').delete().eq('id', inviteRow.id);
    throw formatAuthInviteError(authError);
  }

  const userId = authData.user?.id;
  if (userId) {
    await sb.from('profiles').update({ role: normalizedRole, email: normalizedEmail }).eq('id', userId);
  }

  return {
    invite: inviteRow,
    inviteToken: token,
    userId,
  };
}

export async function hasPendingStaffInvite(email: string) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  if (!normalizedEmail) return false;
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('staff_invites')
    .select('id')
    .eq('site_id', SITE_ID)
    .eq('email', normalizedEmail)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) return false;
  return Boolean(data?.id);
}

export async function acceptStaffInviteForUser(userId: string, email: string) {
  const sb = createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date().toISOString();

  const { data: invites, error } = await sb
    .from('staff_invites')
    .select('id, role, expires_at')
    .eq('site_id', SITE_ID)
    .eq('email', normalizedEmail)
    .is('accepted_at', null)
    .order('created_at', { ascending: false });

  if (error || !invites?.length) return null;

  const invite = invites.find((row) => row.expires_at > now) ?? invites[0];
  await sb.from('profiles').update({ role: invite.role }).eq('id', userId);
  await sb.from('staff_invites').delete().eq('site_id', SITE_ID).eq('email', normalizedEmail);

  return invite.role;
}
