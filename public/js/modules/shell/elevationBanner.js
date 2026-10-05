import { $id } from "../../utils/dom.js";
import { getAccessCapabilities } from "../../core/access.js";
import { authService } from "../../core/AuthService.js";
import { applyRoleBasedAccess, applyUserDisplay } from "../../utils/user-display.js";
import { applyCapabilityGatedElements } from "../../core/access.js";
const BANNER_ID = "paElevationBanner";
let expiryTimer = null;
function clearExpiryTimer() {
  if (expiryTimer) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }
}
function formatUntil(iso) {
  try {
    return new Date(iso).toLocaleString(void 0, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}
async function refreshSessionAfterExpiry() {
  try {
    const data = await authService.session();
    const user = data?.user;
    if (user) {
      applyUserDisplay(user);
      applyRoleBasedAccess(user.role, user.capabilities);
      applyCapabilityGatedElements(user.capabilities);
    }
  } catch {
  }
  syncElevationBanner();
}
function syncElevationBanner() {
  clearExpiryTimer();
  const caps = getAccessCapabilities();
  const main = document.querySelector(".pa-main");
  if (!main) return;
  const existing = $id(BANNER_ID);
  if (!caps.isElevated || !caps.elevatedUntil) {
    existing?.remove();
    return;
  }
  let banner = existing;
  if (!banner) {
    banner = document.createElement("div");
    banner.id = BANNER_ID;
    banner.className = "pa-elevation-banner";
    banner.setAttribute("role", "status");
    main.insertBefore(banner, main.firstChild);
  }
  banner.innerHTML = `<i class="ri-shield-check-line" aria-hidden="true"></i>
    <span>Temporary <strong>editor</strong> role active until <strong>${formatUntil(caps.elevatedUntil)}</strong>, then your account reverts automatically.</span>`;
  const ms = new Date(caps.elevatedUntil).getTime() - Date.now();
  if (ms > 0 && ms < 24 * 60 * 60 * 1e3) {
    expiryTimer = setTimeout(() => {
      void refreshSessionAfterExpiry();
    }, ms + 500);
  }
}
export {
  syncElevationBanner
};
//# sourceMappingURL=elevationBanner.js.map
