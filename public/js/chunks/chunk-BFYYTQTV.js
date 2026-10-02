import {
  closePanels,
  openPanel,
  registerPanel
} from "./chunk-LQZU2QLT.js";
import {
  $id,
  showToast
} from "./chunk-S5QBHCBR.js";

// client/utils/staffRoles.ts
var STAFF_ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" }
];
function formatStaffRoleLabel(role) {
  const match = STAFF_ROLE_OPTIONS.find((opt) => opt.value === role);
  if (match) return match.label;
  return String(role || "Staff").replace(/_/g, " ");
}
function populateStaffRoleSelect(selectEl, { selected = "editor" } = {}) {
  if (!selectEl) return;
  selectEl.innerHTML = STAFF_ROLE_OPTIONS.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join("");
  selectEl.value = STAFF_ROLE_OPTIONS.some((opt) => opt.value === selected) ? selected : "editor";
}

// client/utils/userCredentialsPanel.ts
var lastCredentials = null;
var panelBound = false;
function hitControl(target, id) {
  if (!target) return false;
  if (target.id === id) return true;
  return typeof target.closest === "function" && !!target.closest(`#${id}`);
}
function initUserCredentialsPanel() {
  if (panelBound) return;
  panelBound = true;
  registerPanel("paUserCredentialsPanel");
  document.addEventListener("click", (e) => {
    if (hitControl(e.target, "paUserCredentialsPanelClose")) {
      e.preventDefault();
      closePanels();
      clearUserCredentials();
      return;
    }
    if (hitControl(e.target, "paCopyCredentialsBtn")) {
      e.preventDefault();
      void copyUserCredentials();
      return;
    }
    if (hitControl(e.target, "paShareCredentialsBtn")) {
      e.preventDefault();
      void shareUserCredentials();
    }
  });
}
function clearUserCredentials() {
  lastCredentials = null;
}
function formatUserCredentialsText(credentials = lastCredentials) {
  if (!credentials) return "";
  return [
    "Portfolio Dashboard Login",
    `Email: ${credentials.email}`,
    `Password: ${credentials.password}`,
    `Role: ${formatStaffRoleLabel(credentials.role)}`
  ].join("\n");
}
function showUserCredentialsPanel(credentials, { closePanelIds = [], emailSent, emailError } = {}) {
  if (!credentials) return;
  lastCredentials = credentials;
  const set = (id, value) => {
    const el = $id(id);
    if (el) el.value = value;
  };
  set("credEmail", credentials.email || "");
  set("credPassword", credentials.password || "");
  set("credRole", formatStaffRoleLabel(credentials.role));
  const title = $id("paUserCredentialsPanelTitle");
  if (title) {
    title.textContent = credentials.reset ? "Reset Credentials" : "User Credentials";
  }
  const hint = $id("paUserCredentialsPanel")?.querySelector(".pa-panel-body .pa-text-mute");
  if (hint) {
    const baseHint = credentials.reset ? "A new temporary password was generated. Share these credentials securely with the user." : "Share these credentials securely with the new user. They should change their password after first login.";
    if (emailSent === true) {
      hint.textContent = `${baseHint} Login credentials were emailed to ${credentials.email || "the user"}.`;
    } else if (emailSent === false && emailError) {
      hint.textContent = `${baseHint} Email could not be sent automatically (${emailError}). Use copy or share below.`;
    } else {
      hint.textContent = baseHint;
    }
  }
  openPanel("paUserCredentialsPanel", closePanelIds);
}
function notifyCredentialsEmailStatus({ emailSent, emailError, action = "created" } = {}) {
  if (emailSent) {
    showToast(
      action === "reset" ? "Credentials reset and emailed to the user." : "User created and login credentials emailed.",
      "success"
    );
    return;
  }
  if (emailSent === false && emailError) {
    showToast(
      action === "reset" ? `Credentials reset, but email could not be sent: ${emailError}` : `User created, but email could not be sent: ${emailError}`,
      "info"
    );
  }
}
async function copyUserCredentials() {
  const text = formatUserCredentialsText();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast("Credentials copied to clipboard.", "success");
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
      showToast("Credentials copied to clipboard.", "success");
    } catch {
      showToast("Could not copy credentials.", "danger");
    } finally {
      document.body.removeChild(area);
    }
  }
}
async function shareUserCredentials() {
  const text = formatUserCredentialsText();
  if (!text) return;
  const shareData = {
    title: "Portfolio Dashboard Login",
    text
  };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      showToast("Credentials shared.", "success");
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  const mailto = `mailto:?subject=${encodeURIComponent("Portfolio Dashboard Login")}&body=${encodeURIComponent(text)}`;
  window.location.href = mailto;
}

// client/utils/staffInviteLinkModal.ts
var state = null;
var bound = false;
var onCloseCallback = null;
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
  formatStaffRoleLabel,
  populateStaffRoleSelect,
  initUserCredentialsPanel,
  clearUserCredentials,
  showUserCredentialsPanel,
  notifyCredentialsEmailStatus,
  initStaffInviteLinkModal,
  showStaffInviteLinkModal
};
