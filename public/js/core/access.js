import { deriveAccessCapabilities } from "../../lib/auth/capabilities.js";
import { installViewerWriteGuard, stripCmsWriteControls } from "./cms-access.js";
let activeCapabilities = deriveAccessCapabilities("viewer");
function setAccessCapabilities(capabilities) {
  activeCapabilities = capabilities;
}
function setAccessFromRole(role) {
  setAccessCapabilities(deriveAccessCapabilities(role));
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
  if (!capabilities.canManageContent) {
    stripCmsWriteControls(document);
    installViewerWriteGuard();
  }
}
import { canManageContent } from "./cms-access.js";
export {
  applyCapabilityGatedElements,
  canManageContent,
  getAccessCapabilities,
  setAccessCapabilities,
  setAccessFromRole
};
