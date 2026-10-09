// @ts-nocheck
import { NextResponse } from 'next/server';
import {
  bulkSoftDeleteComments,
  bulkUpdateCommentStatus,
  listCommentsPage,
} from '@/lib/cms/blog-engagement';
import { guardEditor } from '@/lib/auth/guard';
import { withEditorGet } from '@/lib/api/with-editor-get';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  return withEditorGet(() => listCommentsPage({
    cursor: searchParams.get('cursor'),
    limit: Number.parseInt(searchParams.get('limit') || '25', 10),
    status: searchParams.get('status') || 'all',
    postLegacyId: searchParams.get('postId'),
    timeRange: searchParams.get('time') || 'all',
    q: searchParams.get('q') || '',
  }), { maxAgeSec: 0 });
}

export async function PATCH(request) {
  const auth = await guardEditor();
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const ids = Array.isArray(body?.ids) ? body.ids.map(String).filter(Boolean) : [];
    if (!ids.length) {
      return NextResponse.json({ error: 'ids array is required.' }, { status: 400 });
    }
    if (body?.delete === true) {
      const result = await bulkSoftDeleteComments(ids);
      return NextResponse.json({ ok: true, ...result });
    }
    const status = body?.status;
    const allowed = new Set(['pending', 'approved', 'spam', 'rejected']);
    if (!status || !allowed.has(status)) {
      return NextResponse.json({ error: 'Valid status is required.' }, { status: 400 });
    }
    const result = await bulkUpdateCommentStatus(ids, status);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
