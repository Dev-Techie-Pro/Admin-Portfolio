import { animate, stagger } from 'motion';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Stagger-reveal direct children or a selector under `root`.
 * Adds `is-motion-ready` on the stagger container when finished (or immediately if reduced motion).
 */
export function staggerReveal(
  root: HTMLElement | null,
  childSelector?: string,
  options?: { startDelay?: number; staggerBy?: number; duration?: number },
) {
  if (!root) return;

  const startDelay = options?.startDelay ?? 0.04;
  const staggerBy = options?.staggerBy ?? 0.07;
  const duration = options?.duration ?? 0.42;

  if (prefersReducedMotion()) {
    root.classList.add('is-motion-ready');
    return;
  }

  root.classList.remove('is-motion-ready');
  root.classList.add('pa-motion-controlled');
  const targets = childSelector
    ? Array.from(root.querySelectorAll<HTMLElement>(childSelector))
    : Array.from(root.children) as HTMLElement[];

  if (!targets.length) {
    root.classList.add('is-motion-ready');
    return;
  }

  targets.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
  });

  void animate(
    targets,
    { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0)'] },
    {
      delay: stagger(staggerBy, { start: startDelay }),
      duration,
      easing: [0.22, 1, 0.36, 1],
    },
  ).finished.then(() => {
    targets.forEach((el) => {
      el.style.opacity = '';
      el.style.transform = '';
    });
    root.classList.add('is-motion-ready');
  }).catch(() => {
    root.classList.add('is-motion-ready');
  });
}
