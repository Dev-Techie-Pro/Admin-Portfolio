import type { AccessCapabilities } from '@/lib/auth/capabilities';
import { buildSidebarInnerHtml } from '@/app/sidebarHtml';

function removeElementById(html: string, id: string): string {
  const pattern = new RegExp(
    `<([a-zA-Z][\\w-]*)\\b[^>]*\\bid=["']${id}["'][^>]*>[\\s\\S]*?<\\/\\1>`,
    'gi',
  );
  return html.replace(pattern, '');
}

function removeAnchorsWithClass(html: string, className: string): string {
  const pattern = new RegExp(
    `<a\\b[^>]*\\bclass=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>[\\s\\S]*?<\\/a>\\s*`,
    'gi',
  );
  return html.replace(pattern, '');
}

function replaceSidebar(html: string, sidebarHtml: string): string {
  const start = html.indexOf('<aside class="pa-sidebar" id="paSidebar">');
  if (start === -1) return html;
  const end = html.indexOf('</aside>', start);
  if (end === -1) return html;
  return `${html.slice(0, start)}${sidebarHtml.trim()}${html.slice(end + '</aside>'.length)}`;
}

/**
 * Strip or inject shell fragments based on server-derived capabilities.
 * Authorization remains on API routes; this keeps privileged controls out of the initial HTML.
 */
export function personalizePageHtml(html: string, capabilities: AccessCapabilities): string {
  let next = replaceSidebar(html, buildSidebarInnerHtml(capabilities));

  if (!capabilities.isAdmin) {
    next = removeAnchorsWithClass(next, 'pa-admin-only-item');
    next = removeElementById(next, 'paAddUserMenuBtn');
    next = removeElementById(next, 'logoutAllBtn');
    next = removeElementById(next, 'logoutAllDevicesBtn');
    next = removeElementById(next, 'paAddUserPanel');
    next = removeElementById(next, 'paUserCredentialsPanel');
  }

  if (!capabilities.isEditor) {
    next = removeAnchorsWithClass(next, 'pa-editor-only-item');
  }

  if (!capabilities.canClearAllNotifications) {
    next = removeElementById(next, 'paNotifClearBtn');
  }

  return next;
}
