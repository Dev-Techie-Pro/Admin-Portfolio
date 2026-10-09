// @ts-nocheck
import { NextResponse } from 'next/server';
import { authorizeCronRequest } from '@/lib/api/cron-auth';
import { purgeExpiredRecentActivities } from '@/lib/cms/activity-retention';

/**
 * Optional scheduled purge endpoint for platform cron (e.g. Vercel Cron).
 * Set CRON_SECRET in env and call with: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request) {
  const denied = authorizeCronRequest(request);
  if (denied) return denied;

  try {
    const ok = await purgeExpiredRecentActivities();
    return NextResponse.json({ ok });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
