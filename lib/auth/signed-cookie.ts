// @ts-nocheck
const textEncoder = new TextEncoder();

function signingSecret(): string {
  const secret = process.env.SESSION_SIGNING_SECRET?.trim()
    || process.env.CRON_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SIGNING_SECRET or CRON_SECRET must be set in production.');
  }
  return secret || 'dev-only-insecure-signing-key';
}

let cachedHmacKey: CryptoKey | null = null;
let cachedHmacSecret: string | null = null;

async function hmacKey(): Promise<CryptoKey> {
  const secret = signingSecret();
  if (cachedHmacKey && cachedHmacSecret === secret) {
    return cachedHmacKey;
  }
  cachedHmacSecret = secret;
  cachedHmacKey = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return cachedHmacKey;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function timingSafeEqualUtf8(a: string, b: string): boolean {
  const ab = textEncoder.encode(a);
  const bb = textEncoder.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

async function hmacSha256Base64Url(payload: string): Promise<string> {
  const key = await hmacKey();
  const sig = await crypto.subtle.sign('HMAC', key, textEncoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(sig));
}

export async function signCookieValue(payload: string): Promise<string> {
  const sig = await hmacSha256Base64Url(payload);
  return `${payload}.${sig}`;
}

export async function verifySignedCookieValue(
  raw: string | undefined | null,
  maxAgeSec: number,
): Promise<{ subject: string; issuedAt: number } | null> {
  if (!raw) return null;
  const lastDot = raw.lastIndexOf('.');
  if (lastDot <= 0) return null;
  const payload = raw.slice(0, lastDot);
  const sig = raw.slice(lastDot + 1);
  const expected = await hmacSha256Base64Url(payload);
  if (!timingSafeEqualUtf8(sig, expected)) return null;

  const parts = payload.split(':');
  if (parts.length !== 2) return null;
  const issuedAt = Number(parts[1]);
  if (!Number.isFinite(issuedAt)) return null;
  if (Date.now() - issuedAt > maxAgeSec * 1000) return null;
  return { subject: parts[0], issuedAt };
}

export async function buildSignedUserPayload(userId: string): Promise<string> {
  return signCookieValue(`${userId}:${Date.now()}`);
}

export async function readSignedUserCookie(
  raw: string | undefined | null,
  expectedUserId: string,
  maxAgeSec: number,
): Promise<boolean> {
  const parsed = await verifySignedCookieValue(raw, maxAgeSec);
  return Boolean(parsed && parsed.subject === expectedUserId);
}
