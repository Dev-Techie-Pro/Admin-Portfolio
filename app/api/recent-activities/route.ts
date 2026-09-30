import { NextResponse } from 'next/server';
import { guardEditor } from '@/lib/auth/guard';
import { deriveAccessCapabilities } from '@/lib/auth/capabilities';
import { withStaffGet } from '@/lib/api/with-staff-get';
import {
  getRecentActivitiesPayload,
  deleteRecentActivityForUser,
  deleteRecentActivitiesForUser,
  deleteRecentActivity,
  deleteRecentActivities,
} from '@/lib/cms/repository';

function parseIdsParam(raw) {
  if (!raw) return [];
  return raw.split(',').map((value) => value.trim()).filter(Boolean);
}

async function readBulkIds(request, searchParams) {
  const fromQuery = parseIdsParam(searchParams.get('ids'));
  if (fromQuery.length) return fromQuery;

  try {
    const body = await request.json();
    if (Array.isArray(body?.ids)) {
      return body.ids.map((value) => String(value).trim()).filter(Boolean);
    }
  } catch {
    // DELETE may have no JSON body when using query params only.
  }
  return [];
}

export async function GET() {
  return withStaffGet((auth) => {
    const scopeAll = deriveAccessCapabilities(auth.profile.role).canViewAllStaffActivity;
    return getRecentActivitiesPayload({
      userId: auth.user.id,
      scopeAll,
    }).then((payload) => ({ ...payload, scope: scopeAll ? 'all' : 'self' }));
  }, { maxAgeSec: 30 });
}

export async function DELETE(request) {
  const auth = await guardEditor();
  if (!auth.ok) return auth.response;
  const scopeAll = deriveAccessCapabilities(auth.profile.role).canViewAllStaffActivity;
  const userId = auth.user.id;
  try {
    const { searchParams } = new URL(request.url);
    const bulkIds = await readBulkIds(request, searchParams);
    const id = searchParams.get('id');
    if (bulkIds.length) {
      const deleted = scopeAll
        ? await deleteRecentActivities(bulkIds)
        : await deleteRecentActivitiesForUser(bulkIds, userId);
      if (!scopeAll && deleted < bulkIds.length) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ ok: true, deleted });
    }
    if (!id) {
      return NextResponse.json({ error: 'Activity id is required.' }, { status: 400 });
    }
    if (scopeAll) {
      await deleteRecentActivity(id);
    } else {
      const ok = await deleteRecentActivityForUser(id, userId);
      if (!ok) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
