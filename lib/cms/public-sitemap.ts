// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_ID } from '@/lib/cms/constants';
import { getPortfolioPublicBaseUrl } from '@/lib/site-url';
import { publicBlogVisibilityCutoff } from '@/lib/cms/blog-public-visibility';

function xmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function buildSitemapXml(portfolioBaseUrl?: string) {
  const base = (portfolioBaseUrl || getPortfolioPublicBaseUrl()).replace(/\/$/, '');
  const sb = createAdminClient();

  const nowIso = publicBlogVisibilityCutoff();
  const [blogs, projects] = await Promise.all([
    sb
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('site_id', SITE_ID)
      .is('deleted_at', null)
      .neq('status', 'Draft')
      .not('published_at', 'is', null)
      .lte('published_at', nowIso)
      .order('published_at', { ascending: false })
      .limit(500),
    sb
      .from('projects')
      .select('legacy_id, updated_at')
      .eq('site_id', SITE_ID)
      .is('deleted_at', null)
      .eq('status', 'Completed')
      .order('updated_at', { ascending: false })
      .limit(200),
  ]);

  const urls: string[] = [`  <url><loc>${xmlEscape(`${base}/`)}</loc></url>`];

  for (const row of blogs.data || []) {
    if (!row.slug) continue;
    const loc = `${base}/blog/${row.slug}`;
    const lastmod = row.updated_at || row.published_at;
    urls.push(`  <url><loc>${xmlEscape(loc)}</loc>${lastmod ? `<lastmod>${xmlEscape(String(lastmod).slice(0, 10))}</lastmod>` : ''}</url>`);
  }

  for (const row of projects.data || []) {
    if (row.legacy_id == null) continue;
    const loc = `${base}/projects/${row.legacy_id}`;
    const lastmod = row.updated_at;
    urls.push(`  <url><loc>${xmlEscape(loc)}</loc>${lastmod ? `<lastmod>${xmlEscape(String(lastmod).slice(0, 10))}</lastmod>` : ''}</url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

export async function buildBlogRssXml(portfolioBaseUrl?: string) {
  const base = (portfolioBaseUrl || getPortfolioPublicBaseUrl()).replace(/\/$/, '');
  const sb = createAdminClient();
  const nowIso = publicBlogVisibilityCutoff();
  const { data: posts } = await sb
    .from('blog_posts')
    .select('title, slug, excerpt, published_at, updated_at')
    .eq('site_id', SITE_ID)
    .is('deleted_at', null)
    .neq('status', 'Draft')
    .not('published_at', 'is', null)
    .lte('published_at', nowIso)
    .order('published_at', { ascending: false })
    .limit(50);

  const items = (posts || []).map((post) => {
    const link = `${base}/blog/${post.slug}`;
    const pubDate = new Date(post.published_at || post.updated_at || Date.now()).toUTCString();
    return `<item>
  <title>${xmlEscape(post.title || '')}</title>
  <link>${xmlEscape(link)}</link>
  <guid>${xmlEscape(link)}</guid>
  <pubDate>${pubDate}</pubDate>
  <description>${xmlEscape(post.excerpt || '')}</description>
</item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Portfolio Blog</title>
  <link>${xmlEscape(`${base}/blog`)}</link>
  <description>Latest blog posts</description>
  ${items.join('\n  ')}
</channel>
</rss>`;
}
