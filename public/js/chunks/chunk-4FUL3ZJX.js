import {
  $,
  $all,
  $id,
  escapeHtml,
  showStatusToast,
  showToast
} from "./chunk-IC6SRMKJ.js";

// client/core/EventBus.ts
var EventBus = class {
  constructor() {
    this._listeners = /* @__PURE__ */ new Map();
    this._owners = /* @__PURE__ */ new Map();
  }
  /**
   * Subscribe to an event.
   * @param {string} event
   * @param {(payload:any)=>void} handler
   * @param {object} [opts]
   * @param {any} [opts.owner] Optional owner token for bulk unsubscribe.
   * @returns {() => void} unsubscribe function
   */
  on(event, handler, opts = {}) {
    if (typeof handler !== "function") {
      throw new TypeError(`EventBus.on("${event}") requires a function handler`);
    }
    if (!this._listeners.has(event)) this._listeners.set(event, /* @__PURE__ */ new Set());
    this._listeners.get(event).add(handler);
    if (opts.owner) {
      if (!this._owners.has(opts.owner)) this._owners.set(opts.owner, /* @__PURE__ */ new Set());
      this._owners.get(opts.owner).add(() => this.off(event, handler));
    }
    return () => this.off(event, handler);
  }
  /**
   * Subscribe for exactly one invocation.
   * @param {string} event
   * @param {(payload:any)=>void} handler
   * @param {object} [opts]
   */
  once(event, handler, opts = {}) {
    const wrapped = (payload) => {
      this.off(event, wrapped);
      handler(payload);
    };
    return this.on(event, wrapped, opts);
  }
  /**
   * Unsubscribe a specific handler.
   * @param {string} event
   * @param {Function} handler
   */
  off(event, handler) {
    this._listeners.get(event)?.delete(handler);
  }
  /**
   * Emit an event to all subscribers. Handler errors are caught and logged
   * individually so one bad listener can't break the others.
   * @param {string} event
   * @param {any} [payload]
   */
  emit(event, payload) {
    const set = this._listeners.get(event);
    if (!set || set.size === 0) return;
    for (const handler of Array.from(set)) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[EventBus] listener for "${event}" threw:`, err);
      }
    }
  }
  /**
   * Remove every listener registered with a given owner token.
   * Call this from a Module's `destroy()` for automatic cleanup.
   * @param {any} owner
   */
  unsubscribeAll(owner) {
    const cleaners = this._owners.get(owner);
    if (!cleaners) return;
    cleaners.forEach((cleanup) => cleanup());
    this._owners.delete(owner);
  }
  clear() {
    this._listeners.clear();
    this._owners.clear();
  }
};
var eventBus = new EventBus();

// lib/auth/constants.ts
var STAFF_ROLES = ["super_admin", "admin", "editor", "viewer"];
var ADMIN_ROLES = ["super_admin", "admin"];
var EDITOR_ROLES = ["super_admin", "admin", "editor"];
var SESSION_LIFETIME_SECONDS = 24 * 60 * 60;
var SESSION_LIFETIME_MS = SESSION_LIFETIME_SECONDS * 1e3;
var ELEVATION_DEFAULT_HOURS = 3;
var ELEVATION_DURATION_MS = ELEVATION_DEFAULT_HOURS * 60 * 60 * 1e3;

// lib/auth/capabilities.ts
function isElevationActive(elevatedUntil) {
  if (!elevatedUntil) return false;
  return new Date(elevatedUntil).getTime() > Date.now();
}
var VIEWER_SETTINGS_TABS = ["profile", "security", "notifications"];
var ADMIN_SETTINGS_TABS = ["system"];
var SITE_SETTINGS_STORAGE_KEYS = /* @__PURE__ */ new Set([
  "pa_settings",
  "pa_msg_column_visibility"
]);
function isSiteSettingsStorageKey(key) {
  return SITE_SETTINGS_STORAGE_KEYS.has(key);
}
function canAccessSettingsTab(tab, capabilities) {
  if (ADMIN_SETTINGS_TABS.includes(tab)) {
    return capabilities.isAdmin;
  }
  if (capabilities.canManageContent) return true;
  return VIEWER_SETTINGS_TABS.includes(tab);
}
function deriveAccessCapabilities(role, elevatedUntil) {
  const normalized = typeof role === "string" ? role : "viewer";
  const isStaff = STAFF_ROLES.includes(normalized);
  const isAdmin = ADMIN_ROLES.includes(normalized);
  const baseEditor = EDITOR_ROLES.includes(normalized);
  const isViewer = normalized === "viewer";
  const elevated = !isAdmin && isElevationActive(elevatedUntil ?? null);
  const elevatedUntilIso = elevated && elevatedUntil ? elevatedUntil : null;
  const editorLike = baseEditor || elevated;
  return {
    isAdmin,
    isEditor: editorLike,
    isViewer: isViewer && !elevated,
    canManageContent: editorLike,
    canManageSiteSettings: isAdmin,
    canLogoutAllDevices: isAdmin,
    canClearAllNotifications: editorLike,
    canShowRoleRequestCard: isStaff && !isAdmin && !elevated,
    canAccessBlogEngagement: editorLike,
    canViewAllStaffActivity: isAdmin,
    canManageOwnAccountSettings: isStaff,
    isElevated: elevated,
    elevatedUntil: elevatedUntilIso
  };
}

// lib/auth/cms-write-controls.ts
var CMS_WRITE_CONTROL_IDS = [
  "paQuickAddPanel",
  "paMsgReplyPanel"
];
var CMS_VIEWER_STRIP_PANEL_IDS = [
  "paAddPanel",
  "paEditPanel",
  "paQuickAddPanel",
  "paCatAddPanel",
  "paCatEditPanel",
  "paTagAddPanel",
  "paTagEditPanel",
  "paBlogAddPanel",
  "paBlogEditPanel",
  "paBlogCatAddPanel",
  "paBlogCatEditPanel",
  "paExpAddPanel",
  "paExpEditPanel",
  "paTestiAddPanel",
  "paTestiEditPanel",
  "paTechAddPanel",
  "paTechEditPanel",
  "paToolsAddPanel",
  "paToolsEditPanel",
  "paToolCatAddPanel",
  "paToolCatEditPanel",
  "paUploadPanel",
  "paEditDetailsPanel",
  "paMsgReplyPanel",
  "paAddUserPanel",
  "paUserCredentialsPanel"
];
var CMS_WRITE_DOM_SELECTORS = [
  ".pa-msg-reply-panel",
  '[id$="AddSubmit"]',
  '[id$="EditSubmit"]',
  '[id$="EditDelete"]'
];
var CMS_WRITE_MENU_ACTIONS = /* @__PURE__ */ new Set([
  "edit",
  "delete",
  "duplicate",
  "mark-read",
  "mark-unread",
  "toggle-spam",
  "reset-credentials",
  "reply",
  "reply-edit",
  "reply-delete"
]);
function isCmsEmptyAddButton(el) {
  if (!el.classList.contains("pa-empty-state-btn")) return false;
  const id = el.id || "";
  if (/reset/i.test(id)) return false;
  return /add|emptyadd/i.test(id);
}

// client/utils/focus-trap.ts
var FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
function trapFocus(container, event) {
  if (event.key !== "Tab") return;
  const nodes = Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1
  );
  if (!nodes.length) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
function bindFocusTrap(container) {
  if (!container) return () => {
  };
  const onKeyDown = (event) => trapFocus(container, event);
  container.addEventListener("keydown", onKeyDown);
  return () => container.removeEventListener("keydown", onKeyDown);
}

// client/modules/shell/panels.ts
var disposeFocusTrap = null;
var FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
var VIEWER_PANEL_IDS = /* @__PURE__ */ new Set(["paCustomPanel"]);
var registeredPanelIds = /* @__PURE__ */ new Set();
function registerPanel(id) {
  registeredPanelIds.add(id);
}
function anyPanelOpen() {
  return Array.from(registeredPanelIds).some((id) => $id(id)?.classList.contains("visible"));
}
function closePanels() {
  disposeFocusTrap?.();
  disposeFocusTrap = null;
  $id("paPanelOverlay")?.classList.remove("visible");
  registeredPanelIds.forEach((id) => $id(id)?.classList.remove("visible"));
  $id("paCustomToggle")?.classList.remove("active");
  document.querySelector(".pa-custom-toggle")?.classList.remove("active");
  document.body.style.overflow = "";
}
function openPanel(panelId, hidePanelIds = []) {
  if (!canManageContent() && !VIEWER_PANEL_IDS.has(panelId)) return;
  hidePanelIds.forEach((id) => $id(id)?.classList.remove("visible"));
  $id("paPanelOverlay")?.classList.add("visible");
  const panel = $id(panelId);
  panel?.classList.add("visible");
  disposeFocusTrap?.();
  disposeFocusTrap = bindFocusTrap(panel);
  const firstFocus = panel?.querySelector(FOCUSABLE_SELECTOR);
  if (firstFocus instanceof HTMLElement) firstFocus.focus();
}
function activateTab(panel, tab) {
  document.querySelectorAll(
    `.pa-panel-tab[data-panel="${panel}"], .pa-view-btn[data-panel="${panel}"]`
  ).forEach((btn) => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle("active", isActive);
    if (btn.getAttribute("role") === "tab") {
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    }
  });
  document.querySelectorAll(`.pa-qa-top-tab[data-panel="${panel}"], .pa-qa-bottom-tab[data-panel="${panel}"]`).forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  document.querySelectorAll(`.pa-tab-panel[data-panel="${panel}"]`).forEach((pane) => {
    pane.classList.toggle("active", pane.dataset.content === tab);
  });
  const panelId = document.querySelector(`.pa-panel[data-panel="${panel}"]`)?.id || document.querySelector(`#${panel}`)?.id || panel;
  const scrollRoot = document.querySelector(`#${panelId} .pa-qa-content`) || document.querySelector(`#${panelId} .pa-panel-body`);
  if (scrollRoot) scrollRoot.scrollTop = 0;
}
function activateWizardStep(entity, step) {
  const root = document.querySelector(`.pa-qa-wizard[data-qa-entity="${entity}"]`);
  if (!root) return;
  root.querySelectorAll("[data-wizard-step]").forEach((el) => {
    const isStep = el.dataset.wizardStep === step;
    if (el.classList.contains("pa-qa-step")) el.classList.toggle("active", isStep);
    if (el.classList.contains("pa-qa-step-panel")) el.classList.toggle("active", isStep);
  });
  const body = root.querySelector(".pa-qa-wizard-body");
  if (body) body.scrollTop = 0;
}

// client/modules/shell/confirm.ts
var pendingId = null;
var pendingType = null;
var pendingBulkConfirm = null;
var pendingLogoutConfirm = null;
var confirmDefaultsBackup = null;
var dialogBound = false;
function getConfirmIconEl() {
  return document.querySelector("#paConfirmOverlay .pa-confirm-icon i");
}
function getConfirmIconWrap() {
  return document.querySelector("#paConfirmOverlay .pa-confirm-icon");
}
function captureConfirmDefaults() {
  if (confirmDefaultsBackup) return;
  const titleEl = $id("paConfirmTitle");
  const okEl = $id("paConfirmOk");
  const iconEl = getConfirmIconEl();
  const iconWrap = getConfirmIconWrap();
  confirmDefaultsBackup = {
    title: titleEl?.textContent || "",
    okText: okEl?.textContent || "",
    okDanger: okEl?.classList.contains("--pa-red"),
    iconClass: iconEl?.className || "ri-delete-bin-line",
    iconWrapClass: iconWrap?.className || "pa-confirm-icon"
  };
}
function restoreConfirmDefaults() {
  if (!confirmDefaultsBackup) return;
  const titleEl = $id("paConfirmTitle");
  const okEl = $id("paConfirmOk");
  const iconEl = getConfirmIconEl();
  const iconWrap = getConfirmIconWrap();
  if (titleEl) titleEl.textContent = confirmDefaultsBackup.title;
  if (okEl) {
    okEl.textContent = confirmDefaultsBackup.okText;
    okEl.classList.toggle("--pa-red", confirmDefaultsBackup.okDanger);
  }
  if (iconEl) iconEl.className = confirmDefaultsBackup.iconClass;
  if (iconWrap) iconWrap.className = confirmDefaultsBackup.iconWrapClass;
  confirmDefaultsBackup = null;
}
function applyConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  iconClass = "ri-delete-bin-line",
  danger = true,
  iconTone = "danger"
}) {
  captureConfirmDefaults();
  const titleEl = $id("paConfirmTitle");
  const textEl = $id("paConfirmText");
  const okEl = $id("paConfirmOk");
  const iconEl = getConfirmIconEl();
  const iconWrap = getConfirmIconWrap();
  if (titleEl && title) titleEl.textContent = title;
  if (textEl && message) textEl.innerHTML = message;
  if (okEl) {
    okEl.textContent = confirmLabel;
    okEl.classList.toggle("--pa-red", danger);
  }
  if (iconEl) iconEl.className = iconClass;
  if (iconWrap) {
    iconWrap.className = "pa-confirm-icon";
    if (iconTone === "warning") iconWrap.classList.add("pa-confirm-icon--warning");
  }
}
function requestDelete(id, type, name, extraInfo = "") {
  pendingLogoutConfirm = null;
  restoreConfirmDefaults();
  pendingBulkConfirm = null;
  pendingId = id;
  pendingType = type;
  let text = `This will permanently remove <strong>${name}</strong>.`;
  if (extraInfo) text += ` ${extraInfo}`;
  text += " This action cannot be undone.";
  const textEl = $id("paConfirmText");
  if (textEl) textEl.innerHTML = text;
  $id("paConfirmOverlay")?.classList.add("visible");
}
function requestBulkAction({
  title,
  message,
  onConfirm,
  confirmLabel = "Delete",
  iconClass = "ri-delete-bin-line",
  danger = true,
  iconTone = "danger"
}) {
  pendingLogoutConfirm = null;
  restoreConfirmDefaults();
  pendingId = null;
  pendingType = null;
  pendingBulkConfirm = onConfirm;
  applyConfirmDialog({ title, message, confirmLabel, iconClass, danger, iconTone });
  $id("paConfirmOverlay")?.classList.add("visible");
}
function requestConfirm(opts) {
  return requestBulkAction(opts);
}
function closeConfirm() {
  $id("paConfirmOverlay")?.classList.remove("visible");
  pendingId = null;
  pendingType = null;
  if (pendingBulkConfirm) {
    pendingBulkConfirm = null;
    restoreConfirmDefaults();
  }
  if (pendingLogoutConfirm) {
    pendingLogoutConfirm = null;
    restoreConfirmDefaults();
  }
}
function requestLogout(onConfirm) {
  pendingLogoutConfirm = onConfirm;
  pendingId = null;
  pendingType = null;
  pendingBulkConfirm = null;
  restoreConfirmDefaults();
  applyConfirmDialog({
    title: "Logout?",
    message: "Are you sure you want to logout? You will need to sign in again to access the admin panel.",
    confirmLabel: "Logout",
    iconClass: "ri-logout-circle-line",
    danger: false,
    iconTone: "warning"
  });
  $id("paConfirmOverlay")?.classList.add("visible");
}
function hitConfirmControl(target, id) {
  if (!target) return false;
  if (target.id === id) return true;
  return typeof target.closest === "function" && !!target.closest(`#${id}`);
}
async function performDelete() {
  if (pendingLogoutConfirm) {
    const cb = pendingLogoutConfirm;
    pendingLogoutConfirm = null;
    $id("paConfirmOverlay")?.classList.remove("visible");
    restoreConfirmDefaults();
    await Promise.resolve(cb());
    return;
  }
  if (pendingBulkConfirm) {
    const cb = pendingBulkConfirm;
    pendingBulkConfirm = null;
    $id("paConfirmOverlay")?.classList.remove("visible");
    restoreConfirmDefaults();
    await Promise.resolve(cb());
    return;
  }
  if (pendingId == null || pendingType == null) return;
  const { id, type } = { id: pendingId, type: pendingType };
  closeConfirm();
  closePanels();
  eventBus.emit("confirm:confirmed", { id, type });
}
function onConfirmDocumentClick(e) {
  const overlay = document.getElementById("paConfirmOverlay");
  if (!overlay?.classList.contains("visible")) return;
  if (hitConfirmControl(e.target, "paConfirmCancel")) {
    e.preventDefault();
    closeConfirm();
    return;
  }
  if (hitConfirmControl(e.target, "paConfirmOk")) {
    e.preventDefault();
    void performDelete();
    return;
  }
  if (e.target.id === "paConfirmOverlay") {
    closeConfirm();
  }
}
function initConfirmDialog() {
  if (dialogBound) return;
  dialogBound = true;
  document.addEventListener("click", onConfirmDocumentClick);
}
function isConfirmOpen() {
  return !!document.getElementById("paConfirmOverlay")?.classList.contains("visible");
}
var PERMISSION_DENIED_MESSAGE = `You don't have permission to do that. <a href="/settings/security">Contact admin for access</a> from Settings \u2192 Security.`;
function showPermissionDeniedDialog() {
  requestBulkAction({
    title: "Permission required",
    message: PERMISSION_DENIED_MESSAGE,
    confirmLabel: "OK",
    iconClass: "ri-lock-line",
    danger: false,
    iconTone: "warning",
    onConfirm: () => {
    }
  });
}

