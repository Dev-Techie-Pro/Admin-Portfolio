/**
 * Content-Security-Policy builders for middleware (nonce) and static assets in next.config.
 */

export function supabaseConnectOrigins(): string[] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return [];
  try {
    const url = new URL(raw);
    const wsOrigin = url.origin.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
    return [url.origin, wsOrigin];
  } catch {
    return [];
  }
}

export type CspOptions = {
  /** Production-style CSP (no unsafe-inline on scripts). */
  strictScripts?: boolean;
  /** Next.js dev / react-refresh requires eval; never enable in production. */
  development?: boolean;
};

export function buildContentSecurityPolicy(
  nonce: string,
  options: CspOptions | boolean = true,
): string {
  const opts: CspOptions = typeof options === 'boolean'
    ? { strictScripts: options }
    : options;
  const strictScripts = opts.strictScripts !== false;
  const development = opts.development === true;

  const supabase = supabaseConnectOrigins();
  const connectSrc = ["'self'", ...supabase, 'https://challenges.cloudflare.com'].join(' ');
  const scriptParts = [
    "'self'",
    `'nonce-${nonce}'`,
    'https://challenges.cloudflare.com',
  ];
  if (development) {
    scriptParts.push("'unsafe-eval'");
  }
  if (!strictScripts && !development) {
    scriptParts.push("'unsafe-inline'");
  }
  const scriptSrc = scriptParts.join(' ');

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    `img-src 'self' data: blob: ${supabase.join(' ')}`.trim(),
    `connect-src ${connectSrc}`,
    'frame-src https://challenges.cloudflare.com',
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
  ].join('; ');
}

/** CSP for static /js/* (no inline scripts from Next layout). */
export function buildStaticAssetCsp(): string {
  const supabase = supabaseConnectOrigins();
  const connectSrc = ["'self'", ...supabase, 'https://challenges.cloudflare.com'].join(' ');
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    `img-src 'self' data: blob: ${supabase.join(' ')}`.trim(),
    `connect-src ${connectSrc}`,
    "object-src 'none'",
  ].join('; ');
}

export function generateCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
