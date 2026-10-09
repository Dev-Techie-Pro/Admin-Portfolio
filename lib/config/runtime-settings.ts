// @ts-nocheck
import { SITE_ID } from '@/lib/cms/constants';
import { getCached, invalidateCache } from '@/lib/cms/server-cache';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  RUNTIME_CONFIG_KEYS,
  RUNTIME_SECRET_KEYS,
  UI_ENV_DEFINITIONS,
  UI_ENV_GROUPS,
  UNCHANGED_SECRET,
  maskSecretValue,
  parseEnvFile,
  validateEnvUpdates,
} from '@/lib/admin/env-config';
const CACHE_KEY = `runtime-config:${SITE_ID}`;
const MAX_ENV_IMPORT_BYTES = 256 * 1024;
const CACHE_TTL_MS = 45_000;

/** In-process plaintext snapshot for sync reads after warmRuntimeSettings(). */
let memorySnapshot: Record<string, string> = {};

export const CODE_DEFAULTS: Record<string, string> = {
  SESSION_PRUNE_KEEP_DAYS: '90',
  LOGIN_ACTIVITY_RETENTION_DAYS: '90',
  LOGIN_ACTIVITY_PER_USER_CAP: '100',
  CMS_BATCH_WRITES: '',
  MEDIA_FULL_RECONCILE: '',
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: '587',
  EMAIL_BRAND_NAME: 'Muhammad Sohaib',
  EMAIL_BRAND_ROLE: 'Full Stack Web Developer',
  EMAIL_PORTFOLIO_LABEL: 'Portfolio Dashboard',
  EMAIL_GITHUB_URL: 'https://github.com/',
  EMAIL_LINKEDIN_URL: 'https://www.linkedin.com/',
};

function isSecretKey(key: string) {
  return RUNTIME_SECRET_KEYS.has(key);
}

function readCodeDefault(key: string) {
  return CODE_DEFAULTS[key] ?? '';
}

function jsonRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    if (v == null) continue;
    out[k] = String(v);
  }
  return out;
}

function mergeResolved(
  settings: Record<string, string>,
  secrets: Record<string, string>,
): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const key of RUNTIME_CONFIG_KEYS) {
    let value = '';
    if (isSecretKey(key)) {
      value = secrets[key] ?? '';
    } else {
      value = settings[key] ?? '';
    }
    if (!value && CODE_DEFAULTS[key] != null) {
      value = CODE_DEFAULTS[key];
    }
    merged[key] = value;
  }
  return merged;
}

function applyMemorySnapshot(merged: Record<string, string>) {
  memorySnapshot = { ...merged };
}

export function getRuntimeSettingSync(key: string): string {
  if (Object.prototype.hasOwnProperty.call(memorySnapshot, key)) {
    return memorySnapshot[key];
  }
  return readCodeDefault(key);
}

export function invalidateRuntimeConfigCache() {
  invalidateCache(CACHE_KEY);
  memorySnapshot = {};
}

export function runtimeUpdatesFromEnvFileContent(content: string) {
  const parsed = parseEnvFile(content);
  const updates: Record<string, string> = {};
  for (const key of RUNTIME_CONFIG_KEYS) {
    const value = (parsed[key] ?? '').trim();
    if (value) updates[key] = value;
  }
  return updates;
}

