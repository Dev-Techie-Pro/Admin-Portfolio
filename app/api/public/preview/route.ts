// @ts-nocheck
import { publicCorsJson, publicCorsOptions } from '@/lib/api/public-cors';
import { verifyContentPreviewToken } from '@/lib/cms/content-preview-token';
import { getBlogPostByLegacyId } from '@/lib/cms/repository';

export async function OPTIONS(request: Request) {
  return publicCorsOptions(request);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token')?.trim();
  if (!token) {
    return publicCorsJson(request, { error: 'token is required.' }, { status: 400 });
  }

  const payload = verifyContentPreviewToken(token);
  if (!payload) {
    return publicCorsJson(request, { error: 'Invalid or expired preview token.' }, { status: 403 });
  }

  try {
    if (payload.type === 'blog_post') {
      const post = await getBlogPostByLegacyId(payload.legacyId);
      if (!post) {
        return publicCorsJson(request, { error: 'Post not found.' }, { status: 404 });
      }
      return publicCorsJson(request, {
        preview: true,
        type: 'blog_post',
        item: post,
      });
    }
    return publicCorsJson(request, { error: 'Unsupported preview type.' }, { status: 400 });
  } catch (err) {
    console.error('[public/preview]', err);
    return publicCorsJson(request, { error: 'Could not load preview.' }, { status: 500 });
  }
}
