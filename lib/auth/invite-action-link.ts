// @ts-nocheck
import { getSiteUrlFromEnv } from '@/lib/site-url';

/** Supabase may return a relative `auth/v1/verify?...` path — expand to an absolute URL. */
export function normalizeStaffInviteActionLink(raw: string): string | null {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed).href;
  } catch {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    if (!base) return null;
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    try {
      return new URL(path, base.endsWith('/') ? base : `${base}/`).href;
    } catch {
      return null;
    }
  }
}

export function isAllowedStaffInviteActionLink(raw: string): boolean {
  const href = normalizeStaffInviteActionLink(raw);
  if (!href) return false;

  try {
    const url = new URL(href);
    if (!['http:', 'https:'].includes(url.protocol)) return false;

    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();

    const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    if (supabaseBase) {
      const supabaseHost = new URL(supabaseBase).hostname.toLowerCase();
      if (host === supabaseHost) return true;
    }

    if (host.endsWith('.supabase.co') || host.endsWith('.supabase.in')) return true;
    if (path.includes('/auth/v1/verify')) return true;

    const siteHost = new URL(getSiteUrlFromEnv()).hostname.toLowerCase();
    if (host === siteHost && path.startsWith('/auth/callback')) return true;
    if ((host === 'localhost' || host === '127.0.0.1') && path.startsWith('/auth/callback')) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
