// @ts-nocheck
import { NextResponse } from 'next/server';
import { authorizeCronRequest } from '@/lib/api/cron-auth';
import { publishScheduledBlogPosts } from '@/lib/cms/scheduled-publish';
import { deliverWebhookOutboxBatch } from '@/lib/cms/publish-webhook';

/**
 * Publishes blog posts whose published_at date is today or earlier.
 * Also drains the publish webhook outbox (retries). Schedule daily on Vercel Hobby+.
 * Authorization: Bearer CRON_SECRET
 */
export async function GET(request: Request) {
  const denied = authorizeCronRequest(request);
  if (denied) return denied;

  try {
    const result = await publishScheduledBlogPosts();
    const webhooks = await deliverWebhookOutboxBatch(30);
    return NextResponse.json({ ok: true, ...result, webhooks });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