// client/core/cms-access.ts
function canManageContent() {
  return getAccessCapabilities().canManageContent;
}
function canManageSiteSettings() {
  return getAccessCapabilities().canManageSiteSettings;
}
var CMS_WRITE_HIDDEN_ATTR = "data-pa-cms-write-hidden";
function hideForViewer(el) {
  if (!el || el.hasAttribute(CMS_WRITE_HIDDEN_ATTR)) return;
  el.setAttribute(CMS_WRITE_HIDDEN_ATTR, "true");
  el.setAttribute("hidden", "");
  if (el instanceof HTMLElement) {
    el.style.display = "none";
  }
}
function elementByIdWithinRoot(root, id) {
  return root instanceof Document ? root.getElementById(id) : root.querySelector(`#${CSS.escape(id)}`);
}
function restoreCmsWriteControls(root = document) {
  root.querySelectorAll(`[${CMS_WRITE_HIDDEN_ATTR}]`).forEach((el) => {
    el.removeAttribute(CMS_WRITE_HIDDEN_ATTR);
    el.removeAttribute("hidden");
    if (el instanceof HTMLElement) {
      el.style.removeProperty("display");
    }
  });
}
function stripCmsWriteControls(root = document) {
  if (canManageContent()) return;
  for (const id of CMS_WRITE_CONTROL_IDS) {
    hideForViewer(elementByIdWithinRoot(root, id));
  }
  for (const id of CMS_VIEWER_STRIP_PANEL_IDS) {
    hideForViewer(elementByIdWithinRoot(root, id));
  }
  for (const selector of CMS_WRITE_DOM_SELECTORS) {
    root.querySelectorAll(selector).forEach((el) => hideForViewer(el));
  }
  root.querySelectorAll('.pa-panel[role="dialog"]').forEach((panel) => {
    const id = panel.id;
    if (id && id !== "paCustomPanel") hideForViewer(panel);
  });
}
var writeGuardInstalled = false;
var VIEWER_SELF_SERVICE_ROOT_SELECTOR = [
  '.pa-tab-panel[data-content="profile"]',
  '.pa-tab-panel[data-content="security"]',
  '.pa-tab-panel[data-content="notifications"]'
].join(", ");
function isViewerSelfServiceClick(target) {
  return !!target.closest(VIEWER_SELF_SERVICE_ROOT_SELECTOR);
}
var WRITE_GUARD_SELECTOR = [
  '[data-action="edit"]',
  '[data-action="delete"]',
  '[data-action="duplicate"]',
  '[data-action="mark-read"]',
  '[data-action="mark-unread"]',
  '[data-action="toggle-spam"]',
  '[data-action="reply"]',
  '[data-action="reply-edit"]',
  '[data-action="reply-delete"]',
  '[data-action="reset-credentials"]',
  ".pa-btn-add",
  ".pa-action-edit",
  ".pa-action-delete",
  ".pa-action-duplicate",
  ".pa-proj-card__details-btn",
  "#paAddNewBtn",
  "#paSelectModeBtn",
  "#paBlogEngSelectModeBtn",
  "#paBulkDeleteBtn",
  "#paBulkSelectAllBtn",
  "#paBulkClearBtn",
  "#paMsgExportBtn",
  "#paMsgDetailDelete",
  "#paMsgDetailStar",
  "#paMsgReplyBtn",
  ".pa-msg-reply-again-btn",
  "[data-reply-edit]",
  "[data-reply-delete]",
  "[data-cms-write]",
  ".pa-select-checkbox",
  ".pa-msg-bulk-checkbox",
  '.pa-panel [id$="AddSubmit"]',
  '.pa-panel [id$="EditSubmit"]',
  '.pa-panel [id$="EditDelete"]'
].join(", ");
function findBlockedWriteControl(target) {
  if (isViewerSelfServiceClick(target)) return null;
  const menuItem = target.closest(".pa-card-menu-item[data-action]");
  if (menuItem) {
    const action = menuItem.getAttribute("data-action");
    if (action && CMS_WRITE_MENU_ACTIONS.has(action)) return menuItem;
  }
  const emptyAddBtn = target.closest(".pa-empty-state-btn");
  if (isCmsEmptyAddButton(target) || emptyAddBtn && isCmsEmptyAddButton(emptyAddBtn)) {
    return emptyAddBtn || target;
  }
  return target.closest(WRITE_GUARD_SELECTOR);
}
function installViewerWriteGuard() {
  if (writeGuardInstalled || canManageContent()) return;
  writeGuardInstalled = true;
  document.addEventListener(
    "click",
    (e) => {
      if (canManageContent()) return;
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      const blocked = findBlockedWriteControl(target);
      if (!blocked) return;
      e.preventDefault();
      e.stopPropagation();
      showPermissionDeniedDialog();
    },
    true
  );
}

