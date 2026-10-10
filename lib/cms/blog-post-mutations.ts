import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_ID } from '@/lib/cms/constants';
import type { BlogPostPatchInput } from '@/lib/schemas/blog-post';

export async function patchBlogPostByLegacyId(
  legacyId: string,
  patch: BlogPostPatchInput,
  expectedUpdatedAt?: string | null,
) {
  const sb = createAdminClient();
  const idNum = parseInt(legacyId, 10);
  if (!Number.isFinite(idNum)) {
    return { ok: false as const, error: 'Invalid post id.', status: 400 };
  }

  const { data: existing, error: loadErr } = await sb
    .from('blog_posts')
    .select('id, updated_at')
    .eq('site_id', SITE_ID)
    .eq('legacy_id', idNum)
    .is('deleted_at', null)
    .maybeSingle();
  if (loadErr) throw loadErr;
  if (!existing) return { ok: false as const, error: 'Blog post not found.', status: 404 };

  if (expectedUpdatedAt && existing.updated_at && existing.updated_at !== expectedUpdatedAt) {
    return { ok: false as const, error: 'Conflict: post was modified elsewhere.', status: 409 };
  }

  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.excerpt !== undefined) row.excerpt = patch.excerpt;
  if (patch.content !== undefined) row.content = patch.content;
  if (patch.published_at !== undefined) row.published_at = patch.published_at;

  if (!Object.keys(row).length) {
    return { ok: false as const, error: 'No fields to update.', status: 400 };
  }

  const { data, error } = await sb
    .from('blog_posts')
    .update(row)
    .eq('id', existing.id)
    .select('legacy_id, title, slug, status, updated_at')
    .single();
  if (error) throw error;

  return { ok: true as const, post: data };
}
