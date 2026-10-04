import { $id } from "../utils/dom.js";
import { enhanceCrudPanelBlogLayout } from "./crudBlogWorkspaceLayout.js";
const SLIDE_PANEL_IDS = /* @__PURE__ */ new Set([
  "paQuickAddPanel",
  "paCustomPanel",
  "paIntegrationPanel",
  "paAddUserPanel",
  "paUserCredentialsPanel",
  "paMsgReplyPanel",
  "paMediaPickerPanel",
  "paIconPickerPanel"
]);
const panelAnchors = /* @__PURE__ */ new Map();
function isSlideOverPanel(panelId) {
  if (SLIDE_PANEL_IDS.has(panelId)) return true;
  const el = $id(panelId);
  if (!el) return false;
  if (el.classList.contains("pa-quick-add-panel")) return true;
  if (el.classList.contains("pa-msg-reply-panel")) return true;
  if (el.id?.includes("MediaPicker") || el.id?.includes("IconPicker")) return true;
  return false;
}
function resolvePageBody(bodyScrollId) {
  if (bodyScrollId) return $id(bodyScrollId);
  return document.querySelector(".pa-main .pa-body[id]");
}
function mountPanelInBody(panel, bodyScrollId) {
  const body = resolvePageBody(bodyScrollId);
  if (!body || body.contains(panel)) return body;
  if (!panelAnchors.has(panel.id)) {
    panelAnchors.set(panel.id, { parent: panel.parentNode, next: panel.nextSibling });
  }
  body.insertBefore(panel, body.firstChild);
  return body;
}
function unmountPanel(panel) {
  const anchor = panelAnchors.get(panel.id);
  if (!anchor?.parent) return;
  anchor.parent.insertBefore(panel, anchor.next);
}
function openInlineCrudPanel(panelId, hidePanelIds = [], bodyScrollId) {
  hidePanelIds.forEach((id) => {
    const p = $id(id);
    if (!p) return;
    p.classList.remove("visible", "is-open", "pa-crud-inline-panel");
  });
  const panel = $id(panelId);
  if (!panel) return;
  const body = mountPanelInBody(panel, bodyScrollId);
  body?.classList.add("pa-page-body--editing");
  body?.closest(".pa-main")?.classList.add("pa-main--crud-ws");
  document.documentElement.classList.add("pa-crud-ws-open");
  panel.classList.add("pa-crud-inline-panel");
  enhanceCrudPanelBlogLayout(panel);
  if (body) body.scrollTop = 0;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      panel.classList.add("visible", "is-open");
    });
  });
  document.body.style.overflow = "hidden";
  $id("paPanelOverlay")?.classList.remove("visible");
}
function closeInlineCrudPanels() {
  document.querySelectorAll(".pa-panel.pa-crud-inline-panel").forEach((panel) => {
    panel.classList.remove("visible", "is-open", "pa-crud-inline-panel");
    unmountPanel(panel);
  });
  document.querySelectorAll(".pa-page-body--editing").forEach((el) => {
    el.classList.remove("pa-page-body--editing");
  });
  document.querySelectorAll(".pa-main--crud-ws").forEach((el) => {
    el.classList.remove("pa-main--crud-ws");
  });
  document.documentElement.classList.remove("pa-crud-ws-open");
  document.body.style.overflow = "";
}
export {
  closeInlineCrudPanels,
  isSlideOverPanel,
  openInlineCrudPanel
};
