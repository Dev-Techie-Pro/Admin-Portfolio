// lib/auth/constants.ts
var STAFF_ROLES = ["super_admin", "admin", "editor", "viewer"];
var ADMIN_ROLES = ["super_admin", "admin"];
var EDITOR_ROLES = ["super_admin", "admin", "editor"];
var SESSION_LIFETIME_SECONDS = 24 * 60 * 60;
var SESSION_LIFETIME_MS = SESSION_LIFETIME_SECONDS * 1e3;

// lib/auth/capabilities.ts
function deriveAccessCapabilities(role) {
  const normalized = typeof role === "string" ? role : "viewer";
  const isStaff = STAFF_ROLES.includes(normalized);
  const isAdmin = ADMIN_ROLES.includes(normalized);
  const isEditor = EDITOR_ROLES.includes(normalized);
  const isViewer = normalized === "viewer";
  return {
    isAdmin,
    isEditor,
    isViewer,
    canLogoutAllDevices: isAdmin,
    canClearAllNotifications: isEditor,
    canShowRoleRequestCard: isStaff && !isAdmin,
    canAccessBlogEngagement: isEditor
  };
}

// client/core/access.ts
var activeCapabilities = deriveAccessCapabilities("viewer");
function setAccessCapabilities(capabilities) {
  activeCapabilities = capabilities;
}
function getAccessCapabilities() {
  return activeCapabilities;
}
function setElementAccessible(el, allowed) {
  if (allowed) {
    el.removeAttribute("hidden");
    el.removeAttribute("aria-hidden");
    el.style.removeProperty("display");
  } else {
    el.setAttribute("hidden", "");
    el.setAttribute("aria-hidden", "true");
    el.style.display = "none";
  }
}
function applyCapabilityGatedElements(capabilities = activeCapabilities) {
  document.querySelectorAll(".pa-admin-only-item").forEach((el) => {
    setElementAccessible(el, capabilities.isAdmin);
  });
  document.querySelectorAll(".pa-editor-only-item").forEach((el) => {
    setElementAccessible(el, capabilities.isEditor);
  });
  document.querySelectorAll(".pa-staff-only-item").forEach((el) => {
    setElementAccessible(el, capabilities.canShowRoleRequestCard);
  });
  ["logoutAllBtn", "logoutAllDevicesBtn"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) setElementAccessible(el, capabilities.canLogoutAllDevices);
  });
  const clearBtn = document.getElementById("paNotifClearBtn");
  if (clearBtn) setElementAccessible(clearBtn, capabilities.canClearAllNotifications);
}

export {
  deriveAccessCapabilities,
  setAccessCapabilities,
  getAccessCapabilities,
  applyCapabilityGatedElements
};
