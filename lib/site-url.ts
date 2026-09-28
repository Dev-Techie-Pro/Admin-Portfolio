/**
 * Canonical public origin for links in emails and notifications.
 * Prefer NEXT_PUBLIC_SITE_URL; fall back to proxy headers (Vercel, etc.).
 */
export function getSiteUrl(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  const origin = request.headers.get('origin')?.trim()?.replace(/\/$/, '');
  if (origin) return origin;

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (host) {
    const proto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
    return `${proto}://${host}`.replace(/\/$/, '');
  }

  return 'http://localhost:3000';
}
