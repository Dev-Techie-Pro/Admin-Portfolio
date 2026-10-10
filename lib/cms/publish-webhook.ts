import { createHmac } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_ID } from '@/lib/cms/constants';
import { warmRuntimeSettings, getRuntimeSettingSync } from '@/lib/config/runtime-settings';

export type PublishWebhookPayload = {
  id: string;
  legacyId?: number | null;
  title?: string | null;
  slug?: string | null;
  status?: string | null;
};

function webhookSecret(): string {
  return (
    getRuntimeSettingSync('WEBHOOK_PUBLISH_SECRET')?.trim()
    || process.env.WEBHOOK_PUBLISH_SECRET?.trim()
    || ''
  );
}

function signBody(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

async function enqueueOutbox(post: PublishWebhookPayload) {
  const sb = createAdminClient();
  const payload = {
    event: 'blog.published',
    timestamp: new Date().toISOString(),
    post,
  };
  await sb.from('publish_webhook_outbox').insert({
    site_id: SITE_ID,
    payload,
  });
}

export async function deliverWebhookOutboxBatch(limit = 20) {
  await warmRuntimeSettings();
  const url = getRuntimeSettingSync('WEBHOOK_PUBLISH_URL')?.trim();
  if (!url || !/^https:\/\//i.test(url)) return { delivered: 0 };

  const sb = createAdminClient();
  const { data: rows, error } = await sb
    .from('publish_webhook_outbox')
    .select('id, payload, attempts')
    .eq('site_id', SITE_ID)
    .is('delivered_at', null)
    .lte('next_attempt_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) {
    console.warn('[publish-webhook] outbox load failed:', error.message);
    return { delivered: 0 };
  }

  const secret = webhookSecret();
  let delivered = 0;

  for (const row of rows || []) {
    const body = JSON.stringify(row.payload);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (secret) headers['X-Portfolio-Signature'] = `sha256=${signBody(body, secret)}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await sb.from('publish_webhook_outbox').update({
        delivered_at: new Date().toISOString(),
        last_error: null,
      }).eq('id', row.id);
      delivered += 1;
    } catch (err) {
      const attempts = (row.attempts ?? 0) + 1;
      const backoffMin = Math.min(attempts * 5, 60);
      await sb.from('publish_webhook_outbox').update({
        attempts,
        last_error: (err as Error).message,
        next_attempt_at: new Date(Date.now() + backoffMin * 60_000).toISOString(),
      }).eq('id', row.id);
    }
  }

  return { delivered };
}

export async function firePublishWebhooks(posts: PublishWebhookPayload[]) {
  if (!posts.length) return;
  await warmRuntimeSettings();
  const url = getRuntimeSettingSync('WEBHOOK_PUBLISH_URL')?.trim();
  if (!url || !/^https:\/\//i.test(url)) return;

  for (const post of posts) {
    try {
      await enqueueOutbox(post);
    } catch (err) {
      console.warn('[publish-webhook] enqueue failed:', (err as Error).message);
    }
  }
  await deliverWebhookOutboxBatch(10);
}
