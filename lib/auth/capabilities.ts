import { ADMIN_ROLES, EDITOR_ROLES, STAFF_ROLES } from './constants';

/** Settings sub-routes a read-only viewer may open. */
export const VIEWER_SETTINGS_TABS = ['profile', 'security', 'notifications'] as const;

export type AccessCapabilities = {
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  /** CMS create / update / delete (API: guardEditor). */
  canManageContent: boolean;
  /** Settings → Security: revoke all sessions (API: guardAdmin). */
  canLogoutAllDevices: boolean;
  /** Notification inbox “Clear all” (API: guardEditor). */
  canClearAllNotifications: boolean;
  /** Role upgrade request card (non-admin staff only). */
  canShowRoleRequestCard: boolean;
  /** Comments & Likes module (API: guardEditor on writes). */
  canAccessBlogEngagement: boolean;
  /** Recent activities + login history for all staff (API: admin-only scope). */
  canViewAllStaffActivity: boolean;
  /** Profile, avatar/cover, notifications, and account security (all staff including viewer). */
  canManageOwnAccountSettings: boolean;
};

export function canAccessSettingsTab(
  tab: string,
  capabilities: Pick<AccessCapabilities, 'canManageContent' | 'isViewer'>,
): boolean {
  if (capabilities.canManageContent) return true;
  return (VIEWER_SETTINGS_TABS as readonly string[]).includes(tab);
}

export function deriveAccessCapabilities(role: string | null | undefined): AccessCapabilities {
  const normalized = typeof role === 'string' ? role : 'viewer';
  const isStaff = STAFF_ROLES.includes(normalized);
  const isAdmin = ADMIN_ROLES.includes(normalized);
  const isEditor = EDITOR_ROLES.includes(normalized);
  const isViewer = normalized === 'viewer';

  return {
    isAdmin,
    isEditor,
    isViewer,
    canManageContent: isEditor,
    canLogoutAllDevices: isAdmin,
    canClearAllNotifications: isEditor,
    canShowRoleRequestCard: isStaff && !isAdmin,
    canAccessBlogEngagement: isEditor,
    canViewAllStaffActivity: isAdmin,
    canManageOwnAccountSettings: isStaff,
  };
}
