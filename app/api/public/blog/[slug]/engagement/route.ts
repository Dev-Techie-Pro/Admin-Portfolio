import { publicCorsJson, publicCorsJsonCached, publicCorsOptions } from '@/lib/api/public-cors';
import { getPublicEngagementBySlug } from '@/lib/cms/blog-engagement';
import { getCached, PUBLIC_CACHE_MAX_AGE_SEC, PUBLIC_CACHE_TTL } from '@/lib/cms/server-cache';
import { publicRouteError } from '@/lib/api/public-route-error';

export async function OPTIONS(request: Request) {
  return publicCorsOptions(request);
}

export async function GET(request: Request, { params }: { params: { slug?: string } }) {
  try {
    const slug = decodeURIComponent(params.slug || '').trim();
    if (!slug) {
      return publicCorsJson(request, { error: 'Missing slug.' }, { status: 400 });
    }
    const url = new URL(request.url);
    const visitorKey = url.searchParams.get('visitorKey')?.trim() || '';
    const cacheKey = `public:engagement:${slug}:${visitorKey || '_'}`;
    const data = await getCached(cacheKey, PUBLIC_CACHE_TTL.publicEngagement, () =>
      getPublicEngagementBySlug(slug, visitorKey || undefined),
    );
    if (!data) {
      return publicCorsJson(request, { error: 'Post not found.' }, { status: 404 });
    }
    return publicCorsJsonCached(
      request,
      data,
      PUBLIC_CACHE_MAX_AGE_SEC.publicEngagement,
    );
  } catch (error) {
    return publicRouteError(request, 'public/blog/engagement', error);
  }
}
