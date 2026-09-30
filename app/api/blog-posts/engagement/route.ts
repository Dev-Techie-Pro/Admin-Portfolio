import { NextResponse } from 'next/server';
import { getEngagementSummariesByLegacyIds } from '@/lib/cms/blog-engagement';
import { withEditorGet } from '@/lib/api/with-editor-get';

/** Per-post like/comment counts for the blog posts list (keyed by legacy post id). */
export async function GET(request) {
  const idsParam = new URL(request.url).searchParams.get('ids') || '';
  const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
  return withEditorGet(() => getEngagementSummariesByLegacyIds(ids), { maxAgeSec: 30 });
}
