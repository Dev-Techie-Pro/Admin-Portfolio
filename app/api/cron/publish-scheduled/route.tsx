// @ts-nocheck
import { NextResponse } from 'next/server';
import { authorizeCronRequest } from '@/lib/api/cron-auth';
import { publishScheduledBlogPosts } from '@/lib/cms/scheduled-publish';

/**
 * Publishes blog posts whose published_at date is today or earlier.
 * Schedule daily via platform cron with Authorization: Bearer CRON_SECRET
 */
export async function GET(request: Request) {
  const denied = authorizeCronRequest(request);
  if (denied) return denied;

  try {
    const result = await publishScheduledBlogPosts();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
