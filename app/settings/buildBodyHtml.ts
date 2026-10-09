// @ts-nocheck
import { BODY_HTML, SETTINGS_SHELL_SUFFIX_START } from './bodyHtml';
import { getSettingsPageMeta, resolveSettingsTab } from '@/lib/settings/page-meta';
import { SYSTEM_SECTION_TOOLBAR_HTML } from './systemSectionToolbarHtml';

/** Settings routes with a `data-content` panel in BODY_HTML. */
const SETTINGS_ROUTE_TABS = [
  'general',
  'profile',
  'security',
  'notifications',
  'system',
];

/** Non-route shell panels after settings (see SETTINGS_BODY_HTML_SUFFIX). */
const SHELL_SUFFIX_PANELS = ['typography'];

const PANEL_ORDER = [...SETTINGS_ROUTE_TABS, ...SHELL_SUFFIX_PANELS];

function findPanelStart(html: string, tab: string): number {
  const marker = `data-content="${tab}"`;
  const idx = html.indexOf(marker);
  if (idx === -1) return -1;
  return html.lastIndexOf('<div class="pa-tab-panel', idx);
}

function findShellSuffixStart(html: string): number {
  let bound = html.length;
  for (const marker of SHELL_SUFFIX_PANELS) {
    const start = findPanelStart(html, marker);
    if (start !== -1) bound = Math.min(bound, start);
  }
  if (html === BODY_HTML) {
    bound = Math.min(bound, SETTINGS_SHELL_SUFFIX_START);
  }
  return bound;
}

function findPanelEnd(html: string, tab: string): number {
  const start = findPanelStart(html, tab);
  if (start === -1) return -1;

  const tabIndex = PANEL_ORDER.indexOf(tab);
  let end = html.length;
  for (let i = tabIndex + 1; i < PANEL_ORDER.length; i += 1) {
    const nextStart = findPanelStart(html, PANEL_ORDER[i]);
    if (nextStart !== -1 && nextStart > start) {
      end = Math.min(end, nextStart);
    }
  }
  const suffixStart = findShellSuffixStart(html);
  if (suffixStart > start) {
    end = Math.min(end, suffixStart);
  }
  return end;
}

function extractSettingsPanel(html: string, tab: string): string {
  const start = findPanelStart(html, tab);
  if (start === -1) return '';
  const end = findPanelEnd(html, tab);
  let panel = html.slice(start, end).trim();
  panel = panel.replace(
    /<div class="pa-tab-panel(?:\s+active)?"/,
    '<div class="pa-tab-panel active"',
  );
  return panel;
}

function getShellBeforePanels(html: string): string {
  const start = findPanelStart(html, 'general');
  return start === -1 ? html : html.slice(0, start);
}

/** Shell HTML after settings route panels (`SETTINGS_BODY_HTML_SUFFIX`, etc.). */
function getShellAfterPanels(html: string): string {
  const suffixStart = findShellSuffixStart(html);
  if (suffixStart === -1 || suffixStart >= html.length) return '';
  return html.slice(suffixStart);
}

const SETTINGS_HEADER_ACTIONS_SLOT = '<div class="pa-header-page-right" id="settingsPageHeaderActions"></div>';

function injectPageHeaderMeta(shell: string, tab: string): string {
  const meta = getSettingsPageMeta(tab);
  let next = shell
    .replace(
      /<div class="pa-page-title" id="settingsPageTitle">[^<]*<\/div>/,
      `<div class="pa-page-title" id="settingsPageTitle">${meta.title}</div>`,
    )
    .replace(
      /<div class="pa-page-subtitle" id="settingsPageSubtitle">[^<]*<\/div>/,
      `<div class="pa-page-subtitle" id="settingsPageSubtitle">${meta.subtitle}</div>`,
    );

  if (tab === 'system') {
    next = next.replace(
      SETTINGS_HEADER_ACTIONS_SLOT,
      `<div class="pa-header-page-right" id="settingsPageHeaderActions">${SYSTEM_SECTION_TOOLBAR_HTML}</div>`,
    );
  }

  return next;
}

/** One settings sub-route: shared shell + a single tab panel (no in-page tab UI). */
export function buildSettingsBodyHtml(tab: string): string {
  const resolved = resolveSettingsTab(tab);
  const before = injectPageHeaderMeta(getShellBeforePanels(BODY_HTML), resolved);
  const panel = extractSettingsPanel(BODY_HTML, resolved);
  const after = getShellAfterPanels(BODY_HTML);
  return before + panel + after;
}
