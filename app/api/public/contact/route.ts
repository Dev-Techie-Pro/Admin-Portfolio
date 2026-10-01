import { publicCorsJson, publicCorsOptions } from '@/lib/api/public-cors';
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit';
import { getClientIp } from '@/lib/auth/request-meta';
import { verifyTurnstileToken } from '@/lib/api/turnstile';
import { submitPublicContactMessage } from '@/lib/cms/public-contact';
import { maybeSendContactAutoReply } from '@/lib/email/send-contact-auto-reply';

export async function OPTIONS(request: Request) {
  return publicCorsOptions(request);
}

export async function POST(request: Request) {
  const limit = await checkRateLimit(request, 'public_contact');
  if (!limit.allowed) {
    const { status, headers } = rateLimitResponse(limit.retryAfterSec);
    return publicCorsJson(request, { error: 'Too many requests. Please try again later.' }, { status, headers });
  }

  try {
    const body = await request.json();
    const senderIp = getClientIp(request);
    const captcha = await verifyTurnstileToken(body?.turnstileToken ?? body?.captchaToken, senderIp);
    if (!captcha.ok) {
      return publicCorsJson(request, { error: captcha.error }, { status: 400 });
    }
    const result = await submitPublicContactMessage(
      {
        senderName: body?.senderName ?? body?.name,
        senderEmail: body?.senderEmail ?? body?.email,
        subject: body?.subject,
        body: body?.body ?? body?.message,
        website: body?.website ?? body?.url,
      },
      senderIp,
    );
    if (!result.ok) {
      return publicCorsJson(request, { error: result.error }, { status: result.status });
    }
    try {
      await maybeSendContactAutoReply({
        senderName: String(body?.senderName ?? body?.name ?? ''),
        senderEmail: String(body?.senderEmail ?? body?.email ?? ''),
        subject: String(body?.subject ?? ''),
      });
    } catch (err) {
      console.warn('[contact] auto-reply failed:', (err as Error).message);
    }
    return publicCorsJson(request, { ok: true, id: result.legacyId ?? result.id });
  } catch (error) {
    return publicCorsJson(
      request,
      { error: 'Unable to submit message.' },
      { status: 500 },
    );
  }
}
