import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';
import { AUTH_ROUTES, PUBLIC_API_PREFIXES, SESSION_DEADLINE_COOKIE } from '@/lib/auth/constants';
import {
  clearSessionDeadlineCookie,
  isDashboardSessionExpired,
  mergeResponseCookies,
} from '@/lib/auth/session-lifetime';
import { getRuntimeRedirects } from '@/lib/config/redirects';
import { adminMustCompleteMfa } from '@/lib/auth/admin-mfa-policy';
import {
  readAdminMfaOkCookie,
  setAdminMfaOkCookie,
} from '@/lib/auth/admin-mfa-cookie';
import { MFA_STEPUP_COOKIE, readMfaStepUpCookie } from '@/lib/auth/mfa-stepup-cookie';
import { stripSensitiveAuthQueryParams } from '@/lib/auth/sensitive-query-params';

function isPublicPath(pathname) {
  if (pathname.startsWith('/auth/callback')) return true;
  if (pathname.startsWith('/reset-password')) return true;
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  if (pathname.startsWith('/images/')) return true;
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/js/')) return true;
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?|webmanifest)$/i.test(pathname)) return true;
  return false;
}


function isAuthPage(pathname) {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (isAuthPage(pathname)) {
    const cleanUrl = request.nextUrl.clone();
    if (stripSensitiveAuthQueryParams(cleanUrl)) {
      return NextResponse.redirect(cleanUrl, 303);
    }
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const redirects = await getRuntimeRedirects();
  const redirectHit = redirects.find((row) => row.from === pathname);
  if (redirectHit) {
    const url = request.nextUrl.clone();
    url.pathname = redirectHit.to;
    return NextResponse.redirect(url, redirectHit.permanent ? 308 : 307);
  }

  const { supabase, supabaseResponse } = createMiddlewareClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (
    authError
    && (authError.code === 'refresh_token_not_found'
      || /refresh token/i.test(authError.message || ''))
  ) {
    await supabase.auth.signOut();
    return supabaseResponse;
  }

  if (user) {
    const deadlineCookie = request.cookies.get(SESSION_DEADLINE_COOKIE)?.value;
    if (isDashboardSessionExpired(user, deadlineCookie)) {
      await supabase.auth.signOut();
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('session', 'expired');
      loginUrl.searchParams.delete('redirect');
      const redirect = pathname.startsWith('/api/')
        ? NextResponse.json(
          { error: 'Session expired. Please sign in again.', sessionExpired: true },
          { status: 401 },
        )
        : NextResponse.redirect(loginUrl);
      mergeResponseCookies(supabaseResponse, redirect);
      clearSessionDeadlineCookie(redirect);
      return redirect;
    }
  }

  let needsMfa = false;
  if (user) {
    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      needsMfa = aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2';
    } catch {
      needsMfa = false;
    }
    if (needsMfa && readMfaStepUpCookie(request.cookies.get(MFA_STEPUP_COOKIE)?.value, user.id)) {
      needsMfa = false;
    }
  }

  const mfaAllowedPath = isAuthPage(pathname)
    || pathname.startsWith('/api/auth/mfa/')
    || pathname.startsWith('/api/auth/logout')
    || pathname.startsWith('/settings/security');

  if (user && !needsMfa) {
    let adminMfaBlock: string | null = null;
    if (!readAdminMfaOkCookie(request, user.id)) {
      adminMfaBlock = await adminMustCompleteMfa(supabase, user.id);
      if (!adminMfaBlock) {
        setAdminMfaOkCookie(supabaseResponse, user.id);
      }
    }
    if (adminMfaBlock && !mfaAllowedPath) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: adminMfaBlock, needsMfa: true }, { status: 403 });
      }
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('mfa', 'required');
      return NextResponse.redirect(url);
    }
  }

  if (user && needsMfa && !mfaAllowedPath) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'MFA verification required.', needsMfa: true }, { status: 403 });
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('mfa', '1');
    return NextResponse.redirect(url);
  }

  if (!user && !isAuthPage(pathname)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage(pathname) && !needsMfa) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|js/|images/).*)'],
};
