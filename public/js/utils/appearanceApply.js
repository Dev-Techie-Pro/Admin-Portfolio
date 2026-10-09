import {
  APPEARANCE_DEFAULTS,
  applyAppearanceSettings,
  readAppearanceCache
} from "./appearanceCache.js";
const DEFAULT_ACCENT = "#ff6600";
function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)].join(",");
}
function normalizeHex(hex) {
  return typeof hex === "string" && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : DEFAULT_ACCENT;
}
function applyAppearanceTheme(theme, systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches) {
  const dark = theme === "system" ? systemDark : theme === "dark";
  document.body.classList.toggle("light", !dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}
function applyAppearanceAccent(hex) {
  const color = normalizeHex(hex);
  const root = document.documentElement;
  root.style.setProperty("--pa-orange", color);
  root.style.setProperty("--pa-orange-rgb", hexToRgb(color));
  root.style.setProperty("--pa-orange-dim", `rgba(${hexToRgb(color)}, 0.12)`);
  root.style.setProperty("--pa-orange-hover", color);
}
function applyAppearanceBranding(settings = {}) {
  applyAppearanceSettings(settings);
}
function loadLocalAppearance() {
  return readAppearanceCache() ?? { ...APPEARANCE_DEFAULTS };
}
async function initAuthAppearance() {
  try {
    const settings = loadLocalAppearance();
    applyAppearanceSettings(settings);
    const { updateFaviconFromAppearance } = await import("./favicon.js");
    updateFaviconFromAppearance(settings);
  } catch {
  }
}
export {
  applyAppearanceAccent,
  applyAppearanceBranding,
  applyAppearanceTheme,
  initAuthAppearance,
  loadLocalAppearance
};
//# sourceMappingURL=appearanceApply.js.map
