// @ts-nocheck
import { createHmac, timingSafeEqual } from 'crypto';

function signingSecret(): string {
  const secret = process.env.SESSION_SIGNING_SECRET?.trim()
    || process.env.CRON_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SIGNING_SECRET or CRON_SECRET must be set in production.');
  }
  return secret || 'dev-only-insecure-signing-key';
}

export function signCookieValue(payload: string): string {
  const sig = createHmac('sha256', signingSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySignedCookieValue(
  raw: string | undefined | null,
  maxAgeSec: number,
): { subject: string; issuedAt: number } | null {
  if (!raw) return null;
  const lastDot = raw.lastIndexOf('.');
  if (lastDot <= 0) return null;
  const payload = raw.slice(0, lastDot);
  const sig = raw.slice(lastDot + 1);
  const expected = createHmac('sha256', signingSecret()).update(payload).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  const parts = payload.split(':');
  if (parts.length !== 2) return null;
  const issuedAt = Number(parts[1]);
  if (!Number.isFinite(issuedAt)) return null;
  if (Date.now() - issuedAt > maxAgeSec * 1000) return null;
  return { subject: parts[0], issuedAt };
}

export function buildSignedUserPayload(userId: string): string {
  return signCookieValue(`${userId}:${Date.now()}`);
}

export function readSignedUserCookie(
  raw: string | undefined | null,
  expectedUserId: string,
  maxAgeSec: number,
): boolean {
  const parsed = verifySignedCookieValue(raw, maxAgeSec);
  return Boolean(parsed && parsed.subject === expectedUserId);
}
