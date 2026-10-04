/**
 * Smoke test for preview token HMAC (mirrors lib/cms/content-preview-token.ts).
 */
import crypto from 'node:crypto';

const secret = process.env.PREVIEW_TOKEN_SECRET || process.env.CRON_SECRET || 'dev-preview-token-secret';

function sign(body) {
  return crypto.createHmac('sha256', secret).update(body).digest('base64url');
}

function createToken(legacyId, exp) {
  const body = JSON.stringify({ v: 1, type: 'blog_post', legacyId, exp });
  return `${Buffer.from(body, 'utf8').toString('base64url')}.${sign(body)}`;
}

function verify(token) {
  const [encoded, sig] = token.split('.');
  const body = Buffer.from(encoded, 'base64url').toString('utf8');
  if (sign(body) !== sig) return null;
  const payload = JSON.parse(body);
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

const exp = Math.floor(Date.now() / 1000) + 120;
const token = createToken(42, exp);
const ok = verify(token);
if (!ok || ok.legacyId !== 42) {
  console.error('preview token smoke test failed');
  process.exit(1);
}
const expired = createToken(1, Math.floor(Date.now() / 1000) - 10);
if (verify(expired)) {
  console.error('expired token should not verify');
  process.exit(1);
}
console.log('OK: preview token smoke test');
