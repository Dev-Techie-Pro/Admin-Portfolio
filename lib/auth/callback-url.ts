/**
 * Build the Supabase Auth redirect URL for email links (invite, recovery).
 * Add your site origin with a wildcard in Supabase → Auth → URL configuration, e.g.
 * `http://localhost:3000/**` so query params on this path are allowed.
 */
export function buildAuthCallbackUrl(siteUrl: string, nextPath = '/') {
  const base = siteUrl.trim().replace(/\/$/, '');
  const next = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`;
}

/** Staff invite emails — keep redirect URL free of query params so Supabase appends `code` / `token_hash`. */
export function buildInviteAuthCallbackUrl(siteUrl: string) {
  return `${siteUrl.trim().replace(/\/$/, '')}/auth/callback`;
}
