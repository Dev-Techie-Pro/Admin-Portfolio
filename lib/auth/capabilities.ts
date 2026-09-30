import { ADMIN_ROLES, EDITOR_ROLES, STAFF_ROLES } from './constants';

export type AccessCapabilities = {
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  /** Settings → Security: revoke all sessions (API: guardAdmin). */
  canLogoutAllDevices: boolean;
  /** Notification inbox “Clear all” (API: guardEditor). */
  canClearAllNotifications: boolean;
  /** Role upgrade request card (non-admin staff only). */
  canShowRoleRequestCard: boolean;
  /** Comments & Likes module (API: guardEditor on writes). */
  canAccessBlogEngagement: boolean;
};

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
    canLogoutAllDevices: isAdmin,
    canClearAllNotifications: isEditor,
    canShowRoleRequestCard: isStaff && !isAdmin,
    canAccessBlogEngagement: isEditor,
  };
}
