import {
  CMS_WRITE_CONTROL_IDS,
  CMS_WRITE_DOM_SELECTORS,
  CMS_WRITE_MENU_ACTIONS,
  CMS_VIEWER_STRIP_PANEL_IDS,
  isCmsEmptyAddButton
} from "../../lib/auth/cms-write-controls.js";
import { getAccessCapabilities } from "./access.js";
import { showPermissionDeniedDialog } from "../modules/shell/confirm.js";
function canManageContent() {
  return getAccessCapabilities().canManageContent;
}
function canManageSiteSettings() {
  return getAccessCapabilities().canManageSiteSettings;
}
const CMS_WRITE_HIDDEN_ATTR = "data-pa-cms-write-hidden";
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
let writeGuardInstalled = false;
const VIEWER_SELF_SERVICE_ROOT_SELECTOR = [
  '.pa-tab-panel[data-content="profile"]',
  '.pa-tab-panel[data-content="security"]',
  '.pa-tab-panel[data-content="notifications"]'
].join(", ");
function isViewerSelfServiceClick(target) {
  return !!target.closest(VIEWER_SELF_SERVICE_ROOT_SELECTOR);
}
const WRITE_GUARD_SELECTOR = [
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
export {
  canManageContent,
  canManageSiteSettings,
  installViewerWriteGuard,
  restoreCmsWriteControls,
  stripCmsWriteControls
};
