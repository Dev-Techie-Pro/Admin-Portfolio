import { NextResponse } from 'next/server';
import { guardStaff } from '@/lib/auth/guard';
import { getStaffElevationStatus } from '@/lib/cms/access-elevation-requests';

export async function GET() {
  const auth = await guardStaff();
  if (!auth.ok) return auth.response;

  try {
    const status = await getStaffElevationStatus(auth.user.id);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
