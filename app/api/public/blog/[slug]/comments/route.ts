import { publicCorsJson, publicCorsOptions } from '@/lib/api/public-cors';
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit';
import { verifyTurnstileToken } from '@/lib/api/turnstile';
import { getClientIp } from '@/lib/auth/request-meta';
import { submitPublicComment } from '@/lib/cms/blog-engagement';
import { publicRouteError } from '@/lib/api/public-route-error';

export async function OPTIONS(request: Request) {
  return publicCorsOptions(request);
}

export async function POST(request: Request, { params }: { params: { slug?: string } }) {
  const limit = await checkRateLimit(request, 'public_blog_comment', params?.slug);
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
    const senderIp = getClientIp(request);
    const captcha = await verifyTurnstileToken(body?.turnstileToken ?? body?.captchaToken, senderIp);
    if (!captcha.ok) {
      return publicCorsJson(request, { error: captcha.error }, { status: 400 });
    }
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
    return publicRouteError(request, 'public/blog/comments', error);
  }
}
