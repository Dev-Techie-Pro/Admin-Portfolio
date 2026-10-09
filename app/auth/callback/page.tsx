// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

const OTP_TYPES = new Set<string>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);

function loginUrl(params: Record<string, string>) {
  const q = new URLSearchParams(params);
  return `/login?${q.toString()}`;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message] = useState('Completing sign-in…');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const tokenHash = url.searchParams.get('token_hash');
      const otpType = url.searchParams.get('type');
      const next = url.searchParams.get('next') || '/';

      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const hashType = hashParams.get('type');
      const hashError = hashParams.get('error') || hashParams.get('error_code');
      const hashErrorDesc = hashParams.get('error_description') || '';

      if (hashError) {
        router.replace(loginUrl({
          error: 'auth_callback_failed',
          ...(hashErrorDesc ? { error_description: hashErrorDesc } : {}),
        }));
        return;
      }

      let resolvedOtpType = otpType || hashType;
      let authErrorMessage: string | null = null;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        authErrorMessage = error?.message ?? null;
      } else if (tokenHash && otpType && OTP_TYPES.has(otpType)) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: otpType as EmailOtpType,
        });
        authErrorMessage = error?.message ?? null;
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        authErrorMessage = error?.message ?? null;
        if (!resolvedOtpType && hashParams.get('type')) {
          resolvedOtpType = hashParams.get('type');
        }
      } else {
        router.replace(loginUrl({ error: 'auth_callback_failed' }));
        return;
      }

      if (cancelled) return;

      if (authErrorMessage) {
        router.replace(loginUrl({
          error: 'auth_callback_failed',
          error_description: authErrorMessage,
        }));
        return;
      }

      const completeRes = await fetch('/api/auth/callback/complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpType: resolvedOtpType, next }),
      });

      const payload = await completeRes.json().catch(() => ({}));

      if (cancelled) return;

      if (!completeRes.ok) {
        router.replace(loginUrl({
          error: typeof payload.error === 'string' ? payload.error : 'auth_callback_failed',
          ...(payload.errorDescription
            ? { error_description: String(payload.errorDescription) }
            : {}),
        }));
        return;
      }

      const dest = typeof payload.redirect === 'string' ? payload.redirect : next;
      window.history.replaceState(null, '', dest);
      router.replace(dest);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="auth-callback-page" style={{ padding: '2.5rem', textAlign: 'center' }}>
      <p>{message}</p>
    </main>
  );
}
