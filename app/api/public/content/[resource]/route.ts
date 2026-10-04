import { publicCorsJson, publicCorsOptions } from '@/lib/api/public-cors';
import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_ID } from '@/lib/cms/constants';

const ALLOWED = new Set(['projects', 'blog', 'testimonials', 'experience']);

export async function OPTIONS(request: Request) {
  return publicCorsOptions(request);
}

export async function GET(request: Request, { params }: { params: { resource?: string } }) {
  const resource = (params.resource || '').toLowerCase();
  if (!ALLOWED.has(resource)) {
    return publicCorsJson(request, { error: 'Unknown resource.' }, { status: 404 });
  }

  try {
    const sb = createAdminClient();
    const url = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10), 1), 100);

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
      return publicCorsJson(request, { items: data || [] });
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
      return publicCorsJson(request, { items: data || [] });
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
      return publicCorsJson(request, { items: data || [] });
    }

    const { data, error } = await sb
      .from('experience_entries')
      .select('legacy_id, company, job_title, start_date, end_date, description, sort_order, is_current')
      .eq('site_id', SITE_ID)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return publicCorsJson(request, { items: data || [] });
  } catch {
    return publicCorsJson(request, { error: 'Unable to load content.' }, { status: 500 });
  }
}
