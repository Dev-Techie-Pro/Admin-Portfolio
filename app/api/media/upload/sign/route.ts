import { NextResponse } from 'next/server';
import { guardStaff, isGuardFailure } from '@/lib/auth/guard';
import { createSignedMediaUpload, VERCEL_PROXY_UPLOAD_MAX_BYTES } from '@/lib/cms/media-storage';
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit';

export async function POST(request: Request) {
  try {
    const auth = await guardStaff();
    if (isGuardFailure(auth)) return auth.response;

    const limit = await checkRateLimit(request, 'staff_media_upload');
    if (!limit.allowed) {
      const { status, headers } = rateLimitResponse(limit.retryAfterSec);
      return NextResponse.json(
        { error: 'Too many uploads. Please try again later.' },
        { status, headers },
      );
    }

    const body = await request.json();
    const folder = String(body.folder || 'general');
    const mimeType = String(body.mimeType || 'application/octet-stream');
    const fileName = String(body.fileName || 'upload');
    const sizeBytes = Number(body.sizeBytes) || 0;

    if (sizeBytes <= 0) {
      return NextResponse.json({ error: 'sizeBytes is required.' }, { status: 400 });
    }
    if (sizeBytes > VERCEL_PROXY_UPLOAD_MAX_BYTES) {
      /* direct upload expected */
    }

    const caps = auth.capabilities;
    if (!caps.canManageContent && !caps.canManageOwnAccountSettings) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const signed = await createSignedMediaUpload({
      mimeType,
      fileName,
      folder,
      sizeBytes,
    });

    return NextResponse.json({ ok: true, ...signed });
  } catch (error) {
    const message = (error as Error)?.message || 'Sign failed.';
    const status = message.includes('limit') || message.includes('Unsupported') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
