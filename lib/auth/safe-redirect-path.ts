const DEFAULT_SAFE_REDIRECT = '/';

/**
 * Post-login redirect target: same-origin path only (no protocol-relative or absolute URLs).
 */
export function sanitizeRedirectPath(raw: string | null | undefined, fallback = DEFAULT_SAFE_REDIRECT): string {
  if (raw == null || raw === '') return fallback;
  const path = String(raw).trim();
  if (!path.startsWith('/') || path.startsWith('//')) return fallback;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(path)) return fallback;
  if (path.includes('\\')) return fallback;
  if (path.includes('\0')) return fallback;
  return path;
}
