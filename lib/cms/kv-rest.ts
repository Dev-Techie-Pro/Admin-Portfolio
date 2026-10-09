// @ts-nocheck
/**
 * Optional Upstash / Vercel KV REST cache (KV_REST_API_URL + KV_REST_API_TOKEN).
 * Values are JSON-serialized.
 */

const KV_PREFIX = 'pa:';

function kvConfigured() {
  return Boolean(process.env.KV_REST_API_URL?.trim() && process.env.KV_REST_API_TOKEN?.trim());
}

function kvUrl(path: string) {
  const base = process.env.KV_REST_API_URL!.replace(/\/$/, '');
  return `${base}${path}`;
}

function authHeaders() {
  return { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` };
}

export async function kvGetJson(key: string): Promise<unknown | undefined> {
  if (!kvConfigured()) return undefined;
  try {
    const res = await fetch(kvUrl(`/get/${encodeURIComponent(KV_PREFIX + key)}`), {
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return undefined;
    const body = await res.json();
    const raw = body?.result;
    if (raw == null || raw === '') return undefined;
    return JSON.parse(String(raw));
  } catch {
    return undefined;
  }
}

export async function kvSetJson(key: string, value: unknown, ttlMs: number) {
  if (!kvConfigured()) return;
  const px = Math.max(1000, Math.floor(ttlMs));
  try {
    const serialized = JSON.stringify(value);
    await fetch(kvUrl('/'), {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(['SET', KV_PREFIX + key, serialized, 'PX', px]),
    });
  } catch {
    // ignore — in-memory cache still applies
  }
}

export async function kvDelete(key: string) {
  if (!kvConfigured()) return;
  try {
    await fetch(kvUrl(`/del/${encodeURIComponent(KV_PREFIX + key)}`), {
      method: 'POST',
      headers: authHeaders(),
    });
  } catch {
    // ignore
  }
}

export async function kvDeleteByPrefix(prefix: string) {
  if (!kvConfigured()) return;
  const pattern = encodeURIComponent(`${KV_PREFIX}${prefix}*`);
  try {
    const res = await fetch(kvUrl(`/keys/${pattern}`), { headers: authHeaders(), cache: 'no-store' });
    if (!res.ok) return;
    const body = await res.json();
    const keys = Array.isArray(body?.result) ? body.result : [];
    for (const fullKey of keys) {
      const short = String(fullKey).startsWith(KV_PREFIX)
        ? String(fullKey).slice(KV_PREFIX.length)
        : String(fullKey);
      await kvDelete(short);
    }
  } catch {
    // ignore
  }
}