// client/core/access.ts
var activeCapabilities = deriveAccessCapabilities("viewer");
function setAccessCapabilities(capabilities) {
  activeCapabilities = capabilities;
}
function getAccessCapabilities() {
  return activeCapabilities;
}
function setElementAccessible(el, allowed) {
  if (allowed) {
    el.removeAttribute("hidden");
    el.removeAttribute("aria-hidden");
    el.style.removeProperty("display");
  } else {
    el.setAttribute("hidden", "");
    el.setAttribute("aria-hidden", "true");
    el.style.display = "none";
  }
}
function applyCapabilityGatedElements(capabilities = activeCapabilities) {
  document.querySelectorAll(".pa-admin-only-item").forEach((el) => {
    setElementAccessible(el, capabilities.isAdmin);
  });
  document.querySelectorAll(".pa-editor-only-item").forEach((el) => {
    setElementAccessible(el, capabilities.isEditor);
  });
  document.querySelectorAll(".pa-staff-only-item").forEach((el) => {
    setElementAccessible(el, capabilities.canShowRoleRequestCard);
  });
  ["logoutAllBtn", "logoutAllDevicesBtn"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) setElementAccessible(el, capabilities.canLogoutAllDevices);
  });
  const clearBtn = document.getElementById("paNotifClearBtn");
  if (clearBtn) setElementAccessible(clearBtn, capabilities.canClearAllNotifications);
  if (capabilities.canManageContent) {
    restoreCmsWriteControls(document);
  } else {
    stripCmsWriteControls(document);
    installViewerWriteGuard();
  }
}

