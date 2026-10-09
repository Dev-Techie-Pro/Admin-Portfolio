// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { buildSignedUserPayload, readSignedUserCookie } from '@/lib/auth/signed-cookie';

/** Short-lived skip for repeated admin MFA policy checks in middleware. */
export const ADMIN_MFA_OK_COOKIE = 'pa_admin_mfa_ok';

const MAX_AGE_SEC = 300;

export function readAdminMfaOkCookie(request: NextRequest, userId: string): boolean {
  const value = request.cookies.get(ADMIN_MFA_OK_COOKIE)?.value;
  return readSignedUserCookie(value, userId, MAX_AGE_SEC);
}

export function setAdminMfaOkCookie(response: NextResponse, userId: string) {
  response.cookies.set(ADMIN_MFA_OK_COOKIE, buildSignedUserPayload(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SEC,
  });
}

export function clearAdminMfaOkCookie(response: NextResponse) {
  response.cookies.set(ADMIN_MFA_OK_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
