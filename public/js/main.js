import {
  clearUserCredentials,
  formatStaffRoleLabel,
  initStaffInviteLinkModal,
  initUserCredentialsPanel,
  notifyCredentialsEmailStatus,
  populateStaffRoleSelect,
  showUserCredentialsPanel
} from "./chunks/chunk-OAKF3NT4.js";
import {
  debounce
} from "./chunks/chunk-NGJCAR7D.js";
import {
  animate,
  applyRoleBasedAccess,
  applyUserDisplay,
  hideNavFlyout,
  initSettingsNav,
  initSidebarCollapse,
  initSidebarGroupNav,
  isSidebarCollapsedDesktop,
  prefersReducedMotion,
  previewUserAvatar,
  showNavFlyout,
  syncSidebarGroupNav
} from "./chunks/chunk-2QNVQJS4.js";
import {
  initPasswordToggles
} from "./chunks/chunk-HSBA7GYU.js";
import {
  authService
} from "./chunks/chunk-IRZPJAKT.js";
import {
  getThemeBackground,
  updateFavicon
} from "./chunks/chunk-3JOTZRJK.js";
import {
  initAllPaSelects
} from "./chunks/chunk-WJJ4NSHA.js";
import {
  handleFileValidation,
  uploadCmsFileWithPreview
} from "./chunks/chunk-VKZENHZA.js";
import {
  PAGE,
  getCurrentPage,
  getLoginPath,
  getSettingsTabFromPath
} from "./chunks/chunk-KIKQZPYB.js";
import {
  closeAllCardMenus
} from "./chunks/chunk-IZ7T64RP.js";
import {
  Module,
  activateTab,
  addNotification,
  anyPanelOpen,
  applyCapabilityGatedElements,
  clearNotifications,
  closeConfirm,
  closePanels,
  eventBus,
  getAccessCapabilities,
  initConfirmDialog,
  isConfirmOpen,
  loadNotifications,
  markNotificationRead,
  openPanel,
  registerPanel,
  renderNotifications,
  requestLogout,
  storage
} from "./chunks/chunk-3TY7DIYN.js";
import {
  $all,
  $id,
  clearDomCache,
  escapeHtml,
  showStatusToast,
  showToast
} from "./chunks/chunk-IC6SRMKJ.js";

// client/core/BodyLoader.ts
var BodyLoader = class {
  constructor() {
    this._count = 0;
    this._host = null;
    this._el = null;
    this._labelEl = null;
    this._defaultMessage = "Loading your data\u2026";
    this._hideTimer = null;
    this._showFrame = null;
    this._EXIT_MS = 220;
  }
  _resolveHost() {
    return document.body;
  }
  _findLoader() {
    return document.getElementById("paBodyLoader");
  }
  _ensureOnBody(el) {
    if (el && el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
  }
  _cancelShowFrame() {
    if (this._showFrame) {
      cancelAnimationFrame(this._showFrame);
      this._showFrame = null;
    }
  }
  mount() {
    if (typeof window.__paEnsureBodyLoader === "function") {
      this._el = window.__paEnsureBodyLoader(false);
      this._host = this._resolveHost();
      if (this._el) {
        this._labelEl = this._el.querySelector(".pa-body-loader__label");
      }
      return;
    }
    this._host = this._resolveHost();
    if (!this._host) return;
    const existing = this._findLoader();
    if (existing) {
      this._ensureOnBody(existing);
      this._el = existing;
      this._labelEl = existing.querySelector(".pa-body-loader__label");
      return;
    }
    const el = document.createElement("div");
    el.className = "pa-body-loader";
    el.id = "paBodyLoader";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-busy", "true");
    el.innerHTML = `
      <div class="pa-body-loader__veil" aria-hidden="true"></div>
      <div class="pa-body-loader__panel">
        <div class="pa-body-loader__orbit" aria-hidden="true">
          <span class="pa-body-loader__ring"></span>
          <span class="pa-body-loader__ring pa-body-loader__ring--delay"></span>
          <span class="pa-body-loader__core"><i class="ri-database-2-line"></i></span>
        </div>
        <p class="pa-body-loader__label">${this._defaultMessage}</p>
        <div class="pa-body-loader__stream" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>
        <div class="pa-body-loader__skeleton" aria-hidden="true">
          <div class="pa-body-loader__skel-card"></div>
          <div class="pa-body-loader__skel-card"></div>
          <div class="pa-body-loader__skel-card"></div>
          <div class="pa-body-loader__skel-card"></div>
        </div>
      </div>
    `;
    this._host.appendChild(el);
    this._el = el;
    this._labelEl = el.querySelector(".pa-body-loader__label");
  }
  begin(message) {
    const msg = message || this._defaultMessage;
    if (typeof window.__paEnsureBodyLoader === "function") {
      this._el = window.__paEnsureBodyLoader(true, msg);
      this._host = this._resolveHost();
      this._labelEl = this._el?.querySelector(".pa-body-loader__label") || null;
    } else {
      this.mount();
    }
    if (!this._host || !this._el) return;
    this._cancelShowFrame();
    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }
    if (msg && this._labelEl) this._labelEl.textContent = msg;
    this._count += 1;
    document.body.classList.add("pa-loading-active");
    this._el.classList.remove("is-hiding");
    this._el.classList.add("visible");
    this._el.setAttribute("aria-busy", "true");
  }
  end() {
    if (!this._el) return;
    this._count = Math.max(0, this._count - 1);
    if (this._count === 0) this._hide();
  }
  reset() {
    this._count = 0;
    this._hide();
  }
  _hide() {
    this._cancelShowFrame();
    this._host = this._resolveHost();
    if (!this._host || !this._el) return;
    this._el.classList.add("is-hiding");
    this._el.classList.remove("visible");
    if (this._count === 0) document.body.classList.remove("pa-loading-active");
    if (this._labelEl) this._labelEl.textContent = this._defaultMessage;
    this._el.setAttribute("aria-busy", "false");
    if (this._hideTimer) clearTimeout(this._hideTimer);
    this._hideTimer = setTimeout(() => {
      this._el?.classList.remove("is-hiding");
      this._hideTimer = null;
    }, this._EXIT_MS);
  }
  async wrap(promise, message) {
    this.begin(message);
    try {
      return await promise;
    } finally {
      this.end();
    }
  }
};
var bodyLoader = new BodyLoader();

// client/modules/shell/AddUserManager.ts
var ADMIN_ROLES = ["super_admin", "admin"];
var AddUserManager = class {
  /**
   * @param {object} opts
   * @param {(el: Element, event: string, handler: Function) => void} opts.on
   * @param {() => void} [opts.closeUserMenu]
   */
  constructor({ on, closeUserMenu }) {
    this.on = on;
    this.closeUserMenu = closeUserMenu;
    this._profileRole = null;
  }
  bindEvents() {
    registerPanel("paAddUserPanel");
    const menuBtn = $id("paAddUserMenuBtn");
    if (menuBtn) {
      this.on(menuBtn, "click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.closeUserMenu?.();
        void this.openAddUserPanel();
      });
    }
    this.on($id("paAddUserPanelClose"), "click", () => this.closeAddUserPanel());
    this.on($id("paAddUserCancelBtn"), "click", () => this.closeAddUserPanel());
    this.on($id("paAddUserSubmitBtn"), "click", () => {
      void this.submitAddUser();
    });
    this.on($id("paPanelOverlay"), "click", (e) => {
      if (e.target.id !== "paPanelOverlay") return;
      if ($id("paUserCredentialsPanel")?.classList.contains("visible")) {
        this.closeCredentialsPanel();
      } else if ($id("paAddUserPanel")?.classList.contains("visible")) {
        this.closeAddUserPanel();
      }
    });
  }
  setProfileRole(role) {
    this._profileRole = role || null;
  }
  isAdmin() {
    return ADMIN_ROLES.includes(this._profileRole);
  }
  async ensureAdminAccess() {
    if (this.isAdmin()) return true;
    try {
      const profile = await authService.getProfile();
      this._profileRole = profile?.role || null;
    } catch {
      this._profileRole = null;
    }
    if (!this.isAdmin()) {
      showToast("Only administrators can add users.", "danger");
      return false;
    }
    return true;
  }
  resetAddUserForm() {
    const set = (id, value) => {
      const el = $id(id);
      if (el) el.value = value;
    };
    set("addUserFullName", "");
    set("addUserUsername", "");
    set("addUserEmail", "");
    populateStaffRoleSelect($id("addUserRole"), { selected: "editor" });
  }
  openAddUserPanel() {
    this.resetAddUserForm();
    openPanel("paAddUserPanel", ["paUserCredentialsPanel"]);
    window.setTimeout(() => $id("addUserFullName")?.focus(), 120);
    void this.guardAddUserPanelAccess();
  }
  async guardAddUserPanelAccess() {
    if (this.isAdmin()) return;
    if (!await this.ensureAdminAccess()) {
      this.closeAddUserPanel();
    }
  }
  closeAddUserPanel() {
    closePanels();
  }
  closeCredentialsPanel() {
    closePanels();
    clearUserCredentials();
  }
  collectFormPayload() {
    return {
      fullName: $id("addUserFullName")?.value?.trim() || "",
      username: $id("addUserUsername")?.value?.trim() || "",
      email: $id("addUserEmail")?.value?.trim() || "",
      role: $id("addUserRole")?.value || "editor"
    };
  }
  async fetchJson(url, options) {
    const res = await fetch(url, {
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...options?.body ? { "Content-Type": "application/json" } : {},
        ...options?.headers || {}
      },
      ...options
    });
    if (res.status === 401) {
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText || "Request failed");
    return data;
  }
  async submitAddUser() {
    if (!await this.ensureAdminAccess()) return;
    const payload = this.collectFormPayload();
    if (!payload.fullName) {
      showToast("Full name is required.", "danger");
      $id("addUserFullName")?.focus();
      return;
    }
    if (!payload.email) {
      showToast("Email is required.", "danger");
      $id("addUserEmail")?.focus();
      return;
    }
    showStatusToast("Creating user\u2026", "info", 12e4);
    try {
      const result = await this.fetchJson("/api/users", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      this.showCredentials(result.credentials, result);
      addNotification(`User ${result.user?.fullName || result.user?.email || payload.email} was created`, "ri-user-add-line");
      notifyCredentialsEmailStatus(result);
    } catch (error) {
      showStatusToast(error.message || "Could not create user.", "danger");
    }
  }
  formatRoleLabel(role) {
    return formatStaffRoleLabel(role);
  }
  showCredentials(credentials, emailMeta = {}) {
    if (!credentials) return;
    showUserCredentialsPanel(credentials, {
      closePanelIds: ["paAddUserPanel"],
      emailSent: emailMeta.emailSent,
      emailError: emailMeta.emailError
    });
  }
};

