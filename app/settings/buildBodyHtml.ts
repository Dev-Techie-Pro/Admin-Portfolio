import { BODY_HTML } from './bodyHtml';
import { getSettingsPageMeta, resolveSettingsTab } from '@/lib/settings/page-meta';
import { SYSTEM_SECTION_TOOLBAR_HTML } from './systemSectionToolbarHtml';

const TAB_ORDER = [
  'general',
  'profile',
  'security',
  'notifications',
  'integrations',
  'logs',
  'system',
];

function findPanelStart(html: string, tab: string): number {
  const marker = `data-content="${tab}"`;
  const idx = html.indexOf(marker);
  if (idx === -1) return -1;
  return html.lastIndexOf('<div class="pa-tab-panel', idx);
}

function findPanelEnd(html: string, tab: string): number {
  const start = findPanelStart(html, tab);
  if (start === -1) return -1;

  const tabIndex = TAB_ORDER.indexOf(tab);
  let end = html.length;
  for (let i = tabIndex + 1; i < TAB_ORDER.length; i += 1) {
    const nextStart = findPanelStart(html, TAB_ORDER[i]);
    if (nextStart !== -1 && nextStart > start) {
      end = Math.min(end, nextStart);
    }
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

function getShellAfterPanels(html: string): string {
  const systemEnd = findPanelEnd(html, 'system');
  const systemStart = findPanelStart(html, 'system');
  if (systemStart !== -1 && systemEnd !== -1) {
    return html.slice(systemEnd);
  }
  const notifEnd = findPanelEnd(html, 'notifications');
  return notifEnd !== -1 ? html.slice(notifEnd) : '';
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
