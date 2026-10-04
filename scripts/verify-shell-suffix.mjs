import {
  BODY_HTML,
  SETTINGS_SHELL_SUFFIX_START,
} from '../app/settings/bodyHtml.tsx';
import { buildSettingsBodyHtml } from '../app/settings/buildBodyHtml.ts';

function findPanelStart(html, tab) {
  const marker = `data-content="${tab}"`;
  const idx = html.indexOf(marker);
  if (idx === -1) return -1;
  return html.lastIndexOf('<div class="pa-tab-panel', idx);
}

const hasTypo = BODY_HTML.includes('data-content="typography"');
console.log('typography in BODY_HTML:', hasTypo);

for (const tab of ['general', 'notifications', 'system']) {
  const h = buildSettingsBodyHtml(tab);
  console.log(tab, {
    hasTypography: h.includes('data-content="typography"'),
    len: h.length,
  });
}

// System panel is followed immediately by SETTINGS_BODY_HTML_SUFFIX (typography), not EOF.
const systemStart = findPanelStart(BODY_HTML, 'system');
const noSystem =
  systemStart === -1
    ? BODY_HTML
    : BODY_HTML.slice(0, systemStart) + BODY_HTML.slice(SETTINGS_SHELL_SUFFIX_START);

const systemRemoved =
  noSystem.length < BODY_HTML.length
  && !noSystem.includes('data-panel="settings" data-content="system"');
console.log('noSystem fixture: system panel removed:', systemRemoved);

const noTypoNoSystem = noSystem.replace(/data-content="typography"/g, 'data-content="typography-x"');
console.log(
  'noTypoNoSystem: typography marker removed:',
  !noTypoNoSystem.includes('data-content="typography"'),
);

const h = buildSettingsBodyHtml('notifications');
console.log('normal notifications suffix ok:', h.includes('typography') || h.length > 35000);
