// @ts-nocheck
import { warmRuntimeSettings, getRuntimeSettingSync } from '@/lib/config/runtime-settings';

export async function verifyTurnstileToken(token: string | null | undefined, remoteIp?: string | null) {
  await warmRuntimeSettings();
  const secret = getRuntimeSettingSync('TURNSTILE_SECRET_KEY')?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false as const, error: 'Captcha is not configured for this site.' };
    }
    return { ok: true as const, skipped: true };
  }

  const response = token?.trim();
  if (!response) {
    return { ok: false as const, error: 'Captcha verification is required.' };
  }

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', response);
  if (remoteIp) body.set('remoteip', remoteIp);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    if (data?.success) return { ok: true as const, skipped: false };
    return { ok: false as const, error: 'Captcha verification failed. Please try again.' };
  } catch {
    return { ok: false as const, error: 'Captcha service unavailable. Please try again later.' };
  }
}

export async function getPublicTurnstileSiteKey() {
  await warmRuntimeSettings();
  const key = getRuntimeSettingSync('TURNSTILE_SITE_KEY')?.trim();
  return key || null;
}
