// @ts-nocheck
import { NextResponse } from 'next/server';
import { guardStaff } from '@/lib/auth/guard';
import { searchCmsContent } from '@/lib/cms/content-search';

export async function GET(request: Request) {
  const auth = await guardStaff();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  try {
    const results = await searchCmsContent(q, limit);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 });
  }
}
