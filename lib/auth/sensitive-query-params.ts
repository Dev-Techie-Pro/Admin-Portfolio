/** Query keys that must never appear in URLs (credentials leak via history, referrers, logs). */
export const SENSITIVE_AUTH_QUERY_KEYS = ['email', 'password', 'passwd', 'pass'] as const;

export function stripSensitiveAuthQueryParams(url: URL): boolean {
  let changed = false;
  for (const key of SENSITIVE_AUTH_QUERY_KEYS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  return changed;
}

export function hasSensitiveAuthQueryParams(url: URL): boolean {
  return SENSITIVE_AUTH_QUERY_KEYS.some((key) => url.searchParams.has(key));
}
