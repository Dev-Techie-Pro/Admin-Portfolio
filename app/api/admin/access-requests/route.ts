// @ts-nocheck
import { NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/auth/guard';
import { listAccessRequestsForAdmin } from '@/lib/cms/access-elevation-requests';

export async function GET(request) {
  const auth = await guardAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10) || 50;
    const items = await listAccessRequestsForAdmin({ limit, status });
    const pendingCount = items.filter((i) => i.status === 'pending').length;
    return NextResponse.json({ items, pendingCount });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
