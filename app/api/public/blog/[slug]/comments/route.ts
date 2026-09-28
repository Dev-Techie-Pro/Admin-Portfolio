import { publicCorsJson, publicCorsOptions } from '@/lib/api/public-cors';
import { submitPublicComment } from '@/lib/cms/blog-engagement';

export async function OPTIONS(request) {
  return publicCorsOptions(request);
}

export async function POST(request, { params }) {
  try {
    const slug = decodeURIComponent(params.slug || '').trim();
    if (!slug) {
      return publicCorsJson(request, { error: 'Missing slug.' }, { status: 400 });
    }
    const body = await request.json();
    const senderIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || null;
    const result = await submitPublicComment(
      slug,
      {
        authorName: body?.authorName,
        authorEmail: body?.authorEmail,
        body: body?.body,
      },
      senderIp,
    );
    if (!result.ok) {
      return publicCorsJson(request, { error: result.error }, { status: result.status });
    }
    return publicCorsJson(request, result);
  } catch (error) {
    return publicCorsJson(request, { error: error.message }, { status: 500 });
  }
}