// client/core/PersistentCache.ts
var DB_NAME = "pa_portfolio_cache_v1";
var DB_VERSION = 1;
var STORE_NAME = "entries";
var CACHE_TTL_MS = {
  pa_recent_activities: 30 * 1e3,
  pa_category_meta: 15 * 60 * 1e3,
  pa_technologies: 15 * 60 * 1e3,
  pa_project_tags: 15 * 60 * 1e3,
  pa_tool_categories: 15 * 60 * 1e3,
  pa_blog_categories: 15 * 60 * 1e3,
  pa_settings: 10 * 60 * 1e3,
  default: 5 * 60 * 1e3
};
function getTtlForKey(key) {
  return CACHE_TTL_MS[key] ?? CACHE_TTL_MS.default;
}
function isEntryStale(fetchedAt, key) {
  if (!fetchedAt) return true;
  return Date.now() - fetchedAt > getTtlForKey(key);
}
var PersistentCache = class {
  constructor() {
    this._dbPromise = null;
  }
  _openDb() {
    if (this._dbPromise) return this._dbPromise;
    this._dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB unavailable"));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this._dbPromise;
  }
  async get(key) {
    try {
      const db = await this._openDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => {
          const row = request.result;
          if (!row || row.value === void 0) {
            resolve(null);
            return;
          }
          resolve({ value: row.value, fetchedAt: row.fetchedAt || 0 });
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn(`[PersistentCache] get("${key}") failed:`, err);
      return null;
    }
  }
  async getMany(keys) {
    const out = {};
    await Promise.all(keys.map(async (key) => {
      const entry = await this.get(key);
      if (entry) out[key] = entry;
    }));
    return out;
  }
  async set(key, value, fetchedAt = Date.now()) {
    try {
      const db = await this._openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.objectStore(STORE_NAME).put({ key, value, fetchedAt });
      });
    } catch (err) {
      console.warn(`[PersistentCache] set("${key}") failed:`, err);
    }
  }
  async setMany(entries, fetchedAt = Date.now()) {
    if (!entries.length) return;
    try {
      const db = await this._openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        const store = tx.objectStore(STORE_NAME);
        entries.forEach(({ key, value, fetchedAt: ts }) => {
          if (value === null || value === void 0) return;
          store.put({ key, value, fetchedAt: ts ?? fetchedAt });
        });
      });
    } catch (err) {
      console.warn("[PersistentCache] setMany failed:", err);
    }
  }
  async delete(key) {
    try {
      const db = await this._openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.objectStore(STORE_NAME).delete(key);
      });
    } catch (err) {
      console.warn(`[PersistentCache] delete("${key}") failed:`, err);
    }
  }
  async clear() {
    try {
      const db = await this._openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.objectStore(STORE_NAME).clear();
      });
    } catch (err) {
      console.warn("[PersistentCache] clear failed:", err);
    }
  }
};
var persistentCache = new PersistentCache();

