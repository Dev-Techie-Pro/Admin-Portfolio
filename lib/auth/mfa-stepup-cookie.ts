// @ts-nocheck
import { NextResponse } from 'next/server';
import { readSignedUserCookie, buildSignedUserPayload } from '@/lib/auth/signed-cookie';
import { SESSION_LIFETIME_SECONDS } from '@/lib/auth/constants';

/** Set after TOTP or backup-code login when Supabase AAL2 is not yet reflected. */
export const MFA_STEPUP_COOKIE = 'pa_mfa_stepup_ok';

const MAX_AGE_SEC = SESSION_LIFETIME_SECONDS;

export function readMfaStepUpCookie(cookieValue: string | undefined, userId: string): boolean {
  return readSignedUserCookie(cookieValue, userId, MAX_AGE_SEC);
}

export function setMfaStepUpCookie(response: NextResponse, userId: string) {
  response.cookies.set(MFA_STEPUP_COOKIE, buildSignedUserPayload(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SEC,
  });
}

export function clearMfaStepUpCookie(response: NextResponse) {
  response.cookies.set(MFA_STEPUP_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