async function fetchDbRow() {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('site_runtime_config')
    .select('settings, secrets')
    .eq('site_id', SITE_ID)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function ensureDbRow() {
  const sb = createAdminClient();
  const { error } = await sb.from('site_runtime_config').upsert(
    { site_id: SITE_ID, settings: {}, secrets: {} },
    { onConflict: 'site_id', ignoreDuplicates: true },
  );
  if (error) throw error;
}

function rowIsEmpty(settings: Record<string, string>, secrets: Record<string, string>) {
  return Object.keys(settings).length === 0 && Object.keys(secrets).length === 0;
}

async function loadMergedFromDb() {
  await ensureDbRow();
  const row = await fetchDbRow();
  const settings = jsonRecord(row?.settings);
  const secrets = jsonRecord(row?.secrets);
  const merged = mergeResolved(settings, secrets);
  applyMemorySnapshot(merged);
  return { settings, secrets, merged };
}

/** Per-process TTL cache only (see invalidateRuntimeConfigCache). Not wrapped in React cache() — that would survive invalidation within the same request. */
export async function warmRuntimeSettings() {
  return getCached(CACHE_KEY, CACHE_TTL_MS, () => loadMergedFromDb());
}

export async function getRuntimeConfigForApi() {
  const { settings, secrets, merged } = await warmRuntimeSettings();
  const values: Record<string, string> = {};
  const configured: Record<string, boolean> = {};

  for (const key of RUNTIME_CONFIG_KEYS) {
    const raw = merged[key] ?? '';
    configured[key] = Boolean(isSecretKey(key) ? secrets[key] : settings[key]);
    values[key] = isSecretKey(key) && raw ? maskSecretValue(raw) : raw;
  }

  return {
    values,
    configured,
    source: 'database',
    groups: UI_ENV_GROUPS,
    definitions: UI_ENV_DEFINITIONS,
  };
}

export async function saveRuntimeConfig(updates: Record<string, unknown>, userId: string) {
  const errors = validateEnvUpdates(updates);
  if (errors.length) {
    const err = new Error(errors[0]);
    (err as Error & { validationErrors?: string[] }).validationErrors = errors;
    throw err;
  }

  await ensureDbRow();
  const row = await fetchDbRow();
  const settings = { ...jsonRecord(row?.settings) };
  const secrets = { ...jsonRecord(row?.secrets) };

  for (const key of RUNTIME_CONFIG_KEYS) {
    const value = updates[key];
    if (value === undefined || value === UNCHANGED_SECRET) continue;
    const trimmed = String(value).trim();
    if (isSecretKey(key)) {
      if (trimmed) secrets[key] = trimmed;
      else delete secrets[key];
    } else {
      if (trimmed) settings[key] = trimmed;
      else delete settings[key];
    }
  }

  const sb = createAdminClient();
  const { error } = await sb
    .from('site_runtime_config')
    .update({
      settings,
      secrets,
      updated_by: userId,
    })
    .eq('site_id', SITE_ID);
  if (error) throw error;

  invalidateRuntimeConfigCache();
  const { invalidateRedirectsCache } = await import('@/lib/config/redirects');
  invalidateRedirectsCache();
  await warmRuntimeSettings();
}

export async function importRuntimeConfigFromEnvContent(
  userId: string,
  content: string,
  { onlyIfEmpty = false, fileName = 'uploaded file' } = {},
) {
  const text = String(content ?? '');
  if (!text.trim()) {
    return { imported: false, reason: 'The uploaded file is empty.' };
  }
  if (text.length > MAX_ENV_IMPORT_BYTES) {
    return { imported: false, reason: 'Env file is too large (max 256 KB).' };
  }

  await ensureDbRow();
  const row = await fetchDbRow();
  const settings = jsonRecord(row?.settings);
  const secrets = jsonRecord(row?.secrets);
  if (onlyIfEmpty && !rowIsEmpty(settings, secrets)) {
    return {
      imported: false,
      reason: 'Runtime settings already exist in the database. Upload merges only when you confirm import.',
    };
  }

  const updates = runtimeUpdatesFromEnvFileContent(text);
  if (!Object.keys(updates).length) {
    return {
      imported: false,
      reason:
        'No runtime settings found in this file. Only SMTP, retention, performance toggles, and email branding keys are imported (not Supabase or deployment secrets).',
      sourceFile: fileName,
    };
  }

  await saveRuntimeConfig(updates, userId);
  const label = fileName || 'uploaded file';
  return {
    imported: true,
    keys: Object.keys(updates),
    sourceFile: label,
    merged: !onlyIfEmpty,
    reason: `Merged ${Object.keys(updates).length} setting(s) from ${label} into the database (keys not in the file were kept).`,
  };
}

export async function sessionPruneKeepDays() {
  await warmRuntimeSettings();
  const n = Number.parseInt(getRuntimeSettingSync('SESSION_PRUNE_KEEP_DAYS'), 10);
  return Number.isFinite(n) && n > 0 ? n : 90;
}

export async function cmsBatchWritesEnabled() {
  await warmRuntimeSettings();
  return getRuntimeSettingSync('CMS_BATCH_WRITES') !== 'false';
}

export async function mediaFullReconcileEnabled() {
  await warmRuntimeSettings();
  return getRuntimeSettingSync('MEDIA_FULL_RECONCILE') === 'true';
}
