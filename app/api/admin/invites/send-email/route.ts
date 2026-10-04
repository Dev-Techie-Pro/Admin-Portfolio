import { NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/auth/guard';
import { sendStaffInviteLinkEmail } from '@/lib/email/send-staff-invite-link';
import { recordUserAction } from '@/lib/cms/activity-log';
import {
  isAllowedStaffInviteActionLink,
  normalizeStaffInviteActionLink,
} from '@/lib/auth/invite-action-link';

export async function POST(request: Request) {
  const auth = await guardAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const role = typeof body?.role === 'string' ? body.role.trim().toLowerCase() : 'editor';
    const actionLinkRaw = typeof body?.actionLink === 'string' ? body.actionLink.trim() : '';
    const actionLink = normalizeStaffInviteActionLink(actionLinkRaw);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }
    if (!actionLink || !isAllowedStaffInviteActionLink(actionLink)) {
      return NextResponse.json(
        { error: 'Invalid invite link. Regenerate the invite or paste the full Supabase verify URL.' },
        { status: 400 },
      );
    }

    const result = await sendStaffInviteLinkEmail({ to: email, role, actionLink });
    if (!result.sent) {
      return NextResponse.json(
        { error: result.reason || 'Could not send email.' },
        { status: 400 },
      );
    }

    await recordUserAction({
      userId: auth.user.id,
      actionTitle: 'Staff invite emailed (SMTP)',
      actionDescription: `Sent manual invite link to ${email}`,
      status: 'success',
      metadata: { email, role },
      request,
    });

    return NextResponse.json({ ok: true, sent: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
