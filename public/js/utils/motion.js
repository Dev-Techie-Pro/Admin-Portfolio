import { animate, stagger } from "motion";
function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function staggerReveal(root, childSelector, options) {
  if (!root) return;
  const startDelay = options?.startDelay ?? 0.04;
  const staggerBy = options?.staggerBy ?? 0.07;
  const duration = options?.duration ?? 0.42;
  if (prefersReducedMotion()) {
    root.classList.add("is-motion-ready");
    return;
  }
  root.classList.remove("is-motion-ready");
  root.classList.add("pa-motion-controlled");
  const targets = childSelector ? Array.from(root.querySelectorAll(childSelector)) : Array.from(root.children);
  if (!targets.length) {
    root.classList.add("is-motion-ready");
    return;
  }
  targets.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";
  });
  void animate(
    targets,
    { opacity: [0, 1], transform: ["translateY(10px)", "translateY(0)"] },
    {
      delay: stagger(staggerBy, { start: startDelay }),
      duration,
      easing: [0.22, 1, 0.36, 1]
    }
  ).finished.then(() => {
    targets.forEach((el) => {
      el.style.opacity = "";
      el.style.transform = "";
    });
    root.classList.add("is-motion-ready");
  }).catch(() => {
    root.classList.add("is-motion-ready");
  });
}
export {
  prefersReducedMotion,
  staggerReveal
};
//# sourceMappingURL=motion.js.map
