// @ts-nocheck
import { hideNavFlyout, isSidebarCollapsedDesktop, showNavFlyout } from './sidebarCollapse.js';

const ROUTE_RAIL: [string, string][] = [
  ['/settings', 'settings'],
  ['/tool-categories', 'tools'],
  ['/technologies', 'tools'],
  ['/tools', 'tools'],
  ['/blog-categories', 'content'],
  ['/blog-engagement', 'content'],
  ['/blog-tags', 'content'],
  ['/blog-post', 'content'],
  ['/testimonials', 'content'],
  ['/experience', 'content'],
  ['/media-library', 'content'],
  ['/project-technologies', 'projects'],
  ['/project-tags', 'projects'],
  ['/project-categories', 'projects'],
  ['/categories', 'projects'],
  ['/tags', 'projects'],
  ['/projects', 'projects'],
  ['/recent-activities', 'home'],
  ['/contact-messages', 'home'],
  ['/access-requests', 'home'],
  ['/users', 'home'],
];

const ROUTE_RAIL_SORTED = [...ROUTE_RAIL].sort((a, b) => b[0].length - a[0].length);

function resolveRailSection(path = window.location.pathname) {
  if (path === '/' || path === '') return 'home';
  for (const [needle, section] of ROUTE_RAIL_SORTED) {
    if (path.includes(needle)) return section;
  }
  return 'home';
}

function getRailButton(section: string) {
  return document.querySelector(`.pa-rail-btn[data-rail-target="${section}"]`);
}

function getNavGroup(section: string) {
  return document.querySelector(`.pa-nav-group[data-nav-group="${section}"]`);
}

export function syncSidebarRailActive() {
  const section = resolveRailSection();
  document.querySelectorAll('.pa-rail-btn[data-rail-target]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.railTarget === section);
  });
}

function setGroupExpanded(group, open) {
  if (!group) return;
  group.classList.add('pa-nav-anim-ready');
  group.classList.toggle('open', open);
  group.querySelector(':scope > .pa-nav-parent-row .pa-nav-toggle')
    ?.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function toggleNavGroup(section: string) {
  const group = getNavGroup(section);
  if (!group) return;

  if (isSidebarCollapsedDesktop()) {
    const flyout = document.getElementById('paNavFlyout');
    if (flyout?.classList.contains('visible') && group.classList.contains('flyout-open')) {
      hideNavFlyout();
      return;
    }
    showNavFlyout(group);
    return;
  }

  hideNavFlyout();
  const nextOpen = !group.classList.contains('open');
  setGroupExpanded(group, nextOpen);
  if (nextOpen) {
    group.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

let railBound = false;

export function initSidebarRailNav() {
  syncSidebarRailActive();
  if (railBound) return;
  railBound = true;

  document.querySelectorAll('.pa-rail-btn[data-rail-target]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const section = btn.dataset.railTarget;
      if (!section) return;
      toggleNavGroup(section);
      syncSidebarRailActive();
    });
  });

  window.addEventListener('popstate', syncSidebarRailActive);
}
