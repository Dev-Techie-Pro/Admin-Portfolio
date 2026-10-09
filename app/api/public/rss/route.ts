// @ts-nocheck
import { publicCorsOptions } from '@/lib/api/public-cors';
import { buildBlogRssXml } from '@/lib/cms/public-sitemap';

export async function OPTIONS(request: Request) {
  return publicCorsOptions(request);
}

export async function GET() {
  const xml = await buildBlogRssXml();
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800',
    },
  });
}
