// @ts-nocheck
import { $id } from '../../utils/dom.js';
import { bindFocusTrap } from '../../utils/focus-trap.js';
import { canManageContent } from '../../core/cms-access.js';

let disposeFocusTrap = null;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Panels viewers may still open (e.g. read-only chrome). */
const VIEWER_PANEL_IDS = new Set(['paCustomPanel']);

const registeredPanelIds = new Set();

export function registerPanel(id) {
  registeredPanelIds.add(id);
}

export function anyPanelOpen() {
  return Array.from(registeredPanelIds).some((id) => $id(id)?.classList.contains('visible'));
}

export function closePanels() {
  disposeFocusTrap?.();
  disposeFocusTrap = null;
  $id('paPanelOverlay')?.classList.remove('visible');
  registeredPanelIds.forEach((id) => $id(id)?.classList.remove('visible'));
  $id('paCustomToggle')?.classList.remove('active');
  document.querySelector('.pa-custom-toggle')?.classList.remove('active');
  document.body.style.overflow = '';
}

/**
 * Show one panel (and the shared overlay), hiding any other panel passed in
 * `hidePanelIds` first (typically its Add/Edit sibling).
 * @param {string} panelId
 * @param {string[]} [hidePanelIds]
 */
export function openPanel(panelId, hidePanelIds = []) {
  if (!canManageContent() && !VIEWER_PANEL_IDS.has(panelId)) return;
  hidePanelIds.forEach((id) => $id(id)?.classList.remove('visible'));
  $id('paPanelOverlay')?.classList.add('visible');
  const panel = $id(panelId);
  panel?.classList.add('visible');
  disposeFocusTrap?.();
  disposeFocusTrap = bindFocusTrap(panel);
  const firstFocus = panel?.querySelector(FOCUSABLE_SELECTOR);
  if (firstFocus instanceof HTMLElement) firstFocus.focus();
}

export function setButtonLoading(btnId, loading) {
  const btn = $id(btnId);
  if (!btn) return;
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
}

export function activateTab(panel, tab) {
  document.querySelectorAll(
    `.pa-panel-tab[data-panel="${panel}"], .pa-view-btn[data-panel="${panel}"]`,
  ).forEach((btn) => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    if (btn.getAttribute('role') === 'tab') {
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
  });
  document.querySelectorAll(`.pa-qa-top-tab[data-panel="${panel}"], .pa-qa-bottom-tab[data-panel="${panel}"]`).forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll(`.pa-tab-panel[data-panel="${panel}"]`).forEach((pane) => {
    pane.classList.toggle('active', pane.dataset.content === tab);
  });
  const panelId = document.querySelector(`.pa-panel[data-panel="${panel}"]`)?.id
    || document.querySelector(`#${panel}`)?.id
    || panel;
  const scrollRoot = document.querySelector(`#${panelId} .pa-qa-content`)
    || document.querySelector(`#${panelId} .pa-panel-body`);
  if (scrollRoot) scrollRoot.scrollTop = 0;
}

/** Activate a step inside a quick-add wizard tab. */
export function activateWizardStep(entity, step) {
  const root = document.querySelector(`.pa-qa-wizard[data-qa-entity="${entity}"]`);
  if (!root) return;
  root.querySelectorAll('[data-wizard-step]').forEach((el) => {
    const isStep = el.dataset.wizardStep === step;
    if (el.classList.contains('pa-qa-step')) el.classList.toggle('active', isStep);
    if (el.classList.contains('pa-qa-step-panel')) el.classList.toggle('active', isStep);
  });
  const body = root.querySelector('.pa-qa-wizard-body');
  if (body) body.scrollTop = 0;
}
