import { storage } from "../core/StorageService.js";
import { escapeHtml, $id } from "./dom.js";
import { sortByNewestFirst } from "./format.js";
async function loadToolCategories() {
  const rows = await storage.get("pa_tool_categories", []);
  return Array.isArray(rows) ? sortByNewestFirst(rows) : [];
}
function defaultTechnologyCategoryId(categories) {
  const other = categories.find((c) => String(c.key).toLowerCase() === "other");
  const pick = other ?? categories[0];
  return pick?.id != null ? Number(pick.id) : null;
}
function populateTechnologyCategorySelect(selectEl, categories, selectedId) {
  if (!selectEl) return;
  const sorted = [...categories];
  const fallback = defaultTechnologyCategoryId(sorted);
  selectEl.innerHTML = sorted.map((c) => {
    const label = c.label || c.key || `Category #${c.id}`;
    return `<option value="${escapeHtml(String(c.id))}">${escapeHtml(label)}</option>`;
  }).join("");
  const val = selectedId ?? fallback;
  if (val != null && sorted.some((c) => String(c.id) === String(val))) {
    selectEl.value = String(val);
  }
}
function readTechnologyCategoryLegacyId(selectId) {
  const el = $id(selectId);
  if (!(el instanceof HTMLSelectElement)) return null;
  const n = Number(el.value);
  return Number.isFinite(n) ? n : null;
}
export {
  defaultTechnologyCategoryId,
  loadToolCategories,
  populateTechnologyCategorySelect,
  readTechnologyCategoryLegacyId
};
//# sourceMappingURL=technologyCategorySelect.js.map
