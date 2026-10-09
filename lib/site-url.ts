// @ts-nocheck
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

export function getSiteUrlFromEnv() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, '') || 'http://localhost:3000';
}

/** Base URL for portfolio-facing links (sitemap/RSS). */
export function getPortfolioPublicBaseUrl() {
  const fromList = process.env.PORTFOLIO_PUBLIC_ORIGINS?.split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (fromList?.[0]) return fromList[0];
  const single = process.env.NEXT_PUBLIC_PORTFOLIO_URL?.trim()?.replace(/\/$/, '');
  if (single) return single;
  return getSiteUrlFromEnv();
}
