import { $id } from "./dom.js";
import { showToast } from "../modules/shell/toast.js";
import { closePanels } from "../modules/shell/panels.js";
import { formatStaffRoleLabel } from "./staffRoles.js";
let state = null;
let bound = false;
let onCloseCallback = null;
function overlayEl() {
  return $id("paStaffInviteLinkOverlay");
}
function setStatus(message, tone = "muted") {
  const el = $id("paStaffInviteLinkStatus");
  if (!el) return;
  if (!message) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  el.hidden = false;
  el.textContent = message;
  el.classList.remove("is-success", "is-danger");
  if (tone === "success") el.classList.add("is-success");
  if (tone === "danger") el.classList.add("is-danger");
}
function initStaffInviteLinkModal() {
  if (bound) return;
  bound = true;
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!target) return;
    if (target.closest("#paStaffInviteLinkClose")) {
      e.preventDefault();
      hideStaffInviteLinkModal();
      return;
    }
    if (target.closest("#paStaffInviteLinkCopy")) {
      e.preventDefault();
      void copyInviteLink();
      return;
    }
    if (target.closest("#paStaffInviteLinkSendEmail")) {
      e.preventDefault();
      void sendInviteEmail();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlayEl()?.classList.contains("visible")) {
      hideStaffInviteLinkModal();
    }
  });
  overlayEl()?.addEventListener("click", (e) => {
    if (e.target === overlayEl()) hideStaffInviteLinkModal();
  });
}
function showStaffInviteLinkModal(payload, options = {}) {
  state = {
    email: payload.email,
    role: payload.role,
    actionLink: payload.actionLink
  };
  onCloseCallback = options.onClose ?? null;
  const emailEl = $id("paStaffInviteLinkEmail");
  const roleEl = $id("paStaffInviteLinkRole");
  const urlEl = $id("paStaffInviteLinkUrl");
  if (emailEl) emailEl.value = state.email;
  if (roleEl) roleEl.value = formatStaffRoleLabel(state.role);
  if (urlEl) urlEl.value = state.actionLink;
  setStatus("");
  closePanels();
  const overlay = overlayEl();
  if (!overlay) {
    console.warn("[invite] modal markup missing");
    return;
  }
  overlay.classList.add("visible");
  overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  window.setTimeout(() => $id("paStaffInviteLinkSendEmail")?.focus(), 80);
}
function hideStaffInviteLinkModal() {
  const overlay = overlayEl();
  overlay?.classList.remove("visible");
  overlay?.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  state = null;
  const cb = onCloseCallback;
  onCloseCallback = null;
  cb?.();
}
async function copyInviteLink() {
  if (!state?.actionLink) return;
  try {
    await navigator.clipboard.writeText(state.actionLink);
    showToast("Invite link copied.", "success");
  } catch {
    showToast("Could not copy link. Select the link field and copy manually.", "danger");
  }
}
async function sendInviteEmail() {
  if (!state) return;
  const btn = $id("paStaffInviteLinkSendEmail");
  btn?.setAttribute("disabled", "true");
  setStatus("Sending\u2026", "muted");
  const linkInput = $id("paStaffInviteLinkUrl");
  const actionLink = (linkInput?.value || state.actionLink || "").trim();
  const emailField = $id("paStaffInviteLinkEmail");
  const email = (emailField?.value || state.email || "").trim();
  const role = state.role || "editor";
  if (!actionLink) {
    setStatus("Invite link is missing.", "danger");
    btn?.removeAttribute("disabled");
    return;
  }
  try {
    const res = await fetch("/api/admin/invites/send-email", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        role,
        actionLink
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Could not send email.");
    }
    setStatus(`Invitation emailed to ${state.email}.`, "success");
    showToast("Invitation sent via SMTP.", "success", 3200);
    window.setTimeout(() => hideStaffInviteLinkModal(), 1200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send email.";
    setStatus(message, "danger");
    showToast(message, "danger", 4e3);
  } finally {
    btn?.removeAttribute("disabled");
  }
}
export {
  hideStaffInviteLinkModal,
  initStaffInviteLinkModal,
  showStaffInviteLinkModal
};
//# sourceMappingURL=staffInviteLinkModal.js.map
