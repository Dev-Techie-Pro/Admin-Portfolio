import { $id } from './dom.js';
import { showToast } from '../modules/shell/toast.js';
import { closePanels } from '../modules/shell/panels.js';
import { formatStaffRoleLabel } from './staffRoles.js';

type InviteLinkModalState = {
  email: string;
  role: string;
  actionLink: string;
};

let state: InviteLinkModalState | null = null;
let bound = false;
let onCloseCallback: (() => void) | null = null;

function overlayEl() {
  return $id('paStaffInviteLinkOverlay');
}

function setStatus(message: string, tone: 'muted' | 'success' | 'danger' = 'muted') {
  const el = $id('paStaffInviteLinkStatus');
  if (!el) return;
  if (!message) {
    el.hidden = true;
    el.textContent = '';
    return;
  }
  el.hidden = false;
  el.textContent = message;
  el.classList.remove('is-success', 'is-danger');
  if (tone === 'success') el.classList.add('is-success');
  if (tone === 'danger') el.classList.add('is-danger');
}

export function initStaffInviteLinkModal() {
  if (bound) return;
  bound = true;

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    if (target.closest('#paStaffInviteLinkClose')) {
      e.preventDefault();
      hideStaffInviteLinkModal();
      return;
    }
    if (target.closest('#paStaffInviteLinkCopy')) {
      e.preventDefault();
      void copyInviteLink();
      return;
    }
    if (target.closest('#paStaffInviteLinkSendEmail')) {
      e.preventDefault();
      void sendInviteEmail();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlayEl()?.classList.contains('visible')) {
      hideStaffInviteLinkModal();
    }
  });

  overlayEl()?.addEventListener('click', (e) => {
    if (e.target === overlayEl()) hideStaffInviteLinkModal();
  });
}

export function showStaffInviteLinkModal(
  payload: InviteLinkModalState,
  options: { onClose?: () => void } = {},
) {
  state = {
    email: payload.email,
    role: payload.role,
    actionLink: payload.actionLink,
  };
  onCloseCallback = options.onClose ?? null;

  const emailEl = $id('paStaffInviteLinkEmail');
  const roleEl = $id('paStaffInviteLinkRole');
  const urlEl = $id('paStaffInviteLinkUrl');
  if (emailEl) emailEl.value = state.email;
  if (roleEl) roleEl.value = formatStaffRoleLabel(state.role);
  if (urlEl) urlEl.value = state.actionLink;

  setStatus('');
  closePanels();

  const overlay = overlayEl();
  if (!overlay) {
    console.warn('[invite] modal markup missing');
    return;
  }
  overlay.classList.add('visible');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  window.setTimeout(() => $id('paStaffInviteLinkSendEmail')?.focus(), 80);
}

export function hideStaffInviteLinkModal() {
  const overlay = overlayEl();
  overlay?.classList.remove('visible');
  overlay?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  state = null;
  const cb = onCloseCallback;
  onCloseCallback = null;
  cb?.();
}

async function copyInviteLink() {
  if (!state?.actionLink) return;
  try {
    await navigator.clipboard.writeText(state.actionLink);
    showToast('Invite link copied.', 'success');
  } catch {
    showToast('Could not copy link. Select the link field and copy manually.', 'danger');
  }
}

async function sendInviteEmail() {
  if (!state) return;
  const btn = $id('paStaffInviteLinkSendEmail');
  btn?.setAttribute('disabled', 'true');
  setStatus('Sending…', 'muted');

  const linkInput = $id('paStaffInviteLinkUrl') as HTMLInputElement | null;
  const actionLink = (linkInput?.value || state.actionLink || '').trim();
  const emailField = $id('paStaffInviteLinkEmail') as HTMLInputElement | null;
  const email = (emailField?.value || state.email || '').trim();
  const role = state.role || 'editor';

  if (!actionLink) {
    setStatus('Invite link is missing.', 'danger');
    btn?.removeAttribute('disabled');
    return;
  }

  try {
    const res = await fetch('/api/admin/invites/send-email', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        role,
        actionLink,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Could not send email.');
    }
    setStatus(`Invitation emailed to ${state.email}.`, 'success');
    showToast('Invitation sent via SMTP.', 'success', 3200);
    window.setTimeout(() => hideStaffInviteLinkModal(), 1200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not send email.';
    setStatus(message, 'danger');
    showToast(message, 'danger', 4000);
  } finally {
    btn?.removeAttribute('disabled');
  }
}
