import { warmRuntimeSettings, getRuntimeSettingSync } from '@/lib/config/runtime-settings';

export type RuntimeRedirect = {
  from: string;
  to: string;
  permanent?: boolean;
};

let cache: { at: number; list: RuntimeRedirect[] } = { at: 0, list: [] };

export async function getRuntimeRedirects(): Promise<RuntimeRedirect[]> {
  if (Date.now() - cache.at < 60_000) return cache.list;
  await warmRuntimeSettings();
  const raw = getRuntimeSettingSync('REDIRECTS_JSON')?.trim();
  if (!raw) {
    cache = { at: Date.now(), list: [] };
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cache = { at: Date.now(), list: [] };
      return [];
    }
    const list = parsed
      .map((row) => ({
        from: String(row?.from || '').trim(),
        to: String(row?.to || '').trim(),
        permanent: row?.permanent !== false,
      }))
      .filter((row) => row.from.startsWith('/') && row.to.startsWith('/'));
    cache = { at: Date.now(), list };
    return list;
  } catch {
    cache = { at: Date.now(), list: [] };
    return [];
  }
}

export function invalidateRedirectsCache() {
  cache = { at: 0, list: [] };
}
