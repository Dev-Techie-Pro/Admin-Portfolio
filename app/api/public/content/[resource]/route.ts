// @ts-nocheck
import { publicCorsJson, publicCorsJsonCached, publicCorsOptions } from '@/lib/api/public-cors';
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit';
import {
  getPublicContentItems,
  type PublicContentResource,
} from '@/lib/cms/public-content';
import { PUBLIC_CACHE_MAX_AGE_SEC } from '@/lib/cms/server-cache';

const ALLOWED = new Set<PublicContentResource>(['projects', 'blog', 'testimonials', 'experience']);

export async function OPTIONS(request: Request) {
  return publicCorsOptions(request);
}

export async function GET(request: Request, { params }: { params: { resource?: string } }) {
  const resource = (params.resource || '').toLowerCase() as PublicContentResource;
  if (!ALLOWED.has(resource)) {
    return publicCorsJson(request, { error: 'Unknown resource.' }, { status: 404 });
  }

  const limit = await checkRateLimit(request, 'public_content_read', resource);
  if (!limit.allowed) {
    const { status, headers } = rateLimitResponse(limit.retryAfterSec);
    return publicCorsJson(request, { error: 'Too many requests. Please try again later.' }, { status, headers });
  }

  try {
    const url = new URL(request.url);
    const itemLimit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10), 1), 100);
    const items = await getPublicContentItems(resource, itemLimit);
    return publicCorsJsonCached(
      request,
      { items },
      PUBLIC_CACHE_MAX_AGE_SEC.publicContent,
    );
  } catch {
    return publicCorsJson(request, { error: 'Unable to load content.' }, { status: 500 });
  }
}
