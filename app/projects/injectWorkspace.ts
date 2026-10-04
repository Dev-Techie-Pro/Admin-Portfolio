import { PROJECT_WORKSPACE_HTML } from '@/app/projectWorkspaceHtml';

const BODY_OPEN = '<div class="pa-body" id="paBody">';
const BODY_OPEN_ENHANCED = '<div class="pa-body pa-blog-page-body" id="paBody">';
const LEGACY_PANEL_START = '<div class="pa-panel" id="paAddPanel"';
const SHELL_START = '<div class="pa-shell">';

/** Removes legacy slide-over add/edit panels from the projects page HTML. */
export function stripProjectLegacyPanels(html: string): string {
  const start = html.indexOf(LEGACY_PANEL_START);
  const shell = html.indexOf(SHELL_START);
  if (start === -1 || shell === -1 || start >= shell) return html;
  return html.slice(0, start) + html.slice(shell);
}

/** Prepends the inline project workspace inside the projects page body. */
export function withProjectWorkspace(html: string): string {
  const idx = html.indexOf(BODY_OPEN);
  if (idx === -1) return html;
  const insertAt = idx + BODY_OPEN.length;
  return (
    html.slice(0, idx)
    + BODY_OPEN_ENHANCED
    + PROJECT_WORKSPACE_HTML
    + html.slice(insertAt)
  );
}

export function prepareProjectPageHtml(html: string): string {
  return withProjectWorkspace(stripProjectLegacyPanels(html));
}
