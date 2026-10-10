import { NextResponse } from 'next/server';
import { authorizeCronRequest } from '@/lib/api/cron-auth';
import { deliverWebhookOutboxBatch } from '@/lib/cms/publish-webhook';

export async function GET(request: Request) {
  const denied = authorizeCronRequest(request);
  if (denied) return denied;

  const result = await deliverWebhookOutboxBatch(30);
  return NextResponse.json({ ok: true, ...result });
}
