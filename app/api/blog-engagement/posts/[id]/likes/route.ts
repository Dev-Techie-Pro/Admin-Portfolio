// @ts-nocheck
import { NextResponse } from 'next/server';
import { clearLikesForPost } from '@/lib/cms/blog-engagement';
import { guardEditor } from '@/lib/auth/guard';

export async function DELETE(_request, { params }) {
  const auth = await guardEditor();
  if (!auth.ok) return auth.response;
  try {
    await clearLikesForPost(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error?.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
