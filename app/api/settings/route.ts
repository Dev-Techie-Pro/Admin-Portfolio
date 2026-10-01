import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/cms/repository';
import { guardAdmin, isGuardFailure } from '@/lib/auth/guard';
import { withStaffGet } from '@/lib/api/with-staff-get';
import { recordUserAction } from '@/lib/cms/activity-log';

export async function GET() {
  return withStaffGet(() => getSettings());
}

export async function PUT(request) {
  const auth = await guardAdmin();
  if (isGuardFailure(auth)) return auth.response;
  try {
    await saveSettings(await request.json());
    await recordUserAction({
      userId: auth.user.id,
      actionTitle: 'Settings updated',
      actionDescription: 'General site settings were modified',
      status: 'success',
      metadata: { action: 'settings.updated', section: 'general' },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
