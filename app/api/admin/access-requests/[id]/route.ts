// @ts-nocheck
import { NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/auth/guard';
import {
  approveAccessRequest,
  rejectAccessRequest,
} from '@/lib/cms/access-elevation-requests';
import { createUserNotification } from '@/lib/cms/notifications';
import { recordUserAction } from '@/lib/cms/activity-log';
import { sendAccessElevationApprovedEmail } from '@/lib/email/send-access-elevation-approved';
import { sendAccessElevationRejectedEmail } from '@/lib/email/send-access-elevation-rejected';
import { getSiteUrl } from '@/lib/site-url';
import { normalizeDurationHours } from '@/lib/auth/elevation';

export async function PATCH(request, { params }) {
  const auth = await guardAdmin();
  if (!auth.ok) return auth.response;

  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: 'Request id is required.' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const action = typeof body?.action === 'string' ? body.action.trim() : '';
  const rejectionNote = typeof body?.rejectionNote === 'string' ? body.rejectionNote.trim() : '';

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be approve or reject.' }, { status: 400 });
  }

  try {
    const origin = getSiteUrl(request);
    const dashboardUrl = origin ? origin.replace(/\/$/, '') : '';

    if (action === 'approve') {
      let durationHours;
      try {
        durationHours = normalizeDurationHours(body?.durationHours);
      } catch (durationError) {
        const status = durationError?.status || 400;
        return NextResponse.json({ error: durationError.message }, { status });
      }

      const row = await approveAccessRequest(id, auth.user.id, durationHours);
      const requesterName = row.requesterName || row.requesterEmail || 'Staff member';
      const contactEmail = row.contactEmail || row.requesterEmail;
      const hoursLabel = row.durationHours ?? durationHours;

      await createUserNotification({
        userId: row.userId,
        actorUserId: auth.user.id,
        category: 'system_alerts',
        title: 'Temporary access approved',
        body: `Your role is editor for ${hoursLabel} hour${hoursLabel === 1 ? '' : 's'}, until ${new Date(row.elevatedUntil).toLocaleString()}. User management stays restricted.`,
        icon: 'ri-shield-check-line',
        linkPath: '/',
        metadata: {
          action: 'access_elevation.approved',
          requestId: row.id,
          elevatedUntil: row.elevatedUntil,
          durationHours: hoursLabel,
        },
        force: true,
      });

      if (contactEmail) {
        await sendAccessElevationApprovedEmail({
          to: contactEmail,
          recipientName: requesterName,
          elevatedUntil: row.elevatedUntil,
          durationHours: hoursLabel,
          dashboardUrl,
        });
      }

      await recordUserAction({
        userId: auth.user.id,
        actionTitle: 'Access request approved',
        actionDescription: `Approved temporary access for ${requesterName}`,
        status: 'success',
        metadata: {
          action: 'access_elevation.approve',
          requestId: row.id,
          targetUserId: row.userId,
          durationHours: hoursLabel,
        },
        request,
      });

      return NextResponse.json({ ok: true, item: row });
    }

    const row = await rejectAccessRequest(id, auth.user.id, rejectionNote);
    const requesterName = row.requesterName || row.requesterEmail || 'Staff member';
    const contactEmail = row.contactEmail || row.requesterEmail;

    await createUserNotification({
      userId: row.userId,
      actorUserId: auth.user.id,
      category: 'system_alerts',
      title: 'Access request declined',
      body: rejectionNote || 'Your temporary access request was not approved.',
      icon: 'ri-shield-cross-line',
      linkPath: '/settings/security',
      metadata: { action: 'access_elevation.rejected', requestId: row.id },
      force: true,
    });

    if (contactEmail) {
      await sendAccessElevationRejectedEmail({
        to: contactEmail,
        recipientName: requesterName,
        rejectionNote: rejectionNote || row.rejectionNote,
      });
    }

    await recordUserAction({
      userId: auth.user.id,
      actionTitle: 'Access request rejected',
      actionDescription: `Declined temporary access for ${requesterName}`,
      status: 'info',
      metadata: { action: 'access_elevation.reject', requestId: row.id, targetUserId: row.userId },
      request,
    });

    return NextResponse.json({ ok: true, item: row });
  } catch (error) {
    const status = error?.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
