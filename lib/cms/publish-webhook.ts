// @ts-nocheck
import { warmRuntimeSettings, getRuntimeSettingSync } from '@/lib/config/runtime-settings';

export type PublishWebhookPayload = {
  id: string;
  legacyId?: number | null;
  title?: string | null;
  slug?: string | null;
  status?: string | null;
};

export async function firePublishWebhooks(posts: PublishWebhookPayload[]) {
  if (!posts.length) return;
  await warmRuntimeSettings();
  const url = getRuntimeSettingSync('WEBHOOK_PUBLISH_URL')?.trim();
  if (!url || !/^https:\/\//i.test(url)) return;

  for (const post of posts) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'blog.published',
          timestamp: new Date().toISOString(),
          post,
        }),
        signal: AbortSignal.timeout(8000),
      });
    } catch (err) {
      console.warn('[publish-webhook] delivery failed:', (err as Error).message);
    }
  }
}
