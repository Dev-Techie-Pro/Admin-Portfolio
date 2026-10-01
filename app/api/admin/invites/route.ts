import { NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/auth/guard';
import { createStaffInvite, listPendingStaffInvites } from '@/lib/auth/staff-invites';
import { recordUserAction } from '@/lib/cms/activity-log';

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
    const email = body?.email;
    const role = body?.role || 'editor';
    const result = await createStaffInvite(email, role, auth.user.id);
    await recordUserAction({
      userId: auth.user.id,
      actionTitle: 'Staff invite sent',
      actionDescription: `Invited ${result.invite.email} as ${result.invite.role}`,
      status: 'success',
      metadata: { email: result.invite.email, role: result.invite.role },
      request,
    });
    return NextResponse.json({
      ok: true,
      invite: result.invite,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
