import { animate } from "motion";
import { prefersReducedMotion } from "./motion.js";
const PANEL_SELECTOR = ".pa-env-intro-tips-body, .pa-env-field-help";
const DETAILS_SELECTOR = "details.pa-env-intro-tips, details.pa-env-field-more";
const EASE = [0.22, 1, 0.36, 1];
const DURATION = 0.45;
function getPanel(details) {
  return details.querySelector(PANEL_SELECTOR);
}
function measurePanel(panel) {
  const prevHeight = panel.style.height;
  const prevOverflow = panel.style.overflow;
  panel.style.height = "auto";
  panel.style.overflow = "hidden";
  const h = panel.scrollHeight;
  panel.style.height = prevHeight;
  panel.style.overflow = prevOverflow;
  return h;
}
async function runPanelAnimation(panel, from, to, opacityFrom, opacityTo) {
  if (prefersReducedMotion()) {
    panel.style.height = to === 0 ? "0px" : "auto";
    panel.style.opacity = String(opacityTo);
    return;
  }
  panel.style.overflow = "hidden";
  const controls = animate(
    panel,
    {
      height: [`${from}px`, `${to}px`],
      opacity: [opacityFrom, opacityTo]
    },
    { duration: DURATION, easing: EASE }
  );
  await controls.finished;
}
async function openDetails(details, panel) {
  if (details.dataset.envDetailsAnimating === "1") return;
  details.dataset.envDetailsAnimating = "1";
  details.setAttribute("open", "");
  panel.classList.add("is-env-details-open");
  const target = measurePanel(panel);
  panel.style.opacity = "0";
  panel.style.height = "0px";
  try {
    await runPanelAnimation(panel, 0, target, 0, 1);
    panel.style.height = "auto";
    panel.classList.add("is-env-details-reveal");
  } finally {
    details.dataset.envDetailsAnimating = "0";
  }
}
async function closeDetails(details, panel) {
  if (details.dataset.envDetailsAnimating === "1") return;
  details.dataset.envDetailsAnimating = "1";
  panel.classList.remove("is-env-details-reveal");
  const current = panel.getBoundingClientRect().height || measurePanel(panel);
  try {
    await runPanelAnimation(panel, current, 0, 1, 0);
    details.removeAttribute("open");
    panel.classList.remove("is-env-details-open");
    panel.style.height = "0px";
  } finally {
    details.dataset.envDetailsAnimating = "0";
  }
}
function bindDetailsElement(details) {
  if (details.dataset.envDetailsMotion === "1") return;
  const summary = details.querySelector("summary");
  const panel = getPanel(details);
  if (!summary || !panel) return;
  details.dataset.envDetailsMotion = "1";
  details.classList.add("pa-env-details-animated");
  if (!details.open) {
    panel.style.height = "0px";
    panel.style.overflow = "hidden";
    panel.style.opacity = "0";
  } else {
    panel.classList.add("is-env-details-open", "is-env-details-reveal");
  }
  summary.addEventListener("click", (e) => {
    e.preventDefault();
    if (details.open) {
      void closeDetails(details, panel);
    } else {
      void openDetails(details, panel);
    }
  });
}
function setupEnvDetailsMotion(root) {
  root.querySelectorAll(DETAILS_SELECTOR).forEach(bindDetailsElement);
}
export {
  setupEnvDetailsMotion
};
