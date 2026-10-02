import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { completeAuthCallbackAfterSignIn } from '@/lib/auth/complete-auth-callback';
import { applySessionDeadlineCookie } from '@/lib/auth/session-lifetime';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const otpType = typeof body?.otpType === 'string' ? body.otpType : null;
    const next = typeof body?.next === 'string' ? body.next : null;

    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json(
        { error: 'auth_callback_failed', errorDescription: error?.message || 'No session' },
        { status: 401 },
      );
    }

    const result = await completeAuthCallbackAfterSignIn(user, { otpType, next });
    if (!result.ok) {
      await supabase.auth.signOut();
      const response = NextResponse.json(
        { error: result.error, errorDescription: result.errorDescription },
        { status: 403 },
      );
      return response;
    }

    const response = NextResponse.json({ redirect: result.redirect });
    applySessionDeadlineCookie(response);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'auth_callback_failed', errorDescription: (error as Error).message },
      { status: 500 },
    );
  }
}
