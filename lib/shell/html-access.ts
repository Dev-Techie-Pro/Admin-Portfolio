// @ts-nocheck
import type { AccessCapabilities } from '@/lib/auth/capabilities';
import { CMS_WRITE_CONTROL_IDS, CMS_VIEWER_STRIP_PANEL_IDS } from '@/lib/auth/cms-write-controls';
import { buildSidebarInnerHtml } from '@/app/sidebarHtml';

/** Remove one element (supports nested tags) by id attribute. */
function removeElementById(html: string, id: string): string {
  const idAttr = new RegExp(`\\bid=["']${id}["']`);
  const matchIdx = html.search(idAttr);
  if (matchIdx === -1) return html;

  const openStart = html.lastIndexOf('<', matchIdx);
  if (openStart === -1) return html;

  const openTagEnd = html.indexOf('>', openStart);
  if (openTagEnd === -1) return html;

  const openTag = html.slice(openStart, openTagEnd + 1);
  const tagNameMatch = openTag.match(/^<([a-zA-Z][\w-]*)/);
  if (!tagNameMatch) return html;

  const tagName = tagNameMatch[1];
  if (/\/\s*>$/.test(openTag.trim())) {
    return html.slice(0, openStart) + html.slice(openTagEnd + 1);
  }

  const openPattern = new RegExp(`<${tagName}\\b`, 'gi');
  const closePattern = new RegExp(`</${tagName}\\s*>`, 'gi');

  let depth = 1;
  let pos = openTagEnd + 1;

  while (depth > 0 && pos < html.length) {
    openPattern.lastIndex = pos;
    closePattern.lastIndex = pos;
    const openMatch = openPattern.exec(html);
    const closeMatch = closePattern.exec(html);

    const openAt = openMatch ? openMatch.index : Infinity;
    const closeAt = closeMatch ? closeMatch.index : Infinity;

    if (closeAt === Infinity) break;

    if (openAt < closeAt) {
      depth += 1;
      pos = openAt + 1;
    } else {
      depth -= 1;
      pos = closeMatch.index + closeMatch[0].length;
      if (depth === 0) {
        return html.slice(0, openStart) + html.slice(pos);
      }
    }
  }

  return html;
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

  if (!capabilities.canManageContent) {
    for (const id of CMS_WRITE_CONTROL_IDS) {
      next = removeElementById(next, id);
    }
    for (const id of CMS_VIEWER_STRIP_PANEL_IDS) {
      next = removeElementById(next, id);
    }
  }

  return next;
}
