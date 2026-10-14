import {
  eventBus,
  storage
} from "./chunk-IU6Z7XVG.js";

// client/utils/listGridView.ts
var FALLBACK_VIEW_MODE = "list";
var sessionPageOverrides = /* @__PURE__ */ new Map();
var LEGACY_OVERRIDE_PREFIX = "pa_view_override_";
var LEGACY_SESSION_PREFIX = "pa_view_mode:";
var SITE_DEFAULT_VIEW_LS_KEY = "pa_site_default_view";
function persistSiteDefaultView(mode) {
  try {
    localStorage.setItem(SITE_DEFAULT_VIEW_LS_KEY, mode);
  } catch {
  }
}
function readSiteDefaultViewFromLocalStorage() {
  try {
    const raw = localStorage.getItem(SITE_DEFAULT_VIEW_LS_KEY);
    if (!raw) return null;
    return normalizeViewMode(raw);
  } catch {
    return null;
  }
}
function normalizeViewMode(value) {
  const raw = String(value ?? "").toLowerCase();
  if (raw === "list" || raw.includes("list")) return "list";
  if (raw === "grid" || raw.includes("grid")) return "grid";
  return FALLBACK_VIEW_MODE;
}
function effectiveViewMode(mode) {
  if (mode === "list" || mode === "grid") return mode;
  return FALLBACK_VIEW_MODE;
}
function readDefaultViewFromSettings(settings) {
  if (!settings || typeof settings !== "object") return null;
  const row = settings;
  if (row.defaultView != null && row.defaultView !== "") {
    return normalizeViewMode(row.defaultView);
  }
  if (row.default_view != null && row.default_view !== "") {
    return normalizeViewMode(row.default_view);
  }
  return null;
}
async function getGlobalDefaultViewModeAsync() {
  try {
    await storage.waitForBootstrap();
    const settings = await storage.get("pa_settings", {});
    const fromSettings = readDefaultViewFromSettings(settings);
    if (fromSettings) {
      persistSiteDefaultView(fromSettings);
      return fromSettings;
    }
  } catch {
  }
  const fromLs = readSiteDefaultViewFromLocalStorage();
  if (fromLs) return fromLs;
  const fromPeek = readDefaultViewFromSettings(storage.peek("pa_settings"));
  if (fromPeek) return fromPeek;
  return FALLBACK_VIEW_MODE;
}
function getPageViewOverride(pageKey) {
  if (!pageKey) return null;
  const mode = sessionPageOverrides.get(pageKey);
  return mode === "list" || mode === "grid" ? mode : null;
}
function setPageViewOverride(pageKey, mode) {
  if (!pageKey) return;
  sessionPageOverrides.set(pageKey, mode);
}
function clearLegacyPersistedViewOverrides() {
  const removeMatching = (storage2) => {
    const keys = [];
    for (let i = 0; i < storage2.length; i += 1) {
      const key = storage2.key(i);
      if (!key) continue;
      if (key.startsWith(LEGACY_OVERRIDE_PREFIX) || key.startsWith(LEGACY_SESSION_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach((key) => storage2.removeItem(key));
  };
  try {
    removeMatching(localStorage);
    removeMatching(sessionStorage);
  } catch {
  }
}
async function resolveInitialViewModeAsync(pageKey) {
  const override = getPageViewOverride(pageKey);
  if (override) return override;
  return getGlobalDefaultViewModeAsync();
}
function clearAllPageViewOverrides() {
  sessionPageOverrides.clear();
  clearLegacyPersistedViewOverrides();
}
async function hydratePageViewMode(pageKey, apply) {
  if (!pageKey) return;
  const mode = await resolveInitialViewModeAsync(pageKey);
  apply(mode);
}
function bindDefaultViewChanged(pageKey, on, apply, rerender) {
  if (!pageKey) return;
  on("settings:defaultViewChanged", ({ defaultView }) => {
    if (getPageViewOverride(pageKey)) return;
    apply(normalizeViewMode(defaultView));
    rerender();
  });
}
function emitDefaultViewChanged(defaultView) {
  const mode = normalizeViewMode(defaultView);
  persistSiteDefaultView(mode);
  eventBus.emit("settings:defaultViewChanged", { defaultView: mode });
}
function getViewModeStateKey(module) {
  return module.getViewModeStateKey?.() ?? "viewMode";
}
function getPageModuleViewKey(module) {
  if (!module) return null;
  const fromMethod = module.getViewPageKey?.();
  if (fromMethod) return fromMethod;
  return module.config?.pageKey || module.config?.page || null;
}
async function syncModuleViewModeFromSettings(module) {
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

export {
  persistSiteDefaultView,
  normalizeViewMode,
  effectiveViewMode,
  setPageViewOverride,
  clearLegacyPersistedViewOverrides,
  clearAllPageViewOverrides,
  hydratePageViewMode,
  bindDefaultViewChanged,
  emitDefaultViewChanged,
  syncModuleViewModeFromSettings
};
//# sourceMappingURL=chunk-Z5SVHIB7.js.map