// client/utils/customFonts.ts
var MAX_CUSTOM_FONTS = 5;
var MAX_FONT_BYTES = 2 * 1024 * 1024;
var FONT_MIME_TYPES = /* @__PURE__ */ new Set([
  "font/woff",
  "font/woff2",
  "font/ttf",
  "font/otf",
  "application/font-woff",
  "application/font-woff2",
  "application/x-font-woff",
  "application/x-font-ttf",
  "application/x-font-otf",
  "application/octet-stream"
]);
var FONT_EXTENSIONS = {
  woff: "woff",
  woff2: "woff2",
  ttf: "truetype",
  otf: "opentype"
};
var CUSTOM_FONT_STYLE_ID = "pa-custom-fonts-style";
function isCustomFontId(id) {
  return typeof id === "string" && id.startsWith("custom-");
}
function deriveFontFormat(file) {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return FONT_EXTENSIONS[ext] || "woff2";
}
function deriveFontName(file) {
  const base = file.name.replace(/\.[^.]+$/, "");
  return base.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60) || "Custom Font";
}
function deriveFamilyName(displayName) {
  const safe = String(displayName || "Custom Font").replace(/[^\w\s-]/g, "").trim().slice(0, 50) || "Custom Font";
  return `PA Custom ${safe}`;
}
function createCustomFontId() {
  const rand = Math.random().toString(36).slice(2, 8);
  return `custom-${Date.now().toString(36)}${rand}`;
}
function validateFontFile(file) {
  if (!file) return "No file selected.";
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!FONT_EXTENSIONS[ext]) {
    return `"${file.name}" \u2014 only WOFF, WOFF2, TTF, or OTF files are supported.`;
  }
  if (!FONT_MIME_TYPES.has(file.type) && file.type !== "") {
    return `"${file.name}" \u2014 unsupported file type.`;
  }
  if (file.size > MAX_FONT_BYTES) {
    return `"${file.name}" \u2014 file exceeds the 2MB limit.`;
  }
  return null;
}
function normalizeCustomFonts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((f) => f && isCustomFontId(f.id) && f.url && f.familyName).slice(0, MAX_CUSTOM_FONTS).map((f) => ({
    id: f.id,
    name: String(f.name || f.familyName).slice(0, 60),
    familyName: String(f.familyName).slice(0, 80),
    url: f.url,
    format: f.format || "woff2",
    fileName: typeof f.fileName === "string" ? f.fileName.slice(0, 120) : "",
    uploadedAt: f.uploadedAt || null
  }));
}
function customFontToOption(font) {
  const stack = `'${font.familyName}', sans-serif`;
  return {
    id: font.id,
    name: font.name,
    stack,
    sample: "Your custom typeface",
    isCustom: true
  };
}
function registerCustomFonts(customFonts = []) {
  if (typeof document === "undefined") return;
  let style = document.getElementById(CUSTOM_FONT_STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = CUSTOM_FONT_STYLE_ID;
    document.head.appendChild(style);
  }
  const rules = normalizeCustomFonts(customFonts).map((font) => {
    const format = font.format || "woff2";
    const escapedFamily = font.familyName.replace(/'/g, "\\'");
    const escapedUrl = font.url.replace(/"/g, '\\"');
    return `@font-face{font-family:'${escapedFamily}';src:url("${escapedUrl}") format('${format}');font-display:swap;}`;
  });
  style.textContent = rules.join("\n");
}
async function buildCustomFontFromFile(file) {
  const error = validateFontFile(file);
  if (error) throw new Error(error);
  const { uploadCustomFontFile } = await import("./chunks/media-upload-IOWCA2X3.js");
  const uploaded = await uploadCustomFontFile(file);
  const url = uploaded.url;
  const name = deriveFontName(file);
  const familyName = deriveFamilyName(name);
  return {
    id: createCustomFontId(),
    name,
    familyName,
    url,
    format: deriveFontFormat(file),
    fileName: file.name,
    uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// client/utils/googleFonts.ts
var LAYOUT_PRELOADED = /* @__PURE__ */ new Set(["inter", "outfit"]);
var GOOGLE_FONT_SPECS = {
  "plus-jakarta-sans": { family: "Plus+Jakarta+Sans", weights: "300;400;600;700" },
  manrope: { family: "Manrope", weights: "300;400;600;700" },
  figtree: { family: "Figtree", weights: "300;400;600;700" },
  "dm-sans": { family: "DM+Sans", weights: "400;500;600;700" },
  sora: { family: "Sora", weights: "300;400;600;700" },
  "instrument-sans": { family: "Instrument+Sans", weights: "400;500;600;700" },
  "space-grotesk": { family: "Space+Grotesk", weights: "400;500;600;700" },
  onest: { family: "Onest", weights: "300;400;600;700" },
  fraunces: { family: "Fraunces", weights: "400;600;700" },
  "source-serif-4": { family: "Source+Serif+4", weights: "400;600;700" },
  literata: { family: "Literata", weights: "400;600;700" },
  "jetbrains-mono": { family: "JetBrains+Mono", weights: "400;500;700" },
  "ibm-plex-mono": { family: "IBM+Plex+Mono", weights: "400;500;700" },
  "fira-code": { family: "Fira+Code", weights: "400;500;700" },
  "source-code-pro": { family: "Source+Code+Pro", weights: "400;500;700" },
  "dm-mono": { family: "DM+Mono", weights: "400;500" }
};
function ensureGoogleFontLoaded(fontId) {
  if (!fontId || typeof document === "undefined") return;
  if (LAYOUT_PRELOADED.has(fontId) || fontId.startsWith("custom-")) return;
  const spec = GOOGLE_FONT_SPECS[fontId];
  if (!spec) return;
  const linkId = `pa-gf-${fontId}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${spec.family}:wght@${spec.weights}&display=swap`;
  document.head.appendChild(link);
}

// client/utils/appearanceCache.ts
var APPEARANCE_CACHE_KEY = "pa_appearance_settings_v2";
var APPEARANCE_DEFAULTS = {
  theme: "dark",
  accent: "#ff6600",
  fontSize: "14px",
  fontFamily: "inter",
  fontWeight: "400",
  cornerRadius: "14px",
  cardSpacing: "10px",
  iconSize: "medium",
  customFonts: []
};
var ICON_SIZE_PRESETS = {
  small: {
    nav: "12px",
    action: "14px",
    stat: "18px",
    header: "16px",
    empty: "32px",
    toggle: "14px",
    circle: "38px",
    btn: "34px"
  },
  medium: {
    nav: "14px",
    action: "16px",
    stat: "22px",
    header: "18px",
    empty: "40px",
    toggle: "16px",
    circle: "44px",
    btn: "38px"
  },
  large: {
    nav: "18px",
    action: "20px",
    stat: "26px",
    header: "22px",
    empty: "48px",
    toggle: "20px",
    circle: "52px",
    btn: "44px"
  }
};
var ICON_PREVIEW_SIZES = { small: "12px", medium: "16px", large: "20px" };
var CUSTOM_FONTS = [
  { group: "Sans-serif", fonts: [
    { id: "inter", name: "Inter", stack: "'Inter', sans-serif", sample: "The quick brown fox" },
    { id: "outfit", name: "Outfit", stack: "'Outfit', sans-serif", sample: "Clean and modern" },
    { id: "plus-jakarta-sans", name: "Plus Jakarta Sans", stack: "'Plus Jakarta Sans', sans-serif", sample: "Modern admin dashboard" },
    { id: "manrope", name: "Manrope", stack: "'Manrope', sans-serif", sample: "Clear and balanced" },
    { id: "figtree", name: "Figtree", stack: "'Figtree', sans-serif", sample: "Friendly and professional" },
    { id: "dm-sans", name: "DM Sans", stack: "'DM Sans', sans-serif", sample: "The quick brown fox" },
    { id: "sora", name: "Sora", stack: "'Sora', sans-serif", sample: "Tech-forward clarity" },
    { id: "instrument-sans", name: "Instrument Sans", stack: "'Instrument Sans', sans-serif", sample: "Crisp UI typography" },
    { id: "space-grotesk", name: "Space Grotesk", stack: "'Space Grotesk', sans-serif", sample: "Geometric precision" },
    { id: "onest", name: "Onest", stack: "'Onest', sans-serif", sample: "Designed for interfaces" }
  ] },
  { group: "Serif", fonts: [
    { id: "fraunces", name: "Fraunces", stack: "'Fraunces', serif", sample: "Elegant and literary" },
    { id: "source-serif-4", name: "Source Serif 4", stack: "'Source Serif 4', serif", sample: "Readable long-form text" },
    { id: "literata", name: "Literata", stack: "'Literata', serif", sample: "Warm editorial tone" }
  ] },
  { group: "Monospace", fonts: [
    { id: "jetbrains-mono", name: "JetBrains Mono", stack: "'JetBrains Mono', monospace", sample: "const app = true;" },
    { id: "ibm-plex-mono", name: "IBM Plex Mono", stack: "'IBM Plex Mono', monospace", sample: "function() { }" },
    { id: "fira-code", name: "Fira Code", stack: "'Fira Code', monospace", sample: "const data = [];" },
    { id: "source-code-pro", name: "Source Code Pro", stack: "'Source Code Pro', monospace", sample: "export default {};" },
    { id: "dm-mono", name: "DM Mono", stack: "'DM Mono', monospace", sample: "npm run dev" }
  ] }
];
var FONT_SIZE_MAP = {
  "10px": "10px",
  "14px": "14px",
  "16px": "16px"
};
var FONT_SIZE_TOKEN_BASE = {
  xm: 8,
  sm: 10,
  xmd: 12,
  md: 14,
  lg: 16,
  xl: 22,
  xxl: 42
};
var FONT_WEIGHT_MAP = {
  300: "300",
  400: "400",
  600: "600",
  700: "700"
};
var FONT_WEIGHT_OFFSETS = {
  xs: -200,
  sm: -100,
  md: 0,
  lg: 100,
  xl: 200
};
function clampFontWeight(value) {
  return String(Math.min(900, Math.max(100, value)));
}
function applyFontSizeTokens(root, fontSize) {
  const basePx = parseFloat(FONT_SIZE_MAP[fontSize] || FONT_SIZE_MAP["14px"]);
  const scale = basePx / FONT_SIZE_TOKEN_BASE.md;
  Object.entries(FONT_SIZE_TOKEN_BASE).forEach(([token, px]) => {
    root.style.setProperty(`--pa-fs-${token}`, `${Math.round(px * scale * 100) / 100}px`);
  });
  root.style.fontSize = `${basePx}px`;
  root.dataset.fontSize = fontSize;
}
function applyFontWeightTokens(root, fontWeight) {
  const base = parseInt(FONT_WEIGHT_MAP[fontWeight] || FONT_WEIGHT_MAP["400"], 10);
  Object.entries(FONT_WEIGHT_OFFSETS).forEach(([token, offset]) => {
    root.style.setProperty(`--pa-fw-${token}`, clampFontWeight(base + offset));
  });
  if (document.body) document.body.style.fontWeight = String(base);
  root.dataset.fontWeight = fontWeight;
}
var SPACING_MAP = {
  "5px": "5px",
  "10px": "10px",
  "15px": "15px"
};
var RADIUS_MAP = {
  "0px": { sm: "0px", md: "0px", lg: "0px", xl: "0px" },
  "5px": { sm: "5px", md: "10px", lg: "15px", xl: "20px" },
  "14px": { sm: "8px", md: "15px", lg: "18px", xl: "24px" },
  "25px": { sm: "14px", md: "18px", lg: "20px", xl: "30px" }
};
var ALL_FONT_IDS = CUSTOM_FONTS.flatMap((g) => g.fonts.map((f) => f.id));
var VALID_RADII = Object.keys(RADIUS_MAP);
var VALID_FONT_SIZES = Object.keys(FONT_SIZE_MAP);
function migrateFontSize(size) {
  if (typeof size === "string" && VALID_FONT_SIZES.includes(size)) return size;
  const px = parseFloat(String(size)) || 14;
  if (px <= 11) return "10px";
  if (px <= 15) return "14px";
  return "16px";
}
var VALID_FONT_WEIGHTS = Object.keys(FONT_WEIGHT_MAP);
var VALID_SPACINGS = Object.keys(SPACING_MAP);
var VALID_ICON_SIZES = Object.keys(ICON_SIZE_PRESETS);
function applyIconSizeVariables(root, iconSize) {
  const preset = ICON_SIZE_PRESETS[iconSize] || ICON_SIZE_PRESETS.medium;
  root.style.setProperty("--pa-icon-nav", preset.nav);
  root.style.setProperty("--pa-icon-action", preset.action);
  root.style.setProperty("--pa-icon-stat", preset.stat);
  root.style.setProperty("--pa-icon-header", preset.header);
  root.style.setProperty("--pa-icon-empty", preset.empty);
  root.style.setProperty("--pa-icon-toggle", preset.toggle);
  root.style.setProperty("--pa-icon-circle", preset.circle);
  root.style.setProperty("--pa-icon-btn", preset.btn);
  root.dataset.iconSize = VALID_ICON_SIZES.includes(iconSize) ? iconSize : "medium";
}
function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)].join(",");
}
function applyAccentCssVariables(root, accent) {
  const hex = /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : APPEARANCE_DEFAULTS.accent;
  const rgb = hexToRgb(hex);
  root.style.setProperty("--pa-orange", hex);
  root.style.setProperty("--pa-orange-rgb", rgb);
  root.style.setProperty("--pa-orange-dim", `rgba(${rgb}, 0.12)`);
  root.style.setProperty("--pa-orange-hover", hex);
  root.style.setProperty("--pa-orange-glow", `rgba(${rgb}, 0.22)`);
  root.style.setProperty("--pa-orange-border", `rgba(${rgb}, 0.28)`);
  root.style.setProperty("--pa-orange-lighter", `rgba(${rgb}, 0.5)`);
}
function isValidFontFamilyId(id, customFonts = []) {
  return ALL_FONT_IDS.includes(id) || customFonts.some((f) => f.id === id);
}
function getFontGroups(customFonts = []) {
  const groups = CUSTOM_FONTS.map((group) => ({ ...group, fonts: [...group.fonts] }));
  const normalized = normalizeCustomFonts(customFonts);
  if (normalized.length) {
    groups.unshift({
      group: "Your Uploads",
      fonts: normalized.map(customFontToOption)
    });
  }
  return groups;
}
function getFontById(id, customFonts = []) {
  for (const g of CUSTOM_FONTS) {
    const f = g.fonts.find((x) => x.id === id);
    if (f) return f;
  }
  const custom = normalizeCustomFonts(customFonts).find((f) => f.id === id);
  if (custom) return customFontToOption(custom);
  return CUSTOM_FONTS[0].fonts[0];
}
function normalizeAppearanceSettings(raw) {
  const settings = { ...APPEARANCE_DEFAULTS, customFonts: [] };
  if (!raw || typeof raw !== "object") return settings;
  if (["light", "dark", "system"].includes(raw.theme)) settings.theme = raw.theme;
  if (/^#[0-9a-fA-F]{6}$/.test(raw.accent)) settings.accent = raw.accent;
  if (raw.fontSize) settings.fontSize = migrateFontSize(raw.fontSize);
  settings.customFonts = normalizeCustomFonts(raw.customFonts);
  if (typeof raw.fontFamily === "string" && isValidFontFamilyId(raw.fontFamily, settings.customFonts)) {
    settings.fontFamily = raw.fontFamily;
  } else if (isCustomFontId(raw.fontFamily)) {
    settings.fontFamily = APPEARANCE_DEFAULTS.fontFamily;
  }
  const weight = String(raw.fontWeight);
  if (VALID_FONT_WEIGHTS.includes(weight)) settings.fontWeight = weight;
  if (typeof raw.cornerRadius === "string" && VALID_RADII.includes(raw.cornerRadius)) {
    settings.cornerRadius = raw.cornerRadius;
  }
  if (VALID_SPACINGS.includes(raw.cardSpacing)) settings.cardSpacing = raw.cardSpacing;
  if (VALID_ICON_SIZES.includes(raw.iconSize)) settings.iconSize = raw.iconSize;
  return settings;
}
function readAppearanceCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(APPEARANCE_CACHE_KEY);
    if (!raw) return null;
    return normalizeAppearanceSettings(JSON.parse(raw));
  } catch {
    return null;
  }
}
function writeAppearanceCache(settings) {
  if (typeof window === "undefined" || !settings) return;
  try {
    localStorage.setItem(APPEARANCE_CACHE_KEY, JSON.stringify(normalizeAppearanceSettings(settings)));
  } catch (err) {
    console.warn("[appearanceCache] could not write localStorage:", err);
  }
}
function applyAppearanceSettings(settings, options = {}) {
  if (!settings || typeof document === "undefined") return;
  const normalized = normalizeAppearanceSettings(settings);
  const systemDark = options.systemDark ?? window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = normalized.theme === "system" ? systemDark : normalized.theme === "dark";
  document.body?.classList.toggle("light", !dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  const root = document.documentElement;
  applyAccentCssVariables(root, normalized.accent);
  applyFontSizeTokens(root, normalized.fontSize);
  registerCustomFonts(normalized.customFonts);
  ensureGoogleFontLoaded(normalized.fontFamily);
  const font = getFontById(normalized.fontFamily, normalized.customFonts);
  if (document.body) document.body.style.fontFamily = font.stack;
  applyFontWeightTokens(root, normalized.fontWeight);
  const radius = RADIUS_MAP[normalized.cornerRadius] || RADIUS_MAP["14px"];
  root.style.setProperty("--pa-radius", normalized.cornerRadius);
  root.style.setProperty("--pa-radius-sm", radius.sm);
  root.style.setProperty("--pa-radius-md", radius.md);
  root.style.setProperty("--pa-radius-lg", radius.lg);
  root.style.setProperty("--pa-radius-xl", radius.xl);
  const spacing = SPACING_MAP[normalized.cardSpacing] || "10px";
  root.style.setProperty("--pa-card-gap", spacing);
  root.dataset.cardSpacing = normalized.cardSpacing;
  applyIconSizeVariables(root, normalized.iconSize);
  eventBus.emit("appearance:updated", { settings: normalized });
  return normalized;
}
function bootstrapAppearanceFromCache() {
  const cached = readAppearanceCache();
  if (cached) applyAppearanceSettings(cached);
  if (typeof window !== "undefined") {
    window.__paWriteAppearanceCache = writeAppearanceCache;
  }
  return cached;
}

// client/modules/shell/CustomizationModule.ts
var CustomizationModule = class extends Module {
  constructor() {
    super({ name: "Customization" });
    this.settings = { ...APPEARANCE_DEFAULTS };
    this.systemMq = window.matchMedia("(prefers-color-scheme: dark)");
  }
  async init() {
    this.ensureFontSizeUI();
    this.ensureFontUploadUI();
    this.ensureIconSizeUI();
    this.bindEvents();
    await this.load();
    this.render();
  }
  async load() {
    const cached = readAppearanceCache();
    if (cached) {
      this.settings = normalizeAppearanceSettings(cached);
    }
  }
  async save() {
    writeAppearanceCache(this.settings);
  }
  render() {
    applyAppearanceSettings(this.settings, { systemDark: this.systemMq.matches });
    this.syncFavicon();
    this.syncUI();
  }
  applyTheme(t) {
    this.settings.theme = t;
    applyAppearanceSettings(this.settings, { systemDark: this.systemMq.matches });
    this.syncFavicon();
  }
  applyAccent(hex) {
    this.settings.accent = hex;
    applyAppearanceSettings(this.settings, { systemDark: this.systemMq.matches });
    this.syncFavicon();
  }
  syncFavicon() {
    updateFavicon(this.settings.accent, getThemeBackground());
  }
  applyFontSize(fs) {
    this.settings.fontSize = fs;
    applyAppearanceSettings(this.settings, { systemDark: this.systemMq.matches });
  }
  applyFontFamily(id) {
    this.settings.fontFamily = id;
    const font = getFontById(id, this.settings.customFonts);
    const nameEl = $id("customFontTriggerName");
    const previewEl = $id("customFontTriggerPreview");
    if (nameEl) nameEl.textContent = font.name;
    if (previewEl) {
      previewEl.textContent = font.sample;
      previewEl.style.fontFamily = font.stack;
    }
    applyAppearanceSettings(this.settings, { systemDark: this.systemMq.matches });
  }
  applyFontWeight(weight) {
    this.settings.fontWeight = weight;
    applyAppearanceSettings(this.settings, { systemDark: this.systemMq.matches });
  }
  applyCornerRadius(val) {
    this.settings.cornerRadius = val;
    applyAppearanceSettings(this.settings, { systemDark: this.systemMq.matches });
  }
  applyCardSpacing(spacing) {
    this.settings.cardSpacing = spacing;
    applyAppearanceSettings(this.settings, { systemDark: this.systemMq.matches });
  }
  applyIconSize(size) {
    this.settings.iconSize = size;
    applyAppearanceSettings(this.settings, { systemDark: this.systemMq.matches });
  }
  /** Normalize font-size controls to 10px / 14px / 16px on every page panel. */
  ensureFontSizeUI() {
    document.querySelectorAll('[data-panel="custom"][data-content="typography"]').forEach((panel) => {
      const sizeBtn = panel.querySelector(".custom-fs-btn[data-size]");
      const seg = sizeBtn?.closest(".custom-fs-seg");
      if (!seg || seg.dataset.fontSizeNormalized === "true") return;
      seg.dataset.fontSizeNormalized = "true";
      seg.innerHTML = VALID_FONT_SIZES.map((size) => `<button type="button" class="custom-fs-btn" data-size="${size}" role="radio" aria-checked="false">${size}</button>`).join("");
    });
  }
  ensureIconSizeUI() {
    const typographyPanel = document.querySelector('[data-panel="custom"][data-content="typography"]');
    if (!typographyPanel || $id("customIconSizeSection")) return;
    const section = document.createElement("div");
    section.className = "pa-form-group mt-8";
    section.id = "customIconSizeSection";
    section.innerHTML = `
      <label class="pa-form-label">Icon Size</label>
      <div class="custom-icon-size-group" id="customIconSizeGroup" role="radiogroup" aria-label="Icon size">
        ${VALID_ICON_SIZES.map((size) => {
      const label = size.charAt(0).toUpperCase() + size.slice(1);
      const preview = ICON_PREVIEW_SIZES[size];
      return `
          <button type="button" class="custom-icon-size-card" data-icon-size="${size}" role="radio" aria-checked="false" aria-label="${label} icon size">
            <div class="custom-icon-size-preview" aria-hidden="true">
              <i class="ri-home-4-line" style="font-size:${preview}"></i>
              <i class="ri-settings-3-line" style="font-size:${preview}"></i>
              <i class="ri-notification-3-line" style="font-size:${preview}"></i>
            </div>
            <span class="custom-icon-size-label">${label}</span>
          </button>`;
    }).join("")}
      </div>`;
    typographyPanel.appendChild(section);
  }
  ensureFontUploadUI() {
    const typographyPanel = document.querySelector('[data-panel="custom"][data-content="typography"]');
    if (!typographyPanel || $id("customFontUploadSection")) return;
    const section = document.createElement("div");
    section.className = "pa-form-group mt-8";
    section.id = "customFontUploadSection";
    section.innerHTML = `
      <label class="pa-form-label">Upload Custom Font</label>
      <div class="pa-font-upload" id="customFontUpload" role="button" tabindex="0" aria-label="Upload a custom font file">
        <i class="ri-font-size-2" aria-hidden="true"></i>
        <div class="pa-media-upload-text">Click or drag a font file here</div>
        <div class="pa-media-upload-hint">WOFF, WOFF2, TTF, OTF \u2014 Max 2MB (up to ${MAX_CUSTOM_FONTS} fonts)</div>
        <input type="file" id="customFontFileInput" accept=".woff,.woff2,.ttf,.otf,font/woff,font/woff2,font/ttf,font/otf" hidden />
      </div>
      <div class="custom-font-upload-list" id="customFontUploadList" aria-live="polite"></div>`;
    const fontSizeGroup = typographyPanel.querySelector(".pa-form-group.mt-8");
    if (fontSizeGroup) typographyPanel.insertBefore(section, fontSizeGroup);
    else typographyPanel.appendChild(section);
  }
  renderUploadedFontsList() {
    const list = $id("customFontUploadList");
    const dropzone = $id("customFontUpload");
    if (!list) return;
    const fonts = this.settings.customFonts || [];
    if (!fonts.length) {
      list.innerHTML = "";
      dropzone?.classList.remove("is-full");
      return;
    }
    dropzone?.classList.toggle("is-full", fonts.length >= MAX_CUSTOM_FONTS);
    list.innerHTML = fonts.map((font) => `
      <div class="custom-font-upload-item" data-font-id="${escapeHtml(font.id)}">
        <div class="custom-font-upload-item-main">
          <span class="custom-font-upload-item-name" style="font-family:'${escapeHtml(font.familyName)}', sans-serif">${escapeHtml(font.name)}</span>
          <span class="custom-font-upload-item-meta">${escapeHtml(font.fileName || "Custom font")}</span>
        </div>
        <div class="custom-font-upload-item-actions">
          <button type="button" class="custom-font-upload-use" data-font-id="${escapeHtml(font.id)}" title="Use this font" aria-label="Use ${escapeHtml(font.name)}">Use</button>
          <button type="button" class="custom-font-upload-delete" data-font-id="${escapeHtml(font.id)}" title="Remove font" aria-label="Remove ${escapeHtml(font.name)}"><i class="ri-delete-bin-line"></i></button>
        </div>
      </div>`).join("");
  }
  async handleFontUpload(fileList) {
    const file = Array.from(fileList || [])[0];
    if (!file) return;
    const current = this.settings.customFonts || [];
    if (current.length >= MAX_CUSTOM_FONTS) {
      this.showCustomToast(`Maximum of ${MAX_CUSTOM_FONTS} custom fonts reached`);
      return;
    }
    const dropzone = $id("customFontUpload");
    dropzone?.classList.add("is-uploading");
    try {
      const entry = await buildCustomFontFromFile(file);
      this.settings.customFonts = [...current, entry];
      this.settings.fontFamily = entry.id;
      this.applyFontFamily(entry.id);
      this.renderUploadedFontsList();
      this.buildFontList($id("customFontSearch")?.value);
      await this.save();
      this.showCustomToast(`Font uploaded \u2192 ${entry.name}`);
    } catch (err) {
      this.showCustomToast(err?.message || "Could not upload font", "danger");
    } finally {
      dropzone?.classList.remove("is-uploading");
      const input = $id("customFontFileInput");
      if (input) input.value = "";
    }
  }
  async removeCustomFont(id) {
    const fonts = this.settings.customFonts || [];
    const next = fonts.filter((f) => f.id !== id);
    if (next.length === fonts.length) return;
    this.settings.customFonts = next;
    if (this.settings.fontFamily === id) {
      this.settings.fontFamily = APPEARANCE_DEFAULTS.fontFamily;
      this.applyFontFamily(this.settings.fontFamily);
    }
    this.renderUploadedFontsList();
    this.buildFontList($id("customFontSearch")?.value);
    await this.save();
    this.showCustomToast("Custom font removed");
  }
  buildFontList(query) {
    const list = $id("customFontList");
    const noRes = $id("customFontNoResults");
    if (!list) return;
    list.innerHTML = "";
    const q = (query || "").toLowerCase().trim();
    let total = 0;
    getFontGroups(this.settings.customFonts).forEach((group) => {
      const filtered = group.fonts.filter(
        (f) => !q || f.name.toLowerCase().includes(q) || f.sample.toLowerCase().includes(q)
      );
      if (!filtered.length) return;
      const groupEl = document.createElement("div");
      groupEl.className = "custom-font-group-label";
      groupEl.textContent = group.group;
      list.appendChild(groupEl);
      filtered.forEach((font) => {
        total++;
        const btn = document.createElement("button");
        btn.className = "custom-font-option" + (font.id === this.settings.fontFamily ? " active" : "");
        btn.setAttribute("role", "option");
        btn.setAttribute("aria-selected", String(font.id === this.settings.fontFamily));
        btn.setAttribute("data-font-id", font.id);
        btn.innerHTML = `
          <div class="custom-font-option-left">
            <span class="custom-font-option-name">${escapeHtml(font.name)}</span>
            <span class="custom-font-option-sample" style="font-family:${font.stack}">${escapeHtml(font.sample)}</span>
          </div>
          <div class="custom-font-option-right">
            <span class="custom-font-option-tag">${font.isCustom ? "custom" : escapeHtml(font.id)}</span>
            <svg class="custom-font-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          </div>`;
        this.on(btn, "click", () => {
          this.settings.fontFamily = font.id;
          this.applyFontFamily(font.id);
          this.buildFontList($id("customFontSearch")?.value);
          this.closeFontDropdown();
          this.save();
          this.showCustomToast(`Font \u2192 ${font.name}`);
        });
        list.appendChild(btn);
      });
    });
    if (noRes) noRes.style.display = total === 0 ? "block" : "none";
  }
  openFontDropdown() {
    const wrap = $id("customFontDropdownWrap");
    const trigger = $id("customFontTrigger");
    const search = $id("customFontSearch");
    if (!wrap) return;
    wrap.classList.add("open");
    trigger?.setAttribute("aria-expanded", "true");
    this.buildFontList("");
    setTimeout(() => search?.focus(), 60);
  }
  closeFontDropdown() {
    $id("customFontDropdownWrap")?.classList.remove("open");
    $id("customFontTrigger")?.setAttribute("aria-expanded", "false");
  }
  toggleFontDropdown() {
    $id("customFontDropdownWrap")?.classList.contains("open") ? this.closeFontDropdown() : this.openFontDropdown();
  }
  syncUI() {
    document.querySelectorAll(".custom-theme-card").forEach((el) => {
      const active = el.dataset.theme === this.settings.theme;
      el.classList.toggle("active", active);
      el.setAttribute("aria-checked", String(active));
    });
    document.querySelectorAll(".custom-swatch").forEach((el) => {
      const active = el.dataset.color === this.settings.accent;
      el.classList.toggle("active", active);
      el.setAttribute("aria-checked", String(active));
    });
    document.querySelectorAll(".custom-fs-btn[data-size]").forEach((el) => {
      const active = el.dataset.size === this.settings.fontSize;
      el.classList.toggle("active", active);
      el.setAttribute("aria-checked", String(active));
    });
    document.querySelectorAll(".custom-fs-btn[data-weight]").forEach((el) => {
      const active = el.dataset.weight === this.settings.fontWeight;
      el.classList.toggle("active", active);
      el.setAttribute("aria-checked", String(active));
    });
    document.querySelectorAll(".custom-fs-btn[data-spacing]").forEach((el) => {
      const active = el.dataset.spacing === this.settings.cardSpacing;
      el.classList.toggle("active", active);
      el.setAttribute("aria-checked", String(active));
    });
    document.querySelectorAll(".custom-cr-btn").forEach((el) => {
      const active = el.dataset.radius === this.settings.cornerRadius;
      el.classList.toggle("active", active);
      el.setAttribute("aria-checked", String(active));
    });
    document.querySelectorAll(".custom-icon-size-card").forEach((el) => {
      const active = el.dataset.iconSize === this.settings.iconSize;
      el.classList.toggle("active", active);
      el.setAttribute("aria-checked", String(active));
    });
    const font = getFontById(this.settings.fontFamily, this.settings.customFonts);
    const nameEl = $id("customFontTriggerName");
    const previewEl = $id("customFontTriggerPreview");
    if (nameEl) nameEl.textContent = font.name;
    if (previewEl) {
      previewEl.textContent = font.sample;
      previewEl.style.fontFamily = font.stack;
    }
    this.renderUploadedFontsList();
  }
  showCustomToast(msg, variant = "info") {
    const wrap = $id("paCustomToastWrap");
    if (!wrap) return;
    const el = document.createElement("div");
    el.className = `pa-toast ${variant}`;
    el.innerHTML = `<i class="pa-toast-icon ri-palette-line"></i><span>${msg}</span><button class="pa-toast-close" aria-label="Dismiss"><i class="ri-close-line"></i></button>`;
    const dismiss = () => {
      el.classList.add("removing");
      setTimeout(() => el.remove(), 200);
    };
    el.querySelector(".pa-toast-close").addEventListener("click", dismiss);
    wrap.appendChild(el);
    setTimeout(() => {
      if (el.parentElement) dismiss();
    }, 2500);
  }
  togglePanel() {
    const panel = $id("paCustomPanel");
    const toggleBtn = $id("paCustomToggle") || document.querySelector(".pa-custom-toggle");
    if (!panel) return;
    if (panel.classList.contains("visible")) {
      this.closePanel();
    } else {
      closePanels();
      panel.classList.add("visible");
      $id("paPanelOverlay")?.classList.add("visible");
      toggleBtn?.classList.add("active");
      document.body.style.overflow = "hidden";
      this.syncUI();
      activateTab("custom", "theme");
      setTimeout(() => panel.querySelector("button, input, select")?.focus(), 100);
    }
  }
  closePanel() {
    $id("paCustomPanel")?.classList.remove("visible");
    $id("paPanelOverlay")?.classList.remove("visible");
    ($id("paCustomToggle") || document.querySelector(".pa-custom-toggle"))?.classList.remove("active");
    document.body.style.overflow = "";
    this.closeFontDropdown();
  }
  bindFontUploadEvents() {
    const dropzone = $id("customFontUpload");
    const fileInput = $id("customFontFileInput");
    const list = $id("customFontUploadList");
    if (!dropzone || !fileInput) return;
    this.on(dropzone, "click", (e) => {
      if (e.target.closest(".custom-font-upload-delete, .custom-font-upload-use")) return;
      if (dropzone.classList.contains("is-full")) {
        this.showCustomToast(`Maximum of ${MAX_CUSTOM_FONTS} custom fonts reached`);
        return;
      }
      fileInput.click();
    });
    this.on(dropzone, "keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        dropzone.click();
      }
    });
    this.on(fileInput, "change", (e) => this.handleFontUpload(e.target.files));
    ["dragenter", "dragover"].forEach((evt) => {
      this.on(dropzone, evt, (e) => {
        e.preventDefault();
        if (!dropzone.classList.contains("is-full")) dropzone.classList.add("dragover");
      });
    });
    ["dragleave", "drop"].forEach((evt) => {
      this.on(dropzone, evt, (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
      });
    });
    this.on(dropzone, "drop", (e) => {
      if (dropzone.classList.contains("is-full")) return;
      const files = e.dataTransfer?.files;
      if (files?.length) this.handleFontUpload(files);
    });
    if (list) {
      this.on(list, "click", (e) => {
        const useBtn = e.target.closest(".custom-font-upload-use");
        const deleteBtn = e.target.closest(".custom-font-upload-delete");
        if (useBtn) {
          const id = useBtn.dataset.fontId;
          this.settings.fontFamily = id;
          this.applyFontFamily(id);
          this.syncUI();
          this.save();
          this.showCustomToast(`Font \u2192 ${getFontById(id, this.settings.customFonts).name}`);
        } else if (deleteBtn) {
          this.removeCustomFont(deleteBtn.dataset.fontId);
        }
      });
    }
  }
  bindEvents() {
    registerPanel("paCustomPanel");
    this.bindFontUploadEvents();
    const toggleBtn = $id("paCustomToggle") || document.querySelector(".pa-custom-toggle");
    this.on(toggleBtn, "click", () => this.togglePanel());
    this.on($id("paCustomPanelClose"), "click", () => this.closePanel());
    this.on($id("paCustomCancel"), "click", () => this.closePanel());
    this.on($id("paPanelOverlay"), "click", (e) => {
      if (e.target.id === "paPanelOverlay" && $id("paCustomPanel")?.classList.contains("visible")) {
        this.closePanel();
      }
    });
    this.on(document, "keydown", (e) => {
      if (e.key === "Escape" && $id("paCustomPanel")?.classList.contains("visible")) this.closePanel();
    });
    document.querySelectorAll(".custom-theme-card").forEach((btn) => {
      this.on(btn, "click", () => {
        this.settings.theme = btn.dataset.theme;
        this.applyTheme(this.settings.theme);
        this.syncUI();
        this.save();
        this.showCustomToast(`Theme \u2192 ${this.settings.theme}`);
      });
    });
    document.querySelectorAll(".custom-swatch").forEach((btn) => {
      this.on(btn, "click", () => {
        this.settings.accent = btn.dataset.color;
        this.applyAccent(this.settings.accent);
        this.syncUI();
        this.save();
        this.showCustomToast("Accent color updated");
      });
    });
    const customPanel = $id("paCustomPanel");
    this.on(customPanel, "click", (e) => {
      const btn = e.target.closest(".custom-fs-btn");
      if (!btn || !customPanel?.contains(btn)) return;
      if (btn.dataset.size && VALID_FONT_SIZES.includes(btn.dataset.size)) {
        this.settings.fontSize = btn.dataset.size;
        this.applyFontSize(this.settings.fontSize);
        this.syncUI();
        this.save();
        this.showCustomToast(`Font size \u2192 ${this.settings.fontSize}`);
      } else if (btn.dataset.weight && VALID_FONT_WEIGHTS.includes(btn.dataset.weight)) {
        this.settings.fontWeight = btn.dataset.weight;
        this.applyFontWeight(this.settings.fontWeight);
        this.syncUI();
        this.save();
        this.showCustomToast(`Font weight \u2192 ${this.settings.fontWeight}`);
      } else if (btn.dataset.spacing && VALID_SPACINGS.includes(btn.dataset.spacing)) {
        this.settings.cardSpacing = btn.dataset.spacing;
        this.applyCardSpacing(this.settings.cardSpacing);
        this.syncUI();
        this.save();
        this.showCustomToast(`Card spacing \u2192 ${this.settings.cardSpacing}`);
      }
    });
    document.querySelectorAll(".custom-icon-size-card").forEach((btn) => {
      this.on(btn, "click", () => {
        if (!VALID_ICON_SIZES.includes(btn.dataset.iconSize)) return;
        this.settings.iconSize = btn.dataset.iconSize;
        this.applyIconSize(this.settings.iconSize);
        this.syncUI();
        this.save();
        const label = btn.dataset.iconSize.charAt(0).toUpperCase() + btn.dataset.iconSize.slice(1);
        this.showCustomToast(`Icon size \u2192 ${label}`);
      });
    });
    const radiusLabels = { "0px": "None", "5px": "Small", "14px": "Medium", "25px": "Large" };
    document.querySelectorAll(".custom-cr-btn").forEach((btn) => {
      this.on(btn, "click", () => {
        this.settings.cornerRadius = btn.dataset.radius;
        this.applyCornerRadius(this.settings.cornerRadius);
        this.syncUI();
        this.save();
        this.showCustomToast(`Corner radius \u2192 ${radiusLabels[this.settings.cornerRadius] || this.settings.cornerRadius}`);
      });
      this.on(btn, "keydown", (e) => {
        const all = [...document.querySelectorAll(".custom-cr-btn")];
        const idx = all.indexOf(btn);
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          all[(idx + 1) % all.length]?.focus();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          all[(idx - 1 + all.length) % all.length]?.focus();
        } else if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          btn.click();
        }
      });
    });
    this.on($id("customFontTrigger"), "click", () => this.toggleFontDropdown());
    this.on($id("customFontSearch"), "input", (e) => this.buildFontList(e.target.value));
    this.on(document, "click", (e) => {
      const wrap = $id("customFontDropdownWrap");
      if (wrap && !wrap.contains(e.target)) this.closeFontDropdown();
    });
    this.on($id("customFontDropdownWrap"), "keydown", (e) => {
      if (e.key === "Escape") {
        this.closeFontDropdown();
        $id("customFontTrigger")?.focus();
      }
    });
    this.on(this.systemMq, "change", () => {
      if (this.settings.theme === "system") this.applyTheme("system");
    });
    document.querySelectorAll('.pa-panel-tab[data-panel="custom"]').forEach((btn) => {
      this.on(btn, "click", () => {
        activateTab("custom", btn.dataset.tab);
        this.syncUI();
      });
    });
    const observer = new MutationObserver(() => {
      if ($id("paCustomPanel")?.classList.contains("visible")) this.syncUI();
    });
    const panel = $id("paCustomPanel");
    if (panel) observer.observe(panel, { attributes: true, attributeFilter: ["class"] });
    this._observer = observer;
  }
  destroy() {
    this._observer?.disconnect();
    super.destroy();
  }
};

