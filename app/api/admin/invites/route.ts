import { NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/auth/guard';
import { createStaffInvite, listPendingStaffInvites } from '@/lib/auth/staff-invites';
import { recordUserAction } from '@/lib/cms/activity-log';
import { getSiteUrl } from '@/lib/site-url';

export async function GET() {
  const auth = await guardAdmin();
  if (!auth.ok) return auth.response;
  try {
    const invites = await listPendingStaffInvites();
    return NextResponse.json({ invites });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await guardAdmin();
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const role = typeof body?.role === 'string' ? body.role.trim().toLowerCase() : 'editor';
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    const result = await createStaffInvite(email, role, auth.user.id, {
      siteUrl: getSiteUrl(request),
    });
    const linkOnly = result.emailSkipped === 'rate_limit' && result.actionLink;
    await recordUserAction({
      userId: auth.user.id,
      actionTitle: linkOnly ? 'Staff invite link generated' : 'Staff invite sent',
      actionDescription: linkOnly
        ? `Invite email for ${result.invite.email} was rate-limited; link generated for manual share`
        : `Invited ${result.invite.email} as ${result.invite.role}`,
      status: linkOnly ? 'warning' : 'success',
      metadata: {
        email: result.invite.email,
        role: result.invite.role,
        emailSkipped: result.emailSkipped ?? null,
      },
      request,
    });
    return NextResponse.json({
      ok: true,
      invite: result.invite,
      actionLink: result.actionLink ?? null,
      emailSkipped: result.emailSkipped ?? null,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
