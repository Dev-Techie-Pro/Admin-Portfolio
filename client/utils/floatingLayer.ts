// @ts-nocheck
const DEFAULT_MAX_HEIGHT = 300;
const MIN_LAYER_HEIGHT = 96;
const DEFAULT_GAP = 4;
const DEFAULT_Z_INDEX = 10050;

export type FloatingAlign = 'start' | 'end' | 'match-width';

export type FloatingLayerOptions = {
  maxHeight?: number;
  gap?: number;
  align?: FloatingAlign;
  zIndex?: number;
};

export type FloatingLayerHandle = {
  reposition: () => void;
  release: () => void;
};

type MountRecord = {
  placeholder: Comment;
  parent: HTMLElement;
  onScroll: () => void;
  onResize: () => void;
};

const mounts = new WeakMap<HTMLElement, MountRecord>();

/** Nearest clipping / scroll region for flip and max-height (panel body, main, or viewport). */
export function getFloatingBoundaryRect(anchor: HTMLElement): DOMRect {
  let el: HTMLElement | null = anchor.parentElement;
  while (el && el !== document.documentElement) {
    if (
      el.classList.contains('pa-panel-body') ||
      el.classList.contains('pa-panel') ||
      el.classList.contains('pa-main') ||
      el.classList.contains('pa-body')
    ) {
      return el.getBoundingClientRect();
    }
    const cs = getComputedStyle(el);
    const oy = cs.overflowY;
    if (oy === 'auto' || oy === 'scroll' || oy === 'hidden') {
      if (oy === 'hidden' || el.scrollHeight > el.clientHeight + 1) {
        return el.getBoundingClientRect();
      }
    }
    el = el.parentElement;
  }
  const w = document.documentElement.clientWidth;
  const h = document.documentElement.clientHeight;
  return new DOMRect(0, 0, w, h);
}

function clearFloatingStyles(floating: HTMLElement) {
  floating.style.removeProperty('position');
  floating.style.removeProperty('top');
  floating.style.removeProperty('bottom');
  floating.style.removeProperty('left');
  floating.style.removeProperty('right');
  floating.style.removeProperty('width');
  floating.style.removeProperty('min-width');
  floating.style.removeProperty('max-width');
  floating.style.removeProperty('max-height');
  floating.style.removeProperty('z-index');
  floating.style.removeProperty('--pa-select-panel-max');
  floating.classList.remove('pa-floating-layer', 'pa-floating-layer--above', 'pa-floating-layer--below');
}

function measureFloatingHeight(floating: HTMLElement, maxHeight: number): number {
  const prev = {
    visibility: floating.style.visibility,
    pointerEvents: floating.style.pointerEvents,
    maxHeight: floating.style.maxHeight,
    position: floating.style.position,
  };
  floating.style.visibility = 'hidden';
  floating.style.pointerEvents = 'none';
  floating.style.position = 'fixed';
  floating.style.left = '0';
  floating.style.top = '0';
  floating.style.maxHeight = `${maxHeight}px`;
  const h = floating.scrollHeight;
  floating.style.visibility = prev.visibility;
  floating.style.pointerEvents = prev.pointerEvents;
  floating.style.maxHeight = prev.maxHeight;
  floating.style.position = prev.position;
  floating.style.removeProperty('left');
  floating.style.removeProperty('top');
  return h;
}

/**
 * Move a dropdown panel to `document.body` and position it with `position: fixed`
 * so it is not clipped by `.pa-panel-body` overflow. Call `release()` when hidden.
 */
export function mountFloatingLayer(
  floating: HTMLElement,
  anchor: HTMLElement,
  options: FloatingLayerOptions = {},
): FloatingLayerHandle {
  const maxHeightDefault = options.maxHeight ?? DEFAULT_MAX_HEIGHT;
  const gap = options.gap ?? DEFAULT_GAP;
  const align = options.align ?? 'match-width';
  const zIndex = options.zIndex ?? DEFAULT_Z_INDEX;

  let record = mounts.get(floating);
  if (!record) {
    const parent = floating.parentElement;
    if (!parent) {
      return { reposition: () => {}, release: () => {} };
    }
    const placeholder = document.createComment('pa-floating-layer');
    parent.insertBefore(placeholder, floating);
    document.body.appendChild(floating);
    floating.classList.add('pa-floating-layer');

    const onScroll = () => reposition();
    const onResize = () => reposition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);

    record = { placeholder, parent, onScroll, onResize };
    mounts.set(floating, record);
  }

  function reposition() {
    if (floating.hidden) return;

    const anchorRect = anchor.getBoundingClientRect();
    if (anchorRect.width === 0 && anchorRect.height === 0) return;

    const boundary = getFloatingBoundaryRect(anchor);
    const spaceBelow = boundary.bottom - anchorRect.bottom - gap;
    const spaceAbove = anchorRect.top - boundary.top - gap;

    const naturalHeight = measureFloatingHeight(floating, maxHeightDefault);
    const needed = Math.min(naturalHeight, maxHeightDefault);
    const openBelow =
      spaceBelow >= needed || (spaceBelow >= spaceAbove && spaceBelow >= MIN_LAYER_HEIGHT);
    const available = openBelow ? spaceBelow : spaceAbove;
    const cappedMax = Math.max(MIN_LAYER_HEIGHT, Math.min(maxHeightDefault, available));

    floating.style.position = 'fixed';
    floating.style.zIndex = String(zIndex);
    floating.style.setProperty('--pa-select-panel-max', `${Math.floor(cappedMax)}px`);
    floating.style.maxHeight = `${Math.floor(cappedMax)}px`;

    const layerHeight = Math.min(naturalHeight, cappedMax);
    let top = openBelow
      ? anchorRect.bottom + gap
      : anchorRect.top - gap - layerHeight;
    top = Math.max(boundary.top, Math.min(top, boundary.bottom - MIN_LAYER_HEIGHT));

    let left = anchorRect.left;
    const chartAlign = anchor.closest('.pa-select-wrap.pa-chart-dropdown-btn');
    if (align === 'end' || chartAlign) {
      floating.style.minWidth = `${anchorRect.width}px`;
      floating.style.width = 'max-content';
      const panelW = floating.offsetWidth || anchorRect.width;
      left = anchorRect.right - panelW;
    } else if (align === 'match-width') {
      floating.style.minWidth = `${anchorRect.width}px`;
      floating.style.width = 'max-content';
      const maxW = Math.max(anchorRect.width, boundary.right - boundary.left - 8);
      floating.style.maxWidth = `${Math.min(320, maxW)}px`;
    } else {
      floating.style.removeProperty('min-width');
      floating.style.removeProperty('width');
      floating.style.removeProperty('max-width');
    }

    const floatW = floating.offsetWidth || anchorRect.width;
    left = Math.max(boundary.left + 4, Math.min(left, boundary.right - floatW - 4));

    floating.style.top = `${top}px`;
    floating.style.bottom = 'auto';
    floating.style.left = `${left}px`;
    floating.style.right = 'auto';
    floating.classList.toggle('pa-floating-layer--above', !openBelow);
    floating.classList.toggle('pa-floating-layer--below', openBelow);
  }

  function release() {
    const rec = mounts.get(floating);
    if (!rec) return;
    window.removeEventListener('scroll', rec.onScroll, true);
    window.removeEventListener('resize', rec.onResize);
    clearFloatingStyles(floating);
    rec.parent.insertBefore(floating, rec.placeholder);
    rec.placeholder.remove();
    mounts.delete(floating);
  }

  requestAnimationFrame(() => reposition());

  return { reposition, release };
}
