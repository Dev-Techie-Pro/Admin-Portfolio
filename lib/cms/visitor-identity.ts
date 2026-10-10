import { createHmac } from 'node:crypto';

function likeHmacSecret(): string {
  return (
    process.env.PUBLIC_LIKE_HMAC_SECRET?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || 'dev-like-hmac'
  );
}

/** Derive a stable server-side like identity from client hint + IP (not spoofable alone). */
export function derivePublicLikeVisitorKey(
  clientVisitorKey: string | null | undefined,
  clientIp: string | null | undefined,
): string | null {
  const hint = clientVisitorKey?.trim();
  if (!hint || hint.length < 8 || hint.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(hint)) {
    return null;
  }
  const ip = (clientIp || 'unknown').trim().slice(0, 64);
  const digest = createHmac('sha256', likeHmacSecret())
    .update(`${ip}\0${hint}`)
    .digest('base64url')
    .slice(0, 64);
  return `lk_${digest}`;
}