// client/utils/avatar-upload.ts
async function uploadUserAvatar(file, opts = {}) {
  if (!file) return null;
  if (!handleFileValidation(file)) return null;
  const previousImg = document.querySelector("#paUserDropdownAvatar .pa-avatar img");
  const previousAvatarUrl = previousImg?.src || null;
  const previewUrl = URL.createObjectURL(file);
  previewUserAvatar(previewUrl);
  opts.onPreview?.(previewUrl);
  const avatarBtn = document.getElementById("paUserDropdownAvatar");
  avatarBtn?.classList.add("is-uploading");
  try {
    const uploaded = await uploadCmsFileWithPreview(file, {
      folder: "avatars",
      page: "shell",
      purpose: "user-avatar"
    });
    const data = await authService.updateProfile({ avatarUrl: uploaded.url });
    const profile = data?.profile ?? data;
    if (!profile || typeof profile !== "object") {
      throw new Error("Server did not return an updated profile.");
    }
    applyUserDisplay({
      fullName: profile.fullName,
      username: profile.username,
      email: profile.email,
      role: profile.role,
      avatarUrl: profile.avatarUrl
    });
    eventBus.emit("profile:updated", profile);
    showToast("Avatar updated!", "success", 2200);
    opts.onComplete?.(profile);
    return profile;
  } catch (err) {
    if (previousAvatarUrl) {
      previewUserAvatar(previousAvatarUrl);
    } else {
      try {
        const profile = await authService.getProfile();
        applyUserDisplay(profile);
      } catch {
      }
    }
    showToast(err?.message || "Could not save avatar.", "danger");
    opts.onComplete?.(null);
    return null;
  } finally {
    URL.revokeObjectURL(previewUrl);
    avatarBtn?.classList.remove("is-uploading");
  }
}

