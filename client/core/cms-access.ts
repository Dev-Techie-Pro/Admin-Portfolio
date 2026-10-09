// @ts-nocheck
import {
  CMS_WRITE_CONTROL_IDS,
  CMS_WRITE_DOM_SELECTORS,
  CMS_WRITE_MENU_ACTIONS,
  CMS_VIEWER_STRIP_PANEL_IDS,
  isCmsEmptyAddButton,
} from '../../lib/auth/cms-write-controls.js';
import { getAccessCapabilities } from './access.js';
import { showPermissionDeniedDialog } from '../modules/shell/confirm.js';

export function canManageContent(): boolean {
  return getAccessCapabilities().canManageContent;
}

export function canManageSiteSettings(): boolean {
  return getAccessCapabilities().canManageSiteSettings;
}

const CMS_WRITE_HIDDEN_ATTR = 'data-pa-cms-write-hidden';

/**
 * Hide CMS write affordances for viewers (do not remove — restores when role elevates).
 * List/grid action buttons stay visible; clicks are blocked by {@link installViewerWriteGuard}.
 */
function hideForViewer(el: Element | null | undefined): void {
  if (!el || el.hasAttribute(CMS_WRITE_HIDDEN_ATTR)) return;
  el.setAttribute(CMS_WRITE_HIDDEN_ATTR, 'true');
  el.setAttribute('hidden', '');
  if (el instanceof HTMLElement) {
    el.style.display = 'none';
  }
}

function elementByIdWithinRoot(root: ParentNode, id: string): Element | null {
  return root instanceof Document
    ? root.getElementById(id)
    : root.querySelector(`#${CSS.escape(id)}`);
}

export function restoreCmsWriteControls(root: ParentNode = document): void {
  root.querySelectorAll(`[${CMS_WRITE_HIDDEN_ATTR}]`).forEach((el) => {
    el.removeAttribute(CMS_WRITE_HIDDEN_ATTR);
    el.removeAttribute('hidden');
    if (el instanceof HTMLElement) {
      el.style.removeProperty('display');
    }
  });
}

export function stripCmsWriteControls(root: ParentNode = document): void {
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
    if (id && id !== 'paCustomPanel') hideForViewer(panel);
  });
}

let writeGuardInstalled = false;

/** Settings areas where viewers may save their own account (not CMS content). */
const VIEWER_SELF_SERVICE_ROOT_SELECTOR = [
  '.pa-tab-panel[data-content="profile"]',
  '.pa-tab-panel[data-content="security"]',
  '.pa-tab-panel[data-content="notifications"]',
].join(', ');

function isViewerSelfServiceClick(target: Element): boolean {
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
  '.pa-btn-add',
  '.pa-action-edit',
  '.pa-action-delete',
  '.pa-action-duplicate',
  '.pa-proj-card__details-btn',
  '#paAddNewBtn',
  '#paSelectModeBtn',
  '#paBlogEngSelectModeBtn',
  '#paBulkDeleteBtn',
  '#paBulkSelectAllBtn',
  '#paBulkClearBtn',
  '#paMsgExportBtn',
  '#paMsgDetailDelete',
  '#paMsgDetailStar',
  '#paMsgReplyBtn',
  '.pa-msg-reply-again-btn',
  '[data-reply-edit]',
  '[data-reply-delete]',
  '[data-cms-write]',
  '.pa-select-checkbox',
  '.pa-msg-bulk-checkbox',
  '.pa-panel [id$="AddSubmit"]',
  '.pa-panel [id$="EditSubmit"]',
  '.pa-panel [id$="EditDelete"]',
].join(', ');

function findBlockedWriteControl(target: Element): Element | null {
  if (isViewerSelfServiceClick(target)) return null;

  const menuItem = target.closest('.pa-card-menu-item[data-action]');
  if (menuItem) {
    const action = menuItem.getAttribute('data-action');
    if (action && CMS_WRITE_MENU_ACTIONS.has(action)) return menuItem;
  }

  const emptyAddBtn = target.closest('.pa-empty-state-btn');
  if (isCmsEmptyAddButton(target) || (emptyAddBtn && isCmsEmptyAddButton(emptyAddBtn))) {
    return emptyAddBtn || target;
  }

  return target.closest(WRITE_GUARD_SELECTOR);
}

/** Block write controls for viewers; show a permission dialog instead of running the action. */
export function installViewerWriteGuard(): void {
  if (writeGuardInstalled || canManageContent()) return;
  writeGuardInstalled = true;

  document.addEventListener(
    'click',
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
    true,
  );
}
