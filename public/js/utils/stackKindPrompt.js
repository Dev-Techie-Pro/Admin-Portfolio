import { escapeHtml } from "./dom.js";
let activeOverlay = null;
function removeOverlay() {
  activeOverlay?.remove();
  activeOverlay = null;
}
function promptStackKind(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return Promise.resolve(null);
  return new Promise((resolve) => {
    removeOverlay();
    const overlay = document.createElement("div");
    overlay.className = "pa-confirm-overlay visible pa-stack-kind-overlay";
    overlay.setAttribute("role", "presentation");
    overlay.innerHTML = `
      <div class="pa-confirm-box" role="dialog" aria-modal="true" aria-labelledby="paStackKindTitle">
        <div class="pa-confirm-icon pa-confirm-icon--warning">
          <i class="ri-question-line" aria-hidden="true"></i>
        </div>
        <div class="pa-confirm-title" id="paStackKindTitle">Add "${escapeHtml(trimmed)}" as</div>
        <div class="pa-confirm-text">This name was not found in Tools or Technologies. Choose where to save it.</div>
        <div class="pa-confirm-actions pa-stack-kind-actions">
          <button type="button" class="pa-btn pa-btn-cancel flex-1" data-stack-kind-cancel>Cancel</button>
          <button type="button" class="pa-btn pa-btn-secondary flex-1" data-stack-kind="tool">Tool</button>
          <button type="button" class="pa-btn pa-btn-primary flex-1" data-stack-kind="technology">Technology</button>
        </div>
      </div>
    `;
    const finish = (kind) => {
      removeOverlay();
      resolve(kind);
    };
    overlay.addEventListener("click", (e) => {
      const target = e.target;
      if (target.closest("[data-stack-kind-cancel]")) {
        finish(null);
        return;
      }
      const btn = target.closest("[data-stack-kind]");
      if (!btn) return;
      const kind = btn.getAttribute("data-stack-kind");
      if (kind === "tool" || kind === "technology") finish(kind);
    });
    document.body.appendChild(overlay);
    activeOverlay = overlay;
    overlay.querySelector('[data-stack-kind="technology"]')?.focus();
  });
}
export {
  promptStackKind
};
//# sourceMappingURL=stackKindPrompt.js.map
