import { animate } from "motion";
import { prefersReducedMotion } from "./motion.js";
const PA_COLLAPSE_DURATION = 0.45;
const PA_COLLAPSE_EASE = [0.22, 1, 0.36, 1];
const BOUND = "data-pa-collapse-bound";
const ANIMATING = "data-pa-collapse-animating";
function measureCollapsePanel(panel) {
  const prevHeight = panel.style.height;
  const prevOverflow = panel.style.overflow;
  const prevDisplay = panel.style.display;
  panel.style.height = "auto";
  panel.style.overflow = "hidden";
  panel.style.display = "block";
  const h = panel.scrollHeight;
  panel.style.height = prevHeight;
  panel.style.overflow = prevOverflow;
  panel.style.display = prevDisplay;
  return h;
}
function clearCollapseInlineStyles(panel) {
  panel.style.removeProperty("height");
  panel.style.removeProperty("max-height");
  panel.style.removeProperty("opacity");
  panel.style.removeProperty("overflow");
  panel.style.removeProperty("overflow-y");
  panel.style.removeProperty("pointer-events");
}
async function animateCollapsePanel(panel, open) {
  if (panel.classList.contains("pa-collapse-panel--dropdown")) {
    panel.classList.toggle("is-pa-collapse-open", open);
    return;
  }
  if (prefersReducedMotion()) {
    panel.classList.toggle("is-pa-collapse-open", open);
    clearCollapseInlineStyles(panel);
    return;
  }
  panel.classList.add("is-pa-collapse-animating");
  panel.style.overflow = "hidden";
  if (open) {
    const target = measureCollapsePanel(panel);
    panel.style.opacity = "0";
    panel.style.height = "0px";
    const controls = animate(
      panel,
      { height: ["0px", `${target}px`], opacity: [0, 1] },
      { duration: PA_COLLAPSE_DURATION, easing: PA_COLLAPSE_EASE }
    );
    await controls.finished;
  } else {
    const current = panel.getBoundingClientRect().height || measureCollapsePanel(panel);
    const controls = animate(
      panel,
      { height: [`${current}px`, "0px"], opacity: [1, 0] },
      { duration: PA_COLLAPSE_DURATION, easing: PA_COLLAPSE_EASE }
    );
    await controls.finished;
  }
  clearCollapseInlineStyles(panel);
  panel.classList.remove("is-pa-collapse-animating");
  panel.classList.toggle("is-pa-collapse-open", open);
}
function resolvePanel(root, explicit) {
  if (explicit) return explicit;
  return root.querySelector("[data-pa-collapse-panel], .pa-collapse-panel");
}
function isRootOpen(root, closedClass, inverted) {
  const hasClosed = root.classList.contains(closedClass);
  return inverted ? hasClosed : !hasClosed;
}
function setRootOpen(root, closedClass, inverted, open) {
  if (inverted) {
    root.classList.toggle(closedClass, open);
  } else {
    root.classList.toggle(closedClass, !open);
  }
  root.dataset.paCollapseOpen = open ? "true" : "false";
}
async function openRootCollapse(root, panel, closedClass, inverted) {
  if (root.getAttribute(ANIMATING) === "1") return;
  root.setAttribute(ANIMATING, "1");
  setRootOpen(root, closedClass, inverted, true);
  try {
    await animateCollapsePanel(panel, true);
    panel.classList.add("is-pa-collapse-reveal");
  } finally {
    root.removeAttribute(ANIMATING);
  }
}
async function closeRootCollapse(root, panel, closedClass, inverted) {
  if (root.getAttribute(ANIMATING) === "1") return;
  root.setAttribute(ANIMATING, "1");
  panel.classList.remove("is-pa-collapse-reveal");
  try {
    await animateCollapsePanel(panel, false);
    setRootOpen(root, closedClass, inverted, false);
  } finally {
    root.removeAttribute(ANIMATING);
  }
}
function bindRootCollapse(root) {
  if (root.getAttribute(BOUND) === "1") return;
  const panel = resolvePanel(root);
  const trigger = root.querySelector("[data-pa-collapse-trigger], .pa-collapse-trigger");
  if (!panel || !trigger) return;
  root.setAttribute(BOUND, "1");
  root.classList.add("pa-collapse-root");
  panel.classList.add("pa-collapse-panel");
  if (!panel.hasAttribute("data-pa-collapse-panel")) {
    panel.setAttribute("data-pa-collapse-panel", "");
  }
  const closedClass = root.dataset.paCollapseClass || "is-collapsed";
  const inverted = root.hasAttribute("data-pa-collapse-inverted");
  const open = isRootOpen(root, closedClass, inverted);
  panel.classList.toggle("is-pa-collapse-open", open);
  if (open) panel.classList.add("is-pa-collapse-reveal");
  trigger.addEventListener("click", (e) => {
    if (trigger.tagName !== "BUTTON" && trigger.tagName !== "A") e.preventDefault();
    const expanded = isRootOpen(root, closedClass, inverted);
    if (expanded) {
      void closeRootCollapse(root, panel, closedClass, inverted).then(() => {
        trigger.setAttribute("aria-expanded", "false");
      });
    } else {
      void openRootCollapse(root, panel, closedClass, inverted).then(() => {
        trigger.setAttribute("aria-expanded", "true");
      });
    }
  });
}
function bindDetailsCollapse(details) {
  if (details.getAttribute(BOUND) === "1") return;
  const summary = details.querySelector("summary");
  const panel = details.querySelector("[data-pa-collapse-panel], .pa-collapse-panel") ?? (summary?.nextElementSibling instanceof HTMLElement ? summary.nextElementSibling : null);
  if (!summary || !panel) return;
  details.setAttribute(BOUND, "1");
  details.classList.add("pa-collapse-details", "pa-collapse-root");
  panel.classList.add("pa-collapse-panel");
  if (!panel.hasAttribute("data-pa-collapse-panel")) {
    panel.setAttribute("data-pa-collapse-panel", "");
  }
  panel.classList.toggle("is-pa-collapse-open", details.open);
  if (details.open) panel.classList.add("is-pa-collapse-reveal");
  summary.addEventListener("click", (e) => {
    e.preventDefault();
    if (details.getAttribute(ANIMATING) === "1") return;
    if (details.open) {
      void (async () => {
        details.setAttribute(ANIMATING, "1");
        panel.classList.remove("is-pa-collapse-reveal");
        try {
          await animateCollapsePanel(panel, false);
          details.removeAttribute("open");
        } finally {
          details.removeAttribute(ANIMATING);
        }
      })();
    } else {
      void (async () => {
        details.setAttribute(ANIMATING, "1");
        details.setAttribute("open", "");
        try {
          await animateCollapsePanel(panel, true);
          panel.classList.add("is-pa-collapse-reveal");
        } finally {
          details.removeAttribute(ANIMATING);
        }
      })();
    }
  });
}
function canQueryDescendants(node) {
  return typeof node.querySelectorAll === "function";
}
function scanCollapseRoots(root) {
  if (root instanceof HTMLElement && root.matches("[data-pa-collapse]")) {
    bindRootCollapse(root);
  }
  if (!canQueryDescendants(root)) return;
  root.querySelectorAll("[data-pa-collapse]").forEach(bindRootCollapse);
  root.querySelectorAll('details:not([data-pa-collapse="off"])').forEach(bindDetailsCollapse);
}
let observerStarted = false;
function startCollapseObserver() {
  if (observerStarted || typeof document === "undefined") return;
  observerStarted = true;
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          scanCollapseRoots(node);
        }
      });
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
function initCollapseMotion(root = document) {
  scanCollapseRoots(root);
  startCollapseObserver();
}
function setupEnvDetailsMotion(root) {
  initCollapseMotion(root);
}
export {
  PA_COLLAPSE_DURATION,
  PA_COLLAPSE_EASE,
  animateCollapsePanel,
  clearCollapseInlineStyles,
  initCollapseMotion,
  measureCollapsePanel,
  setupEnvDetailsMotion
};
