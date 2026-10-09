// @ts-nocheck
import { NextResponse } from 'next/server';
import { getProjectTagLabels, saveProjectTagLabels } from '@/lib/cms/repository';
import { getProjectTagActivitySnapshots } from '@/lib/cms/activity-snapshots';
import { guardStaff, guardEditor } from '@/lib/auth/guard';
import { withStaffGet } from '@/lib/api/with-staff-get';
import { logArrayEntityChanges } from '@/lib/cms/activity-events';

export async function GET() {
  return withStaffGet(() => getProjectTagLabels(), { maxAgeSec: 180 });
}

export async function PUT(request) {
  const auth = await guardEditor();
  if (!auth.ok) return auth.response;
  try {
    const before = await getProjectTagActivitySnapshots();
    const records = await request.json();
    await saveProjectTagLabels(Array.isArray(records) ? records : []);
    await logArrayEntityChanges({
      auth,
      request,
      entity: 'project_tag',
      entityLabel: 'Project tag',
      before,
      after: Array.isArray(records) ? records : [],
      titleFn: (item) => item.tag || 'Untitled tag',
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