// client/modules/shell/mobileHeaderSearch.ts
var MOBILE_SEARCH_MAX = 899;
var abortController = null;
var headerTop = null;
function getSearchWrap() {
  return document.querySelector(".pa-header-top-left .pa-search, .pa-header-right .pa-search");
}
function getSearchInput() {
  return getSearchWrap()?.querySelector("input");
}
function isMobileSearchViewport() {
  return window.innerWidth <= MOBILE_SEARCH_MAX;
}
function isMobileHeaderSearchOpen() {
  return headerTop?.classList.contains("pa-header-top--search-open") ?? false;
}
function closeMobileHeaderSearch() {
  if (!headerTop) return;
  headerTop.classList.remove("pa-header-top--search-open");
  document.documentElement.classList.remove("pa-mobile-search-active");
  const toggle = document.getElementById("paMobileSearchToggle");
  toggle?.setAttribute("aria-expanded", "false");
}
function openMobileHeaderSearch() {
  const wrap = getSearchWrap();
  if (!wrap || !headerTop || !isMobileSearchViewport()) return false;
  document.getElementById("paNotifWrap")?.classList.remove("open");
  headerTop.classList.add("pa-header-top--search-open");
  document.documentElement.classList.add("pa-mobile-search-active");
  const toggle = document.getElementById("paMobileSearchToggle");
  toggle?.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => getSearchInput()?.focus());
  return true;
}
function initMobileHeaderSearch() {
  abortController?.abort();
  abortController = new AbortController();
  const { signal } = abortController;
  headerTop = document.querySelector(".pa-header-top");
  const searchWrap = getSearchWrap();
  const headerTopRight = document.querySelector(".pa-header-top-right");
  if (!headerTop || !searchWrap || !headerTopRight) {
    headerTop = null;
    return;
  }
  closeMobileHeaderSearch();
  let toggle = document.getElementById("paMobileSearchToggle");
  if (!toggle) {
    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.id = "paMobileSearchToggle";
    toggle.className = "pa-mobile-search-toggle";
    toggle.setAttribute("aria-label", "Open search");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", searchWrap.id || "paSearchWrap");
    toggle.innerHTML = '<i class="ri-search-line" aria-hidden="true"></i>';
    headerTopRight.insertBefore(toggle, headerTopRight.firstChild);
  }
  let dismiss = searchWrap.querySelector(".pa-mobile-search-dismiss");
  if (!dismiss) {
    dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "pa-mobile-search-dismiss";
    dismiss.setAttribute("aria-label", "Close search");
    dismiss.innerHTML = '<i class="ri-close-line" aria-hidden="true"></i>';
    searchWrap.appendChild(dismiss);
  }
  toggle.addEventListener("click", () => {
    if (isMobileHeaderSearchOpen()) closeMobileHeaderSearch();
    else openMobileHeaderSearch();
  }, { signal });
  dismiss.addEventListener("click", (e) => {
    e.preventDefault();
    closeMobileHeaderSearch();
  }, { signal });
  window.addEventListener("resize", () => {
    if (!isMobileSearchViewport()) closeMobileHeaderSearch();
  }, { signal });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !isMobileHeaderSearchOpen()) return;
    e.preventDefault();
    e.stopPropagation();
    closeMobileHeaderSearch();
  }, { signal, capture: true });
}

