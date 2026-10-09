// @ts-nocheck
import { ADMIN_ROLES, EDITOR_ROLES, STAFF_ROLES } from './constants';

function isElevationActive(elevatedUntil: string | null | undefined): boolean {
  if (!elevatedUntil) return false;
  return new Date(elevatedUntil).getTime() > Date.now();
}

/** Settings sub-routes a read-only viewer may open. */
export const VIEWER_SETTINGS_TABS = ['profile', 'security', 'notifications'] as const;

export type AccessCapabilities = {
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  /** CMS create / update / delete (API: guardEditor). */
  canManageContent: boolean;
  /** Site settings, contact column prefs (API: guardAdmin). */
  canManageSiteSettings: boolean;
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
  /** Active temporary editor elevation (profiles.role reverts after elevated_until). */
  isElevated: boolean;
  elevatedUntil: string | null;
};

const ADMIN_SETTINGS_TABS = ['system'] as const;

/** Storage keys that persist via guardAdmin API routes. */
export const SITE_SETTINGS_STORAGE_KEYS = new Set([
  'pa_settings',
  'pa_msg_column_visibility',
]);

export function isSiteSettingsStorageKey(key: string): boolean {
  return SITE_SETTINGS_STORAGE_KEYS.has(key);
}

export function canAccessSettingsTab(
  tab: string,
  capabilities: Pick<AccessCapabilities, 'canManageContent' | 'isViewer' | 'isAdmin'>,
): boolean {
  if ((ADMIN_SETTINGS_TABS as readonly string[]).includes(tab)) {
    return capabilities.isAdmin;
  }
  if (capabilities.canManageContent) return true;
  return (VIEWER_SETTINGS_TABS as readonly string[]).includes(tab);
}

export function deriveAccessCapabilities(
  role: string | null | undefined,
  elevatedUntil?: string | null,
): AccessCapabilities {
  const normalized = typeof role === 'string' ? role : 'viewer';
  const isStaff = STAFF_ROLES.includes(normalized);
  const isAdmin = ADMIN_ROLES.includes(normalized);
  const baseEditor = EDITOR_ROLES.includes(normalized);
  const isViewer = normalized === 'viewer';
  const elevated = !isAdmin && isElevationActive(elevatedUntil ?? null);
  const elevatedUntilIso = elevated && elevatedUntil ? elevatedUntil : null;

  const editorLike = baseEditor || elevated;

  return {
    isAdmin,
    isEditor: editorLike,
    isViewer: isViewer && !elevated,
    canManageContent: editorLike,
    canManageSiteSettings: isAdmin,
    canLogoutAllDevices: isAdmin,
    canClearAllNotifications: editorLike,
    canShowRoleRequestCard: isStaff && !isAdmin && !elevated,
    canAccessBlogEngagement: editorLike,
    canViewAllStaffActivity: isAdmin,
    canManageOwnAccountSettings: isStaff,
    isElevated: elevated,
    elevatedUntil: elevatedUntilIso,
  };
}
