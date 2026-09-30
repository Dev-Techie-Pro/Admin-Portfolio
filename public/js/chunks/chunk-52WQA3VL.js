import {
  eventBus
} from "./chunk-M734VJHD.js";
import {
  $id
} from "./chunk-S5QBHCBR.js";

// client/modules/shell/panels.ts
var registeredPanelIds = /* @__PURE__ */ new Set();
function registerPanel(id) {
  registeredPanelIds.add(id);
}
function anyPanelOpen() {
  return Array.from(registeredPanelIds).some((id) => $id(id)?.classList.contains("visible"));
}
function closePanels() {
  $id("paPanelOverlay")?.classList.remove("visible");
  registeredPanelIds.forEach((id) => $id(id)?.classList.remove("visible"));
  $id("paCustomToggle")?.classList.remove("active");
  document.querySelector(".pa-custom-toggle")?.classList.remove("active");
  document.body.style.overflow = "";
}
function openPanel(panelId, hidePanelIds = []) {
  hidePanelIds.forEach((id) => $id(id)?.classList.remove("visible"));
  $id("paPanelOverlay")?.classList.add("visible");
  $id(panelId)?.classList.add("visible");
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

export {
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
  isConfirmOpen
};
