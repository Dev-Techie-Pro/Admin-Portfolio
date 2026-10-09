// @ts-nocheck
import { BLOG_POST_WORKSPACE_HTML } from '@/app/blogPostWorkspaceHtml';

const BODY_OPEN = '<div class="pa-body" id="paBlogBody">';
const BODY_OPEN_ENHANCED = '<div class="pa-body pa-blog-page-body" id="paBlogBody">';
const LEGACY_PANEL_START = '<div class="pa-panel" id="paBlogAddPanel"';
const SHELL_START = '<div class="pa-shell">';

/** Removes legacy slide-over add/edit panels from the blog posts page HTML. */
export function stripBlogLegacyPanels(html: string): string {
  const start = html.indexOf(LEGACY_PANEL_START);
  const shell = html.indexOf(SHELL_START);
  if (start === -1 || shell === -1 || start >= shell) return html;
  return html.slice(0, start) + html.slice(shell);
}

/** Prepends the inline blog workspace inside the blog posts page body. */
export function withBlogPostWorkspace(html: string): string {
  const idx = html.indexOf(BODY_OPEN);
  if (idx === -1) return html;
  const insertAt = idx + BODY_OPEN.length;
  return (
    html.slice(0, idx)
    + BODY_OPEN_ENHANCED
    + BLOG_POST_WORKSPACE_HTML
    + html.slice(insertAt)
  );
}

export function prepareBlogPostPageHtml(html: string): string {
  return withBlogPostWorkspace(stripBlogLegacyPanels(html));
}