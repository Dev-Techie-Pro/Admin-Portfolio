// @ts-nocheck
import { NextResponse } from 'next/server';
import { getEngagementSummariesByLegacyIds } from '@/lib/cms/blog-engagement';
import { withStaffGet } from '@/lib/api/with-staff-get';

/** Per-post like/comment counts for the blog posts list (keyed by legacy post id). */
export async function GET(request) {
  const idsParam = new URL(request.url).searchParams.get('ids') || '';
  const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
  return withStaffGet(() => getEngagementSummariesByLegacyIds(ids), { maxAgeSec: 30 });
}
