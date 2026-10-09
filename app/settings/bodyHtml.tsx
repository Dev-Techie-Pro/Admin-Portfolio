// @ts-nocheck
import { SYSTEM_TAB_HTML } from './systemTabHtml';
import { SETTINGS_BODY_HTML_PREFIX, SETTINGS_BODY_HTML_SUFFIX } from './bodyHtmlParts';

/** Settings tab panels + system tab. */
export const SETTINGS_BODY_HTML_MAIN =
  SETTINGS_BODY_HTML_PREFIX + SYSTEM_TAB_HTML.trim();

/** Legacy hook for panel slicing; typography lives in `CUSTOM_PANEL_HTML` only. */
export const BODY_HTML = SETTINGS_BODY_HTML_MAIN + SETTINGS_BODY_HTML_SUFFIX;

export const SETTINGS_SHELL_SUFFIX_START = SETTINGS_BODY_HTML_MAIN.length;
