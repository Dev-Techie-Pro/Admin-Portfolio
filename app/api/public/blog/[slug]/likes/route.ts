import { publicCorsJson, publicCorsOptions } from '@/lib/api/public-cors';
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit';
import { togglePublicLike } from '@/lib/cms/blog-engagement';

export async function OPTIONS(request) {
  return publicCorsOptions(request);
}

export async function POST(request, { params }) {
  const limit = await checkRateLimit(request, 'public_blog_like', params?.slug);
  if (!limit.allowed) {
    const { status, headers } = rateLimitResponse(limit.retryAfterSec);
    return publicCorsJson(request, { error: 'Too many requests. Please try again later.' }, { status, headers });
  }

  try {
    const slug = decodeURIComponent(params.slug || '').trim();
    if (!slug) {
      return publicCorsJson(request, { error: 'Missing slug.' }, { status: 400 });
    }
    const body = await request.json();
    const visitorKey = typeof body?.visitorKey === 'string' ? body.visitorKey : '';
    const result = await togglePublicLike(slug, visitorKey);
    if (!result.ok) {
      return publicCorsJson(request, { error: result.error }, { status: result.status });
    }
    return publicCorsJson(request, result);
  } catch (error) {
    return publicCorsJson(request, { error: error.message }, { status: 500 });
  }
}
