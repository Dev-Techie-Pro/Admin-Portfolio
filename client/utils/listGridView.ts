import { storage } from '../core/StorageService.js';
import { eventBus } from '../core/EventBus.js';

export type ViewMode = 'grid' | 'list';

export const FALLBACK_VIEW_MODE: ViewMode = 'list';
/** Current-tab only — not persisted (site default comes from settings / localStorage). */
const sessionPageOverrides = new Map<string, ViewMode>();
const LEGACY_OVERRIDE_PREFIX = 'pa_view_override_';
const LEGACY_SESSION_PREFIX = 'pa_view_mode:';
const SITE_DEFAULT_VIEW_LS_KEY = 'pa_site_default_view';

export function persistSiteDefaultView(mode: ViewMode) {
  try {
    localStorage.setItem(SITE_DEFAULT_VIEW_LS_KEY, mode);
  } catch {
    // localStorage unavailable
  }
}

function readSiteDefaultViewFromLocalStorage(): ViewMode | null {
  try {
    const raw = localStorage.getItem(SITE_DEFAULT_VIEW_LS_KEY);
    if (!raw) return null;
    return normalizeViewMode(raw);
  } catch {
    return null;
  }
}

export function normalizeViewMode(value: unknown): ViewMode {
  const raw = String(value ?? '').toLowerCase();
  if (raw === 'list' || raw.includes('list')) return 'list';
  if (raw === 'grid' || raw.includes('grid')) return 'grid';
  return FALLBACK_VIEW_MODE;
}

export function effectiveViewMode(mode: unknown): ViewMode {
  if (mode === 'list' || mode === 'grid') return mode;
  return FALLBACK_VIEW_MODE;
}

function readDefaultViewFromSettings(settings: unknown): ViewMode | null {
  if (!settings || typeof settings !== 'object') return null;
  const row = settings as { defaultView?: unknown; default_view?: unknown };
  if (row.defaultView != null && row.defaultView !== '') {
    return normalizeViewMode(row.defaultView);
  }
  if (row.default_view != null && row.default_view !== '') {
    return normalizeViewMode(row.default_view);
  }
  return null;
}

export function getGlobalDefaultViewMode(): ViewMode {
  const fromCache = readDefaultViewFromSettings(storage.peek('pa_settings'));
  if (fromCache) return fromCache;
  const fromLs = readSiteDefaultViewFromLocalStorage();
  if (fromLs) return fromLs;
  return FALLBACK_VIEW_MODE;
}

export async function getGlobalDefaultViewModeAsync(): Promise<ViewMode> {
  try {
    await storage.waitForBootstrap();
    const settings = await storage.get('pa_settings', {});
    const fromSettings = readDefaultViewFromSettings(settings);
    if (fromSettings) {
      persistSiteDefaultView(fromSettings);
      return fromSettings;
    }
  } catch {
    // use local / sync peek / fallback
  }
  const fromLs = readSiteDefaultViewFromLocalStorage();
  if (fromLs) return fromLs;
  const fromPeek = readDefaultViewFromSettings(storage.peek('pa_settings'));
  if (fromPeek) return fromPeek;
  return FALLBACK_VIEW_MODE;
}

export function getPageViewOverride(pageKey: string): ViewMode | null {
  if (!pageKey) return null;
  const mode = sessionPageOverrides.get(pageKey);
  return mode === 'list' || mode === 'grid' ? mode : null;
}

export function setPageViewOverride(pageKey: string, mode: ViewMode) {
  if (!pageKey) return;
  sessionPageOverrides.set(pageKey, mode);
}

export function clearPageViewOverride(pageKey: string) {
  if (!pageKey) return;
  sessionPageOverrides.delete(pageKey);
}

/** Remove old persisted per-page keys so Settings → Default View applies site-wide. */
export function clearLegacyPersistedViewOverrides() {
  const removeMatching = (storage: Storage) => {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (!key) continue;
      if (key.startsWith(LEGACY_OVERRIDE_PREFIX) || key.startsWith(LEGACY_SESSION_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach((key) => storage.removeItem(key));
  };
  try {
    removeMatching(localStorage);
    removeMatching(sessionStorage);
  } catch {
    // storage unavailable
  }
}

export function resolveInitialViewMode(pageKey: string): ViewMode {
  const override = getPageViewOverride(pageKey);
  if (override) return override;
  return getGlobalDefaultViewMode();
}

export async function resolveInitialViewModeAsync(pageKey: string): Promise<ViewMode> {
  const override = getPageViewOverride(pageKey);
  if (override) return override;
  return getGlobalDefaultViewModeAsync();
}

/** Drop in-tab overrides and legacy persisted keys (after saving Default View in settings). */
export function clearAllPageViewOverrides() {
  sessionPageOverrides.clear();
  clearLegacyPersistedViewOverrides();
}

/** Warm settings cache when needed, then apply resolved view for a page. */
export async function hydratePageViewMode(
  pageKey: string,
  apply: (mode: ViewMode) => void,
) {
  if (!pageKey) return;
  const mode = await resolveInitialViewModeAsync(pageKey);
  apply(mode);
}

type BusSubscribe = (
  event: string,
  handler: (payload: { defaultView?: string }) => void,
) => void;

export function bindDefaultViewChanged(
  pageKey: string,
  on: BusSubscribe,
  apply: (mode: ViewMode) => void,
  rerender: () => void,
) {
  if (!pageKey) return;
  on('settings:defaultViewChanged', ({ defaultView }) => {
    if (getPageViewOverride(pageKey)) return;
    apply(normalizeViewMode(defaultView));
    rerender();
  });
}

export function emitDefaultViewChanged(defaultView: string) {
  const mode = normalizeViewMode(defaultView);
  persistSiteDefaultView(mode);
  eventBus.emit('settings:defaultViewChanged', { defaultView: mode });
}

type ViewModeModule = {
  store?: { get: (key: string) => unknown; set: (key: string, value: unknown) => void };
  getViewPageKey?: () => string | null;
  getViewModeStateKey?: () => string;
  config?: { pageKey?: string; page?: string };
};

function getViewModeStateKey(module: ViewModeModule): string {
  return module.getViewModeStateKey?.() ?? 'viewMode';
}

export function getPageModuleViewKey(module: ViewModeModule | null | undefined): string | null {
  if (!module) return null;
  const fromMethod = module.getViewPageKey?.();
  if (fromMethod) return fromMethod;
  return module.config?.pageKey || module.config?.page || null;
}

/** Re-read global default (and session override) after bootstrap/settings cache updates. */
export async function syncModuleViewModeFromSettings(
  module: ViewModeModule | null | undefined,
): Promise<boolean> {
  if (!module?.store) return false;
  const pageKey = getPageModuleViewKey(module);
  if (!pageKey) return false;
  const stateKey = getViewModeStateKey(module);
  const next = await resolveInitialViewModeAsync(pageKey);
  const prev = module.store.get(stateKey);
  if (prev === next) return false;
  module.store.set(stateKey, next);
  return true;
}
