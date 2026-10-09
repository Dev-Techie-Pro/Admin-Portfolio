// @ts-nocheck
import {
  applyCapabilityGatedElements,
  setAccessCapabilities,
  setAccessFromRole,
} from '../core/access.js';
import { deriveAccessCapabilities } from '../../lib/auth/capabilities.js';

function setImageSrc(container, url, { alt = '' } = {}) {
  if (!container) return;
  container.innerHTML = '';
  if (!url) return;
  const img = document.createElement('img');
  img.src = url;
  img.alt = alt;
  img.decoding = 'async';
  container.appendChild(img);
}

/**
 * Update header user chip and other user labels across the shell.
 * @param {object} user
 */
export function applyUserDisplay(user) {
  if (!user) return;

  const displayName = user.fullName || user.username || user.email || 'User';
  const displayRole = user.role ? user.role.replace(/_/g, ' ') : 'Staff';

  document.querySelectorAll('.pa-user-name').forEach((el) => {
    el.textContent = displayName;
  });
  document.querySelectorAll('.pa-user-role').forEach((el) => {
    el.textContent = displayRole;
  });
  document.querySelectorAll('.pa-user-email').forEach((el) => {
    el.textContent = user.email || '';
  });

  document.querySelectorAll(
    '#paUserMenuAvatar, #paUserMenu .pa-avatar, .pa-header-user .pa-avatar, #paUserDropdownAvatar .pa-avatar, #paRailAvatar .pa-rail-profile-mark',
  ).forEach((el) => {
    renderAvatarElement(el, user.avatarUrl);
  });

  applyRoleBasedAccess(user.role, user.capabilities);
}

/**
 * Apply server-derived access flags and hide UI the user cannot use.
 * Role/capabilities come from /api/auth/session or bootstrap — not from CSS.
 * @param {string} [role]
 * @param {import('../../lib/auth/capabilities').AccessCapabilities} [capabilitiesFromServer]
 */
export function applyRoleBasedAccess(role, capabilitiesFromServer) {
  const capabilities = capabilitiesFromServer ?? deriveAccessCapabilities(role);
  setAccessCapabilities(capabilities);
  applyCapabilityGatedElements(capabilities);
}

export { setAccessFromRole, deriveAccessCapabilities };

/**
 * @param {HTMLElement} container
 * @param {string} [url]
 */
export function renderAvatarElement(container, url) {
  if (!container) return;
  if (url) {
    setImageSrc(container, url);
  } else {
    container.innerHTML = '<i class="ri-user-3-fill"></i>';
  }
}

/** Update only avatar images in the header dropdown (instant preview while uploading). */
export function previewUserAvatar(url) {
  document.querySelectorAll(
    '#paUserMenuAvatar, #paUserMenu .pa-avatar, .pa-header-user .pa-avatar, #paUserDropdownAvatar .pa-avatar, #paRailAvatar .pa-rail-profile-mark',
  ).forEach((el) => {
    renderAvatarElement(el, url);
  });
}

/**
 * @param {HTMLElement} container
 * @param {string} [url]
 */
export function renderPreviewAvatar(container, url) {
  if (!container) return;
  if (url) {
    setImageSrc(container, url, { alt: 'Profile photo' });
  } else {
    container.innerHTML = '<i class="ri-user-3-fill"></i>';
  }
}

/**
 * @param {HTMLImageElement|null} imgEl
 * @param {string} [url]
 * @param {string} [fallback]
 */
export function setCoverImage(imgEl, url) {
  const img = imgEl?.tagName === 'IMG'
    ? imgEl
    : document.getElementById('coverImage');
  if (!img) return;

  if (url) {
    img.src = url;
    img.hidden = false;
    img.removeAttribute('hidden');
  } else {
    img.removeAttribute('src');
    img.hidden = true;
  }
}
