import { debounce } from '../../utils/timing.js';

type SearchResult = {
  type: string;
  title: string;
  subtitle?: string | null;
  href: string;
};

let listEl: HTMLElement | null = null;
let inputEl: HTMLInputElement | null = null;

function ensureResultsList() {
  if (!inputEl) return null;
  let wrap = inputEl.closest('.pa-search');
  if (!wrap) return null;
  let panel = wrap.querySelector('.pa-global-search-results') as HTMLElement | null;
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'pa-global-search-results';
    panel.setAttribute('role', 'listbox');
    panel.hidden = true;
    wrap.appendChild(panel);
  }
  listEl = panel;
  return panel;
}

function renderResults(results: SearchResult[]) {
  const panel = ensureResultsList();
  if (!panel) return;
  if (!results.length) {
    panel.innerHTML = '<div class="pa-global-search-empty">No matches</div>';
    panel.hidden = false;
    return;
  }
  panel.innerHTML = results
    .map(
      (item) => `<a class="pa-global-search-item" role="option" href="${item.href}">
        <span class="pa-global-search-item-title">${item.title}</span>
        <span class="pa-global-search-item-meta">${item.type}${item.subtitle ? ` · ${item.subtitle}` : ''}</span>
      </a>`,
    )
    .join('');
  panel.hidden = false;
}

async function runSearch(query: string) {
  const q = query.trim();
  if (q.length < 2) {
    if (listEl) listEl.hidden = true;
    return;
  }
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=12`, { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();
    renderResults(data.results || []);
  } catch {
    /* ignore */
  }
}

const debouncedSearch = debounce((value: string) => {
  void runSearch(value);
}, 280);

function ensureHeaderSearchInput() {
  const left = document.querySelector('.pa-header-top-left');
  if (!left || left.querySelector('.pa-search input')) return;
  const wrap = document.createElement('div');
  wrap.className = 'pa-search pa-global-search';
  wrap.innerHTML = '<i class="ri-search-line" aria-hidden="true"></i><input type="search" placeholder="Search CMS…" aria-label="Search CMS">';
  left.appendChild(wrap);
}

export function initGlobalSearch() {
  ensureHeaderSearchInput();
  inputEl = document.querySelector<HTMLInputElement>('.pa-header-top .pa-global-search input, .pa-header-top .pa-search input');
  if (!inputEl || inputEl.dataset.paGlobalSearchBound === '1') return;
  inputEl.dataset.paGlobalSearchBound = '1';
  inputEl.setAttribute('autocomplete', 'off');
  inputEl.addEventListener('input', () => debouncedSearch(inputEl?.value || ''));
  inputEl.addEventListener('focus', () => {
    if ((inputEl?.value || '').trim().length >= 2) debouncedSearch(inputEl?.value || '');
  });
  document.addEventListener('click', (event) => {
    const target = event.target as Node;
    if (!inputEl?.closest('.pa-search')?.contains(target) && listEl && !listEl.contains(target)) {
      listEl.hidden = true;
    }
  });
}