// client/modules/shell/roleAccessModal.ts
var BRIEFING_VERSION = "v1";
var STORAGE_PREFIX = "pa_role_access_briefing";
var ROLE_BRIEFINGS = {
  editor: {
    title: "Editor account",
    subtitle: "You can manage portfolio content and update selected settings.",
    icon: "ri-edit-box-line",
    allowed: [
      "View every dashboard and content page",
      "Create, edit, and delete projects, media, blog posts, and other CMS data",
      "Moderate blog comments and likes on the Comments & Likes page",
      "Update General, Notifications, Profile, and Security settings",
      "Use appearance and customization options"
    ],
    restricted: [
      "User management or adding new staff accounts",
      "System settings and database tools",
      "Admin-only sidebar links stay hidden for your role"
    ]
  },
  viewer: {
    title: "Viewer account",
    subtitle: "Your access is read-only across the portfolio dashboard.",
    icon: "ri-eye-line",
    allowed: [
      "View dashboard stats and all content pages",
      "Browse projects, media, messages, and other records",
      "Update Notifications, Profile, and Security settings",
      "Use appearance and customization options"
    ],
    restricted: [
      "Create, edit, or delete any content or records",
      "Access the Comments & Likes moderation page",
      "Dashboard add actions, bulk actions, and edit panels",
      "Changing General site settings (view only)",
      "User management and system settings"
    ]
  }
};
var bindingsReady = false;
function storageKey(userId, role) {
  return `${STORAGE_PREFIX}_${BRIEFING_VERSION}_${userId}_${role}`;
}
function hasSeenBriefing(userId, role) {
  try {
    return localStorage.getItem(storageKey(userId, role)) === "1";
  } catch {
    return false;
  }
}
function markBriefingSeen(userId, role) {
  try {
    localStorage.setItem(storageKey(userId, role), "1");
  } catch {
  }
}
function formatRoleLabel(role) {
  return (role || "staff").replace(/_/g, " ");
}
function renderList(items, variant) {
  return items.map((item) => `<li class="pa-role-access-item pa-role-access-item--${variant}">
      <i class="${variant === "allowed" ? "ri-check-line" : "ri-close-line"}" aria-hidden="true"></i>
      <span>${item}</span>
    </li>`).join("");
}
function ensureModalInDom() {
  if ($id("paRoleAccessOverlay")) return;
  const overlay = document.createElement("div");
  overlay.className = "pa-role-access-overlay";
  overlay.id = "paRoleAccessOverlay";
  overlay.hidden = true;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "paRoleAccessTitle");
  overlay.innerHTML = `
    <div class="pa-role-access-box">
      <div class="pa-role-access-head">
        <div class="pa-role-access-icon" id="paRoleAccessIcon" aria-hidden="true">
          <i class="ri-shield-user-line"></i>
        </div>
        <div>
          <div class="pa-role-access-eyebrow" id="paRoleAccessEyebrow">Account access</div>
          <div class="pa-role-access-title" id="paRoleAccessTitle">Your permissions</div>
          <div class="pa-role-access-subtitle" id="paRoleAccessSubtitle"></div>
        </div>
      </div>
      <div class="pa-role-access-body">
        <div class="pa-role-access-section">
          <div class="pa-role-access-section-title allowed"><i class="ri-check-double-line"></i> You can</div>
          <ul class="pa-role-access-list" id="paRoleAccessAllowed"></ul>
        </div>
        <div class="pa-role-access-section">
          <div class="pa-role-access-section-title restricted"><i class="ri-forbid-line"></i> You cannot</div>
          <ul class="pa-role-access-list" id="paRoleAccessRestricted"></ul>
        </div>
      </div>
      <div class="pa-role-access-foot">
        <p class="pa-role-access-note">These limits are enforced in the sidebar, settings, and API. To request a role change, open Settings \u2192 Security and use the "Request role update" form.</p>
        <button type="button" class="pa-btn pa-btn-primary w-100" id="paRoleAccessOk">Got it</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}
function bindModalEvents() {
  if (bindingsReady) return;
  bindingsReady = true;
  const overlay = $id("paRoleAccessOverlay");
  const okBtn = $id("paRoleAccessOk");
  if (!overlay || !okBtn) return;
  const close = () => {
    overlay.classList.remove("visible");
    overlay.hidden = true;
    document.body.classList.remove("pa-role-access-open");
    overlay.dataset.userId = "";
    overlay.dataset.role = "";
  };
  okBtn.addEventListener("click", () => {
    const userId = overlay.dataset.userId;
    const role = overlay.dataset.role;
    if (userId && role) markBriefingSeen(userId, role);
    close();
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("visible")) close();
  });
}
function populateModal(role) {
  const briefing = ROLE_BRIEFINGS[role];
  if (!briefing) return;
  const iconWrap = $id("paRoleAccessIcon");
  const eyebrow = $id("paRoleAccessEyebrow");
  const title = $id("paRoleAccessTitle");
  const subtitle = $id("paRoleAccessSubtitle");
  const allowed = $id("paRoleAccessAllowed");
  const restricted = $id("paRoleAccessRestricted");
  if (iconWrap) iconWrap.innerHTML = `<i class="${briefing.icon}"></i>`;
  if (eyebrow) eyebrow.textContent = `${formatRoleLabel(role)} access`;
  if (title) title.textContent = briefing.title;
  if (subtitle) subtitle.textContent = briefing.subtitle;
  if (allowed) allowed.innerHTML = renderList(briefing.allowed, "allowed");
  if (restricted) restricted.innerHTML = renderList(briefing.restricted, "restricted");
}
function openModal(userId, role) {
  ensureModalInDom();
  bindModalEvents();
  const overlay = $id("paRoleAccessOverlay");
  if (!overlay) return;
  populateModal(role);
  overlay.dataset.userId = userId;
  overlay.dataset.role = role;
  overlay.hidden = false;
  overlay.classList.add("visible");
  document.body.classList.add("pa-role-access-open");
  $id("paRoleAccessOk")?.focus();
}
async function maybeShowRoleAccessModal(profile = null) {
  if (typeof window === "undefined") return;
  if (window.location.pathname.includes("/login")) return;
  let userId = profile?.id;
  let role = profile?.role;
  if (!role || !userId) {
    try {
      const session = await authService.session();
      userId = userId || session?.user?.id;
      if (!role) {
        const loaded = await authService.getProfile().catch(() => null);
        role = loaded?.role || session?.user?.role;
        userId = userId || loaded?.id;
      }
    } catch {
      return;
    }
  }
  if (!userId || !role || !ROLE_BRIEFINGS[role]) return;
  if (hasSeenBriefing(userId, role)) return;
  requestAnimationFrame(() => {
    openModal(userId, role);
  });
}

// client/modules/shell/elevationBanner.ts
var BANNER_ID = "paElevationBanner";
var expiryTimer = null;
function clearExpiryTimer() {
  if (expiryTimer) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }
}
function formatUntil(iso) {
  try {
    return new Date(iso).toLocaleString(void 0, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}
async function refreshSessionAfterExpiry() {
  try {
    const data = await authService.session();
    const user = data?.user;
    if (user) {
      applyUserDisplay(user);
      applyRoleBasedAccess(user.role, user.capabilities);
      applyCapabilityGatedElements(user.capabilities);
    }
  } catch {
  }
  syncElevationBanner();
}
function syncElevationBanner() {
  clearExpiryTimer();
  const caps = getAccessCapabilities();
  const main = document.querySelector(".pa-main");
  if (!main) return;
  const existing = $id(BANNER_ID);
  if (!caps.isElevated || !caps.elevatedUntil) {
    existing?.remove();
    return;
  }
  let banner = existing;
  if (!banner) {
    banner = document.createElement("div");
    banner.id = BANNER_ID;
    banner.className = "pa-elevation-banner";
    banner.setAttribute("role", "status");
    main.insertBefore(banner, main.firstChild);
  }
  banner.innerHTML = `<i class="ri-shield-check-line" aria-hidden="true"></i>
    <span>Temporary <strong>editor</strong> role active until <strong>${formatUntil(caps.elevatedUntil)}</strong>, then your account reverts automatically.</span>`;
  const ms = new Date(caps.elevatedUntil).getTime() - Date.now();
  if (ms > 0 && ms < 24 * 60 * 60 * 1e3) {
    expiryTimer = setTimeout(() => {
      void refreshSessionAfterExpiry();
    }, ms + 500);
  }
}

// client/modules/shell/globalSearch.ts
var listEl = null;
var inputEl = null;
var documentClickBound = false;
function findHeaderSearchInput() {
  return document.querySelector(
    ".pa-header-top-left .pa-global-search input, .pa-header-top .pa-global-search input, .pa-header-top-left .pa-search input"
  );
}
function ensureResultsList() {
  if (!inputEl) return null;
  const wrap = inputEl.closest(".pa-search");
  if (!wrap) return null;
  let panel = wrap.querySelector(".pa-global-search-results");
  if (!panel) {
    panel = document.createElement("div");
    panel.className = "pa-global-search-results";
    panel.setAttribute("role", "listbox");
    panel.hidden = true;
    wrap.appendChild(panel);
  }
  listEl = panel;
  return panel;
}
function renderResults(results) {
  const panel = ensureResultsList();
  if (!panel) return;
  if (!results.length) {
    panel.innerHTML = '<div class="pa-global-search-empty">No matches</div>';
    panel.hidden = false;
    return;
  }
  panel.innerHTML = results.map(
    (item) => `<a class="pa-global-search-item" role="option" href="${item.href}">
        <span class="pa-global-search-item-title">${item.title}</span>
        <span class="pa-global-search-item-meta">${item.type}${item.subtitle ? ` \xB7 ${item.subtitle}` : ""}</span>
      </a>`
  ).join("");
  panel.hidden = false;
}
async function runSearch(query) {
  const q = query.trim();
  if (q.length < 2) {
    if (listEl) listEl.hidden = true;
    return;
  }
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=12`, {
      credentials: "same-origin"
    });
    if (!res.ok) return;
    const data = await res.json();
    renderResults(data.results || []);
  } catch {
  }
}
var debouncedSearch = debounce((value) => {
  void runSearch(value);
}, 280);
function ensureHeaderSearchInput() {
  const left = document.querySelector(".pa-header-top-left");
  if (!left || left.querySelector(".pa-search input")) return;
  const wrap = document.createElement("div");
  wrap.id = "paGlobalSearchWrap";
  wrap.className = "pa-search pa-global-search";
  wrap.innerHTML = '<i class="ri-search-line" aria-hidden="true"></i><input type="search" placeholder="Search CMS\u2026" aria-label="Search CMS">';
  left.appendChild(wrap);
}
function bindDocumentDismiss() {
  if (documentClickBound) return;
  documentClickBound = true;
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!inputEl?.closest(".pa-search")?.contains(target) && listEl && !listEl.contains(target)) {
      listEl.hidden = true;
    }
  });
}
function bindSearchInput(input) {
  inputEl = input;
  if (input.dataset.paGlobalSearchBound === "1") return;
  input.dataset.paGlobalSearchBound = "1";
  input.setAttribute("autocomplete", "off");
  input.addEventListener("input", () => debouncedSearch(input.value || ""));
  input.addEventListener("focus", () => {
    if ((input.value || "").trim().length >= 2) debouncedSearch(input.value || "");
  });
}
function getGlobalSearchInput() {
  ensureHeaderSearchInput();
  return findHeaderSearchInput();
}
function focusGlobalSearch() {
  const input = getGlobalSearchInput();
  if (!input) return false;
  bindSearchInput(input);
  input.focus();
  return true;
}
function initGlobalSearch() {
  ensureHeaderSearchInput();
  bindDocumentDismiss();
  const input = findHeaderSearchInput();
  if (!input) return;
  bindSearchInput(input);
}

