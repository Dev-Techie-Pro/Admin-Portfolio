import { SYSTEM_TAB_HTML } from './systemTabHtml';
import { SETTINGS_BODY_HTML_PREFIX, SETTINGS_BODY_HTML_SUFFIX } from './bodyHtmlParts';

/** Settings tab panels + system tab; shell suffix (`SETTINGS_BODY_HTML_SUFFIX`) follows. */
export const SETTINGS_BODY_HTML_MAIN =
  SETTINGS_BODY_HTML_PREFIX + SYSTEM_TAB_HTML.trim();

export const BODY_HTML = SETTINGS_BODY_HTML_MAIN + SETTINGS_BODY_HTML_SUFFIX;

/** Index where `SETTINGS_BODY_HTML_SUFFIX` begins inside `BODY_HTML`. */
export const SETTINGS_SHELL_SUFFIX_START = SETTINGS_BODY_HTML_MAIN.length;
