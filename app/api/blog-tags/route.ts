import { NextResponse } from 'next/server';
import { getBlogTags, saveBlogTags } from '@/lib/cms/repository';
import { guardEditor } from '@/lib/auth/guard';
import { withStaffGet } from '@/lib/api/with-staff-get';

export async function GET() {
  return withStaffGet(() => getBlogTags(), { maxAgeSec: 180 });
}

export async function PUT(request) {
  const auth = await guardEditor();
  if (!auth.ok) return auth.response;
  try {
    const records = await request.json();
    await saveBlogTags(Array.isArray(records) ? records : []);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
