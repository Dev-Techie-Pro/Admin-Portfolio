// @ts-nocheck
/** Shared ids / selectors for read-only (viewer) roles — server HTML + client DOM. */

/**
 * Controls removed from HTML/DOM for viewers (forms, quick-add, reply composer).
 * Toolbar/list actions (add, select mode, export, row edit/delete) stay visible;
 * {@link installViewerWriteGuard} blocks clicks with a permission dialog.
 */
export const CMS_WRITE_CONTROL_IDS = [
  'paQuickAddPanel',
  'paMsgReplyPanel',
] as const;

/** Add/edit/upload panels removed from HTML for viewers (not paCustomPanel). */
export const CMS_VIEWER_STRIP_PANEL_IDS = [
  'paAddPanel',
  'paEditPanel',
  'paQuickAddPanel',
  'paCatAddPanel',
  'paCatEditPanel',
  'paTagAddPanel',
  'paTagEditPanel',
  'paBlogAddPanel',
  'paBlogEditPanel',
  'paBlogCatAddPanel',
  'paBlogCatEditPanel',
  'paExpAddPanel',
  'paExpEditPanel',
  'paTestiAddPanel',
  'paTestiEditPanel',
  'paTechAddPanel',
  'paTechEditPanel',
  'paToolsAddPanel',
  'paToolsEditPanel',
  'paToolCatAddPanel',
  'paToolCatEditPanel',
  'paUploadPanel',
  'paEditDetailsPanel',
  'paMsgReplyPanel',
  'paAddUserPanel',
  'paUserCredentialsPanel',
] as const;

/**
 * Query selectors for write affordances removed from the DOM (not list/grid action buttons).
 */
export const CMS_WRITE_DOM_SELECTORS = [
  '.pa-msg-reply-panel',
  '[id$="AddSubmit"]',
  '[id$="EditSubmit"]',
  '[id$="EditDelete"]',
] as const;

/** Card / row menu actions that mutate data (viewers keep read-only actions like copy / view). */
export const CMS_WRITE_MENU_ACTIONS = new Set([
  'edit',
  'delete',
  'duplicate',
  'mark-read',
  'mark-unread',
  'toggle-spam',
  'reset-credentials',
  'reply',
  'reply-edit',
  'reply-delete',
]);

/** Empty-state buttons that create content (keep reset-filter buttons). */
export function isCmsEmptyAddButton(el: Element): boolean {
  if (!el.classList.contains('pa-empty-state-btn')) return false;
  const id = el.id || '';
  if (/reset/i.test(id)) return false;
  return /add|emptyadd/i.test(id);
}
