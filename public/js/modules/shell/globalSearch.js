import { debounce } from "../../utils/timing.js";
let listEl = null;
let inputEl = null;
function ensureResultsList() {
  if (!inputEl) return null;
  let wrap = inputEl.closest(".pa-search");
  if (!wrap) return null;
  let panel = wrap.querySelector(".pa-global-search-results");
  if (!panel) {
    panel = document.createElement("div");
    panel.className = "pa-global-search-results";
    panel.setAttribute("role", "listbox");
    panel.hidden = true;
    wrap.appendChild(panel);
  }
  listEl = panel;
  return panel;
}
function renderResults(results) {
  const panel = ensureResultsList();
  if (!panel) return;
  if (!results.length) {
    panel.innerHTML = '<div class="pa-global-search-empty">No matches</div>';
    panel.hidden = false;
    return;
  }
  panel.innerHTML = results.map(
    (item) => `<a class="pa-global-search-item" role="option" href="${item.href}">
        <span class="pa-global-search-item-title">${item.title}</span>
        <span class="pa-global-search-item-meta">${item.type}${item.subtitle ? ` \xB7 ${item.subtitle}` : ""}</span>
      </a>`
  ).join("");
  panel.hidden = false;
}
async function runSearch(query) {
  const q = query.trim();
  if (q.length < 2) {
    if (listEl) listEl.hidden = true;
    return;
  }
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=12`, { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    renderResults(data.results || []);
  } catch {
  }
}
const debouncedSearch = debounce((value) => {
  void runSearch(value);
}, 280);
function ensureHeaderSearchInput() {
  const left = document.querySelector(".pa-header-top-left");
  if (!left || left.querySelector(".pa-search input")) return;
  const wrap = document.createElement("div");
  wrap.className = "pa-search pa-global-search";
  wrap.innerHTML = '<i class="ri-search-line" aria-hidden="true"></i><input type="search" placeholder="Search CMS\u2026" aria-label="Search CMS">';
  left.appendChild(wrap);
}
function initGlobalSearch() {
  ensureHeaderSearchInput();
  inputEl = document.querySelector(".pa-header-top .pa-global-search input, .pa-header-top .pa-search input");
  if (!inputEl || inputEl.dataset.paGlobalSearchBound === "1") return;
  inputEl.dataset.paGlobalSearchBound = "1";
  inputEl.setAttribute("autocomplete", "off");
  inputEl.addEventListener("input", () => debouncedSearch(inputEl?.value || ""));
  inputEl.addEventListener("focus", () => {
    if ((inputEl?.value || "").trim().length >= 2) debouncedSearch(inputEl?.value || "");
  });
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!inputEl?.closest(".pa-search")?.contains(target) && listEl && !listEl.contains(target)) {
      listEl.hidden = true;
    }
  });
}
export {
  initGlobalSearch
};
