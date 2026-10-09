import {
  setStatValue
} from "./chunk-2Y2WE6IH.js";
import {
  applyListGridClasses,
  closeListRow,
  listActionBtn,
  renderListActionsCell,
  renderListIconProjectCell,
  renderListIndexCell,
  renderListRowStart,
  renderListTableShell,
  renderListTextCell,
  syncListPaginationChrome
} from "./chunk-FNKMPPAH.js";
import {
  Module,
  storage
} from "./chunk-3TY7DIYN.js";
import {
  $all,
  $id,
  $input,
  escapeHtml
} from "./chunk-IC6SRMKJ.js";

// client/modules/project-technologies/ProjectTechnologiesModule.ts
var PAGE_SIZE = 12;
var ProjectTechnologiesModule = class extends Module {
  constructor() {
    super({
      name: "Project Technologies",
      storageKey: "pa_project_technology_usage",
      initialState: {
        records: [],
        searchQuery: "",
        page: 1,
        viewMode: "grid",
        filters: { usage: "all", sort: "name" }
      }
    });
  }
  async load() {
    const records = await storage.get(this.storageKey, []);
    this.store.set("records", Array.isArray(records) ? records : []);
  }
  getFiltered() {
    const q = (this.store.get("searchQuery") || "").trim().toLowerCase();
    const { usage, sort } = this.store.get("filters") || {};
    let rows = this.store.get("records").slice();
    if (usage === "used") rows = rows.filter((r) => (Number(r.projectCount) || 0) > 0);
    if (usage === "unused") rows = rows.filter((r) => (Number(r.projectCount) || 0) === 0);
    if (q) {
      rows = rows.filter((r) => String(r.name || "").toLowerCase().includes(q) || (r.projectTitles || []).join(" ").toLowerCase().includes(q));
    }
    if (sort === "count-desc") {
      rows.sort((a, b) => (Number(b.projectCount) || 0) - (Number(a.projectCount) || 0) || String(a.name).localeCompare(String(b.name)));
    } else if (sort === "count-asc") {
      rows.sort((a, b) => (Number(a.projectCount) || 0) - (Number(b.projectCount) || 0) || String(a.name).localeCompare(String(b.name)));
    } else {
      rows.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    }
    return rows;
  }
  renderStats() {
    const records = this.store.get("records");
    const used = records.filter((r) => (Number(r.projectCount) || 0) > 0).length;
    const links = records.reduce((sum, r) => sum + (Number(r.projectCount) || 0), 0);
    setStatValue("paProjTechStatTotal", records.length);
    setStatValue("paProjTechStatUsed", used);
    setStatValue("paProjTechStatUnused", records.length - used);
    setStatValue("paProjTechStatLinks", links);
  }
  navigateToProject(legacyId) {
    try {
      sessionStorage.setItem("pa_projects_focus_id", String(legacyId));
    } catch {
    }
    window.location.href = "/projects";
  }
  renderCard(row) {
    const name = escapeHtml(row.name || "");
    const count = Number(row.projectCount) || 0;
    const titles = row.projectTitles || [];
    const projects = titles.length ? escapeHtml(titles.slice(0, 4).join(", ") + (titles.length > 4 ? "\u2026" : "")) : '<span class="pa-cat-card__desc-empty">Not assigned to any project</span>';
    const id = escapeHtml(String(row.id ?? ""));
    return `<div class="pa-card pa-cat-card" data-tech-id="${id}">
      <div class="pa-cat-card__grid">
        <div class="pa-cat-card__top">
          <div class="pa-cat-card__icon"><i class="ri-code-s-slash-line"></i></div>
          <div class="pa-cat-card__top-content">
            <h3 class="pa-cat-card__title">${name}</h3>
            <div class="pa-cat-card__slug">${count} project${count === 1 ? "" : "s"}</div>
          </div>
        </div>
        <p class="pa-cat-card__desc">${projects}</p>
        <div class="pa-cat-card__footer pa-cat-card__footer--solo">
          <a class="pa-btn pa-btn-cancel pa-btn-sm" href="/technologies">Edit skill details</a>
        </div>
      </div>
    </div>`;
  }
  getListTableColumns() {
    return [
      { label: "#", className: "pa-lv-col-num" },
      { label: "Technology", className: "pa-lv-col-project" },
      { label: "Projects", className: "pa-lv-col-status" },
      { label: "Assigned to" },
      { label: "Actions", className: "pa-lv-col-actions" }
    ];
  }
  renderAssignedCell(titles) {
    const full = (titles || []).filter(Boolean).join(", ") || "\u2014";
    const safeFull = escapeHtml(full);
    let display = safeFull;
    if (titles.length > 3) {
      display = `${escapeHtml(titles.slice(0, 3).join(", "))} (+${titles.length - 3} more)`;
    }
    return `<td><span class="pa-lv-text pa-lv-project-name" title="${safeFull}">${display}</span></td>`;
  }
  renderListRow(row, rowIndex) {
    const count = Number(row.projectCount) || 0;
    const countLabel = `${count} project${count === 1 ? "" : "s"}`;
    const iconHtml = '<i class="ri-code-s-slash-line"></i>';
    const editBtn = listActionBtn(
      "pa-proj-tech-edit",
      "ri-pencil-line",
      "Edit skill",
      "data-tech-id",
      row.id ?? "",
      "Edit"
    );
    return `${renderListRowStart()}
    ${renderListIndexCell(rowIndex)}
    ${renderListIconProjectCell(row.name || "\u2014", iconHtml)}
    ${renderListTextCell(countLabel, "pa-lv-col-status")}
    ${this.renderAssignedCell(row.projectTitles || [])}
    ${renderListActionsCell(editBtn)}
  ${closeListRow()}`;
  }
  renderListTable(pageItems, startIndex) {
    const rows = pageItems.map((r, i) => this.renderListRow(r, startIndex + i + 1)).join("");
    return renderListTableShell(this.getListTableColumns(), rows);
  }
  attachListListeners(scope) {
    if (!scope) return;
    scope.querySelectorAll(".pa-proj-tech-edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/technologies";
      });
    });
  }
  renderPagination(totalItems, totalPages, page) {
    const btnsWrap = $id("paProjTechPaginationBtns");
    const info = $id("paProjTechPaginationInfo");
    if (!btnsWrap || !info) return;
    if (totalItems === 0) {
      btnsWrap.innerHTML = "";
      info.textContent = "Showing 0 of 0";
      return;
    }
    let html = `<div class="pa-page-nav ${page === 1 ? "disabled" : ""}" id="paProjTechPagePrev" role="button" aria-label="Previous page"><i class="ri-arrow-left-s-line"></i></div>`;
    let lastShown = 0;
    for (let p = 1; p <= totalPages; p += 1) {
      const show = p === 1 || p === totalPages || Math.abs(p - page) <= 1;
      if (!show) continue;
      if (p - lastShown > 1) html += '<span style="color:var(--pa-text-faint); padding:0 4px; font-size:12px;">\u2026</span>';
      html += `<button class="pa-page-btn ${p === page ? "active" : ""}" data-page="${p}">${p}</button>`;
      lastShown = p;
    }
    html += `<div class="pa-page-nav ${page === totalPages ? "disabled" : ""}" id="paProjTechPageNext" role="button" aria-label="Next page"><i class="ri-arrow-right-s-line"></i></div>`;
    btnsWrap.innerHTML = html;
    const startN = (page - 1) * PAGE_SIZE + 1;
    const endN = Math.min(page * PAGE_SIZE, totalItems);
    info.textContent = `Showing ${startN} to ${endN} of ${totalItems}`;
    btnsWrap.querySelectorAll(".pa-page-btn").forEach((btn) => {
      if (!(btn instanceof HTMLElement)) return;
      btn.addEventListener("click", () => {
        this.store.set("page", parseInt(btn.dataset.page ?? "", 10));
        this.render();
        $id("paProjTechBody")?.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
    const prevBtn = $id("paProjTechPagePrev");
    const nextBtn = $id("paProjTechPageNext");
    if (prevBtn && !prevBtn.classList.contains("disabled")) {
      prevBtn.addEventListener("click", () => {
        this.store.set("page", page - 1);
        this.render();
      });
    }
    if (nextBtn && !nextBtn.classList.contains("disabled")) {
      nextBtn.addEventListener("click", () => {
        this.store.set("page", page + 1);
        this.render();
      });
    }
  }
  setViewMode(mode) {
    this.store.set("viewMode", mode);
    const gridBtn = $id("paGridViewBtn");
    const listBtn = $id("paListViewBtn");
    gridBtn?.classList.toggle("active", mode === "grid");
    listBtn?.classList.toggle("active", mode === "list");
    this.render();
  }
  resetFilters() {
    const searchInput = $input("paSearchInput");
    if (searchInput) searchInput.value = "";
    $id("paSearchWrap")?.classList.remove("has-value");
    const usageEl = $id("paProjTechUsageFilter");
    const sortEl = $id("paProjTechSortFilter");
    if (usageEl) usageEl.value = "all";
    if (sortEl) sortEl.value = "name";
    this.store.update({
      searchQuery: "",
      page: 1,
      filters: { usage: "all", sort: "name" }
    });
    this.render();
  }
  render() {
    this.renderStats();
    const grid = $id("paProjTechGrid");
    const all = this.getFiltered();
    const total = this.store.get("records").length;
    const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    let page = this.store.get("page");
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    if (page !== this.store.get("page")) this.store.set("page", page);
    const start = (page - 1) * PAGE_SIZE;
    const pageItems = all.slice(start, start + PAGE_SIZE);
    const isList = this.store.get("viewMode") === "list";
    const resultCount = $id("paProjTechResultCount");
    if (resultCount) {
      resultCount.textContent = all.length === total ? `${total} total` : `${all.length} of ${total}`;
    }
    if (!grid) return;
    applyListGridClasses(grid, isList);
    if (!pageItems.length) {
      const hasFilters = !!(this.store.get("searchQuery") || "").trim() || this.store.get("filters")?.usage !== "all";
      grid.innerHTML = hasFilters ? `<div class="pa-empty-state"><i class="ri-search-line"></i><div class="pa-empty-state-title">No results match your filters</div><div class="pa-empty-state-text">Try adjusting your search or filters.</div><button type="button" class="pa-empty-state-btn" id="paProjTechEmptyReset">Reset filters</button></div>` : '<div class="pa-empty-state"><i class="ri-code-s-slash-line"></i><div class="pa-empty-state-title">No technologies yet</div><div class="pa-empty-state-text">Add skills under Tech &amp; Tools, then assign them on project forms.</div></div>';
      this.on($id("paProjTechEmptyReset"), "click", () => this.resetFilters());
    } else if (isList) {
      grid.innerHTML = this.renderListTable(pageItems, start);
      this.attachListListeners(grid);
    } else {
      grid.innerHTML = pageItems.map((row) => this.renderCard(row)).join("");
    }
    syncListPaginationChrome(isList, $id("paProjTechPagination"));
    this.renderPagination(all.length, totalPages, page);
    $all("[data-project-legacy-id]", grid).forEach((btn) => {
      btn.addEventListener("click", () => {
        const legacyId = btn.getAttribute("data-project-legacy-id");
        if (legacyId) this.navigateToProject(legacyId);
      });
    });
  }
  bindEvents() {
    const searchInput = $input("paSearchInput");
    if (searchInput) {
      this.on(searchInput, "input", () => {
        this.store.update({ searchQuery: searchInput.value, page: 1 });
        $id("paSearchWrap")?.classList.toggle("has-value", !!searchInput.value);
        this.render();
      });
    }
    this.on($id("paSearchClear"), "click", () => {
      if (!searchInput) return;
      searchInput.value = "";
      this.store.update({ searchQuery: "", page: 1 });
      $id("paSearchWrap")?.classList.remove("has-value");
      this.render();
    });
    const usageFilter = $id("paProjTechUsageFilter");
    if (usageFilter) {
      this.on(usageFilter, "change", () => {
        this.store.update({
          filters: { ...this.store.get("filters"), usage: usageFilter.value },
          page: 1
        });
        this.render();
      });
    }
    const sortFilter = $id("paProjTechSortFilter");
    if (sortFilter) {
      this.on(sortFilter, "change", () => {
        this.store.update({
          filters: { ...this.store.get("filters"), sort: sortFilter.value },
          page: 1
        });
        this.render();
      });
    }
    this.on($id("paGridViewBtn"), "click", () => this.setViewMode("grid"));
    this.on($id("paListViewBtn"), "click", () => this.setViewMode("list"));
  }
};
export {
  ProjectTechnologiesModule
};
//# sourceMappingURL=ProjectTechnologiesModule-ZBAPLBI3.js.map
