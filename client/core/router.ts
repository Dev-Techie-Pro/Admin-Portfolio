// @ts-nocheck
const ROUTES = [
  ['/projects', 'projects'],
  ['/project-tags', 'project-tags'],
  ['/project-technologies', 'project-technologies'],
  ['/project-categories', 'categories'],
  ['/blog-tags', 'blog-tags'],
  ['/tags', 'project-tags'],
  ['/blog-categories', 'blog-categories'],
  ['/tool-categories', 'tool-categories'],
  ['/categories', 'categories'],
  ['/technologies', 'technologies'],
  ['/tools', 'tools'],
  ['/media-library', 'media'],
  ['/testimonials', 'testimonials'],
  ['/blog-post', 'blogposts'],
  ['/blog-engagement', 'blog-engagement'],
  ['/experience', 'experience'],
  ['/contact-messages', 'contact-messages'],
  ['/access-requests', 'access-requests'],
  ['/users', 'users'],
  ['/recent-activities', 'recent-activities'],
  ['/settings', 'settings'],
  ['/login', 'login'],
  ['/forget-password', 'forgot-password'],
  ['/reset-password', 'reset-password'],
];

export const SETTINGS_TABS = ['general', 'profile', 'security', 'notifications', 'system'];

export const SETTINGS_PAGE_META = {
  general: {
    title: 'General Settings',
    subtitle: 'Site title, timezone, and display defaults',
  },
  profile: {
    title: 'Profile',
    subtitle: 'Your public profile and account details',
  },
  security: {
    title: 'Security',
    subtitle: 'Password, two-factor authentication, and sessions',
  },
  notifications: {
    title: 'Notifications',
    subtitle: 'Email alerts, channels, and quiet hours',
  },
  system: {
    title: 'System',
    subtitle: 'Database export and environment configuration',
  },
};

/** @param {string} [path] */
export function getSettingsTabFromPath(path = window.location.pathname) {
  const match = path.match(/\/settings\/([^/]+)\/?$/);
  const tab = match?.[1];
  return SETTINGS_TABS.includes(tab) ? tab : 'general';
}

/** @param {string} tab */
export function getSettingsPageMeta(tab) {
  const resolved = SETTINGS_TABS.includes(tab) ? tab : 'general';
  return SETTINGS_PAGE_META[resolved];
}

/** @param {string} tab */
export function getSettingsTabPath(tab) {
  const resolved = SETTINGS_TABS.includes(tab) ? tab : 'general';
  return `/settings/${resolved}`;
}

/** @returns {string} the current page key, defaulting to "dashboard". */
export function getCurrentPage(path = window.location.pathname) {
  // Check for auth pages first
  if (path.includes('/login')) return 'login';
  if (path.includes('/forget-password')) return 'forgot-password';
  if (path.includes('/reset-password')) return 'reset-password';

  const routes = [...ROUTES].sort((a, b) => b[0].length - a[0].length);
  for (const [needle, page] of routes) {
    if (path.includes(needle)) return page;
  }
  return 'dashboard';
}

/** @deprecated Use getCurrentPage() — this is fixed at first module load and stale after client navigation. */
export const PAGE = getCurrentPage();

/**
 * Resolves the login page path. Next.js serves every route from the root,
 * so this is now a single absolute path rather than a depth-relative one.
 * @returns {string} the path to use for window.location.href
 */
export function getLoginPath() {
  return '/login';
}

/**
 * Get the absolute Next.js path for an auth page based on its original
 * filename, so any existing call sites that still pass e.g. 'login.html'
 * or 'forget-password.html' keep working unchanged.
 * @param {string} page - The auth page filename (e.g., 'login.html')
 * @returns {string} the absolute path to the auth page
 */
export function getAuthPath(page) {
  const map = {
    'login.html': '/login',
    'forget-password.html': '/forget-password',
    'reset-password.html': '/reset-password',
  };
  return map[page] || '/login';
}