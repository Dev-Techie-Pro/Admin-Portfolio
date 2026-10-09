// @ts-nocheck
import { getKeysForPage } from './prefetch-config';
import {
  getProjects,
  getCategories,
  getTechnologies,
  getMedia,
  getTestimonials,
  getBlogPosts,
  getExperience,
  getContactMessagesPage,
  CONTACT_PAGE_SIZE,
  getRecentActivitiesPayload,
  getToolItems,
  getToolCategories,
  getBlogCategories,
  getProjectTagLabels,
  getProjectTechnologyUsage,
  getBlogTags,
  getSettings,
  getContactColumnVisibility,
} from './repository';
import { getNotificationPreferences, getUserNotifications } from './notifications';
import { getProfileForUser } from '@/lib/auth/profile';
import { getActiveElevationUntil, getStaffCapabilities } from '@/lib/auth/elevation';

const KEY_FETCHERS = {
  pa_projects: getProjects,
  pa_category_meta: getCategories,
  pa_technologies: getTechnologies,
  pa_media_library: getMedia,
  pa_testimonials: getTestimonials,
  pa_blog_posts: () => getBlogPosts({ includeContent: true }),
  pa_experience: getExperience,
  pa_contact_messages: () => getContactMessagesPage({ limit: CONTACT_PAGE_SIZE }),
  pa_recent_activities: async (auth) => {
    const scopeAll = auth.capabilities?.canViewAllStaffActivity
      ?? getStaffCapabilities(auth.profile.role, auth.elevatedUntil).canViewAllStaffActivity;
    const payload = await getRecentActivitiesPayload({
      userId: auth.user.id,
      scopeAll,
    });
    return { ...payload, scope: scopeAll ? 'all' : 'self' };
  },
  pa_tools: getToolItems,
  pa_tool_categories: getToolCategories,
  pa_blog_categories: getBlogCategories,
  pa_project_tag_labels: getProjectTagLabels,
  pa_project_technology_usage: getProjectTechnologyUsage,
  pa_blog_tags: getBlogTags,
  pa_project_tags: getProjectTagLabels,
  pa_settings: getSettings,
  pa_msg_column_visibility: getContactColumnVisibility,
  pa_notification_preferences: (auth) => getNotificationPreferences(auth.user.id),
  pa_notifications: (auth) => getUserNotifications(auth.user.id),
};

function sessionFromProfile(userId, authEmail, profile, elevatedUntil) {
  const role = profile?.role ?? 'viewer';
  const capabilities = getStaffCapabilities(role, elevatedUntil);
  return {
    id: userId,
    email: profile?.email || authEmail || '',
    role,
    fullName: profile?.fullName || null,
    username: profile?.username || null,
    avatarUrl: profile?.avatarUrl || null,
    coverImageUrl: profile?.coverImageUrl || null,
    capabilities,
    elevatedUntil: capabilities.elevatedUntil,
  };
}

async function fetchPageData(page, auth) {
  const pageKeys = getKeysForPage(page);
  const entries = await Promise.all(
    pageKeys.map(async (key) => {
      const fetcher = KEY_FETCHERS[key];
      if (!fetcher) return [key, null];
      try {
        return [key, await fetcher(auth)];
      } catch (err) {
        console.error(`[bootstrap] failed to load "${key}":`, err);
        return [key, null];
      }
    }),
  );

  const data = Object.fromEntries(entries);

  if (!data.pa_notifications) {
    try {
      data.pa_notifications = await getUserNotifications(auth.user.id);
    } catch (err) {
      console.error('[bootstrap] failed to load "pa_notifications":', err);
      data.pa_notifications = null;
    }
  }

  return data;
}

export async function getBootstrapPayload(page, auth) {
  const [profile, data] = await Promise.all([
    getProfileForUser(auth.user),
    fetchPageData(page, auth),
  ]);

  const elevatedUntil = auth.elevatedUntil ?? await getActiveElevationUntil(auth.user.id);
  const sessionUser = sessionFromProfile(auth.user.id, auth.user.email, profile, elevatedUntil);

  return {
    profile,
    session: { user: sessionUser },
    data,
    fetchedAt: new Date().toISOString(),
  };
}
