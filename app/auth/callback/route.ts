import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { STAFF_ROLES } from '@/lib/auth/constants';
import { applySessionDeadlineCookie } from '@/lib/auth/session-lifetime';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const { data: profile } = await createAdminClient()
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profile || !STAFF_ROLES.includes(profile.role)) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=no_dashboard_access`);
      }

      const redirect = NextResponse.redirect(`${origin}${next}`);
      applySessionDeadlineCookie(redirect);
      return redirect;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
