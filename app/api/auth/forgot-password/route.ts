import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildAuthCallbackUrl } from '@/lib/auth/callback-url';
import { getSiteUrl } from '@/lib/site-url';

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildAuthCallbackUrl(getSiteUrl(request), '/reset-password'),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
