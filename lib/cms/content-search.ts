import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_ID } from '@/lib/cms/constants';

export type SearchResult = {
  type: 'project' | 'blog' | 'media' | 'tool';
  id: string;
  legacyId: number | null;
  title: string;
  subtitle?: string | null;
  href: string;
};

function escapeIlike(term: string) {
  return term.replace(/[%_\\]/g, '\\$&');
}

export async function searchCmsContent(query: string, limit = 20): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const safeLimit = Math.min(Math.max(limit, 1), 40);
  const pattern = `%${escapeIlike(q)}%`;
  const sb = createAdminClient();

  const [projects, blogs, media, categoriesRes] = await Promise.all([
    sb
      .from('projects')
      .select('id, legacy_id, title, status')
      .eq('site_id', SITE_ID)
      .is('deleted_at', null)
      .ilike('title', pattern)
      .limit(safeLimit),
    sb
      .from('blog_posts')
      .select('id, legacy_id, title, status')
      .eq('site_id', SITE_ID)
      .is('deleted_at', null)
      .ilike('title', pattern)
      .limit(safeLimit),
    sb
      .from('media_assets')
      .select('id, legacy_id, file_name')
      .eq('site_id', SITE_ID)
      .is('deleted_at', null)
      .ilike('file_name', pattern)
      .limit(safeLimit),
    sb
      .from('tool_categories')
      .select('id')
      .eq('site_id', SITE_ID)
      .is('deleted_at', null),
  ]);

  const toolCategoryIds = (categoriesRes.data || []).map((c) => c.id);
  const tools = toolCategoryIds.length
    ? await sb
      .from('tool_items')
      .select('id, legacy_id, name')
      .in('category_id', toolCategoryIds)
      .ilike('name', pattern)
      .limit(safeLimit)
    : { data: [] };

  const results: SearchResult[] = [];

  for (const row of projects.data || []) {
    results.push({
      type: 'project',
      id: row.id,
      legacyId: row.legacy_id,
      title: row.title || 'Untitled project',
      subtitle: row.status,
      href: '/projects',
    });
  }
  for (const row of blogs.data || []) {
    results.push({
      type: 'blog',
      id: row.id,
      legacyId: row.legacy_id,
      title: row.title || 'Untitled post',
      subtitle: row.status,
      href: row.legacy_id != null ? `/blog-post?open=${row.legacy_id}` : '/blog-post',
    });
  }
  for (const row of media.data || []) {
    results.push({
      type: 'media',
      id: row.id,
      legacyId: row.legacy_id,
      title: row.file_name || 'Media asset',
      href: '/media-library',
    });
  }
  for (const row of tools.data || []) {
    results.push({
      type: 'tool',
      id: row.id,
      legacyId: row.legacy_id,
      title: row.name || 'Tool',
      href: '/tools',
    });
  }

  return results.slice(0, safeLimit);
}
