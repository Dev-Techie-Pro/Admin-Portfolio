/** Static shell; sidebar is personalized server-side (`personalizePageHtml`). */
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
<div class="pa-panel-overlay" id="paPanelOverlay"></div>
<div class="pa-sidebar-overlay" id="paSidebarOverlay"></div>
<div class="pa-shell">
  <aside class="pa-sidebar" id="paSidebar"></aside>
  <div class="pa-main">
    <header class="pa-header">
      <div class="pa-header-top">
        <div class="pa-header-top-left">
          <div class="pa-search" id="paSearchWrap">
            <i class="ri-search-line"></i>
            <input type="text" placeholder="Search technologies…" id="paSearchInput" aria-label="Search technologies" />
            <button class="pa-search-clear" id="paSearchClear" aria-label="Clear search">
              <i class="ri-close-line"></i>
            </button>
            <span class="pa-search-kbd">⌘K</span>
          </div>
        </div>
        <div class="pa-header-top-right pa-header-right">
          <div class="pa-notif-wrap" id="paNotifWrap">
            <div class="pa-notif" id="paNotifBtn" tabindex="0" role="button" aria-label="Notifications" title="Notifications">
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
            <button class="pa-custom-toggle" id="paCustomToggle" title="Appearance Settings" aria-label="Open appearance settings">
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
              <a href="/recent-activities" class="pa-user-dropdown-item" role="menuitem"><i class="ri-history-line"></i> Recent Activities</a>
              <button type="button" class="pa-user-dropdown-item pa-admin-only-item" id="paAddUserMenuBtn" role="menuitem" hidden><i class="ri-user-add-line"></i> Add User</button>
              <div class="pa-user-dropdown-divider"></div>
              <button type="button" class="pa-user-dropdown-item danger" id="paUserDropdownLogout" role="menuitem"><i class="ri-logout-circle-line"></i> Logout</button>
            </div>
          </div>
        </div>
      </div>
    </header>
    <div class="pa-body" id="paProjTechBody">
      <div class="pa-header-page">
        <div class="pa-header-page-left">
          <button class="pa-mobile-toggle" id="paMobileToggle" aria-label="Toggle menu"><i class="ri-menu-line"></i></button>
          <div class="pa-header-title-block">
            <span class="pa-header-accent" aria-hidden="true"></span>
            <div class="pa-header-left">
              <div class="pa-page-title">Project Technologies</div>
              <div class="pa-page-subtitle">Skills used across projects (managed under Tech &amp; Tools)</div>
            </div>
          </div>
        </div>
        <div class="pa-header-page-right">
          <a class="pa-btn-add" href="/technologies"><i class="ri-code-s-slash-line"></i> <span>Manage skills</span></a>
        </div>
      </div>

      <div class="pa-stats-grid pa-dash-stats-grid pa-cat-stats">
        <div class="pa-dash-stat-card pa-dash-stat-card--orange pa-cat-stat-card">
          <span class="pa-dash-stat-accent" aria-hidden="true"></span>
          <div class="pa-dash-stat-main">
            <div class="pa-dash-icon-circle orange"><i class="ri-code-s-slash-line"></i></div>
            <div class="pa-dash-stat-text">
              <div class="pa-dash-stat-label">Total skills</div>
              <div class="pa-dash-stat-number" id="paProjTechStatTotal">0</div>
            </div>
            <span class="pa-dash-stat-change neutral" id="paProjTechStatTotalTrend"><i class="ri-subtract-line"></i> 0%</span>
          </div>
          <div class="pa-dash-stat-footer"><span class="pa-dash-stat-vs">in catalog</span></div>
        </div>
        <div class="pa-dash-stat-card pa-dash-stat-card--green pa-cat-stat-card">
          <span class="pa-dash-stat-accent" aria-hidden="true"></span>
          <div class="pa-dash-stat-main">
            <div class="pa-dash-icon-circle green"><i class="ri-links-line"></i></div>
            <div class="pa-dash-stat-text">
              <div class="pa-dash-stat-label">Used on projects</div>
              <div class="pa-dash-stat-number" id="paProjTechStatUsed">0</div>
            </div>
            <span class="pa-dash-stat-change neutral" id="paProjTechStatUsedTrend"><i class="ri-subtract-line"></i> 0%</span>
          </div>
          <div class="pa-dash-stat-footer"><span class="pa-dash-stat-vs">with ≥1 project</span></div>
        </div>
        <div class="pa-dash-stat-card pa-dash-stat-card--blue pa-cat-stat-card">
          <span class="pa-dash-stat-accent" aria-hidden="true"></span>
          <div class="pa-dash-stat-main">
            <div class="pa-dash-icon-circle blue"><i class="ri-inbox-line"></i></div>
            <div class="pa-dash-stat-text">
              <div class="pa-dash-stat-label">Unused</div>
              <div class="pa-dash-stat-number" id="paProjTechStatUnused">0</div>
            </div>
            <span class="pa-dash-stat-change neutral" id="paProjTechStatUnusedTrend"><i class="ri-subtract-line"></i> 0%</span>
          </div>
          <div class="pa-dash-stat-footer"><span class="pa-dash-stat-vs">not linked yet</span></div>
        </div>
        <div class="pa-dash-stat-card pa-dash-stat-card--purple pa-cat-stat-card">
          <span class="pa-dash-stat-accent" aria-hidden="true"></span>
          <div class="pa-dash-stat-main">
            <div class="pa-dash-icon-circle purple"><i class="ri-apps-line"></i></div>
            <div class="pa-dash-stat-text">
              <div class="pa-dash-stat-label">Project links</div>
              <div class="pa-dash-stat-number" id="paProjTechStatLinks">0</div>
            </div>
            <span class="pa-dash-stat-change neutral" id="paProjTechStatLinksTrend"><i class="ri-subtract-line"></i> 0%</span>
          </div>
          <div class="pa-dash-stat-footer"><span class="pa-dash-stat-vs">total assignments</span></div>
        </div>
      </div>

      <div class="pa-toolbar pa-cat-toolbar">
        <div class="pa-view-toggle pa-cat-view-toggle" role="group" aria-label="View mode">
          <button class="pa-view-btn active" id="paGridViewBtn" title="Grid view" aria-label="Grid view"><i class="ri-layout-grid-fill"></i></button>
          <button class="pa-view-btn" id="paListViewBtn" title="List view" aria-label="List view"><i class="ri-list-unordered"></i></button>
        </div>
        <select class="pa-filter-select" id="paProjTechUsageFilter" aria-label="Filter by usage">
          <option value="all">All skills</option>
          <option value="used">Used on projects</option>
          <option value="unused">Unused</option>
        </select>
        <select class="pa-filter-select" id="paProjTechSortFilter" aria-label="Sort technologies">
          <option value="name">Name (A–Z)</option>
          <option value="count-desc">Most projects</option>
          <option value="count-asc">Fewest projects</option>
        </select>
        <div class="pa-toolbar-spacer"></div>
        <div class="pa-result-count" id="paProjTechResultCount"></div>
      </div>

      <div class="pa-grid pa-cat-grid" id="paProjTechGrid" aria-live="polite" aria-label="Project technologies"></div>
      <div class="pa-pagination" id="paProjTechPagination">
        <div class="pa-pagination-btns" id="paProjTechPaginationBtns"></div>
        <div class="pa-pagination-info" id="paProjTechPaginationInfo"></div>
      </div>
    </div>
  </div>
</div>`;
