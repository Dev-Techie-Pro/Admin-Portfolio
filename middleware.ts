import { NextRequest, NextResponse } from 'next/server';
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
import { needsMfaFromAal, NEEDS_MFA_ON_AAL_ERROR } from '@/lib/auth/mfa-aal';
import { sanitizeRedirectPath } from '@/lib/auth/safe-redirect-path';
import { resolveMiddlewareUser } from '@/lib/auth/middleware-session';
import {
  applyDocumentSecurityHeaders,
  createNonce,
  nextWithNonceHeaders,
} from '@/lib/security/middleware-headers';

function isPublicPath(pathname: string) {
  if (pathname.startsWith('/auth/callback')) return true;
  if (pathname.startsWith('/reset-password')) return true;
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  if (pathname.startsWith('/images/')) return true;
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/js/')) return true;
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?|webmanifest)$/i.test(pathname)) return true;
  return false;
}


function isAuthPage(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function withCsp(request: NextRequest, response: NextResponse, nonce: string) {
  if (request.nextUrl.pathname.startsWith('/api/')) return response;
  return applyDocumentSecurityHeaders(request, response, nonce);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = createNonce();
  const nonceNextInit = nextWithNonceHeaders(request, nonce);

  if (isAuthPage(pathname)) {
    const cleanUrl = request.nextUrl.clone();
    if (stripSensitiveAuthQueryParams(cleanUrl)) {
      return withCsp(request, NextResponse.redirect(cleanUrl, 303), nonce);
    }
  }

  if (isPublicPath(pathname)) {
    return withCsp(request, NextResponse.next(nonceNextInit), nonce);
  }

  const redirects = await getRuntimeRedirects();
  const redirectHit = redirects.find((row) => row.from === pathname);
  if (redirectHit) {
    const url = request.nextUrl.clone();
    url.pathname = redirectHit.to;
    return withCsp(
      request,
      NextResponse.redirect(url, redirectHit.permanent ? 308 : 307),
      nonce,
    );
  }

  const { supabase, supabaseResponse } = createMiddlewareClient(request, nonceNextInit);
  const user = await resolveMiddlewareUser(supabase, pathname);

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
      return withCsp(request, redirect, nonce);
    }
  }

  let needsMfa = false;
  if (user) {
    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      needsMfa = needsMfaFromAal(aal);
    } catch (err) {
      console.error('[middleware] MFA AAL lookup failed:', (err as Error).message);
      needsMfa = NEEDS_MFA_ON_AAL_ERROR;
    }
    if (needsMfa && await readMfaStepUpCookie(request.cookies.get(MFA_STEPUP_COOKIE)?.value, user.id)) {
      needsMfa = false;
    }
  }

  const mfaAllowedPath = isAuthPage(pathname)
    || pathname.startsWith('/api/auth/mfa/')
    || pathname.startsWith('/api/auth/logout')
    || pathname.startsWith('/settings/security');

  if (user && !needsMfa) {
    let adminMfaBlock: string | null = null;
    if (!await readAdminMfaOkCookie(request, user.id)) {
      adminMfaBlock = await adminMustCompleteMfa(supabase, user.id);
      if (!adminMfaBlock) {
        await setAdminMfaOkCookie(supabaseResponse, user.id);
      }
    }
    if (adminMfaBlock && !mfaAllowedPath) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: adminMfaBlock, needsMfa: true }, { status: 403 });
      }
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('mfa', 'required');
      return withCsp(request, NextResponse.redirect(url), nonce);
    }
  }

  if (user && needsMfa && !mfaAllowedPath) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'MFA verification required.', needsMfa: true }, { status: 403 });
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('mfa', '1');
    return withCsp(request, NextResponse.redirect(url), nonce);
  }

  if (!user && !isAuthPage(pathname)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', sanitizeRedirectPath(pathname));
    return withCsp(request, NextResponse.redirect(url), nonce);
  }

  if (user && isAuthPage(pathname) && !needsMfa) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return withCsp(request, NextResponse.redirect(url), nonce);
  }

  return withCsp(request, supabaseResponse, nonce);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|js/|images/).*)'],
};
