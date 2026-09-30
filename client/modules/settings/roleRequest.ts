import { $id } from '../../utils/dom.js';
import { authService } from '../../core/AuthService.js';
import { showToast } from '../shell/toast.js';
import { getAccessCapabilities } from '../../core/access.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let wired = false;

function isViewerRole(role) {
  return role === 'viewer';
}

function ensureCard() {
  const securityPanel = document.querySelector('.pa-tab-panel[data-content="security"]');
  if (!securityPanel || $id('paRoleRequestCard')) return;

  const card = document.createElement('div');
  card.className = 'pa-security-card pa-role-request-card pa-staff-only-item';
  card.id = 'paRoleRequestCard';
  card.innerHTML = `
    <div class="pa-card-title"><i class="ri-user-settings-line"></i> Request temporary access</div>
    <p class="pa-role-request-lead">Need to edit content? Ask an administrator for a temporary <strong>editor</strong> role (default <strong>3 hours</strong>; they can set the duration). User management stays restricted.</p>
    <div class="pa-role-request-status" id="paRoleRequestStatus" hidden></div>
    <form id="paRoleRequestForm" class="pa-role-request-form" novalidate>
      <div class="pa-form-group">
        <label class="pa-form-label" for="paRoleRequestEmail">Contact email</label>
        <input class="pa-form-input" id="paRoleRequestEmail" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" required>
        <div class="pa-form-hint"><i class="ri-information-line"></i> Use a valid email where an administrator can reach you.</div>
      </div>
      <div class="pa-form-group">
        <label class="pa-form-label" for="paRoleRequestMessage">Message</label>
        <textarea class="pa-form-textarea" id="paRoleRequestMessage" rows="4" maxlength="2000" placeholder="Explain what you need to do in the dashboard..." required></textarea>
      </div>
      <div class="pa-settings-actions">
        <button type="submit" class="pa-btn pa-btn-primary" id="paRoleRequestSubmit">
          <i class="ri-send-plane-line"></i> Contact administrator
        </button>
      </div>
    </form>`;

  const loginCard = securityPanel.querySelector('#loginActivityList')?.closest('.pa-security-card');
  if (loginCard?.parentElement) {
    loginCard.parentElement.insertBefore(card, loginCard.nextSibling);
  } else {
    securityPanel.appendChild(card);
  }
}

function populateDefaults(profile) {
  const emailInput = $id('paRoleRequestEmail');
  if (emailInput && !emailInput.value) {
    emailInput.value = profile?.email || '';
  }
}

function bindForm() {
  if (wired) return;
  wired = true;

  const form = $id('paRoleRequestForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const contactEmail = $id('paRoleRequestEmail')?.value?.trim() || '';
    const message = $id('paRoleRequestMessage')?.value?.trim() || '';
    const submitBtn = $id('paRoleRequestSubmit');

    if (!EMAIL_RE.test(contactEmail)) {
      showToast('Enter a valid contact email address.', 'warning');
      return;
    }
    if (message.length < 10) {
      showToast('Please write a short message (at least 10 characters).', 'warning');
      return;
    }

    submitBtn?.setAttribute('disabled', 'true');
    try {
      const result = await authService.requestTemporaryAccess({ contactEmail, message });
      showToast(result?.message || 'Request sent to administrators.', 'success');
      const messageInput = $id('paRoleRequestMessage');
      if (messageInput) messageInput.value = '';
      await refreshStatus();
    } catch (err) {
      showToast(err?.message || 'Could not send access request.', 'danger');
    } finally {
      submitBtn?.removeAttribute('disabled');
    }
  });
}

async function refreshStatus() {
  const statusEl = $id('paRoleRequestStatus');
  const form = $id('paRoleRequestForm');
  const card = $id('paRoleRequestCard');
  if (!statusEl || !card) return;

  const caps = getAccessCapabilities();
  if (caps.isElevated && caps.elevatedUntil) {
    card.setAttribute('hidden', '');
    return;
  }
  card.removeAttribute('hidden');

  try {
    const status = await authService.getAccessElevationStatus();
    if (status?.activeUntil) {
      statusEl.hidden = false;
      statusEl.className = 'pa-role-request-status pa-role-request-status--active';
      statusEl.innerHTML = `<i class="ri-shield-check-line"></i> Temporary access is active until ${new Date(status.activeUntil).toLocaleString()}.`;
      form?.setAttribute('hidden', '');
      return;
    }
    if (status?.pending) {
      statusEl.hidden = false;
      statusEl.className = 'pa-role-request-status pa-role-request-status--pending';
      statusEl.innerHTML = '<i class="ri-time-line"></i> Your request is pending administrator review.';
      form?.setAttribute('hidden', '');
      return;
    }
    statusEl.hidden = true;
    form?.removeAttribute('hidden');
  } catch {
    statusEl.hidden = true;
    form?.removeAttribute('hidden');
  }
}

export async function initRoleRequestCard(role) {
  if (!isViewerRole(role)) {
    $id('paRoleRequestCard')?.remove();
    return;
  }

  if (getAccessCapabilities().isElevated) {
    $id('paRoleRequestCard')?.remove();
    return;
  }

  ensureCard();
  bindForm();

  try {
    const profile = await authService.getProfile();
    populateDefaults(profile);
  } catch {
    populateDefaults(null);
  }

  await refreshStatus();
}
