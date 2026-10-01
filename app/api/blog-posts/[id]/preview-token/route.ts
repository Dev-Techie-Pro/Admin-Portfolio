import { NextResponse } from 'next/server';
import { guardEditor, isGuardFailure } from '@/lib/auth/guard';
import {
  createContentPreviewToken,
  getPreviewTokenTtlSec,
} from '@/lib/cms/content-preview-token';
import { getBlogPostByLegacyId } from '@/lib/cms/repository';
import { getSiteUrlFromEnv } from '@/lib/site-url';

export async function POST(_request: Request, { params }: { params: { id?: string } }) {
  const auth = await guardEditor();
  if (isGuardFailure(auth)) return auth.response;

  const legacyId = parseInt(String(params?.id ?? ''), 10);
  if (!Number.isFinite(legacyId)) {
    return NextResponse.json({ error: 'Invalid post id.' }, { status: 400 });
  }

  const post = await getBlogPostByLegacyId(legacyId);
  if (!post) {
    return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 });
  }

  try {
    const ttlSec = getPreviewTokenTtlSec();
    const token = createContentPreviewToken('blog_post', legacyId, ttlSec);
    const base = getSiteUrlFromEnv().replace(/\/$/, '');
    const previewUrl = `${base}/api/public/preview?token=${encodeURIComponent(token)}`;

    return NextResponse.json({
      token,
      previewUrl,
      expiresInSec: ttlSec,
      legacyId,
      status: post.status ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Could not create preview token.' },
      { status: 500 },
    );
  }
}
