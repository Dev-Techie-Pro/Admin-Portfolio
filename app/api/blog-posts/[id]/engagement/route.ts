// @ts-nocheck
import { NextResponse } from 'next/server';
import {
  deleteComment,
  getPostEngagementForStaff,
  updateCommentStatus,
} from '@/lib/cms/blog-engagement';
import { guardEditor } from '@/lib/auth/guard';
import { withStaffGet } from '@/lib/api/with-staff-get';

export async function GET(_request, { params }) {
  return withStaffGet(() => getPostEngagementForStaff(params.id), { maxAgeSec: 0 });
}

export async function PATCH(request, { params }) {
  const auth = await guardEditor();
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const commentId = body?.commentId;
    const status = body?.status;
    if (!commentId || !status) {
      return NextResponse.json({ error: 'commentId and status are required.' }, { status: 400 });
    }
    const allowed = new Set(['pending', 'approved', 'spam', 'rejected']);
    if (!allowed.has(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }
    const updated = await updateCommentStatus(commentId, status);
    if (!updated) {
      return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
    }
    const engagement = await getPostEngagementForStaff(params.id);
    return NextResponse.json({ ok: true, engagement });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = await guardEditor();
  if (!auth.ok) return auth.response;
  try {
    const commentId = new URL(request.url).searchParams.get('commentId');
    if (!commentId) {
      return NextResponse.json({ error: 'commentId query param is required.' }, { status: 400 });
    }
    await deleteComment(commentId);
    const engagement = await getPostEngagementForStaff(params.id);
    return NextResponse.json({ ok: true, engagement });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