// client/modules/shell/ShellModule.ts
var ShellModule = class extends Module {
  constructor() {
    super({ name: "Shell" });
    this._sessionExpiryTimer = null;
    this.customization = new CustomizationModule();
    this.addUser = new AddUserManager({
      on: this.on.bind(this),
      closeUserMenu: () => {
        this._userMenuWrap?.classList.remove("open");
        $id("paUserMenu")?.setAttribute("aria-expanded", "false");
      }
    });
  }
  async init() {
    initConfirmDialog();
    this.bindEvents();
    this.addUser.bindEvents();
    this.onBus("profile:updated", (profile) => {
      applyUserDisplay(profile);
      applyRoleBasedAccess(profile?.role);
      this.addUser.setProfileRole(profile?.role);
    });
    await Promise.all([
      this.loadUserSession(),
      this.customization.init(),
      loadNotifications({ force: true })
    ]);
    renderNotifications();
    initSettingsNav();
    initSidebarGroupNav();
    initSidebarCollapse();
    initGlobalSearch();
  }
  async loadUserSession() {
    try {
      const { user, sessionExpiresAt } = await authService.session();
      if (!user) return;
      this.scheduleSessionExpiry(sessionExpiresAt);
      try {
        const profile = await authService.getProfile();
        applyUserDisplay({
          fullName: profile.fullName,
          username: profile.username,
          email: profile.email || user.email,
          role: profile.role || user.role,
          avatarUrl: profile.avatarUrl
        });
        applyRoleBasedAccess(profile.role || user.role, user.capabilities);
        syncElevationBanner();
        storage.reconcileRecentActivitiesScope({
          user: { id: profile.id || user.id, capabilities: user.capabilities }
        });
        this.addUser.setProfileRole(profile.role || user.role);
        void maybeShowRoleAccessModal({
          id: profile.id || user.id,
          role: profile.role || user.role
        });
      } catch {
        applyUserDisplay(user);
        applyRoleBasedAccess(user.role, user.capabilities);
        syncElevationBanner();
        storage.reconcileRecentActivitiesScope({ user });
        this.addUser.setProfileRole(user.role);
        void maybeShowRoleAccessModal({ id: user.id, role: user.role });
      }
    } catch (err) {
      console.warn("[Shell] session load failed:", err);
    }
  }
  scheduleSessionExpiry(sessionExpiresAt) {
    if (this._sessionExpiryTimer) {
      window.clearTimeout(this._sessionExpiryTimer);
      this._sessionExpiryTimer = null;
    }
    if (!sessionExpiresAt) return;
    const ms = new Date(sessionExpiresAt).getTime() - Date.now();
    if (ms <= 0) {
      void this.expireSessionNow();
      return;
    }
    this._sessionExpiryTimer = window.setTimeout(() => {
      void this.expireSessionNow();
    }, ms);
  }
  async expireSessionNow() {
    try {
      await authService.logout();
    } catch {
    }
    window.location.assign(`${getLoginPath()}?session=expired`);
  }
  bindEvents() {
    const sidebar = $id("paSidebar");
    const overlay = $id("paSidebarOverlay");
    const toggle = $id("paMobileToggle");
    const closeMobileSidebar = () => {
      sidebar?.classList.remove("mobile-open");
      overlay?.classList.remove("visible");
    };
    this._closeMobileSidebar = closeMobileSidebar;
    this.on(toggle, "click", () => {
      sidebar?.classList.add("mobile-open");
      overlay?.classList.add("visible");
    });
    this.on(overlay, "click", closeMobileSidebar);
    const handleNavSelection = (item) => {
      const href = item.getAttribute("href");
      if (href === "#") return;
      document.querySelectorAll(".pa-nav-subitem").forEach((i) => i.classList.remove("active"));
      document.querySelectorAll(".pa-nav-toggle").forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      closeMobileSidebar();
    };
    document.querySelectorAll(".pa-nav-subitem[data-nav], .pa-nav-subitem[data-settings-tab]").forEach((item) => {
      this.on(item, "click", (e) => {
        if (item.getAttribute("href") === "#") e.preventDefault();
        handleNavSelection(item);
      });
    });
    const userMenuWrap = $id("paUserMenuWrap");
    const userMenuBtn = $id("paUserMenu");
    this._userMenuWrap = userMenuWrap;
    if (userMenuBtn && userMenuWrap) {
      this.on(userMenuBtn, "click", (e) => {
        e.stopPropagation();
        const isOpen = userMenuWrap.classList.toggle("open");
        userMenuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        if (isOpen) notifWrap?.classList.remove("open");
      });
      this.on(userMenuBtn, "keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const isOpen = userMenuWrap.classList.toggle("open");
          userMenuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        }
      });
    }
    this.bindHeaderAvatarUpload();
    const userDropdownLogout = $id("paUserDropdownLogout");
    if (userDropdownLogout) {
      this.on(userDropdownLogout, "click", (e) => {
        e.stopPropagation();
        userMenuWrap?.classList.remove("open");
        userMenuBtn?.setAttribute("aria-expanded", "false");
        this.handleLogout();
      });
    }
    const logoutBtn = $id("paLogoutBtn");
    if (logoutBtn) {
      this.on(logoutBtn, "click", () => this.handleLogout());
    }
    const notifWrap = $id("paNotifWrap");
    const notifBtn = $id("paNotifBtn");
    this._notifWrap = notifWrap;
    if (notifBtn && notifWrap) {
      this.on(notifBtn, "click", (e) => {
        e.stopPropagation();
        const opening = !notifWrap.classList.contains("open");
        notifWrap.classList.toggle("open");
        if (notifWrap.classList.contains("open")) {
          userMenuWrap?.classList.remove("open");
          userMenuBtn?.setAttribute("aria-expanded", "false");
          if (opening) void loadNotifications({ force: true });
        }
      });
      this.on(notifBtn, "keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const opening = !notifWrap.classList.contains("open");
          notifWrap.classList.toggle("open");
          if (opening) void loadNotifications({ force: true });
        }
      });
      this.on($id("paNotifClearBtn"), "click", (e) => {
        e.stopPropagation();
        if (!getAccessCapabilities().canClearAllNotifications) {
          showToast("You do not have permission to clear notifications.", "warning", 2200);
          return;
        }
        void clearNotifications().then(() => {
          showToast("Notifications cleared", "info", 1800);
        }).catch((err) => {
          showToast(err?.message || "Could not clear notifications.", "danger", 2200);
        });
      });
      const notifList = $id("paNotifList");
      if (notifList) {
        this.on(notifList, "click", (e) => {
          const item = e.target.closest("[data-notif-id]");
          if (!item) return;
          const id = item.dataset.notifId;
          const link = item.dataset.notifLink;
          void markNotificationRead(id).then(() => {
            if (link) window.location.href = link;
          });
        });
      }
    }
    this.onBus("notifications:updated", () => {
      renderNotifications();
    });
    this.onBus("storage:invalidated", (key) => {
      if (key === "pa_notifications" || key === "pa_recent_activities") {
        void loadNotifications({ silent: true });
      }
    });
    this.on(document, "click", (e) => {
      if (notifWrap && !notifWrap.contains(e.target)) notifWrap.classList.remove("open");
      if (userMenuWrap && !userMenuWrap.contains(e.target)) {
        if (!userMenuWrap.classList.contains("pa-user-menu--locked")) {
          userMenuWrap.classList.remove("open");
          userMenuBtn?.setAttribute("aria-expanded", "false");
        }
      }
      if (!e.target.closest(".pa-card-actions, .pa-lv-more-wrap, .pa-lv-actions, .pa-cat-card__list-actions, .pa-cat-card__footer-more, .pa-proj-card__head-more, .pa-proj-card__list-more, .pa-proj-card__list-actions, .pa-media-card__thumb-more, .pa-media-card__footer-more, .pa-media-card__list-more, .pa-media-card__list-actions")) closeAllCardMenus();
    });
    this.on(document, "keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key?.toLowerCase() === "k") {
        e.preventDefault();
        if (window.innerWidth <= 899) {
          if (!openMobileHeaderSearch()) focusGlobalSearch();
        } else {
          focusGlobalSearch();
        }
      }
      if (e.key === "Escape") {
        if (isMobileHeaderSearchOpen()) {
          closeMobileHeaderSearch();
        } else if (isConfirmOpen()) {
          closeConfirm();
        } else if ($id("paBulkConfirmOverlay")?.classList.contains("visible")) {
          eventBus.emit("bulk-confirm:close");
        } else if (anyPanelOpen()) {
          closePanels();
        } else {
          closeAllCardMenus();
          notifWrap?.classList.remove("open");
          userMenuWrap?.classList.remove("open");
          userMenuBtn?.setAttribute("aria-expanded", "false");
          closeMobileSidebar();
        }
      }
      if (e.key?.toLowerCase() === "n" && !anyPanelOpen() && !document.activeElement.matches("input, textarea, select, [contenteditable]")) {
        eventBus.emit("shortcut:new-item", { page: PAGE });
      }
    });
  }
  bindHeaderAvatarUpload() {
    const avatarBtn = $id("paUserDropdownAvatar");
    const userMenuWrap = this._userMenuWrap || $id("paUserMenuWrap");
    const userMenuBtn = $id("paUserMenu");
    if (!avatarBtn) return;
    let avatarInput = $id("paHeaderAvatarInput");
    if (!avatarInput) {
      avatarInput = document.createElement("input");
      avatarInput.type = "file";
      avatarInput.id = "paHeaderAvatarInput";
      avatarInput.accept = "image/png,image/jpeg,image/webp";
      avatarInput.hidden = true;
      document.body.appendChild(avatarInput);
    }
    const lockMenu = () => {
      userMenuWrap?.classList.add("pa-user-menu--locked", "open");
      userMenuBtn?.setAttribute("aria-expanded", "true");
    };
    const unlockMenu = (closeAfter = false) => {
      userMenuWrap?.classList.remove("pa-user-menu--locked");
      if (closeAfter) {
        userMenuWrap?.classList.remove("open");
        userMenuBtn?.setAttribute("aria-expanded", "false");
      }
    };
    this.on(avatarBtn, "click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      lockMenu();
      avatarInput.click();
    });
    this.on(avatarInput, "cancel", () => {
      unlockMenu(false);
      avatarInput.value = "";
    });
    this.on(window, "focus", () => {
      if (!userMenuWrap?.classList.contains("pa-user-menu--locked")) return;
      window.setTimeout(() => {
        if (!avatarInput.files?.length && !avatarBtn.classList.contains("is-uploading")) {
          unlockMenu(false);
        }
      }, 280);
    });
    this.on(avatarInput, "change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) {
        unlockMenu(false);
        e.target.value = "";
        return;
      }
      lockMenu();
      await uploadUserAvatar(file, {
        onComplete: (profile) => unlockMenu(!!profile)
      });
      e.target.value = "";
    });
  }
  handleLogout() {
    requestLogout(async () => {
      showToast("Logging out...", "info", 1500);
      try {
        await authService.logout();
      } catch (err) {
        console.warn("[Shell] logout failed:", err);
      }
      try {
        await storage.clearPersistentCache();
      } catch (err) {
        console.warn("[Shell] cache clear failed:", err);
      }
      window.location.href = getLoginPath();
    });
  }
  destroy() {
    this.customization.destroy();
    super.destroy();
  }
};

