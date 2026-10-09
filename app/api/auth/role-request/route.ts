// @ts-nocheck
import { NextResponse } from 'next/server';
import { guardStaff } from '@/lib/auth/guard';
import { ADMIN_ROLES } from '@/lib/auth/constants';
import { getProfileForUser } from '@/lib/auth/profile';
import { recordUserAction } from '@/lib/cms/activity-log';
import { createUserNotification, getAdminUserIds } from '@/lib/cms/notifications';
import { sendRoleRequestEmail } from '@/lib/email/send-role-request';
import {
  createAccessElevationRequest,
  getStaffElevationStatus,
} from '@/lib/cms/access-elevation-requests';
import { staffAlreadyHasEditorAccess } from '@/lib/auth/elevation';
import { createAdminClient } from '@/lib/supabase/admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const auth = await guardStaff();
  if (!auth.ok) return auth.response;

  if (ADMIN_ROLES.includes(auth.profile.role)) {
    return NextResponse.json({ error: 'Administrators cannot submit access requests.' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const contactEmail = typeof body?.contactEmail === 'string' ? body.contactEmail.trim() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';

  if (!contactEmail || !EMAIL_RE.test(contactEmail)) {
    return NextResponse.json({ error: 'Please provide a valid contact email address.' }, { status: 400 });
  }
  if (!message || message.length < 10) {
    return NextResponse.json({ error: 'Please include a short message (at least 10 characters).' }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'Message is too long (max 2000 characters).' }, { status: 400 });
  }

  const elevationStatus = await getStaffElevationStatus(auth.user.id);
  if (elevationStatus.pending) {
    return NextResponse.json({ error: 'You already have a pending access request.' }, { status: 409 });
  }
  if (elevationStatus.activeUntil) {
    return NextResponse.json({ error: 'You already have active temporary access.' }, { status: 400 });
  }

  const alreadyEditor = staffAlreadyHasEditorAccess(auth.profile.role);
  if (alreadyEditor) {
    return NextResponse.json({
      error: 'Your account already has editor-level CMS access. Contact an admin if you need something else.',
    }, { status: 400 });
  }

  const profile = await getProfileForUser(auth.user);
  const actorName = profile.fullName || profile.username || profile.email || auth.user.email || 'Staff member';
  const actorEmail = profile.email || auth.user.email || '';
  const currentRole = auth.profile.role;

  const { data: profileRow } = await createAdminClient()
    .from('profiles')
    .select('site_id')
    .eq('id', auth.user.id)
    .maybeSingle();

  let requestRow;
  try {
    requestRow = await createAccessElevationRequest({
      userId: auth.user.id,
      siteId: profileRow?.site_id,
      contactEmail,
      message,
    });
  } catch (error) {
    const status = error?.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  await recordUserAction({
    userId: auth.user.id,
    actionTitle: 'Temporary access request submitted',
    actionDescription: `${actorName} requested temporary editor access`,
    status: 'info',
    metadata: {
      action: 'access_elevation.request',
      requestId: requestRow.id,
      contactEmail,
      currentRole,
    },
    request,
  });

  const admins = await getAdminUserIds();
  const { getSiteUrl } = await import('@/lib/site-url');
  const origin = getSiteUrl(request);
  const reviewUrl = origin ? `${origin.replace(/\/$/, '')}/access-requests` : '/access-requests';

  let notificationsCreated = 0;
  let emailsSent = 0;
  const emailErrors = [];

  for (const admin of admins) {
    const notification = await createUserNotification({
      userId: admin.id,
      actorUserId: auth.user.id,
      category: 'system_alerts',
      title: 'Temporary access request',
      body: `${actorName} (${currentRole.replace(/_/g, ' ')}) requested temporary editor access. Contact: ${contactEmail}`,
      icon: 'ri-user-settings-line',
      linkPath: '/access-requests',
      metadata: {
        action: 'access_elevation.request',
        requestId: requestRow.id,
        contactEmail,
        currentRole,
        requesterEmail: actorEmail,
        message,
      },
      force: true,
    });
    if (notification) notificationsCreated += 1;

    if (admin.email) {
      const mail = await sendRoleRequestEmail({
        to: admin.email,
        adminName: admin.full_name || admin.username || admin.email,
        requesterName: actorName,
        requesterEmail: actorEmail,
        requesterRole: currentRole,
        contactEmail,
        requestedRole: '',
        message,
        usersUrl: reviewUrl,
      });
      if (mail.sent) emailsSent += 1;
      else if (mail.reason) emailErrors.push(mail.reason);
    }
  }

  return NextResponse.json({
    ok: true,
    requestId: requestRow.id,
    notificationsCreated,
    emailsSent,
    emailConfigured: emailErrors.length === 0 || emailsSent > 0,
    message: notificationsCreated
      ? 'Your request was sent to the administrators.'
      : 'Request recorded, but no administrators were available to notify.',
  });
}
