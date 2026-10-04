import { getSettingsTabFromPath } from "../../core/router.js";
import { syncSidebarGroupNav } from "./sidebarGroupNav.js";
import { syncSidebarRailActive } from "./sidebarRailNav.js";
const NAV_BY_PATH = [
  ["/tool-categories", "Tool Categories"],
  ["/recent-activities", "Recent Activities"],
  ["/access-requests", "Access Requests"],
  ["/users", "Users"],
  ["/contact-messages", "Contact Messages"],
  ["/media-library", "Media Library"],
  ["/technologies", "Technologies"],
  ["/blog-categories", "Blog Categories"],
  ["/project-categories", "Project Categories"],
  ["/categories", "Project Categories"],
  ["/project-technologies", "Project Technologies"],
  ["/project-tags", "Project Tags"],
  ["/blog-tags", "Blog Tags"],
  ["/blog-engagement", "Comments & Likes"],
  ["/blog-post", "Blog Posts"],
  ["/testimonials", "Testimonials"],
  ["/experience", "Experience"],
  ["/tags", "Project Tags"],
  ["/projects", "Projects"],
  ["/settings", "Settings"],
  ["/tools", "Tools"]
];
const NAV_BY_PATH_SORTED = [...NAV_BY_PATH].sort((a, b) => b[0].length - a[0].length);
function resolveActiveNav(path = window.location.pathname) {
  if (path === "/" || path === "") return "Dashboard";
  for (const [needle, label] of NAV_BY_PATH_SORTED) {
    if (path.includes(needle)) return label;
  }
  return null;
}
function syncSidebarActiveNav() {
  const active = resolveActiveNav();
  if (!active) return;
  document.querySelectorAll(".pa-nav-subitem[data-nav]").forEach((item) => {
    item.classList.toggle("active", item.dataset.nav === active);
  });
  if (active === "Settings" && window.location.pathname.includes("/settings")) {
    const tab = getSettingsTabFromPath();
    document.querySelectorAll(".pa-nav-subitem[data-settings-tab]").forEach((item) => {
      item.classList.toggle("active", item.dataset.settingsTab === tab);
    });
  } else {
    document.querySelectorAll(".pa-nav-subitem[data-settings-tab]").forEach((item) => {
      item.classList.remove("active");
    });
  }
  syncSidebarGroupNav();
  syncSidebarRailActive();
}
let sidebarNavBound = false;
function bindSidebarPrefetch() {
  const warm = typeof window.__paWarmPrefetchPath === "function" ? window.__paWarmPrefetchPath : null;
  if (!warm) return;
  document.querySelectorAll(".pa-nav-subitem[href], .pa-logo-link[href]").forEach((link) => {
    link.addEventListener("pointerenter", () => {
      const href = link.getAttribute("href");
      if (href) warm(href);
    }, { passive: true });
  });
}
function initSidebarNav() {
  syncSidebarActiveNav();
  if (!sidebarNavBound) {
    window.addEventListener("popstate", syncSidebarActiveNav);
    bindSidebarPrefetch();
    sidebarNavBound = true;
  }
}
function syncSettingsNavTab(tab) {
  if (window.location.pathname.includes("/settings")) {
    syncSidebarActiveNav();
  }
}
export {
  initSidebarNav,
  resolveActiveNav,
  syncSettingsNavTab,
  syncSidebarActiveNav
};
