// @ts-nocheck
import { escapeHtml } from './dom.js';
import { mountFloatingLayer, type FloatingLayerHandle } from './floatingLayer.js';
import { addStackChip, getStackChipSelections } from './chips.js';
import { loadStackCatalog, type StackCatalogItem, type StackKind } from './stackCatalog.js';
import { resolveStackItemByName } from './stackResolve.js';
import { promptStackKind } from './stackKindPrompt.js';

const MAX_SUGGESTIONS = 8;

function selectedKeys(chipsEl: HTMLElement) {
  return new Set(
    getStackChipSelections(chipsEl).map((row) => `${row.kind}:${row.id}`),
  );
}

export type TechnologySuggestOptions = {
  onStackItemCreated?: (item: StackCatalogItem) => void;
  onCreateFailed?: (message: string) => void;
};

export type TechnologySuggestBinding = {
  destroy: () => void;
  refreshCatalog: () => Promise<void>;
  commit: () => Promise<void>;
};

function kindLabel(kind: StackKind) {
  return kind === 'tool' ? 'Tool' : 'Technology';
}

/**
 * Autocomplete for project stack chips (technologies + tools catalogs).
 */
export function bindTechnologySuggest(
  inputEl: HTMLInputElement | null,
  chipsEl: HTMLElement | null,
  listEl: HTMLElement | null,
  options: TechnologySuggestOptions = {},
): TechnologySuggestBinding | null {
  if (!inputEl || !chipsEl || !listEl) return null;

  let catalog: StackCatalogItem[] = [];
  let visible: StackCatalogItem[] = [];
  let highlight = -1;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let floating: FloatingLayerHandle | null = null;

  const wrap = inputEl.closest('.pa-tech-suggest') || inputEl.parentElement;

  if (!listEl.id) {
    listEl.id = `pa-tech-suggest-${Math.random().toString(36).slice(2, 9)}`;
  }

  async function refreshCatalog() {
    catalog = await loadStackCatalog();
  }

  function positionList() {
    if (listEl.hidden) return;
    if (!floating) {
      floating = mountFloatingLayer(listEl, inputEl, { maxHeight: 220, align: 'match-width' });
    } else {
      floating.reposition();
    }
    inputEl.setAttribute('aria-expanded', 'true');
  }

  function renderSuggestionList(items: StackCatalogItem[], highlightIndex: number) {
    if (!items.length) {
      listEl.hidden = true;
      listEl.innerHTML = '';
      floating?.release();
      floating = null;
      inputEl.setAttribute('aria-expanded', 'false');
      return;
    }
    listEl.hidden = false;
    listEl.innerHTML = items
      .map((item, i) => {
        const active = i === highlightIndex ? ' active' : '';
        const name = escapeHtml(item.name || '');
        const badge = escapeHtml(kindLabel(item.kind));
        return `<button type="button" class="pa-tech-suggest-item${active}" role="option" aria-selected="${i === highlightIndex}" data-chip-kind="${escapeHtml(item.kind)}" data-legacy-id="${escapeHtml(String(item.id))}"><span class="pa-tech-suggest-name">${name}</span><span class="pa-tech-suggest-kind">${badge}</span></button>`;
      })
      .join('');
    requestAnimationFrame(() => positionList());
  }

  function hideList() {
    floating?.release();
    floating = null;
    listEl.hidden = true;
    listEl.innerHTML = '';
    highlight = -1;
    visible = [];
    inputEl.setAttribute('aria-expanded', 'false');
  }

  function filterVisible(query: string) {
    const q = query.trim().toLowerCase();
    const taken = selectedKeys(chipsEl);
    visible = catalog
      .filter((item) => !taken.has(`${item.kind}:${item.id}`))
      .filter((item) => !q || String(item.name).toLowerCase().includes(q))
      .slice(0, MAX_SUGGESTIONS);
    highlight = visible.length ? 0 : -1;
    renderSuggestionList(visible, highlight);
  }

  function scheduleHide() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => hideList(), 180);
  }

  function cancelHide() {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function pickItem(item: StackCatalogItem) {
    if (!item) return;
    addStackChip(chipsEl, item.kind, item.id, item.name);
    inputEl.value = '';
    hideList();
    inputEl.focus();
  }

  async function commitFreeText() {
    const raw = inputEl.value.trim();
    if (!raw) return;
    const lower = raw.toLowerCase();
    const exactTech = catalog.find((i) => i.kind === 'technology' && i.name.toLowerCase() === lower);
    const exactTool = catalog.find((i) => i.kind === 'tool' && i.name.toLowerCase() === lower);
    if (exactTech && exactTool) {
      pickItem(highlight >= 0 && visible[highlight] ? visible[highlight] : exactTech);
      return;
    }
    if (exactTool) {
      pickItem(exactTool);
      return;
    }
    if (exactTech) {
      pickItem(exactTech);
      return;
    }
    if (highlight >= 0 && visible[highlight]) {
      pickItem(visible[highlight]);
      return;
    }
    try {
      const kind = await promptStackKind(raw);
      if (!kind) return;
      const created = await resolveStackItemByName(raw, kind);
      if (created) {
        options.onStackItemCreated?.(created);
        await refreshCatalog();
        pickItem(created);
        return;
      }
      options.onCreateFailed?.('Could not add item. Add a tool category under Tech & Tools first.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save item.';
      options.onCreateFailed?.(msg);
    }
  }

  function onInput() {
    cancelHide();
    filterVisible(inputEl.value);
  }

  function onFocus() {
    cancelHide();
    void refreshCatalog().then(() => filterVisible(inputEl.value));
  }

  function onBlur() {
    scheduleHide();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!visible.length) {
        void refreshCatalog().then(() => {
          filterVisible(inputEl.value);
          if (visible.length) highlight = 0;
          renderSuggestionList(visible, highlight);
        });
        return;
      }
      highlight = Math.min(visible.length - 1, highlight + 1);
      renderSuggestionList(visible, highlight);
      return;
    }
    if (e.key === 'ArrowUp') {
      if (!visible.length) return;
      e.preventDefault();
      highlight = Math.max(0, highlight - 1);
      renderSuggestionList(visible, highlight);
      return;
    }
    if (e.key === 'Escape') {
      hideList();
      return;
    }
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      void commitFreeText();
      return;
    }
  }

  function onListMouseDown(e: MouseEvent) {
    e.preventDefault();
    cancelHide();
  }

  function onListClick(e: MouseEvent) {
    const btn = (e.target as HTMLElement).closest('.pa-tech-suggest-item');
    if (!btn) return;
    const kind = btn.getAttribute('data-chip-kind') === 'tool' ? 'tool' : 'technology';
    const id = Number(btn.getAttribute('data-legacy-id'));
    const item = catalog.find((i) => i.kind === kind && Number(i.id) === id)
      || visible.find((i) => i.kind === kind && Number(i.id) === id);
    if (item) pickItem(item);
  }

  function onDocClick(e: MouseEvent) {
    const t = e.target;
    if (!(t instanceof Node)) return;
    if (wrap?.contains(t) || listEl.contains(t)) return;
    if (t instanceof Element && t.closest('.pa-tech-suggest-list, .pa-tech-suggest-item')) return;
    hideList();
  }

  inputEl.setAttribute('autocomplete', 'off');
  inputEl.setAttribute('role', 'combobox');
  inputEl.setAttribute('aria-expanded', 'false');
  inputEl.setAttribute('aria-controls', listEl.id);
  listEl.setAttribute('role', 'listbox');

  inputEl.addEventListener('input', onInput);
  inputEl.addEventListener('focus', onFocus);
  inputEl.addEventListener('blur', onBlur);
  inputEl.addEventListener('keydown', onKeyDown);
  listEl.addEventListener('mousedown', onListMouseDown);
  listEl.addEventListener('click', onListClick);
  document.addEventListener('click', onDocClick, true);

  void refreshCatalog();

  return {
    refreshCatalog,
    commit: commitFreeText,
    destroy: () => {
      inputEl.removeEventListener('input', onInput);
      inputEl.removeEventListener('focus', onFocus);
      inputEl.removeEventListener('blur', onBlur);
      inputEl.removeEventListener('keydown', onKeyDown);
      listEl.removeEventListener('mousedown', onListMouseDown);
      listEl.removeEventListener('click', onListClick);
      document.removeEventListener('click', onDocClick, true);
      if (hideTimer) clearTimeout(hideTimer);
      hideList();
    },
  };
}
