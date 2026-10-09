/** Mirror of lib/auth/safe-redirect-path.ts for browser post-login redirects. */
export function sanitizeRedirectPath(raw: string | null | undefined, fallback = '/'): string {
  if (raw == null || raw === '') return fallback;
  const path = String(raw).trim();
  if (!path.startsWith('/') || path.startsWith('//')) return fallback;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(path)) return fallback;
  if (path.includes('\\')) return fallback;
  if (path.includes('\0')) return fallback;
  return path;
}
