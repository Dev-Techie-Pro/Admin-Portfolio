// @ts-nocheck
import { publicCorsOptions } from '@/lib/api/public-cors';
import { buildSitemapXml } from '@/lib/cms/public-sitemap';

export async function OPTIONS(request: Request) {
  return publicCorsOptions(request);
}

export async function GET() {
  const xml = await buildSitemapXml();
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
