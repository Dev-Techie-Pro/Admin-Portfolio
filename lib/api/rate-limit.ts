// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin';
import { getClientIp } from '@/lib/auth/request-meta';
import { getRuntimeSettingSync, warmRuntimeSettings } from '@/lib/config/runtime-settings';

export type RateLimitScope =
  | 'auth_login'
  | 'auth_forgot_password'
  | 'public_contact'
  | 'public_blog_comment'
  | 'public_blog_like'
  | 'public_content_read'
  | 'staff_media_upload';

const DEFAULTS: Record<RateLimitScope, { windowSec: number; maxHits: number }> = {
  auth_login: { windowSec: 900, maxHits: 20 },
  auth_forgot_password: { windowSec: 3600, maxHits: 5 },
  public_contact: { windowSec: 3600, maxHits: 5 },
  public_blog_comment: { windowSec: 3600, maxHits: 30 },
  public_blog_like: { windowSec: 3600, maxHits: 120 },
  public_content_read: { windowSec: 60, maxHits: 120 },
  staff_media_upload: { windowSec: 3600, maxHits: 200 },
};

function parsePositiveInt(raw: string | undefined, fallback: number) {
  const n = parseInt(String(raw ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function checkRateLimit(
  request: Request,
  scope: RateLimitScope,
  extraBucketSuffix = '',
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  await warmRuntimeSettings();
  const base = DEFAULTS[scope];
  const envPrefix = `RATE_LIMIT_${scope.toUpperCase()}`;
  const maxHits = parsePositiveInt(
    getRuntimeSettingSync(`${envPrefix}_MAX`),
    base.maxHits,
  );
  const windowSec = parsePositiveInt(
    getRuntimeSettingSync(`${envPrefix}_WINDOW_SEC`),
    base.windowSec,
  );

  const ip = getClientIp(request) || 'unknown';
  const bucket = `${scope}:${ip}${extraBucketSuffix ? `:${extraBucketSuffix}` : ''}`;

  try {
    const sb = createAdminClient();
    const { data, error } = await sb.rpc('pa_rate_limit_allow', {
      p_bucket: bucket,
      p_window_seconds: windowSec,
      p_max_hits: maxHits,
    });
    if (error) {
      console.warn('[rate-limit] rpc failed:', error.message);
      if (process.env.NODE_ENV === 'production') {
        return { allowed: false, retryAfterSec: windowSec };
      }
      return { allowed: true };
    }
    if (data === true) return { allowed: true };
    return { allowed: false, retryAfterSec: windowSec };
  } catch (err) {
    console.warn('[rate-limit] error:', (err as Error).message);
    if (process.env.NODE_ENV === 'production') {
      return { allowed: false, retryAfterSec: windowSec };
    }
    return { allowed: true };
  }
}

export function rateLimitResponse(retryAfterSec?: number) {
  const headers: Record<string, string> = {};
  if (retryAfterSec) headers['Retry-After'] = String(retryAfterSec);
  return { status: 429 as const, headers };
}
