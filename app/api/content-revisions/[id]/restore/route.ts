// @ts-nocheck
import { NextResponse } from 'next/server';
import { guardEditor, isGuardFailure } from '@/lib/auth/guard';
import { getContentRevisionById } from '@/lib/cms/content-revisions';
import { getBlogPosts, saveBlogPosts } from '@/lib/cms/repository';

export async function POST(_request: Request, { params }: { params: { id?: string } }) {
  const auth = await guardEditor();
  if (isGuardFailure(auth)) return auth.response;

  const revisionId = params?.id;
  if (!revisionId) {
    return NextResponse.json({ error: 'Revision id is required.' }, { status: 400 });
  }

  try {
    const revision = await getContentRevisionById(revisionId);
    if (!revision || revision.entity_type !== 'blog_post') {
      return NextResponse.json({ error: 'Revision not found.' }, { status: 404 });
    }

    const snapshot = revision.snapshot as Record<string, unknown>;
    const legacyId = revision.legacy_id ?? snapshot?.legacyId ?? snapshot?.id;
    if (legacyId == null) {
      return NextResponse.json({ error: 'Invalid revision snapshot.' }, { status: 400 });
    }

    const posts = await getBlogPosts({ includeContent: true });
    const list = Array.isArray(posts) ? posts : [];
    const idx = list.findIndex((p) => String(p.id) === String(legacyId) || String(p.legacyId) === String(legacyId));
    if (idx === -1) {
      return NextResponse.json({ error: 'Blog post no longer exists.' }, { status: 404 });
    }

    list[idx] = { ...list[idx], ...snapshot, id: list[idx].id };
    await saveBlogPosts(list);
    return NextResponse.json({ ok: true, legacyId: list[idx].id });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
