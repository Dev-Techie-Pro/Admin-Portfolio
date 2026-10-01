import { escapeHtml, $id } from './dom.js';

type PaSelectState = {
  wrap: HTMLDivElement;
  trigger: HTMLButtonElement;
  panel: HTMLDivElement;
  list: HTMLDivElement;
  select: HTMLSelectElement;
  setOpen: (open: boolean) => void;
  rebuildOptions: () => void;
  mo: MutationObserver;
};

const REGISTRY = new Map<HTMLSelectElement, PaSelectState>();

const SKIP_SELECTOR = '[data-pa-select-native]';

const ENHANCE_SELECTOR = [
  'select.pa-form-select',
  'select.pa-filter-select',
  'select.pa-form-input',
  'select.pa-act-sort-select',
  'select.pa-chart-dropdown-btn',
].join(', ');

function resolveSelect(
  selectOrId: string | HTMLSelectElement | null | undefined,
): HTMLSelectElement | null {
  if (!selectOrId) return null;
  if (typeof selectOrId === 'string') {
    const el = $id(selectOrId);
    return el instanceof HTMLSelectElement ? el : null;
  }
  return selectOrId instanceof HTMLSelectElement ? selectOrId : null;
}

function closeAllPaSelects(exceptWrap: Element | null = null) {
  document.querySelectorAll('.pa-select-wrap.open').forEach((wrap) => {
    if (wrap === exceptWrap) return;
    const select = wrap.querySelector('select.pa-select-native');
    const state =
      select instanceof HTMLSelectElement ? REGISTRY.get(select) : null;
    if (state?.setOpen) {
      void state.setOpen(false);
      return;
    }
    wrap.classList.remove('open');
  });
}

function optionText(opt: HTMLOptionElement): string {
  return (opt.textContent ?? '').trim();
}

function applyTriggerLabel(trigger: HTMLButtonElement, select: HTMLSelectElement) {
  const opt = select.options.item(select.selectedIndex);
  const valueEl = trigger.querySelector('.pa-select-value');
  if (!valueEl) return;
  if (!opt) {
    valueEl.textContent = 'Select…';
    valueEl.classList.add('is-placeholder');
    return;
  }
  const label = optionText(opt);
  valueEl.textContent = label;
  valueEl.classList.toggle('is-placeholder', opt.value === '' && label.toLowerCase().startsWith('select'));
}

function rebuildOptions(state: PaSelectState) {
  const { list, select, trigger, wrap } = state;

  list.replaceChildren();
  const options = select.options;
  for (let i = 0; i < options.length; i++) {
    const opt: HTMLOptionElement = options[i];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pa-select-option';
    if (opt.selected) btn.classList.add('is-selected');
    if (opt.disabled) btn.classList.add('is-disabled');
    btn.dataset.value = opt.value;
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-selected', String(opt.selected));
    if (opt.disabled) btn.disabled = true;
    btn.innerHTML = `<span class="pa-select-option-label">${escapeHtml(optionText(opt))}</span><i class="ri-check-line pa-select-option-check" aria-hidden="true"></i>`;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.disabled) return;
      select.value = btn.dataset.value ?? '';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      syncPaSelect(select);
      const st = REGISTRY.get(select);
      if (st?.setOpen) void st.setOpen(false);
    });
    list.appendChild(btn);
  }

  applyTriggerLabel(trigger, select);
  wrap.classList.toggle('error', select.classList.contains('error'));
  trigger.disabled = select.disabled;
}

function syncPicker(select: HTMLSelectElement) {
  const state = REGISTRY.get(select);
  if (!state) return;
  rebuildOptions(state);
}

function createPaSelectState(
  wrap: HTMLDivElement,
  trigger: HTMLButtonElement,
  panel: HTMLDivElement,
  list: HTMLDivElement,
  select: HTMLSelectElement,
  setOpen: (open: boolean) => void,
): PaSelectState {
  let state: PaSelectState;
  state = {
    wrap,
    trigger,
    panel,
    list,
    select,
    setOpen,
    rebuildOptions: () => rebuildOptions(state),
    mo: new MutationObserver(() => rebuildOptions(state)),
  };
  return state;
}

/**
 * Enhance a native select with a styled dropdown matching the portfolio UI.
 * @param {string|HTMLSelectElement} selectOrId
 */
export function initPaSelect(
  selectOrId: string | HTMLSelectElement | null | undefined,
): PaSelectState | null {
  const select = resolveSelect(selectOrId);
  if (!select || select.matches(SKIP_SELECTOR) || select.dataset.paSelectReady === '1') {
    return REGISTRY.get(select) || null;
  }

  const wrap = document.createElement('div');
  wrap.className = `pa-select-wrap ${select.className}`.trim();

  select.className = 'pa-select-native';
  select.setAttribute('tabindex', '-1');
  select.setAttribute('aria-hidden', 'true');

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'pa-select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  const ariaLabel = select.getAttribute('aria-label');
  if (ariaLabel) trigger.setAttribute('aria-label', ariaLabel);

  trigger.innerHTML = `<span class="pa-select-value"></span><i class="ri-arrow-down-s-line pa-select-chevron" aria-hidden="true"></i>`;

  const panel = document.createElement('div');
  panel.className = 'pa-select-panel pa-collapse-panel pa-collapse-panel--dropdown';
  panel.setAttribute('role', 'listbox');

  const list = document.createElement('div');
  list.className = 'pa-select-list';
  panel.appendChild(list);

  const parent = select.parentNode;
  parent.insertBefore(wrap, select);
  wrap.appendChild(select);
  wrap.appendChild(trigger);
  wrap.appendChild(panel);

  const setOpen = (open: boolean) => {
    const isOpen = wrap.classList.contains('open');
    if (open === isOpen) return;

    if (open) {
      closeAllPaSelects(wrap);
      wrap.classList.add('open');
      panel.classList.add('is-pa-collapse-open');
      trigger.setAttribute('aria-expanded', 'true');
    } else {
      panel.classList.remove('is-pa-collapse-open');
      wrap.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  };

  const state = createPaSelectState(wrap, trigger, panel, list, select, setOpen);
  state.mo.observe(select, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'class'],
  });
  REGISTRY.set(select, state);

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (select.disabled) return;
    setOpen(!wrap.classList.contains('open'));
  });

  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!select.disabled) setOpen(true);
    }
  });

  select.addEventListener('change', () => syncPaSelect(select));

  if (!window.__paSelectDocBound) {
    window.__paSelectDocBound = true;
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof Element) || !target.closest('.pa-select-wrap')) closeAllPaSelects();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllPaSelects();
    });
  }

  select.dataset.paSelectReady = '1';
  rebuildOptions(state);
  return state;
}

export function syncPaSelect(
  selectOrId: string | HTMLSelectElement | null | undefined,
) {
  const select = resolveSelect(selectOrId);
  if (select) syncPicker(select);
}

export function refreshPaSelect(selectOrId) {
  syncPaSelect(selectOrId);
}

export function initAllPaSelects(root = document) {
  root.querySelectorAll(ENHANCE_SELECTOR).forEach((select) => {
    if (select instanceof HTMLSelectElement && !select.matches(SKIP_SELECTOR)) {
      initPaSelect(select);
    }
  });
}