// client/core/StorageService.ts
var StorageQuotaError = class extends Error {
  constructor(key, detail) {
    super(detail || `Storage request failed for "${key}"`);
    this.name = "StorageQuotaError";
    this.key = key;
  }
};
var MEDIA_LINKED_KEYS = [
  "pa_projects",
  "pa_blog_posts",
  "pa_testimonials",
  "pa_tools",
  "pa_contact_messages"
];
var RECENT_ACTIVITIES_SCOPE_KEY = "pa_recent_activities_scope";
var REMOTE_ROUTES = {
  pa_projects: "/api/projects",
  pa_category_meta: "/api/categories",
  pa_technologies: "/api/technologies",
  pa_media_library: "/api/media",
  pa_testimonials: "/api/testimonials",
  pa_blog_posts: "/api/blog-posts?full=1",
  pa_experience: "/api/experience",
  pa_contact_messages: "/api/contact-messages?all=1",
  pa_recent_activities: "/api/recent-activities",
  pa_tools: "/api/tools",
  pa_tool_categories: "/api/tool-categories",
  pa_blog_categories: "/api/blog-categories",
  pa_project_tag_labels: "/api/project-tags",
  pa_project_technology_usage: "/api/project-technologies",
  pa_blog_tags: "/api/blog-tags",
  pa_project_tags: "/api/project-tags",
  pa_settings: "/api/settings",
  pa_msg_column_visibility: "/api/preferences/contact-columns",
  pa_notification_preferences: "/api/notification-preferences",
  pa_notifications: "/api/notifications"
};
var StorageService = class {
  constructor() {
    this._cache = /* @__PURE__ */ new Map();
    this._meta = /* @__PURE__ */ new Map();
    this._inflight = /* @__PURE__ */ new Map();
    this._revalidating = /* @__PURE__ */ new Set();
    this._readyPromise = Promise.resolve();
    this._bootstrapPromise = null;
  }
  isBootstrapPending() {
    const bag = typeof window !== "undefined" ? window.__paPrefetch : null;
    const pending = bag?.__bootstrap;
    return !!(pending && typeof pending.then === "function");
  }
  /** Wait for the cold-load bootstrap request to finish and persist fresh data. */
  async waitForBootstrap() {
    if (!this.isBootstrapPending() && !this._bootstrapPromise) return;
    await this._ensureBootstrapHydrated();
  }
  async _persist(key, value, fetchedAt = Date.now()) {
    this._cache.set(key, value);
    this._meta.set(key, fetchedAt);
    await persistentCache.set(key, value, fetchedAt);
  }
  /** Drop scoped activity cache when a different user or scope signs in on this browser. */
  reconcileRecentActivitiesScope(session) {
    const user = session?.user;
    if (!user?.id) return;
    const scopeAll = user.capabilities?.canViewAllStaffActivity === true;
    const marker = `${user.id}:${scopeAll ? "all" : "self"}`;
    try {
      const prev = sessionStorage.getItem(RECENT_ACTIVITIES_SCOPE_KEY);
      if (prev && prev !== marker) {
        this.invalidate("pa_recent_activities");
      }
      sessionStorage.setItem(RECENT_ACTIVITIES_SCOPE_KEY, marker);
    } catch {
    }
  }
  async _persistBootstrapPayload(payload) {
    if (!payload) return;
    const fetchedAt = payload.fetchedAt ? Date.parse(payload.fetchedAt) : Date.now();
    const entries = Object.entries(payload.data || {}).filter(([, value]) => value !== null && value !== void 0).map(([key, value]) => ({ key, value, fetchedAt }));
    entries.forEach(({ key, value }) => {
      this._cache.set(key, value);
      this._meta.set(key, fetchedAt);
    });
    await persistentCache.setMany(entries, fetchedAt);
  }
  async _ensureBootstrapHydrated() {
    const bag = typeof window !== "undefined" ? window.__paPrefetch : null;
    const pending = bag?.__bootstrap;
    if (!pending || typeof pending.then !== "function") return;
    if (!this._bootstrapPromise) {
      this._bootstrapPromise = pending.then(async (payload) => {
        if (!payload) return;
        Object.entries(payload.data || {}).forEach(([key, value]) => {
          if (value !== null && value !== void 0) this._cache.set(key, value);
        });
        if (payload.session) {
          window.__paBootstrapSession = payload.session;
          this.reconcileRecentActivitiesScope(payload.session);
        }
        if (payload.profile) window.__paBootstrapProfile = payload.profile;
        await this._persistBootstrapPayload(payload);
        delete bag.__bootstrap;
      }).catch(() => {
      });
    }
    await this._bootstrapPromise;
  }
  /** Load cached CMS data from IndexedDB into memory before page modules run. */
  async hydrateFromPersistentCache(keys) {
    const list = Array.isArray(keys) ? keys : [keys];
    if (!list.length) return;
    const entries = await persistentCache.getMany(list);
    Object.entries(entries).forEach(([key, entry]) => {
      if (entry.value === null || entry.value === void 0) return;
      this._cache.set(key, entry.value);
      this._meta.set(key, entry.fetchedAt || 0);
    });
  }
  _scheduleRevalidate(key, route, fallback) {
    if (!route) return;
    if (this.isBootstrapPending()) return;
    if (this._revalidating.has(key)) return;
    const fetchedAt = this._meta.get(key);
    if (fetchedAt && !isEntryStale(fetchedAt, key)) return;
    this._revalidating.add(key);
    this._fetchRemote(key, route, fallback, { background: true }).catch(() => {
    }).finally(() => this._revalidating.delete(key));
  }
  ready() {
    return this._readyPromise;
  }
  /** Fire-and-forget parallel warm-up for one or more keys. */
  prefetch(keys) {
    const list = Array.isArray(keys) ? keys : [keys];
    list.forEach((key) => {
      if (this._cache.has(key) || this._inflight.has(key)) return;
      this.get(key).catch(() => {
      });
    });
  }
  _consumeBootPrefetch(key) {
    const bag = typeof window !== "undefined" ? window.__paPrefetch : null;
    const pending = bag?.[key];
    if (!pending || typeof pending.then !== "function") return null;
    delete bag[key];
    return pending;
  }
  async _fetchRemote(key, route, fallback, { background = false } = {}) {
    try {
      const res = await fetch(route, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "same-origin"
      });
      if (res.status === 401) {
        if (!background) window.location.href = "/login";
        return fallback;
      }
      if (!res.ok) throw new Error(await res.text());
      const value = await res.json();
      if (value === null || value === void 0) return fallback;
      await this._persist(key, value);
      return value;
    } catch (err) {
      if (!background) {
        console.warn(`[StorageService] get("${key}") failed, using fallback:`, err);
      }
      return fallback;
    }
  }
  async get(key, fallback = null) {
    const route = REMOTE_ROUTES[key];
    if (!route) {
      console.warn(`[StorageService] unknown key "${key}"`);
      return fallback;
    }
    if (this._cache.has(key)) {
      this._scheduleRevalidate(key, route, fallback);
      return this._cache.get(key);
    }
    if (this._inflight.has(key)) return this._inflight.get(key);
    const request = (async () => {
      const persisted = await persistentCache.get(key);
      if (persisted?.value !== null && persisted?.value !== void 0) {
        this._cache.set(key, persisted.value);
        this._meta.set(key, persisted.fetchedAt || 0);
        this._scheduleRevalidate(key, route, fallback);
        return persisted.value;
      }
      await this._ensureBootstrapHydrated();
      if (this._cache.has(key)) {
        this._scheduleRevalidate(key, route, fallback);
        return this._cache.get(key);
      }
      const bootPrefetch = this._consumeBootPrefetch(key);
      if (bootPrefetch) {
        try {
          const value = await bootPrefetch;
          if (value !== null && value !== void 0) {
            await this._persist(key, value);
            return value;
          }
        } catch {
        }
      }
      return this._fetchRemote(key, route, fallback);
    })();
    this._inflight.set(key, request);
    try {
      return await request;
    } finally {
      this._inflight.delete(key);
    }
  }
  /** Persist to memory + IndexedDB only (after a dedicated API mutation). */
  async persistLocal(key, value, fetchedAt = Date.now()) {
    await this._persist(key, value, fetchedAt);
  }
  async set(key, value) {
    const route = REMOTE_ROUTES[key];
    if (!route) throw new Error(`Unknown storage key: ${key}`);
    if (isSiteSettingsStorageKey(key) && !canManageSiteSettings()) {
      throw new StorageQuotaError(key, "Only administrators can change site settings.");
    }
    this._cache.set(key, value);
    try {
      const res = await fetch(route, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(value),
        credentials: "same-origin"
      });
      if (res.status === 401) {
        window.location.href = "/login";
        throw new StorageQuotaError(key);
      }
      const raw = await res.text();
      if (!res.ok) {
        let detail = raw;
        try {
          const parsed = JSON.parse(raw);
          detail = parsed.error || raw;
        } catch {
        }
        throw new StorageQuotaError(key, detail);
      }
      let payload = null;
      try {
        payload = raw ? JSON.parse(raw) : null;
      } catch {
        payload = null;
      }
      if (key === "pa_projects" || key === "pa_blog_posts") {
        this.invalidate("pa_media_library");
      } else if (key === "pa_media_library" && payload?.propagation?.changed) {
        MEDIA_LINKED_KEYS.forEach((linkedKey) => this.invalidate(linkedKey));
      }
      await this._persist(key, value);
    } catch (err) {
      this._cache.delete(key);
      this._meta.delete(key);
      throw err instanceof StorageQuotaError ? err : new StorageQuotaError(key, err?.message);
    }
  }
  async remove(key) {
    this._cache.delete(key);
    this._meta.delete(key);
    await persistentCache.delete(key);
    await this.set(key, Array.isArray(await this.get(key, [])) ? [] : {});
  }
  async getMany(keys, fallback = null) {
    const out = {};
    await Promise.all(keys.map(async (k) => {
      out[k] = await this.get(k, fallback);
    }));
    return out;
  }
  async setMany(entries) {
    await Promise.all(Object.entries(entries).map(([key, value]) => this.set(key, value)));
  }
  invalidate(key) {
    this._cache.delete(key);
    this._meta.delete(key);
    persistentCache.delete(key).catch(() => {
    });
    eventBus.emit("storage:invalidated", key);
  }
  /** Drop local caches for a key and load the latest value from the API. */
  async revalidate(key, fallback = null) {
    const route = REMOTE_ROUTES[key];
    if (!route) throw new Error(`Unknown storage key: ${key}`);
    this._cache.delete(key);
    this._meta.delete(key);
    await persistentCache.delete(key);
    return this._fetchRemote(key, route, fallback, { background: false });
  }
  clearCache() {
    this._cache.clear();
    this._meta.clear();
  }
  async clearPersistentCache() {
    this.clearCache();
    await persistentCache.clear();
  }
};
var storage = new StorageService();