// client/modules/shell/sidebarRailNav.ts
var ROUTE_RAIL = [
  ["/settings", "settings"],
  ["/tool-categories", "tools"],
  ["/technologies", "tools"],
  ["/tools", "tools"],
  ["/blog-categories", "content"],
  ["/blog-engagement", "content"],
  ["/blog-tags", "content"],
  ["/blog-post", "content"],
  ["/testimonials", "content"],
  ["/experience", "content"],
  ["/media-library", "content"],
  ["/project-technologies", "projects"],
  ["/project-tags", "projects"],
  ["/project-categories", "projects"],
  ["/categories", "projects"],
  ["/tags", "projects"],
  ["/projects", "projects"],
  ["/recent-activities", "home"],
  ["/contact-messages", "home"],
  ["/access-requests", "home"],
  ["/users", "home"]
];
var ROUTE_RAIL_SORTED = [...ROUTE_RAIL].sort((a, b) => b[0].length - a[0].length);
function resolveRailSection(path = window.location.pathname) {
  if (path === "/" || path === "") return "home";
  for (const [needle, section] of ROUTE_RAIL_SORTED) {
    if (path.includes(needle)) return section;
  }
  return "home";
}
function getNavGroup(section) {
  return document.querySelector(`.pa-nav-group[data-nav-group="${section}"]`);
}
function syncSidebarRailActive() {
  const section = resolveRailSection();
  document.querySelectorAll(".pa-rail-btn[data-rail-target]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.railTarget === section);
  });
}
function setGroupExpanded(group, open) {
  if (!group) return;
  group.classList.add("pa-nav-anim-ready");
  group.classList.toggle("open", open);
  group.querySelector(":scope > .pa-nav-parent-row .pa-nav-toggle")?.setAttribute("aria-expanded", open ? "true" : "false");
}
function toggleNavGroup(section) {
  const group = getNavGroup(section);
  if (!group) return;
  if (isSidebarCollapsedDesktop()) {
    const flyout = document.getElementById("paNavFlyout");
    if (flyout?.classList.contains("visible") && group.classList.contains("flyout-open")) {
      hideNavFlyout();
      return;
    }
    showNavFlyout(group);
    return;
  }
  hideNavFlyout();
  const nextOpen = !group.classList.contains("open");
  setGroupExpanded(group, nextOpen);
  if (nextOpen) {
    group.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}
var railBound = false;
function initSidebarRailNav() {
  syncSidebarRailActive();
  if (railBound) return;
  railBound = true;
  document.querySelectorAll(".pa-rail-btn[data-rail-target]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const section = btn.dataset.railTarget;
      if (!section) return;
      toggleNavGroup(section);
      syncSidebarRailActive();
    });
  });
  window.addEventListener("popstate", syncSidebarRailActive);
}

// client/modules/shell/sidebarNav.ts
var NAV_BY_PATH = [
  ["/tool-categories", "Tool Categories"],
  ["/recent-activities", "Recent Activities"],
  ["/access-requests", "Access Requests"],
  ["/users", "Users"],
  ["/contact-messages", "Contact Messages"],
  ["/media-library", "Media Library"],
  ["/technologies", "Technologies"],
  ["/blog-categories", "Blog Categories"],
  ["/project-categories", "Project Categories"],
  ["/categories", "Project Categories"],
  ["/project-technologies", "Project Technologies"],
  ["/project-tags", "Project Tags"],
  ["/blog-tags", "Blog Tags"],
  ["/blog-engagement", "Comments & Likes"],
  ["/blog-post", "Blog Posts"],
  ["/testimonials", "Testimonials"],
  ["/experience", "Experience"],
  ["/tags", "Project Tags"],
  ["/projects", "Projects"],
  ["/settings", "Settings"],
  ["/tools", "Tools"]
];
var NAV_BY_PATH_SORTED = [...NAV_BY_PATH].sort((a, b) => b[0].length - a[0].length);
function resolveActiveNav(path = window.location.pathname) {
  if (path === "/" || path === "") return "Dashboard";
  for (const [needle, label] of NAV_BY_PATH_SORTED) {
    if (path.includes(needle)) return label;
  }
  return null;
}
function syncSidebarActiveNav() {
  const active = resolveActiveNav();
  if (!active) return;
  document.querySelectorAll(".pa-nav-subitem[data-nav]").forEach((item) => {
    item.classList.toggle("active", item.dataset.nav === active);
  });
  if (active === "Settings" && window.location.pathname.includes("/settings")) {
    const tab = getSettingsTabFromPath();
    document.querySelectorAll(".pa-nav-subitem[data-settings-tab]").forEach((item) => {
      item.classList.toggle("active", item.dataset.settingsTab === tab);
    });
  } else {
    document.querySelectorAll(".pa-nav-subitem[data-settings-tab]").forEach((item) => {
      item.classList.remove("active");
    });
  }
  syncSidebarGroupNav();
  syncSidebarRailActive();
}
var sidebarNavBound = false;
function bindSidebarPrefetch() {
  const warm = typeof window.__paWarmPrefetchPath === "function" ? window.__paWarmPrefetchPath : null;
  if (!warm) return;
  document.querySelectorAll(".pa-nav-subitem[href], .pa-logo-link[href]").forEach((link) => {
    link.addEventListener("pointerenter", () => {
      const href = link.getAttribute("href");
      if (href) warm(href);
    }, { passive: true });
  });
}
function initSidebarNav() {
  syncSidebarActiveNav();
  if (!sidebarNavBound) {
    window.addEventListener("popstate", syncSidebarActiveNav);
    bindSidebarPrefetch();
    sidebarNavBound = true;
  }
}

// client/utils/appearanceApply.ts
function loadLocalAppearance() {
  return readAppearanceCache() ?? { ...APPEARANCE_DEFAULTS };
}
async function initAuthAppearance() {
  try {
    const settings = loadLocalAppearance();
    applyAppearanceSettings(settings);
    const { updateFaviconFromAppearance } = await import("./chunks/favicon-IB7JJT52.js");
    updateFaviconFromAppearance(settings);
  } catch {
  }
}

