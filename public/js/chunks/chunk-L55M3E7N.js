import {
  $id,
  escapeHtml
} from "./chunk-S5QBHCBR.js";

// client/utils/floatingLayer.ts
var DEFAULT_MAX_HEIGHT = 300;
var MIN_LAYER_HEIGHT = 96;
var DEFAULT_GAP = 4;
var DEFAULT_Z_INDEX = 10050;
var mounts = /* @__PURE__ */ new WeakMap();
function getFloatingBoundaryRect(anchor) {
  let el = anchor.parentElement;
  while (el && el !== document.documentElement) {
    if (el.classList.contains("pa-panel-body") || el.classList.contains("pa-panel") || el.classList.contains("pa-main") || el.classList.contains("pa-body")) {
      return el.getBoundingClientRect();
    }
    const cs = getComputedStyle(el);
    const oy = cs.overflowY;
    if (oy === "auto" || oy === "scroll" || oy === "hidden") {
      if (oy === "hidden" || el.scrollHeight > el.clientHeight + 1) {
        return el.getBoundingClientRect();
      }
    }
    el = el.parentElement;
  }
  const w = document.documentElement.clientWidth;
  const h = document.documentElement.clientHeight;
  return new DOMRect(0, 0, w, h);
}
function clearFloatingStyles(floating) {
  floating.style.removeProperty("position");
  floating.style.removeProperty("top");
  floating.style.removeProperty("bottom");
  floating.style.removeProperty("left");
  floating.style.removeProperty("right");
  floating.style.removeProperty("width");
  floating.style.removeProperty("min-width");
  floating.style.removeProperty("max-width");
  floating.style.removeProperty("max-height");
  floating.style.removeProperty("z-index");
  floating.style.removeProperty("--pa-select-panel-max");
  floating.classList.remove("pa-floating-layer", "pa-floating-layer--above", "pa-floating-layer--below");
}
function measureFloatingHeight(floating, maxHeight) {
  const prev = {
    visibility: floating.style.visibility,
    pointerEvents: floating.style.pointerEvents,
    maxHeight: floating.style.maxHeight,
    position: floating.style.position
  };
  floating.style.visibility = "hidden";
  floating.style.pointerEvents = "none";
  floating.style.position = "fixed";
  floating.style.left = "0";
  floating.style.top = "0";
  floating.style.maxHeight = `${maxHeight}px`;
  const h = floating.scrollHeight;
  floating.style.visibility = prev.visibility;
  floating.style.pointerEvents = prev.pointerEvents;
  floating.style.maxHeight = prev.maxHeight;
  floating.style.position = prev.position;
  floating.style.removeProperty("left");
  floating.style.removeProperty("top");
  return h;
}
function mountFloatingLayer(floating, anchor, options = {}) {
  const maxHeightDefault = options.maxHeight ?? DEFAULT_MAX_HEIGHT;
  const gap = options.gap ?? DEFAULT_GAP;
  const align = options.align ?? "match-width";
  const zIndex = options.zIndex ?? DEFAULT_Z_INDEX;
  let record = mounts.get(floating);
  if (!record) {
    const parent = floating.parentElement;
    if (!parent) {
      return { reposition: () => {
      }, release: () => {
      } };
    }
    const placeholder = document.createComment("pa-floating-layer");
    parent.insertBefore(placeholder, floating);
    document.body.appendChild(floating);
    floating.classList.add("pa-floating-layer");
    const onScroll = () => reposition();
    const onResize = () => reposition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
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
    const openBelow = spaceBelow >= needed || spaceBelow >= spaceAbove && spaceBelow >= MIN_LAYER_HEIGHT;
    const available = openBelow ? spaceBelow : spaceAbove;
    const cappedMax = Math.max(MIN_LAYER_HEIGHT, Math.min(maxHeightDefault, available));
    floating.style.position = "fixed";
    floating.style.zIndex = String(zIndex);
    floating.style.setProperty("--pa-select-panel-max", `${Math.floor(cappedMax)}px`);
    floating.style.maxHeight = `${Math.floor(cappedMax)}px`;
    const layerHeight = Math.min(naturalHeight, cappedMax);
    let top = openBelow ? anchorRect.bottom + gap : anchorRect.top - gap - layerHeight;
    top = Math.max(boundary.top, Math.min(top, boundary.bottom - MIN_LAYER_HEIGHT));
    let left = anchorRect.left;
    const chartAlign = anchor.closest(".pa-select-wrap.pa-chart-dropdown-btn");
    if (align === "end" || chartAlign) {
      floating.style.minWidth = `${anchorRect.width}px`;
      floating.style.width = "max-content";
      const panelW = floating.offsetWidth || anchorRect.width;
      left = anchorRect.right - panelW;
    } else if (align === "match-width") {
      floating.style.minWidth = `${anchorRect.width}px`;
      floating.style.width = "max-content";
      const maxW = Math.max(anchorRect.width, boundary.right - boundary.left - 8);
      floating.style.maxWidth = `${Math.min(320, maxW)}px`;
    } else {
      floating.style.removeProperty("min-width");
      floating.style.removeProperty("width");
      floating.style.removeProperty("max-width");
    }
    const floatW = floating.offsetWidth || anchorRect.width;
    left = Math.max(boundary.left + 4, Math.min(left, boundary.right - floatW - 4));
    floating.style.top = `${top}px`;
    floating.style.bottom = "auto";
    floating.style.left = `${left}px`;
    floating.style.right = "auto";
    floating.classList.toggle("pa-floating-layer--above", !openBelow);
    floating.classList.toggle("pa-floating-layer--below", openBelow);
  }
  function release() {
    const rec = mounts.get(floating);
    if (!rec) return;
    window.removeEventListener("scroll", rec.onScroll, true);
    window.removeEventListener("resize", rec.onResize);
    clearFloatingStyles(floating);
    rec.parent.insertBefore(floating, rec.placeholder);
    rec.placeholder.remove();
    mounts.delete(floating);
  }
  requestAnimationFrame(() => reposition());
  return { reposition, release };
}

