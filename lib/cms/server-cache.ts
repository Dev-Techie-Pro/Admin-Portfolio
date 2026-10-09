// @ts-nocheck
import { kvDelete, kvDeleteByPrefix, kvGetJson, kvSetJson } from './kv-rest';

const store = new Map();

function cacheKey(key) {
  return String(key);
}

/**
 * TTL cache for CMS and public read paths.
 * Uses in-memory Map per process; optional Upstash/Vercel KV when env is set.
 */
export async function getCached(key, ttlMs, loader) {
  const k = cacheKey(key);
  const now = Date.now();

  const kvHit = await kvGetJson(k);
  if (kvHit !== undefined) {
    return kvHit;
  }

  const hit = store.get(k);

  if (hit && hit.expiresAt > now) {
    if (hit.pending) return hit.pending;
    if ('value' in hit) return hit.value;
  }

  const pending = hit?.pending;
  if (pending) return pending;

  const promise = Promise.resolve().then(loader).then(async (value) => {
    store.set(k, { value, expiresAt: Date.now() + ttlMs });
    await kvSetJson(k, value, ttlMs);
    return value;
  }).catch((err) => {
    store.delete(k);
    throw err;
  });

  store.set(k, { pending: promise, expiresAt: now + ttlMs });
  return promise;
}

export function invalidateCache(key) {
  const k = cacheKey(key);
  store.delete(k);
  void kvDelete(k);
}

export function invalidateCachePrefix(prefix) {
  const p = cacheKey(prefix);
  for (const key of store.keys()) {
    if (key === p || key.startsWith(`${p}:`)) store.delete(key);
  }
  void kvDeleteByPrefix(p);
}

/** Drop all CMS list caches after a mutation. */
export function invalidateCmsReadCaches() {
  invalidateCachePrefix('cms');
  invalidateCachePrefix('public');
  invalidateCache('cms:dashboard-stats');
  try {
    import('./dashboard-stats').then((mod) => {
      mod.scheduleDashboardStatsRefresh?.();
    }).catch(() => {});
  } catch {
    // ignore
  }
}

export const CMS_CACHE_TTL = {
  recentActivities: 30 * 1000,
  notifications: 45 * 1000,
  lists: 3 * 60 * 1000,
  settings: 5 * 60 * 1000,
};

export const PUBLIC_CACHE_TTL = {
  publicContent: 120 * 1000,
  publicEngagement: 20 * 1000,
};

/** HTTP Cache-Control max-age for public JSON responses (seconds). */
export const PUBLIC_CACHE_MAX_AGE_SEC = {
  publicContent: 120,
  publicEngagement: 20,
};