// client/utils/collapse-motion.ts
var PA_COLLAPSE_DURATION = 0.45;
var PA_COLLAPSE_EASE = [0.22, 1, 0.36, 1];
var animateDomKeyframes = animate;
var BOUND = "data-pa-collapse-bound";
var ANIMATING = "data-pa-collapse-animating";
function measureCollapsePanel(panel) {
  const prevHeight = panel.style.height;
  const prevOverflow = panel.style.overflow;
  const prevDisplay = panel.style.display;
  panel.style.height = "auto";
  panel.style.overflow = "hidden";
  panel.style.display = "block";
  const h = panel.scrollHeight;
  panel.style.height = prevHeight;
  panel.style.overflow = prevOverflow;
  panel.style.display = prevDisplay;
  return h;
}
function clearCollapseInlineStyles(panel) {
  panel.style.removeProperty("height");
  panel.style.removeProperty("max-height");
  panel.style.removeProperty("opacity");
  panel.style.removeProperty("overflow");
  panel.style.removeProperty("overflow-y");
  panel.style.removeProperty("pointer-events");
}
async function animateCollapsePanel(panel, open) {
  if (panel.classList.contains("pa-collapse-panel--dropdown")) {
    panel.classList.toggle("is-pa-collapse-open", open);
    return;
  }
  if (prefersReducedMotion()) {
    panel.classList.toggle("is-pa-collapse-open", open);
    clearCollapseInlineStyles(panel);
    return;
  }
  panel.classList.add("is-pa-collapse-animating");
  panel.style.overflow = "hidden";
  if (open) {
    const target = measureCollapsePanel(panel);
    panel.style.opacity = "0";
    panel.style.height = "0px";
    const keyframes = {
      height: ["0px", `${target}px`],
      opacity: [0, 1]
    };
    const controls = animateDomKeyframes(panel, keyframes, {
      duration: PA_COLLAPSE_DURATION,
      easing: PA_COLLAPSE_EASE
    });
    await controls.finished;
  } else {
    const current = panel.getBoundingClientRect().height || measureCollapsePanel(panel);
    const keyframes = {
      height: [`${current}px`, "0px"],
      opacity: [1, 0]
    };
    const controls = animateDomKeyframes(panel, keyframes, {
      duration: PA_COLLAPSE_DURATION,
      easing: PA_COLLAPSE_EASE
    });
    await controls.finished;
  }
  clearCollapseInlineStyles(panel);
  panel.classList.remove("is-pa-collapse-animating");
  panel.classList.toggle("is-pa-collapse-open", open);
}
function resolvePanel(root, explicit) {
  if (explicit) return explicit;
  return root.querySelector("[data-pa-collapse-panel], .pa-collapse-panel");
}
function isRootOpen(root, closedClass, inverted) {
  const hasClosed = root.classList.contains(closedClass);
  return inverted ? hasClosed : !hasClosed;
}
function setRootOpen(root, closedClass, inverted, open) {
  if (inverted) {
    root.classList.toggle(closedClass, open);
  } else {
    root.classList.toggle(closedClass, !open);
  }
  root.dataset.paCollapseOpen = open ? "true" : "false";
}
async function openRootCollapse(root, panel, closedClass, inverted) {
  if (root.getAttribute(ANIMATING) === "1") return;
  root.setAttribute(ANIMATING, "1");
  setRootOpen(root, closedClass, inverted, true);
  try {
    await animateCollapsePanel(panel, true);
    panel.classList.add("is-pa-collapse-reveal");
  } finally {
    root.removeAttribute(ANIMATING);
  }
}
async function closeRootCollapse(root, panel, closedClass, inverted) {
  if (root.getAttribute(ANIMATING) === "1") return;
  root.setAttribute(ANIMATING, "1");
  panel.classList.remove("is-pa-collapse-reveal");
  try {
    await animateCollapsePanel(panel, false);
    setRootOpen(root, closedClass, inverted, false);
  } finally {
    root.removeAttribute(ANIMATING);
  }
}
function bindRootCollapse(root) {
  if (root.getAttribute(BOUND) === "1") return;
  const panel = resolvePanel(root);
  const trigger = root.querySelector("[data-pa-collapse-trigger], .pa-collapse-trigger");
  if (!panel || !trigger) return;
  root.setAttribute(BOUND, "1");
  root.classList.add("pa-collapse-root");
  panel.classList.add("pa-collapse-panel");
  if (!panel.hasAttribute("data-pa-collapse-panel")) {
    panel.setAttribute("data-pa-collapse-panel", "");
  }
  const closedClass = root.dataset.paCollapseClass || "is-collapsed";
  const inverted = root.hasAttribute("data-pa-collapse-inverted");
  const open = isRootOpen(root, closedClass, inverted);
  panel.classList.toggle("is-pa-collapse-open", open);
  if (open) panel.classList.add("is-pa-collapse-reveal");
  trigger.addEventListener("click", (e) => {
    if (trigger.tagName !== "BUTTON" && trigger.tagName !== "A") e.preventDefault();
    const expanded = isRootOpen(root, closedClass, inverted);
    if (expanded) {
      void closeRootCollapse(root, panel, closedClass, inverted).then(() => {
        trigger.setAttribute("aria-expanded", "false");
      });
    } else {
      void openRootCollapse(root, panel, closedClass, inverted).then(() => {
        trigger.setAttribute("aria-expanded", "true");
      });
    }
  });
}
function bindDetailsCollapse(details) {
  if (details.getAttribute(BOUND) === "1") return;
  const summary = details.querySelector("summary");
  const panel = details.querySelector("[data-pa-collapse-panel], .pa-collapse-panel") ?? (summary?.nextElementSibling instanceof HTMLElement ? summary.nextElementSibling : null);
  if (!summary || !panel) return;
  details.setAttribute(BOUND, "1");
  details.classList.add("pa-collapse-details", "pa-collapse-root");
  panel.classList.add("pa-collapse-panel");
  if (!panel.hasAttribute("data-pa-collapse-panel")) {
    panel.setAttribute("data-pa-collapse-panel", "");
  }
  panel.classList.toggle("is-pa-collapse-open", details.open);
  if (details.open) panel.classList.add("is-pa-collapse-reveal");
  summary.addEventListener("click", (e) => {
    e.preventDefault();
    if (details.getAttribute(ANIMATING) === "1") return;
    if (details.open) {
      void (async () => {
        details.setAttribute(ANIMATING, "1");
        panel.classList.remove("is-pa-collapse-reveal");
        try {
          await animateCollapsePanel(panel, false);
          details.removeAttribute("open");
        } finally {
          details.removeAttribute(ANIMATING);
        }
      })();
    } else {
      void (async () => {
        details.setAttribute(ANIMATING, "1");
        details.setAttribute("open", "");
        try {
          await animateCollapsePanel(panel, true);
          panel.classList.add("is-pa-collapse-reveal");
        } finally {
          details.removeAttribute(ANIMATING);
        }
      })();
    }
  });
}
function canQueryDescendants(node) {
  return typeof node.querySelectorAll === "function";
}
function scanCollapseRoots(root) {
  if (root instanceof HTMLElement && root.matches("[data-pa-collapse]")) {
    bindRootCollapse(root);
  }
  if (!canQueryDescendants(root)) return;
  root.querySelectorAll("[data-pa-collapse]").forEach(bindRootCollapse);
  root.querySelectorAll('details:not([data-pa-collapse="off"])').forEach(bindDetailsCollapse);
}
var observerStarted = false;
var collapseMutationObserver = null;
function startCollapseObserver() {
  if (observerStarted || typeof document === "undefined") return;
  observerStarted = true;
  collapseMutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          scanCollapseRoots(node);
        }
      });
    }
  });
  collapseMutationObserver.observe(document.documentElement, { childList: true, subtree: true });
}
function initCollapseMotion(root = document) {
  scanCollapseRoots(root);
  startCollapseObserver();
}

// client/utils/focusMain.ts
function focusMainContent() {
  if (typeof document === "undefined") return;
  const main = document.getElementById("pa-main-content") || document.querySelector("main") || document.querySelector(".pa-main");
  if (main) {
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    main.focus({ preventScroll: true });
  }
}

// client/main.ts
var AUTH_PAGES = /* @__PURE__ */ new Set(["login", "forgot-password", "reset-password"]);
var PREFETCH_BY_PAGE = window.__paPrefetchConfig?.PAGE_KEYS || {};
async function loadPageModuleClass(page) {
  switch (page) {
    case "dashboard":
      return (await import("./chunks/DashboardModule-MVYIMSR4.js")).DashboardModule;
    case "projects":
      return (await import("./chunks/ProjectsModule-52AIFJG6.js")).ProjectsModule;
    case "categories":
      return (await import("./chunks/CategoriesModule-KAPUMWGN.js")).CategoriesModule;
    case "project-tags":
    case "tags":
      return (await import("./chunks/TagsModule-HQYBZ6GT.js")).TagsModule;
    case "project-technologies":
      return (await import("./chunks/ProjectTechnologiesModule-ZBAPLBI3.js")).ProjectTechnologiesModule;
    case "blog-tags":
      return (await import("./chunks/BlogTagsModule-SZ45EE5X.js")).BlogTagsModule;
    case "technologies":
      return (await import("./chunks/TechnologiesModule-C3RUHXME.js")).TechnologiesModule;
    case "tool-categories":
      return (await import("./chunks/ToolCategoriesModule-OON2LXFJ.js")).ToolCategoriesModule;
    case "blog-categories":
      return (await import("./chunks/BlogCategoriesModule-E7MCZKVN.js")).BlogCategoriesModule;
    case "tools":
      return (await import("./chunks/ToolsModule-QMZ5G3ZA.js")).ToolsModule;
    case "media":
      return (await import("./chunks/MediaModule-OBLBN662.js")).MediaModule;
    case "testimonials":
      return (await import("./chunks/TestimonialsModule-JPGWBESA.js")).TestimonialsModule;
    case "blogposts":
      return (await import("./chunks/BlogModule-AVOX43RC.js")).BlogModule;
    case "experience":
      return (await import("./chunks/ExperienceModule-KE4E6ZO7.js")).ExperienceModule;
    case "contact-messages":
      return (await import("./chunks/ContactMessagesModule-M4W6YCGZ.js")).ContactMessagesModule;
    case "blog-engagement":
      return (await import("./chunks/BlogEngagementModule-BNNEEQEY.js")).BlogEngagementModule;
    case "access-requests":
      return (await import("./chunks/AccessRequestsModule-DASWSRBT.js")).AccessRequestsModule;
    case "users":
      return (await import("./chunks/UsersModule-N55E7BPE.js")).UsersModule;
    case "recent-activities":
      return (await import("./chunks/RecentActivitiesModule-5V5UJYHG.js")).RecentActivitiesModule;
    case "settings":
      return (await import("./chunks/SettingsModule-SM4XRDZ3.js")).SettingsModule;
    case "login":
      return (await import("./chunks/LoginModule-4H7EA2FW.js")).LoginModule;
    case "forgot-password":
      return (await import("./chunks/ForgotPasswordModule-2BF2VNUJ.js")).ForgotPasswordModule;
    case "reset-password":
      return (await import("./chunks/ResetPasswordModule-I5I7NU6H.js")).ResetPasswordModule;
    default:
      return null;
  }
}
var activePageModule = null;
var shellInstance = null;
var bootPromise = null;
var appChromeInitialized = false;
function bindGlobalPanelChrome() {
  initUserCredentialsPanel();
  initStaffInviteLinkModal();
  $all(".pa-panel-tab").forEach((btn) => {
    if (!(btn instanceof HTMLElement)) return;
    btn.addEventListener("click", () => {
      activateTab(btn.dataset.panel, btn.dataset.tab);
    });
  });
  $id("paPanelOverlay")?.addEventListener("click", (e) => {
    if (e.target instanceof HTMLElement && e.target.id === "paPanelOverlay") closePanels();
  });
}
var quickAddModule = null;
async function bindQuickAddButton(pageModule) {
  if (quickAddModule) return;
  const { QuickAddModule } = await import("./chunks/QuickAddModule-KEQL5CHN.js");
  quickAddModule = new QuickAddModule(pageModule);
  quickAddModule.bindEvents();
}
async function initPageModule(pageModule) {
  await pageModule.load();
  bodyLoader.end();
  bodyLoader.reset();
  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      pageModule.render();
      pageModule.bindEvents();
      applyCapabilityGatedElements(getAccessCapabilities());
      resolve();
    });
  });
}
async function ensureShell() {
  if (!shellInstance) {
    shellInstance = new ShellModule();
    await shellInstance.init().catch((err) => {
      console.warn("[main] shell init failed:", err);
    });
  }
}
function initAppChrome() {
  if (appChromeInitialized) {
    initSettingsNav();
    syncSidebarActiveNav();
    return;
  }
  appChromeInitialized = true;
  initSettingsNav();
  initSidebarNav();
  initSidebarGroupNav();
  initSidebarRailNav();
  initSidebarCollapse();
  initMobileHeaderSearch();
}
async function bootAuthPage(ModuleClass, page) {
  document.documentElement.classList.add("pa-auth-route");
  clearDomCache();
  initConfirmDialog();
  await initAuthAppearance();
  const pageModule = new ModuleClass();
  await pageModule.load();
  pageModule.render();
  pageModule.bindEvents();
  activePageModule = pageModule;
  window.__paDebug = { pageModule, page };
}
async function bootAppPage(ModuleClass, page) {
  bodyLoader.mount();
  bodyLoader.begin("Loading your data\u2026");
  const prefetchKeys = PREFETCH_BY_PAGE[page];
  if (prefetchKeys?.length) {
    await storage.hydrateFromPersistentCache(prefetchKeys);
    storage.prefetch(prefetchKeys);
  }
  clearDomCache();
  initConfirmDialog();
  const pageModule = new ModuleClass();
  const bootstrapPending = storage.isBootstrapPending();
  await ensureShell();
  await initPageModule(pageModule);
  initAllPaSelects();
  initCollapseMotion();
  bindGlobalPanelChrome();
  if (page === "dashboard") void bindQuickAddButton(pageModule);
  initAppChrome();
  activePageModule = pageModule;
  window.__paDebug = { pageModule, page };
  focusMainContent();
  if (bootstrapPending) {
    void storage.waitForBootstrap().then(() => {
      if (activePageModule === pageModule && typeof pageModule.render === "function") {
        pageModule.render();
        applyCapabilityGatedElements(getAccessCapabilities());
      }
    });
  }
}
async function runBoot() {
  bootstrapAppearanceFromCache();
  initPasswordToggles();
  const page = getCurrentPage();
  const ModuleClass = await loadPageModuleClass(page);
  if (!ModuleClass) {
    console.warn(`[main] no module registered for page "${page}"`);
    bodyLoader.reset();
    return;
  }
  try {
    if (AUTH_PAGES.has(page)) {
      await bootAuthPage(ModuleClass, page);
    } else {
      await bootAppPage(ModuleClass, page);
    }
  } catch (err) {
    if (!AUTH_PAGES.has(page)) {
      bodyLoader.end();
      bodyLoader.reset();
    }
    throw err;
  }
}
function teardownPortfolioApp() {
  if (activePageModule?.destroy) {
    try {
      activePageModule.destroy();
    } catch (err) {
      console.warn("[main] page teardown failed:", err);
    }
  }
  activePageModule = null;
  quickAddModule = null;
  if (shellInstance) {
    shellInstance.destroy();
    shellInstance = null;
    appChromeInitialized = false;
  }
  clearDomCache();
  bodyLoader.reset();
  closePanels();
}
function bootPortfolioApp() {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    teardownPortfolioApp();
    window.__paBooted = true;
    if (typeof window.__paStartPrefetch === "function") {
      window.__paStartPrefetch(window.location.pathname);
    }
    await runBoot();
  })().catch((err) => {
    window.__paBooted = false;
    bodyLoader.reset();
    console.error("[main] fatal error during boot:", err);
    throw err;
  }).finally(() => {
    bootPromise = null;
  });
  return bootPromise;
}
window.__paBootPortfolioApp = bootPortfolioApp;
window.__paTeardownPortfolioApp = teardownPortfolioApp;
export {
  bootPortfolioApp,
  teardownPortfolioApp
};
//# sourceMappingURL=main.js.map
