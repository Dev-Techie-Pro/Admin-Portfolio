import { storage } from '../core/StorageService.js';
import { escapeHtml, $id } from './dom.js';
import { sortByNewestFirst } from './format.js';

export type ToolCategoryRecord = {
  id: number;
  key?: string;
  label?: string;
};

export async function loadToolCategories(): Promise<ToolCategoryRecord[]> {
  const rows = await storage.get('pa_tool_categories', []);
  return Array.isArray(rows) ? sortByNewestFirst(rows) : [];
}

export function defaultTechnologyCategoryId(categories: ToolCategoryRecord[]): number | null {
  const other = categories.find((c) => String(c.key).toLowerCase() === 'other');
  const pick = other ?? categories[0];
  return pick?.id != null ? Number(pick.id) : null;
}

export function populateTechnologyCategorySelect(
  selectEl: HTMLSelectElement | null,
  categories: ToolCategoryRecord[],
  selectedId?: number | null,
) {
  if (!selectEl) return;
  const sorted = [...categories];
  const fallback = defaultTechnologyCategoryId(sorted);
  selectEl.innerHTML = sorted
    .map((c) => {
      const label = c.label || c.key || `Category #${c.id}`;
      return `<option value="${escapeHtml(String(c.id))}">${escapeHtml(label)}</option>`;
    })
    .join('');
  const val = selectedId ?? fallback;
  if (val != null && sorted.some((c) => String(c.id) === String(val))) {
    selectEl.value = String(val);
  }
}

export function readTechnologyCategoryLegacyId(selectId: string): number | null {
  const el = $id(selectId);
  if (!(el instanceof HTMLSelectElement)) return null;
  const n = Number(el.value);
  return Number.isFinite(n) ? n : null;
}