// client/modules/shell/notifications.ts
var notifications = [];
var unreadCount = 0;
var loading = false;
function formatRelativeTime(iso) {
  if (!iso) return "Just now";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 6e4);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
function maybeShowBrowserNotification(item) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(item.title, {
      body: item.body || "",
      icon: "/favicon.ico",
      tag: item.id
    });
  } catch {
  }
}
function renderNotifications() {
  const list = $id("paNotifList");
  const badge = $id("paNotifBadge");
  if (!list) return;
  if (loading) {
    list.innerHTML = '<div class="pa-notif-empty"><i class="ri-loader-4-line"></i> Loading notifications\u2026</div>';
    return;
  }
  if (notifications.length === 0) {
    list.innerHTML = `<div class="pa-notif-empty"><i class="ri-notification-off-line" style="font-size:24px;display:block;margin-bottom:8px;"></i>No new notifications</div>`;
  } else {
    list.innerHTML = notifications.map(
      (n) => `
      <div class="pa-notif-item${n.read ? " is-read" : ""}" data-notif-id="${escapeHtml(n.id)}"${n.linkPath ? ` data-notif-link="${escapeHtml(n.linkPath)}"` : ""} role="button" tabindex="0">
        <div class="pa-notif-item-icon"><i class="${escapeHtml(n.icon || "ri-information-line")}"></i></div>
        <div>
          <div class="pa-notif-item-text">${escapeHtml(n.title)}</div>
          ${n.body ? `<div class="pa-notif-item-desc">${escapeHtml(n.body)}</div>` : ""}
          <div class="pa-notif-item-time">${escapeHtml(formatRelativeTime(n.createdAt))}</div>
        </div>
      </div>`
    ).join("");
  }
  if (badge) {
    const count = unreadCount || notifications.filter((n) => !n.read).length;
    if (count > 0) {
      badge.textContent = count > 9 ? "9+" : String(count);
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }
}
async function loadNotifications({ silent = false, force = false } = {}) {
  if (!silent) {
    loading = true;
    renderNotifications();
  }
  try {
    if (force) {
      storage.invalidate("pa_notifications");
    }
    const payload = await storage.get("pa_notifications", { notifications: [], unreadCount: 0 });
    const list = payload?.notifications;
    notifications = Array.isArray(list) ? list : [];
    unreadCount = Number(payload?.unreadCount);
    if (Number.isNaN(unreadCount)) {
      unreadCount = notifications.filter((n) => !n.read).length;
    }
  } catch {
    notifications = [];
    unreadCount = 0;
  } finally {
    loading = false;
    renderNotifications();
  }
}
async function addNotification(text, icon, options = {}) {
  const title = String(text || "").trim();
  if (!title) return;
  try {
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        title,
        icon: icon || "ri-information-line",
        body: options.body || null,
        category: options.category || "other",
        linkPath: options.linkPath || null,
        metadata: options.metadata || {}
      })
    });
    const payload = await res.json().catch(() => ({}));
    if (res.ok && payload.notification) {
      notifications = [payload.notification, ...notifications.filter((n) => n.id !== payload.notification.id)];
      unreadCount += payload.notification.read ? 0 : 1;
      storage.invalidate("pa_notifications");
      renderNotifications();
      maybeShowBrowserNotification(payload.notification);
      eventBus.emit("notifications:updated", { notifications, unreadCount });
      return payload.notification;
    }
  } catch {
  }
  const fallback = {
    id: `local-${Date.now()}`,
    title,
    body: options.body || "",
    icon: icon || "ri-information-line",
    read: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    linkPath: options.linkPath || ""
  };
  notifications = [fallback, ...notifications];
  unreadCount += 1;
  renderNotifications();
  return fallback;
}
async function clearNotifications() {
  notifications = [];
  unreadCount = 0;
  renderNotifications();
  eventBus.emit("notifications:updated", { notifications, unreadCount });
  void storage.persistLocal("pa_notifications", { notifications: [], unreadCount: 0 });
  try {
    const res = await fetch("/api/notifications", {
      method: "DELETE",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ clearAll: true })
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload.error || "Could not clear notifications.");
    }
  } catch (err) {
    storage.invalidate("pa_notifications");
    await loadNotifications({ silent: true });
    throw err;
  }
}
async function markNotificationRead(notificationId) {
  if (!notificationId) return;
  try {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ ids: [notificationId] })
    });
    const payload = await res.json().catch(() => ({}));
    if (res.ok) {
      notifications = payload.notifications || notifications.map((n) => n.id === notificationId ? { ...n, read: true } : n);
      unreadCount = payload.unreadCount ?? notifications.filter((n) => !n.read).length;
      storage.invalidate("pa_notifications");
      renderNotifications();
      eventBus.emit("notifications:updated", { notifications, unreadCount });
    }
  } catch {
  }
}
async function requestBrowserNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

