// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_ID } from '@/lib/cms/constants';
import { invalidateCachePrefix } from '@/lib/cms/server-cache';
import { firePublishWebhooks } from '@/lib/cms/publish-webhook';

export async function publishScheduledBlogPosts() {
  const sb = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: due, error: selectError } = await sb
    .from('blog_posts')
    .select('id, legacy_id, title, slug, status, published_at')
    .eq('site_id', SITE_ID)
    .is('deleted_at', null)
    .neq('status', 'Published')
    .not('published_at', 'is', null)
    .lte('published_at', nowIso);

  if (selectError) throw selectError;
  if (!due?.length) return { published: 0, posts: [] as { id: string; title: string | null }[] };

  const ids = due.map((row) => row.id);
  const { error: updateError } = await sb
    .from('blog_posts')
    .update({ status: 'Published' })
    .in('id', ids);
  if (updateError) throw updateError;

  invalidateCachePrefix('cms:blog');
  await firePublishWebhooks(
    due.map((row) => ({
      id: row.id,
      legacyId: row.legacy_id,
      title: row.title,
      slug: row.slug,
      status: 'Published',
    })),
  );

  return {
    published: due.length,
    posts: due.map((row) => ({ id: row.id, title: row.title })),
  };
}
