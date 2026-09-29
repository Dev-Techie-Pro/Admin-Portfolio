import { createAdminClient } from '@/lib/supabase/admin';

/** Default days to retain login_activity rows (aligns with SESSION_PRUNE_KEEP_DAYS). */
export const DEFAULT_LOGIN_ACTIVITY_RETENTION_DAYS = 90;

/** Safety cap: max rows kept per user after time-based purge. */
export const DEFAULT_LOGIN_ACTIVITY_PER_USER_CAP = 100;

/** Minimum interval between automatic purge attempts (in-process throttle). */
export const LOGIN_ACTIVITY_PURGE_INTERVAL_MS = 60 * 60 * 1000;

let lastPurgeAttemptAt = 0;

function parsePositiveInt(value: string | undefined, fallback: number) {
  const n = Number.parseInt(value || '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function loginActivityRetentionDays() {
  return parsePositiveInt(
    process.env.LOGIN_ACTIVITY_RETENTION_DAYS,
    DEFAULT_LOGIN_ACTIVITY_RETENTION_DAYS,
  );
}

export function loginActivityPerUserCap() {
  return parsePositiveInt(
    process.env.LOGIN_ACTIVITY_PER_USER_CAP,
    DEFAULT_LOGIN_ACTIVITY_PER_USER_CAP,
  );
}

function retentionCutoffIso() {
  const days = loginActivityRetentionDays();
  const ms = days * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - ms).toISOString();
}

/** ISO timestamp for queries that should only return non-expired rows. */
export function loginActivityRetentionCutoffIso() {
  return retentionCutoffIso();
}

/**
 * Delete login_activity rows older than the retention window and trim per-user excess.
 */
export async function purgeExpiredLoginActivity() {
  const keepDays = loginActivityRetentionDays();
  const maxPerUser = loginActivityPerUserCap();
  const sb = createAdminClient();

  const { data: deletedByAge, error: ageError } = await sb.rpc('pa_prune_login_activity', {
    p_keep_days: keepDays,
  });
  if (ageError) {
    console.warn('[login-activity-retention] age purge failed:', ageError.message);
    return { ok: false, deletedByAge: 0, deletedByCap: 0 };
  }

  const { data: deletedByCap, error: capError } = await sb.rpc('pa_prune_login_activity_user_cap', {
    p_max_per_user: maxPerUser,
  });
  if (capError) {
    console.warn('[login-activity-retention] per-user cap purge failed:', capError.message);
    return { ok: false, deletedByAge: deletedByAge ?? 0, deletedByCap: 0 };
  }

  return {
    ok: true,
    deletedByAge: deletedByAge ?? 0,
    deletedByCap: deletedByCap ?? 0,
  };
}

/**
 * Fire-and-forget purge at most once per hour per server instance.
 */
export function schedulePurgeExpiredLoginActivity() {
  const now = Date.now();
  if (now - lastPurgeAttemptAt < LOGIN_ACTIVITY_PURGE_INTERVAL_MS) return;
  lastPurgeAttemptAt = now;
  void purgeExpiredLoginActivity();
}