// client/core/StateStore.ts
var StateStore = class {
  /**
   * @param {object} initialState
   */
  constructor(initialState = {}) {
    this._subscribers = /* @__PURE__ */ new Set();
    this._batching = false;
    this._dirtyKeys = /* @__PURE__ */ new Set();
    this._scheduled = false;
    this._raw = { ...initialState };
    this.state = new Proxy(this._raw, {
      set: (target, key, value) => {
        if (typeof key !== "string") return true;
        if (target[key] === value) return true;
        target[key] = value;
        this._dirtyKeys.add(key);
        this._scheduleNotify();
        return true;
      },
      deleteProperty: (target, key) => {
        if (typeof key !== "string") return true;
        if (!(key in target)) return true;
        delete target[key];
        this._dirtyKeys.add(key);
        this._scheduleNotify();
        return true;
      }
    });
  }
  get(key) {
    return this._raw[key];
  }
  set(key, value) {
    this.state[key] = value;
    return this;
  }
  update(patch) {
    this.batch(() => {
      Object.entries(patch).forEach(([k, v]) => {
        this.state[k] = v;
      });
    });
    return this;
  }
  /**
   * Run `fn` with notifications suppressed until it returns, then fire once.
   * Nested batches are safe — only the outermost flushes.
   * @param {() => void} fn
   */
  batch(fn) {
    const alreadyBatching = this._batching;
    this._batching = true;
    try {
      fn();
    } finally {
      if (!alreadyBatching) {
        this._batching = false;
        this._flush();
      }
    }
  }
  /**
   * Subscribe to state changes.
   * @param {(state: object, changedKeys: string[]) => void} fn
   * @returns {() => void} unsubscribe
   */
  subscribe(fn) {
    this._subscribers.add(fn);
    return () => this._subscribers.delete(fn);
  }
  _scheduleNotify() {
    if (this._batching) return;
    if (this._scheduled) return;
    this._scheduled = true;
    Promise.resolve().then(() => this._flush());
  }
  _flush() {
    this._scheduled = false;
    if (this._dirtyKeys.size === 0) return;
    const changed = Array.from(this._dirtyKeys);
    this._dirtyKeys.clear();
    this._subscribers.forEach((fn) => {
      try {
        fn(this._raw, changed);
      } catch (err) {
        console.error("[StateStore] subscriber threw:", err);
      }
    });
  }
};

