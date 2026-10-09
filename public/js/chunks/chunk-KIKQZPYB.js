// client/core/router.ts
var ROUTES = [
  ["/projects", "projects"],
  ["/project-tags", "project-tags"],
  ["/project-technologies", "project-technologies"],
  ["/project-categories", "categories"],
  ["/blog-tags", "blog-tags"],
  ["/tags", "project-tags"],
  ["/blog-categories", "blog-categories"],
  ["/tool-categories", "tool-categories"],
  ["/categories", "categories"],
  ["/technologies", "technologies"],
  ["/tools", "tools"],
  ["/media-library", "media"],
  ["/testimonials", "testimonials"],
  ["/blog-post", "blogposts"],
  ["/blog-engagement", "blog-engagement"],
  ["/experience", "experience"],
  ["/contact-messages", "contact-messages"],
  ["/access-requests", "access-requests"],
  ["/users", "users"],
  ["/recent-activities", "recent-activities"],
  ["/settings", "settings"],
  ["/login", "login"],
  ["/forget-password", "forgot-password"],
  ["/reset-password", "reset-password"]
];
var SETTINGS_TABS = ["general", "profile", "security", "notifications", "system"];
var SETTINGS_PAGE_META = {
  general: {
    title: "General Settings",
    subtitle: "Site title, timezone, and display defaults"
  },
  profile: {
    title: "Profile",
    subtitle: "Your public profile and account details"
  },
  security: {
    title: "Security",
    subtitle: "Password, two-factor authentication, and sessions"
  },
  notifications: {
    title: "Notifications",
    subtitle: "Email alerts, channels, and quiet hours"
  },
  system: {
    title: "System",
    subtitle: "Database export and environment configuration"
  }
};
function getSettingsTabFromPath(path = window.location.pathname) {
  const match = path.match(/\/settings\/([^/]+)\/?$/);
  const tab = match?.[1];
  return SETTINGS_TABS.includes(tab) ? tab : "general";
}
function getSettingsPageMeta(tab) {
  const resolved = SETTINGS_TABS.includes(tab) ? tab : "general";
  return SETTINGS_PAGE_META[resolved];
}
function getSettingsTabPath(tab) {
  const resolved = SETTINGS_TABS.includes(tab) ? tab : "general";
  return `/settings/${resolved}`;
}
function getCurrentPage(path = window.location.pathname) {
  if (path.includes("/login")) return "login";
  if (path.includes("/forget-password")) return "forgot-password";
  if (path.includes("/reset-password")) return "reset-password";
  const routes = [...ROUTES].sort((a, b) => b[0].length - a[0].length);
  for (const [needle, page] of routes) {
    if (path.includes(needle)) return page;
  }
  return "dashboard";
}
var PAGE = getCurrentPage();
function getLoginPath() {
  return "/login";
}

export {
  SETTINGS_TABS,
  getSettingsTabFromPath,
  getSettingsPageMeta,
  getSettingsTabPath,
  getCurrentPage,
  PAGE,
  getLoginPath
};
//# sourceMappingURL=chunk-KIKQZPYB.js.map
