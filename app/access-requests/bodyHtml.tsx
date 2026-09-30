/** Static shell; sidebar and admin-only nav are personalized server-side. */
export const BODY_HTML = `<div class="pa-toast-wrap" id="paToastWrap" role="status" aria-live="polite"></div>
<div class="pa-confirm-overlay" id="paConfirmOverlay">
  <div class="pa-confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="paConfirmTitle">
    <div class="pa-confirm-icon"><i class="ri-delete-bin-line"></i></div>
    <div class="pa-confirm-title" id="paConfirmTitle">Confirm</div>
    <div class="pa-confirm-text" id="paConfirmText"></div>
    <div class="pa-confirm-actions">
      <button class="pa-btn pa-btn-cancel flex-1" id="paConfirmCancel">Cancel</button>
      <button class="pa-btn pa-btn-primary flex-1" id="paConfirmOk">Confirm</button>
    </div>
  </div>
</div>
<div class="pa-sidebar-overlay" id="paSidebarOverlay"></div>
<div class="pa-shell">
  <aside class="pa-sidebar" id="paSidebar"></aside>
  <div class="pa-main">
    <header class="pa-header">
      <div class="pa-header-top">
        <div class="pa-header-top-left"></div>
        <div class="pa-header-top-right pa-header-right">
          <div class="pa-notif-wrap" id="paNotifWrap">
            <div class="pa-notif" id="paNotifBtn" tabindex="0" role="button" aria-label="Notifications">
              <i class="ri-notification-3-line"></i>
              <span class="pa-notif-badge" id="paNotifBadge"></span>
            </div>
            <div class="pa-notif-dropdown" id="paNotifDropdown">
              <div class="pa-notif-dropdown-head">
                <span>Notifications</span>
                <button class="pa-notif-clear-btn" id="paNotifClearBtn">Clear all</button>
              </div>
              <div class="pa-notif-list" id="paNotifList"></div>
            </div>
          </div>
          <div class="pa-custom-toggle-wrap">
            <button class="pa-custom-toggle" id="paEditorsToggle" title="Appearance Settings" aria-label="Open appearance settings">
              <i class="ri-palette-line"></i>
            </button>
          </div>
          <span class="pa-header-divider" aria-hidden="true"></span>
          <div class="pa-user-menu-wrap" id="paUserMenuWrap">
            <button type="button" class="pa-user pa-header-user" id="paUserMenu" aria-label="User menu" aria-haspopup="true" aria-expanded="false">
              <div class="pa-avatar" id="paUserMenuAvatar"><i class="ri-user-3-fill"></i></div>
              <div class="pa-user-info">
                <div class="pa-user-name">Staff</div>
                <div class="pa-user-role">admin</div>
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
                  <div class="pa-user-name">Staff</div>
                  <div class="pa-user-role">admin</div>
                  <div class="pa-user-email pa-user-dropdown-email"></div>
                </div>
              </div>
              <div class="pa-user-dropdown-divider"></div>
              <a href="/settings/profile" class="pa-user-dropdown-item" role="menuitem"><i class="ri-user-line"></i> My Profile</a>
              <a href="/settings/general" class="pa-user-dropdown-item" role="menuitem"><i class="ri-settings-3-line"></i> Settings</a>
              <a href="/settings/security" class="pa-user-dropdown-item" role="menuitem"><i class="ri-shield-keyhole-line"></i> Security</a>
              <button type="button" class="pa-user-dropdown-item pa-admin-only-item" id="paAddUserMenuBtn" role="menuitem" hidden><i class="ri-user-add-line"></i> Add User</button>
              <div class="pa-user-dropdown-divider"></div>
              <button type="button" class="pa-user-dropdown-item danger" id="paUserDropdownLogout" role="menuitem"><i class="ri-logout-circle-line"></i> Logout</button>
            </div>
          </div>
        </div>
      </div>
    </header>
    <div class="pa-body" id="paAccessRequestsBody">
      <div class="pa-header-page">
        <div class="pa-header-page-left">
          <div class="pa-header-title-block">
            <span class="pa-header-accent" aria-hidden="true"></span>
            <div class="pa-header-left">
              <div class="pa-page-title">Access requests</div>
              <div class="pa-page-subtitle">Approve or decline temporary CMS access (3 hours)</div>
            </div>
          </div>
        </div>
        <div class="pa-header-page-right">
          <button type="button" class="pa-btn pa-btn-secondary" id="paAccessRequestsRefresh">
            <i class="ri-refresh-line"></i> Refresh
          </button>
        </div>
      </div>
      <div class="pa-toolbar pa-cat-toolbar">
        <div class="pa-status-tabs" role="tablist" aria-label="Filter requests">
          <button type="button" class="pa-status-tab active" data-access-filter="all" role="tab" aria-selected="true">All</button>
          <button type="button" class="pa-status-tab" data-access-filter="pending" role="tab" aria-selected="false">Pending</button>
          <button type="button" class="pa-status-tab" data-access-filter="approved" role="tab" aria-selected="false">Approved</button>
          <button type="button" class="pa-status-tab" data-access-filter="rejected" role="tab" aria-selected="false">Rejected</button>
        </div>
        <div class="pa-toolbar-spacer"></div>
        <div class="pa-result-count" id="paAccessRequestsCount"></div>
      </div>
      <div class="pa-access-requests-list" id="paAccessRequestsList" aria-live="polite"></div>
      <div class="pa-empty-state" id="paAccessRequestsEmpty" hidden>
        <i class="ri-inbox-line"></i>
        <div class="pa-empty-title">No requests</div>
        <div class="pa-empty-text">Staff access requests will appear here.</div>
      </div>
    </div>
  </div>
</div>`;
