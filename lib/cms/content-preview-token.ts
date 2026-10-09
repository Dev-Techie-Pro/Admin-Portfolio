// @ts-nocheck
import crypto from 'node:crypto';

export type PreviewContentType = 'blog_post';

export type PreviewTokenPayload = {
  v: 1;
  type: PreviewContentType;
  legacyId: number;
  exp: number;
};

const DEFAULT_TTL_SEC = 3600;

function getPreviewSecret(): string {
  const dedicated = process.env.PREVIEW_TOKEN_SECRET?.trim();
  if (process.env.NODE_ENV === 'production') {
    if (!dedicated) {
      throw new Error('PREVIEW_TOKEN_SECRET must be set in production for draft preview (do not reuse CRON_SECRET).');
    }
    return dedicated;
  }
  const fallback = dedicated || process.env.CRON_SECRET?.trim();
  return fallback || 'dev-preview-token-secret';
}

function sign(body: string): string {
  return crypto.createHmac('sha256', getPreviewSecret()).update(body).digest('base64url');
}

export function createContentPreviewToken(
  type: PreviewContentType,
  legacyId: number,
  ttlSec = DEFAULT_TTL_SEC,
): string {
  const exp = Math.floor(Date.now() / 1000) + Math.max(60, ttlSec);
  const payload: PreviewTokenPayload = { v: 1, type, legacyId, exp };
  const body = JSON.stringify(payload);
  return `${Buffer.from(body, 'utf8').toString('base64url')}.${sign(body)}`;
}

export function verifyContentPreviewToken(token: string): PreviewTokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  let body: string;
  try {
    body = Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const expected = sign(body);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

  let payload: PreviewTokenPayload;
  try {
    payload = JSON.parse(body) as PreviewTokenPayload;
  } catch {
    return null;
  }
  if (payload.v !== 1 || payload.type !== 'blog_post') return null;
  if (!Number.isFinite(payload.legacyId)) return null;
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function getPreviewTokenTtlSec(): number {
  return DEFAULT_TTL_SEC;
}
