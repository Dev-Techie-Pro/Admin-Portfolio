const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
function trapFocus(container, event) {
  if (event.key !== "Tab") return;
  const nodes = Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1
  );
  if (!nodes.length) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
function bindFocusTrap(container) {
  if (!container) return () => {
  };
  const onKeyDown = (event) => trapFocus(container, event);
  container.addEventListener("keydown", onKeyDown);
  return () => container.removeEventListener("keydown", onKeyDown);
}
export {
  bindFocusTrap,
  trapFocus
};
//# sourceMappingURL=focus-trap.js.map
