// @ts-nocheck
import { deriveAccessCapabilities, type AccessCapabilities } from '../../lib/auth/capabilities.js';
import { installViewerWriteGuard, restoreCmsWriteControls, stripCmsWriteControls } from './cms-access.js';

let activeCapabilities: AccessCapabilities = deriveAccessCapabilities('viewer');

export function setAccessCapabilities(capabilities: AccessCapabilities) {
  activeCapabilities = capabilities;
}

export function setAccessFromRole(role: string | null | undefined) {
  setAccessCapabilities(deriveAccessCapabilities(role));
}

export function getAccessCapabilities(): AccessCapabilities {
  return activeCapabilities;
}

function setElementAccessible(el: Element, allowed: boolean) {
  if (allowed) {
    el.removeAttribute('hidden');
    el.removeAttribute('aria-hidden');
    el.style.removeProperty('display');
  } else {
    el.setAttribute('hidden', '');
    el.setAttribute('aria-hidden', 'true');
    el.style.display = 'none';
  }
}

export function applyCapabilityGatedElements(capabilities = activeCapabilities) {
  document.querySelectorAll('.pa-admin-only-item').forEach((el) => {
    setElementAccessible(el, capabilities.isAdmin);
  });

  document.querySelectorAll('.pa-editor-only-item').forEach((el) => {
    setElementAccessible(el, capabilities.isEditor);
  });

  document.querySelectorAll('.pa-staff-only-item').forEach((el) => {
    setElementAccessible(el, capabilities.canShowRoleRequestCard);
  });

  ['logoutAllBtn', 'logoutAllDevicesBtn'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) setElementAccessible(el, capabilities.canLogoutAllDevices);
  });

  const clearBtn = document.getElementById('paNotifClearBtn');
  if (clearBtn) setElementAccessible(clearBtn, capabilities.canClearAllNotifications);

  if (capabilities.canManageContent) {
    restoreCmsWriteControls(document);
  } else {
    stripCmsWriteControls(document);
    installViewerWriteGuard();
  }
}

export { canManageContent } from './cms-access.js';
