import { publicCorsJson, publicCorsOptions } from '@/lib/api/public-cors';
import { getPublicEngagementBySlug } from '@/lib/cms/blog-engagement';

export async function OPTIONS(request) {
  return publicCorsOptions(request);
}

export async function GET(request, { params }) {
  try {
    const slug = decodeURIComponent(params.slug || '').trim();
    if (!slug) {
      return publicCorsJson(request, { error: 'Missing slug.' }, { status: 400 });
    }
    const url = new URL(request.url);
    const visitorKey = url.searchParams.get('visitorKey')?.trim() || undefined;
    const data = await getPublicEngagementBySlug(slug, visitorKey);
    if (!data) {
      return publicCorsJson(request, { error: 'Post not found.' }, { status: 404 });
    }
    return publicCorsJson(request, data);
  } catch (error) {
    return publicCorsJson(request, { error: error.message }, { status: 500 });
  }
}
