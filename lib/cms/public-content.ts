import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_ID } from './constants';
import { getCached, PUBLIC_CACHE_TTL } from './server-cache';

export type PublicContentResource = 'projects' | 'blog' | 'testimonials' | 'experience';

export async function getPublicContentItems(resource: PublicContentResource, limit: number) {
  const cacheKey = `public:content:${resource}:${limit}`;
  return getCached(cacheKey, PUBLIC_CACHE_TTL.publicContent, async () => {
    const sb = createAdminClient();

    if (resource === 'projects') {
      const { data, error } = await sb
        .from('projects')
        .select('legacy_id, title, category_key, status, short_description, featured_image_url, live_url, repo_url, is_featured')
        .eq('site_id', SITE_ID)
        .is('deleted_at', null)
        .eq('status', 'Completed')
        .order('sort_order', { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data || [];
    }

    if (resource === 'blog') {
      const { data, error } = await sb
        .from('blog_posts')
        .select('legacy_id, title, slug, status, excerpt, featured_image_url, published_at, meta_title, meta_description')
        .eq('site_id', SITE_ID)
        .is('deleted_at', null)
        .eq('status', 'Published')
        .order('published_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    }

    if (resource === 'testimonials') {
      const { data, error } = await sb
        .from('testimonials')
        .select('legacy_id, client_name, client_role, company, quote, avatar_url, rating')
        .eq('site_id', SITE_ID)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data || [];
    }

    const { data, error } = await sb
      .from('experience_entries')
      .select('legacy_id, company, job_title, start_date, end_date, description, sort_order, is_current')
      .eq('site_id', SITE_ID)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data || [];
  });
}