// client/utils/paSelect.ts
var REGISTRY = /* @__PURE__ */ new Map();
var SKIP_SELECTOR = "[data-pa-select-native]";
var ENHANCE_SELECTOR = [
  "select.pa-form-select",
  "select.pa-filter-select",
  "select.pa-form-input",
  "select.pa-act-sort-select",
  "select.pa-chart-dropdown-btn"
].join(", ");
function resolveSelect(selectOrId) {
  if (!selectOrId) return null;
  if (typeof selectOrId === "string") {
    const el = $id(selectOrId);
    return el instanceof HTMLSelectElement ? el : null;
  }
  return selectOrId instanceof HTMLSelectElement ? selectOrId : null;
}
function closeAllPaSelects(exceptWrap = null) {
  document.querySelectorAll(".pa-select-wrap.open").forEach((wrap) => {
    if (wrap === exceptWrap) return;
    const select = wrap.querySelector("select.pa-select-native");
    const state = select instanceof HTMLSelectElement ? REGISTRY.get(select) : null;
    if (state?.setOpen) {
      void state.setOpen(false);
      return;
    }
    wrap.classList.remove("open");
  });
}
function optionText(opt) {
  return (opt.textContent ?? "").trim();
}
function applyTriggerLabel(trigger, select) {
  const opt = select.options.item(select.selectedIndex);
  const valueEl = trigger.querySelector(".pa-select-value");
  if (!valueEl) return;
  if (!opt) {
    valueEl.textContent = "Select\u2026";
    valueEl.classList.add("is-placeholder");
    return;
  }
  const label = optionText(opt);
  valueEl.textContent = label;
  valueEl.classList.toggle("is-placeholder", opt.value === "" && label.toLowerCase().startsWith("select"));
}
function rebuildOptions(state) {
  const { list, select, trigger, wrap } = state;
  list.replaceChildren();
  const options = select.options;
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pa-select-option";
    if (opt.selected) btn.classList.add("is-selected");
    if (opt.disabled) btn.classList.add("is-disabled");
    btn.dataset.value = opt.value;
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", String(opt.selected));
    if (opt.disabled) btn.disabled = true;
    btn.innerHTML = `<span class="pa-select-option-label">${escapeHtml(optionText(opt))}</span><i class="ri-check-line pa-select-option-check" aria-hidden="true"></i>`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (btn.disabled) return;
      select.value = btn.dataset.value ?? "";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      syncPaSelect(select);
      const st = REGISTRY.get(select);
      if (st?.setOpen) void st.setOpen(false);
    });
    list.appendChild(btn);
  }
  applyTriggerLabel(trigger, select);
  wrap.classList.toggle("error", select.classList.contains("error"));
  trigger.disabled = select.disabled;
  if (wrap.classList.contains("open")) state.floating?.reposition();
}
function syncPicker(select) {
  const state = REGISTRY.get(select);
  if (!state) return;
  rebuildOptions(state);
}
function createPaSelectState(wrap, trigger, panel, list, select, setOpen) {
  let state;
  state = {
    wrap,
    trigger,
    panel,
    list,
    select,
    setOpen,
    rebuildOptions: () => rebuildOptions(state),
    mo: new MutationObserver(() => rebuildOptions(state)),
    floating: null
  };
  return state;
}
function initPaSelect(selectOrId) {
  const select = resolveSelect(selectOrId);
  if (!select || select.matches(SKIP_SELECTOR) || select.dataset.paSelectReady === "1") {
    return REGISTRY.get(select) || null;
  }
  const wrap = document.createElement("div");
  wrap.className = `pa-select-wrap ${select.className}`.trim();
  select.className = "pa-select-native";
  select.setAttribute("tabindex", "-1");
  select.setAttribute("aria-hidden", "true");
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "pa-select-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  const ariaLabel = select.getAttribute("aria-label");
  if (ariaLabel) trigger.setAttribute("aria-label", ariaLabel);
  trigger.innerHTML = `<span class="pa-select-value"></span><i class="ri-arrow-down-s-line pa-select-chevron" aria-hidden="true"></i>`;
  const panel = document.createElement("div");
  panel.className = "pa-select-panel pa-collapse-panel pa-collapse-panel--dropdown";
  panel.setAttribute("role", "listbox");
  const list = document.createElement("div");
  list.className = "pa-select-list";
  panel.appendChild(list);
  const parent = select.parentNode;
  parent.insertBefore(wrap, select);
  wrap.appendChild(select);
  wrap.appendChild(trigger);
  wrap.appendChild(panel);
  const setOpen = (open) => {
    const isOpen = wrap.classList.contains("open");
    if (open === isOpen) return;
    if (open) {
      closeAllPaSelects(wrap);
      wrap.classList.add("open");
      panel.classList.add("is-pa-collapse-open");
      trigger.setAttribute("aria-expanded", "true");
      const align = wrap.classList.contains("pa-chart-dropdown-btn") ? "end" : "match-width";
      state.floating?.release();
      state.floating = mountFloatingLayer(panel, trigger, { align });
    } else {
      state.floating?.release();
      state.floating = null;
      panel.classList.remove("is-pa-collapse-open");
      wrap.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    }
  };
  let state = createPaSelectState(wrap, trigger, panel, list, select, setOpen);
  state.mo.observe(select, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["disabled", "class"]
  });
  REGISTRY.set(select, state);
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    if (select.disabled) return;
    setOpen(!wrap.classList.contains("open"));
  });
  trigger.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!select.disabled) setOpen(true);
    }
  });
  select.addEventListener("change", () => syncPaSelect(select));
  if (!window.__paSelectDocBound) {
    window.__paSelectDocBound = true;
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".pa-select-wrap") || target.closest(".pa-select-panel")) return;
      closeAllPaSelects();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAllPaSelects();
    });
  }
  select.dataset.paSelectReady = "1";
  rebuildOptions(state);
  return state;
}
function syncPaSelect(selectOrId) {
  const select = resolveSelect(selectOrId);
  if (select) syncPicker(select);
}
function initAllPaSelects(root = document) {
  root.querySelectorAll(ENHANCE_SELECTOR).forEach((select) => {
    if (select instanceof HTMLSelectElement && !select.matches(SKIP_SELECTOR)) {
      initPaSelect(select);
    }
  });
}

export {
  mountFloatingLayer,
  syncPaSelect,
  initAllPaSelects
};
