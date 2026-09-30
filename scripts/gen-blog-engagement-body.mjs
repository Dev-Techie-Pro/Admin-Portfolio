import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSidebarInnerHtml } from './get-sidebar-html.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function escapeForTsString(s) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

function normalizeLf(s) {
  return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

const overlays = `<div class="pa-toast-wrap" id="paToastWrap" role="status" aria-live="polite"></div>
<div class="pa-confirm-overlay" id="paConfirmOverlay">
  <div class="pa-confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="paConfirmTitle">
    <div class="pa-confirm-icon"><i class="ri-delete-bin-line"></i></div>
    <div class="pa-confirm-title" id="paConfirmTitle">Delete this comment?</div>
    <div class="pa-confirm-text" id="paConfirmText">This will permanently remove the comment. This action cannot be undone.</div>
    <div class="pa-confirm-actions">
      <button class="pa-btn pa-btn-cancel flex" id="paConfirmCancel" type="button">Cancel</button>
      <button class="pa-btn pa-btn-primary pa-red flex aic" id="paConfirmOk" type="button">Confirm</button>
    </div>
  </div>
</div>
<div class="pa-panel-overlay" id="paPanelOverlay"></div>
<div class="pa-sidebar-overlay" id="paSidebarOverlay"></div>`;

const header = `<header class="pa-header">
  <div class="pa-header-top">
    <div class="pa-header-top-left"></div>
    <div class="pa-header-top-right pa-header-right">
      <div class="pa-notif-wrap" id="paNotifWrap">
        <div class="pa-notif" id="paNotifBtn" tabindex="0" role="button" aria-label="Notifications" title="Notifications">
          <i class="ri-notification-3-line"></i>
          <span class="pa-notif-badge" id="paNotifBadge">0</span>
        </div>
        <div class="pa-notif-dropdown" id="paNotifDropdown">
          <div class="pa-notif-dropdown-head">
            <span>Notifications</span>
            <button class="pa-notif-clear-btn" id="paNotifClearBtn" type="button">Clear all</button>
          </div>
          <div class="pa-notif-list" id="paNotifList"></div>
        </div>
      </div>
      <div class="pa-custom-toggle-wrap">
        <button class="pa-custom-toggle" id="paCustomToggle" type="button" title="Appearance Settings" aria-label="Open appearance settings">
          <i class="ri-palette-line"></i>
        </button>
      </div>
      <span class="pa-header-divider" aria-hidden="true"></span>
      <div class="pa-user-menu-wrap" id="paUserMenuWrap">
        <button type="button" class="pa-user pa-header-user" id="paUserMenu" aria-label="User menu" aria-haspopup="true" aria-expanded="false">
          <div class="pa-avatar" id="paUserMenuAvatar"><i class="ri-user-3-fill"></i></div>
          <div class="pa-user-info">
            <div class="pa-user-name">Admin User</div>
            <div class="pa-user-role">super admin</div>
          </div>
          <i class="ri-arrow-down-s-line pa-user-menu-chevron" aria-hidden="true"></i>
        </button>
        <div class="pa-user-dropdown" id="paUserDropdown" role="menu" aria-label="User menu">
          <div class="pa-user-dropdown-head">
            <button type="button" class="pa-user-dropdown-avatar" id="paUserDropdownAvatar" title="Change profile photo" aria-label="Change profile photo">
              <div class="pa-avatar"><i class="ri-user-3-fill"></i></div>
              <span class="pa-user-dropdown-avatar-edit"><i class="ri-camera-line"></i></span>
            </button>
            <div class="pa-user-dropdown-identity">
              <div class="pa-user-name">Admin User</div>
              <div class="pa-user-role">super admin</div>
              <div class="pa-user-email pa-user-dropdown-email"></div>
            </div>
          </div>
          <div class="pa-user-dropdown-divider"></div>
          <a href="/settings/profile" class="pa-user-dropdown-item" role="menuitem"><i class="ri-user-line"></i> My Profile</a>
          <a href="/settings/general" class="pa-user-dropdown-item" role="menuitem"><i class="ri-settings-3-line"></i> Settings</a>
          <a href="/settings/security" class="pa-user-dropdown-item" role="menuitem"><i class="ri-shield-keyhole-line"></i> Security</a>
          <a href="/recent-activities" class="pa-user-dropdown-item" role="menuitem"><i class="ri-history-line"></i> Recent Activities</a>
          <button type="button" class="pa-user-dropdown-item pa-admin-only-item" id="paAddUserMenuBtn" role="menuitem" hidden><i class="ri-user-add-line"></i> Add User</button>
          <div class="pa-user-dropdown-divider"></div>
          <button type="button" class="pa-user-dropdown-item danger" id="paUserDropdownLogout" role="menuitem"><i class="ri-logout-circle-line"></i> Logout</button>
        </div>
      </div>
    </div>
  </div>
</header>`;

const mainContent = normalizeLf(
  fs.readFileSync(path.join(root, 'app/blog-engagement/contentTemplate.html'), 'utf8'),
).trim();

const sidebarHtml = normalizeLf(await getSidebarInnerHtml()).trim();

const html = normalizeLf(`${overlays}
<div class="pa-shell">
  ${sidebarHtml}
  <div class="pa-main">
    ${header}
    <div class="pa-body pa-beng-root" id="paBlogEngBody">
      ${mainContent}
    </div>
  </div>
</div>`);

fs.mkdirSync(path.join(root, 'app/blog-engagement'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'app/blog-engagement/bodyHtml.tsx'),
  `export const BODY_HTML = "${escapeForTsString(html)}";\n`,
);
console.log('OK');