// client/core/Module.ts
var Module = class {
  constructor({ name, storageKey = null, initialState = {} } = {}) {
    this.name = name || this.constructor.name;
    this.storageKey = storageKey;
    this.store = new StateStore(initialState);
    this._domListeners = [];
    this._destroyed = false;
    this.log(`constructed`);
  }
  async init() {
    this.log("init");
    await this.load();
    this.render();
    this.bindEvents();
  }
  async load() {
  }
  render() {
  }
  bindEvents() {
  }
  destroy() {
    if (this._destroyed) return;
    this._domListeners.forEach(({ el, type, handler, options }) => {
      el.removeEventListener(type, handler, options);
    });
    this._domListeners = [];
    eventBus.unsubscribeAll(this);
    this._destroyed = true;
    this.log("destroyed");
  }
  /**
   * Load this module's records from storage, falling back to `seedFn()`
   * (typically a function returning a copy of seed/demo data) when nothing
   * is persisted yet.
   * @param {() => any} seedFn
   */
  async loadRecords(seedFn) {
    if (!this.storageKey) throw new Error(`${this.name}: loadRecords() requires storageKey`);
    const value = await storage.get(this.storageKey, null);
    if (value !== null) return value;
    return seedFn();
  }
  async saveRecords(data, { feedback = true } = {}) {
    if (!this.storageKey) throw new Error(`${this.name}: saveRecords() requires storageKey`);
    if (this.storageKey && isSiteSettingsStorageKey(this.storageKey)) {
      if (!canManageSiteSettings()) {
        if (feedback) {
          showStatusToast("Only administrators can change site settings.", "warning");
        }
        return;
      }
    } else if (!canManageContent()) {
      if (feedback) {
        showStatusToast("You do not have permission to change this content.", "warning");
      }
      return;
    }
    if (feedback) showStatusToast("Saving changes\u2026", "info", 12e4);
    try {
      await storage.set(this.storageKey, data);
      storage.invalidate("pa_recent_activities");
      storage.invalidate("pa_notifications");
    } catch (err) {
      this.logError("save failed", err);
      showStatusToast(err?.message || `Could not save ${this.name.toLowerCase()}. Please try again.`, "danger");
      throw err;
    }
  }
  $(selector, scope = document) {
    return $(selector, scope);
  }
  $all(selector, scope = document) {
    return $all(selector, scope);
  }
  /**
   * Add a DOM listener that is automatically removed in `destroy()`.
   * @param {EventTarget|null} el
   * @param {string} type
   * @param {Function} handler
   * @param {boolean|AddEventListenerOptions} [options]
   */
  on(el, type, handler, options) {
    if (!el) return;
    el.addEventListener(type, handler, options);
    this._domListeners.push({ el, type, handler, options });
  }
  onBus(event, handler) {
    eventBus.on(event, handler, { owner: this });
  }
  emit(event, payload) {
    eventBus.emit(event, payload);
  }
  toast(msg, type = "info", duration) {
    showToast(msg, type, duration);
  }
  statusToast(msg, type = "info", duration) {
    showStatusToast(msg, type, duration);
  }
  notify(text, icon, options) {
    void addNotification(text, icon, options);
  }
  log(...args) {
  }
  logError(...args) {
    console.error(`[${this.name}]`, ...args);
  }
};

export {
  eventBus,
  canAccessSettingsTab,
  deriveAccessCapabilities,
  setAccessCapabilities,
  getAccessCapabilities,
  applyCapabilityGatedElements,
  registerPanel,
  anyPanelOpen,
  closePanels,
  openPanel,
  activateTab,
  activateWizardStep,
  requestDelete,
  requestBulkAction,
  requestConfirm,
  closeConfirm,
  requestLogout,
  initConfirmDialog,
  isConfirmOpen,
  canManageContent,
  storage,
  renderNotifications,
  loadNotifications,
  addNotification,
  clearNotifications,
  markNotificationRead,
  requestBrowserNotificationPermission,
  Module
};
//# sourceMappingURL=chunk-4FUL3ZJX.js.map
