import { NextResponse } from 'next/server';
import { guardStaff, isGuardFailure } from '@/lib/auth/guard';
import { getMediaPublicUrl, MEDIA_BUCKET, normalizeUploadFolder } from '@/lib/cms/media-storage';
import { createAdminClient } from '@/lib/supabase/admin';
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
    const storagePath = String(body.storagePath || '').trim();
    const mimeType = String(body.mimeType || 'application/octet-stream');
    const fileName = String(body.fileName || 'upload');
    const folder = normalizeUploadFolder(String(body.folder || 'general'));
    const sizeBytes = Number(body.sizeBytes) || 0;

    if (!storagePath || !storagePath.includes('/')) {
      return NextResponse.json({ error: 'Invalid storagePath.' }, { status: 400 });
    }

    const caps = auth.capabilities;
    if (!caps.canManageContent && !caps.canManageOwnAccountSettings) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: listed, error: headErr } = await admin.storage.from(MEDIA_BUCKET).list(
      storagePath.split('/').slice(0, -1).join('/'),
      { search: storagePath.split('/').pop() },
    );
    if (headErr) {
      return NextResponse.json({ error: 'Upload not found in storage.' }, { status: 400 });
    }
    if (!listed?.length) {
      return NextResponse.json({ error: 'Upload not found in storage.' }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      url: getMediaPublicUrl(storagePath),
      storagePath,
      fileName,
      size: sizeBytes || listed[0]?.metadata?.size || 0,
      mimeType,
      folder,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error)?.message || 'Complete failed.' }, { status: 500 });
  }
}
