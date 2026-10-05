import {
  CrudCardModule
} from "./chunk-CWLCMTC6.js";
import {
  setStatTrend,
  setStatValue
} from "./chunk-7UGQDK37.js";
import {
  slugify
} from "./chunk-7E6YUGMN.js";
import {
  renderGroupedCards
} from "./chunk-BTPUWCWQ.js";
import {
  sortByNewestFirst
} from "./chunk-MXTY5YBH.js";
import {
  applyListGridClasses,
  closeListRow,
  renderListDateCell,
  renderListEditDeleteActions,
  renderListIconProjectCell,
  renderListIndexCell,
  renderListRowStart,
  renderListStatusCell,
  renderListTableShell,
  renderListTextCell,
  syncListPaginationChrome
} from "./chunk-FL3A6ZLL.js";
import {
  PAGE
} from "./chunk-FNXGUDEM.js";
import {
  activateTab,
  closePanels,
  openPanel,
  storage
} from "./chunk-W73CLJTU.js";
import {
  $all,
  $field,
  $id,
  $input,
  $select,
  escapeHtml
} from "./chunk-B2QR3Q5R.js";

// client/modules/tags/TagsModule.ts
function newTagId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `tag-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
var DEFAULT_TAG_ENTITY_LABELS = {
  capitalized: "Project",
  pluralCapitalized: "Projects",
  selectPlaceholder: "Select a project",
  selectError: "Please select a project",
  filterAll: "All Projects",
  filterAria: "Filter by project",
  assignHint: "assign this tag to a project",
  tagNameHint: "shown on project cards",
  fallbackName: "Project",
  listColumn: "Project",
  noLinked: "No projects linked",
  notLinkedDelete: "Not linked to any projects yet.",
  emptyTitle: "No project tags yet",
  emptyText: "Get started by adding your first project tag.",
  navigatePath: "/projects",
  focusStorageKey: "pa_projects_focus_id",
  deleteConfirmTitle: "Delete project tag?",
  deleteConfirmText: "This will permanently remove the tag from the assigned project.",
  addPanelBlockedToast: "Add a project first before creating tags.",
  viewAria: "View project"
};
var TagsModule = class extends CrudCardModule {
  constructor() {
    super({
      name: "Project Tags",
      storageKey: "pa_project_tag_labels",
      deleteType: "project-tag",
      page: "project-tags",
      pageSize: 12,
      listTable: true,
      cardIdAttr: "data-tag-id",
      bulkLabel: "tag",
      tabGroup: null,
      addFocusId: "tagAddName",
      editFocusId: "tagEditName",
      ids: {
        grid: "paTagGrid",
        resultCount: "paTagResultCount",
        paginationBtns: "paTagPaginationBtns",
        paginationInfo: "paTagPaginationInfo",
        pagePrev: "paTagPagePrev",
        pageNext: "paTagPageNext",
        bodyScroll: "paTagBody",
        emptyResetBtn: "paTagEmptyResetBtn",
        emptyAddBtn: "paTagEmptyAddBtn",
        addPanel: "paTagAddPanel",
        editPanel: "paTagEditPanel",
        addSubmit: "paTagAddSubmit",
        editSubmit: "paTagEditSubmit",
        editDelete: null,
        addNewBtn: "paTagAddNewBtn",
        addPanelClose: "paTagAddPanelClose",
        editPanelClose: "paTagEditPanelClose",
        addCancel: "paTagAddCancel",
        editCancel: "paTagEditCancel"
      },
      menuActions: {
        "copy-tag": function copyTag(id) {
          this.copyTagName(id);
        }
      },
      buildDuplicate: function buildDuplicate(record) {
        return {
          ...record,
          id: newTagId(),
          tag: `${record.tag} Copy`
        };
      },
      defaultFilters: { project: "all" },
      filterSelectIds: [{ id: "paTagProjectFilter", key: "project" }],
      layout: {
        selectId: "paTagLayout",
        singular: "tag",
        plural: "tags",
        getGroupInfo(record) {
          const title = record.name || record.tag || "Tag";
          const key = String(record.slug || title).toLowerCase();
          return { key, title, icon: "ri-price-tag-3-line", actionHtml: "" };
        }
      }
    });
    this.projects = [];
    this.entityLabels = null;
  }
  getEntityLabels() {
    return this.entityLabels ?? DEFAULT_TAG_ENTITY_LABELS;
  }
  patchEntityLabels() {
    const L = this.getEntityLabels();
    const assignHintHtml = `<span class="pa-form-hint">\u2014 ${L.assignHint}</span>`;
    const setAssignLabel = (forId) => {
      const label = document.querySelector(`label.pa-form-label[for="${forId}"]`);
      if (!label) return;
      label.innerHTML = `${L.capitalized} <span class="pa-form-required">*</span> ${assignHintHtml}`;
    };
    setAssignLabel("tagAddProject");
    setAssignLabel("tagEditProject");
    const addNameLabel = document.querySelector('label.pa-form-label[for="tagAddName"]');
    if (addNameLabel) {
      addNameLabel.innerHTML = `Tag Name <span class="pa-form-required">*</span> <span class="pa-form-hint">\u2014 ${L.tagNameHint}</span>`;
    }
    const setSelectError = (id) => {
      const el = $id(id);
      if (el) el.innerHTML = `<i class="ri-error-warning-line"></i> ${L.selectError}`;
    };
    setSelectError("tagAddProjectError");
    setSelectError("tagEditProjectError");
    const filter = $id("paTagProjectFilter");
    if (filter) filter.setAttribute("aria-label", L.filterAria);
    const confirmTitle = $id("paConfirmTitle");
    const confirmText = $id("paConfirmText");
    if (confirmTitle) confirmTitle.textContent = L.deleteConfirmTitle;
    if (confirmText) confirmText.textContent = L.deleteConfirmText;
  }
  entityCountLabel(count) {
    const L = this.getEntityLabels();
    const n = Number(count) || 0;
    return `${n} ${L.capitalized.toLowerCase()}${n === 1 ? "" : "s"}`;
  }
  seedData() {
    return [];
  }
  async load() {
    const [records, projects] = await Promise.all([
      storage.get(this.storageKey, []),
      storage.get("pa_projects", [])
    ]);
    this.projects = Array.isArray(projects) ? projects.slice() : [];
    this.store.set("records", Array.isArray(records) ? records : []);
    this.patchEntityLabels();
    this.populateProjectSelects();
  }
  async persist() {
    await this.saveRecords(this.store.get("records"));
    storage.invalidate(this.storageKey);
    storage.invalidate("pa_project_tags");
    storage.invalidate("pa_projects");
    const fresh = await storage.get(this.storageKey, []);
    this.store.set("records", Array.isArray(fresh) ? fresh : []);
  }
  sortRecords(records) {
    return sortByNewestFirst(records);
  }
  tagName(record) {
    return record.name || record.tag || "";
  }
  matchesSearch(record, query) {
    const q = query.trim().toLowerCase();
    const names = (record.projectTitles || []).join(" ");
    return String(this.tagName(record)).toLowerCase().includes(q) || String(record.slug || "").toLowerCase().includes(q) || names.toLowerCase().includes(q);
  }
  matchesFilters(record, filters) {
    const project = filters?.project || "all";
    if (project === "all") return true;
    const ids = record.projectLegacyIds || (record.projectLegacyId != null ? [record.projectLegacyId] : []);
    return ids.some((id) => String(id) === String(project));
  }
  getDeleteName(record) {
    return this.tagName(record) || "Tag";
  }
  getDeleteExtraInfo(record) {
    const L = this.getEntityLabels();
    const count = record.projectCount ?? (record.projectLegacyIds || []).length;
    if (!count) return L.notLinkedDelete;
    const noun = L.capitalized.toLowerCase();
    return `Used on ${count} ${noun}${count === 1 ? "" : "s"}.`;
  }
  copyTagName(id) {
    const record = this.findById(id);
    if (!record) return;
    navigator.clipboard?.writeText(this.tagName(record)).then(
      () => this.toast(`Copied \u201C${this.tagName(record)}\u201D to clipboard.`, "success", 2e3),
      () => this.toast("Clipboard not available.", "danger")
    );
  }
  navigateToProject(legacyId) {
    const L = this.getEntityLabels();
    try {
      sessionStorage.setItem(L.focusStorageKey, String(legacyId));
    } catch {
    }
    window.location.href = L.navigatePath;
  }
  populateProjectSelects() {
    const L = this.getEntityLabels();
    const options = this.projects.slice().sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""))).map((p) => `<option value="${escapeHtml(String(p.id))}">${escapeHtml(p.title || `${L.fallbackName} #${p.id}`)}</option>`).join("");
    const empty = `<option value="">${escapeHtml(L.selectPlaceholder)}</option>`;
    const addSelect = $id("tagAddProject");
    const editSelect = $id("tagEditProject");
    if (addSelect) addSelect.innerHTML = empty + options;
    if (editSelect) editSelect.innerHTML = empty + options;
    const filter = $select("paTagProjectFilter");
    if (filter) {
      const current = this.store.get("filters")?.project || "all";
      filter.innerHTML = `<option value="all">${escapeHtml(L.filterAll)}</option>` + this.projects.slice().sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""))).map((p) => `<option value="${escapeHtml(String(p.id))}">${escapeHtml(p.title || `${L.fallbackName} #${p.id}`)}</option>`).join("");
      filter.value = this.projects.some((p) => String(p.id) === String(current)) ? String(current) : "all";
      if (filter.value !== current) {
        this.store.set("filters", { ...this.store.get("filters"), project: filter.value });
      }
    }
  }
  projectTitleByLegacyId(legacyId) {
    const project = this.projects.find((p) => String(p.id) === String(legacyId));
    return project?.title || "";
  }
  renderCardMenu(record) {
    const id = escapeHtml(String(record.id));
    return `<div class="pa-card-menu" data-tag-id="${id}">
      <div class="pa-card-menu-item" data-action="copy-tag" data-tag-id="${id}"><i class="ri-clipboard-line"></i> Copy tag</div>
      <div class="pa-card-menu-item" data-action="duplicate" data-tag-id="${id}"><i class="ri-file-copy-line"></i> Duplicate</div>
    </div>`;
  }
  renderListRow(record, rowIndex) {
    const id = record.id;
    const tag = this.tagName(record);
    const L = this.getEntityLabels();
    const projectTitle = (record.projectTitles || []).slice(0, 2).join(", ") || this.entityCountLabel(record.projectCount || 0);
    const safeTag = escapeHtml(tag);
    return `${renderListRowStart(this.bulkSelect?.cardClass(record.id) || "")}
      ${renderListIndexCell(rowIndex)}
      ${renderListIconProjectCell(tag, '<i class="ri-price-tag-3-line"></i>')}
      ${renderListTextCell(projectTitle)}
      ${renderListStatusCell("Active")}
      ${renderListDateCell("\u2014")}
      ${renderListEditDeleteActions({
      idAttr: "data-tag-id",
      id,
      title: tag
    })}
    ${closeListRow()}`;
  }
  renderCard(record, index) {
    const id = escapeHtml(String(record.id));
    const tag = escapeHtml(this.tagName(record));
    const L = this.getEntityLabels();
    const projectTitle = escapeHtml((record.projectTitles || []).join(", ") || L.noLinked);
    const slug = escapeHtml(record.slug || "");
    const projectCount = Number(record.projectCount ?? (record.projectLegacyIds || []).length) || 0;
    const firstProjectId = (record.projectLegacyIds || [])[0];
    const projectLegacyId = escapeHtml(String(firstProjectId ?? ""));
    const bulkCheckbox = this.bulkSelect?.checkboxHtml(record.id, `Select ${record.tag}`) || "";
    const menu = this.renderCardMenu(record);
    const delay = Math.min(index, 12) * 40;
    return `<div class="pa-card pa-cat-card${this.bulkSelect?.cardClass(record.id) || ""}" data-tag-id="${id}" data-cat-key="web" style="animation-delay:${delay}ms;">
      ${bulkCheckbox}
      <div class="pa-cat-card__bg" aria-hidden="true"></div>
      <div class="pa-cat-card__grid">
        <div class="pa-cat-card__top">
          <div class="pa-cat-card__icon"><i class="ri-price-tag-3-line"></i></div>
          <div class="pa-cat-card__top-content">
            <h3 class="pa-cat-card__title" title="${tag}">${tag}</h3>
            <div class="pa-cat-card__slug"><span class="pa-cat-card__slug-mark" aria-hidden="true">\u25C6</span>${slug || "tag"}</div>
          </div>
        </div>
        <p class="pa-cat-card__desc">${projectTitle}</p>
        <div class="pa-cat-card__count"><i class="ri-apps-line"></i><span>${this.entityCountLabel(projectCount)}</span></div>
        <div class="pa-cat-card__footer pa-cat-card__footer--solo">
          <div class="pa-cat-card__footer-more">
            <button type="button" class="pa-action-btn pa-action-view pa-cat-card__view-btn" data-project-legacy-id="${projectLegacyId}" title="${escapeHtml(L.viewAria)}" aria-label="${escapeHtml(L.viewAria)} ${projectTitle}"><i class="ri-eye-line"></i></button>
            <button type="button" class="pa-action-btn pa-action-edit" data-tag-id="${id}" title="Edit tag" aria-label="Edit ${tag}"><i class="ri-pencil-line"></i></button>
            <button type="button" class="pa-action-btn pa-action-delete" data-tag-id="${id}" title="Delete tag" aria-label="Delete ${tag}"><i class="ri-delete-bin-line"></i></button>
            <button type="button" class="pa-action-btn pa-action-more" data-tag-id="${id}" title="More options" aria-label="More options for ${tag}"><i class="ri-more-2-fill"></i></button>
            ${menu}
          </div>
        </div>
      </div>
      <div class="pa-cat-card__list">
        <div class="pa-cat-card__icon"><i class="ri-price-tag-3-line"></i></div>
        <div class="pa-cat-card__list-main">
          <div class="pa-cat-card__title" title="${tag}">${tag}</div>
          <div class="pa-cat-card__slug"><span class="pa-cat-card__slug-mark" aria-hidden="true">\u25C6</span>${slug || "tag"}</div>
          <div class="pa-cat-card__desc">${projectTitle}</div>
        </div>
        <div class="pa-cat-card__count"><i class="ri-apps-line"></i><span>${this.entityCountLabel(projectCount)}</span></div>
        <div class="pa-cat-card__status">Active</div>
        <div class="pa-cat-card__list-actions">
          <button type="button" class="pa-action-btn pa-action-edit" data-tag-id="${id}" title="Edit tag" aria-label="Edit ${tag}"><i class="ri-pencil-line"></i></button>
          <button type="button" class="pa-action-btn pa-action-delete" data-tag-id="${id}" title="Delete tag" aria-label="Delete ${tag}"><i class="ri-delete-bin-line"></i></button>
          <button type="button" class="pa-action-btn pa-action-more" data-tag-id="${id}" title="More options" aria-label="More options for ${tag}"><i class="ri-more-2-fill"></i></button>
          ${menu}
        </div>
        <button type="button" class="pa-cat-card__chevron" data-project-legacy-id="${projectLegacyId}" aria-label="${escapeHtml(L.viewAria)} ${projectTitle}"><i class="ri-arrow-right-s-line"></i></button>
      </div>
    </div>`;
  }
  setViewModeFromStore() {
    const mode = this.store.get("viewMode") || "grid";
    const gridBtn = $id("paTagGridViewBtn");
    const listBtn = $id("paTagListViewBtn");
    if (gridBtn) gridBtn.classList.toggle("active", mode === "grid");
    if (listBtn) listBtn.classList.toggle("active", mode === "list");
  }
  renderStats() {
    const records = this.store.get("records");
    const unique = new Set(records.map((r) => String(this.tagName(r)).toLowerCase()).filter(Boolean));
    const projectsWithTags = /* @__PURE__ */ new Set();
    records.forEach((r) => (r.projectLegacyIds || []).forEach((id) => projectsWithTags.add(String(id))));
    const avg = projectsWithTags.size ? Math.round(records.length / projectsWithTags.size * 10) / 10 : 0;
    setStatValue("paTagStatTotal", records.length);
    setStatValue("paTagStatUnique", unique.size);
    setStatValue("paTagStatProjects", projectsWithTags.size);
    setStatValue("paTagStatAvg", avg);
    setStatTrend("paTagStatTotalTrend", records);
    setStatTrend("paTagStatUniqueTrend", records);
    setStatTrend("paTagStatProjectsTrend", records);
    setStatTrend("paTagStatAvgTrend", records);
  }
  async render() {
    this.renderStats();
    this.syncLayoutSelect();
    const { ids, pageSize } = this.config;
    const all = this.getFiltered();
    const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
    let page = this.store.get("page");
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    if (page !== this.store.get("page")) this.store.set("page", page);
    const start = (page - 1) * pageSize;
    const pageItems = all.slice(start, start + pageSize);
    const grid = $id(ids.grid);
    const isList = this.store.get("viewMode") === "list";
    if (grid) {
      applyListGridClasses(grid, isList);
      if (pageItems.length === 0) {
        const hasFilters = !!(this.store.get("searchQuery") || "").trim() || Object.values(this.store.get("filters")).some((v) => v && v !== "all");
        const L = this.getEntityLabels();
        grid.innerHTML = `<div class="pa-empty-state"><i class="ri-price-tag-3-line"></i><div class="pa-empty-state-title">${hasFilters ? "No tags match your filters" : L.emptyTitle}</div><div class="pa-empty-state-text">${hasFilters ? "Try adjusting your search or filters to find what you're looking for." : L.emptyText}</div>${hasFilters ? `<button class="pa-empty-state-btn" id="${ids.emptyResetBtn}">Reset filters</button>` : `<button class="pa-empty-state-btn" id="${ids.emptyAddBtn}">+ Add Tag</button>`}</div>`;
        this.on($id(ids.emptyResetBtn), "click", () => this.resetFilters());
        this.on($id(ids.emptyAddBtn), "click", () => this.openAddPanel());
      } else if (isList) {
        const rows = pageItems.map((r, i) => this.renderListRow(r, start + i + 1)).join("");
        grid.innerHTML = renderListTableShell([
          { label: "#", className: "pa-lv-col-num" },
          { label: "Tag", className: "pa-lv-col-project" },
          { label: this.getEntityLabels().listColumn },
          { label: "Status", className: "pa-lv-col-status" },
          { label: "Created", className: "pa-lv-col-date" },
          { label: "Actions", className: "pa-lv-col-actions" }
        ], rows);
      } else if (this.isGroupedLayout()) {
        grid.innerHTML = renderGroupedCards(
          pageItems,
          all,
          (record) => this.groupInfo(record),
          (record, i) => this.renderCard(record, i),
          "tag",
          "tags"
        );
      } else {
        grid.innerHTML = pageItems.map((record, i) => this.renderCard(record, i)).join("");
      }
    }
    syncListPaginationChrome(isList && pageItems.length > 0, $id(ids.paginationBtns)?.closest(".pa-pagination"));
    const resultCount = $id(ids.resultCount);
    const total = this.store.get("records").length;
    if (resultCount) {
      resultCount.textContent = all.length === total ? `${total} total` : `${all.length} of ${total}`;
    }
    this.renderPagination(all.length, totalPages, page);
    this.patchEntityLabels();
    this.populateProjectSelects();
    this.attachCardListeners();
    this.bulkSelect?.onRender();
    this.onAfterRender();
    this.setViewModeFromStore();
  }
  resetFilters() {
    this.store.batch(() => {
      this.store.set("searchQuery", "");
      this.store.set("filters", { project: "all" });
      this.store.set("layoutMode", "flat");
      this.store.set("page", 1);
    });
    const searchInput = $input("paTagSearchInput");
    if (searchInput) {
      searchInput.value = "";
      $id("paTagSearchWrap")?.classList.remove("has-value");
    }
    const projectFilter = $select("paTagProjectFilter");
    if (projectFilter) projectFilter.value = "all";
    const layoutEl = this.layoutSelect();
    if (layoutEl) layoutEl.value = "flat";
    this.render();
  }
  attachCardListeners() {
    super.attachCardListeners();
    const grid = $id(this.config.ids.grid);
    if (!grid) return;
    $all("button[data-project-legacy-id], .pa-cat-card__view-btn[data-project-legacy-id], .pa-cat-card__chevron[data-project-legacy-id], .pa-group-heading__link[data-project-legacy-id]", grid).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const legacyId = btn.getAttribute("data-project-legacy-id");
        if (legacyId) this.navigateToProject(legacyId);
      });
    });
  }
  onAfterRender() {
  }
  bindEvents() {
    super.bindEvents();
    const searchInput = $input("paTagSearchInput");
    if (searchInput) {
      this.on(searchInput, "input", () => {
        this.store.set("searchQuery", searchInput.value);
        this.store.set("page", 1);
        $id("paTagSearchWrap")?.classList.toggle("has-value", !!searchInput.value);
        this.render();
      });
    }
    this.on($id("paTagSearchClear"), "click", () => {
      if (!searchInput) return;
      searchInput.value = "";
      this.store.set("searchQuery", "");
      $id("paTagSearchWrap")?.classList.remove("has-value");
      this.render();
    });
    const gridBtn = $id("paTagGridViewBtn");
    const listBtn = $id("paTagListViewBtn");
    if (gridBtn) {
      const parent = gridBtn.parentNode;
      const newGridBtn = gridBtn.cloneNode(true);
      parent.replaceChild(newGridBtn, gridBtn);
      this.on(newGridBtn, "click", () => {
        this.store.set("viewMode", "grid");
        this.setViewModeFromStore();
        this.render();
      });
    }
    if (listBtn) {
      const parent = listBtn.parentNode;
      const newListBtn = listBtn.cloneNode(true);
      parent.replaceChild(newListBtn, listBtn);
      this.on(newListBtn, "click", () => {
        this.store.set("viewMode", "list");
        this.setViewModeFromStore();
        this.render();
      });
    }
  }
  resetAddForm() {
    ["tagAddName", "tagAddProject", "tagAddSort"].forEach((id) => {
      const el = $field(id);
      if (!el) return;
      if (id === "tagAddSort") el.value = "0";
      else el.value = "";
    });
    ["tagAddName", "tagAddProject"].forEach((id) => {
      $id(`${id}Error`)?.classList.remove("visible");
      $id(id)?.classList.remove("error");
    });
  }
  populateEditForm(record) {
    this.patchEntityLabels();
    this.populateProjectSelects();
    const editName = $input("tagEditName");
    if (editName) editName.value = this.tagName(record);
    const firstProject = (record.projectLegacyIds || [])[0];
    const editProject = $select("tagEditProject");
    if (editProject) editProject.value = firstProject != null ? String(firstProject) : "";
    const editSort = $input("tagEditSort");
    if (editSort) editSort.value = "0";
    ["tagEditName", "tagEditProject"].forEach((id) => {
      $id(`${id}Error`)?.classList.remove("visible");
      $id(id)?.classList.remove("error");
    });
  }
  _setFieldError(id, valid) {
    const input = $id(id);
    const err = $id(`${id}Error`);
    input?.classList.toggle("error", !valid);
    err?.classList.toggle("visible", !valid);
  }
  validateForm(prefix) {
    const isAdd = prefix === "add";
    const p = isAdd ? "tagAdd" : "tagEdit";
    let valid = true;
    const tag = ($input(`${p}Name`)?.value ?? "").trim();
    const projectLegacyId = ($select(`${p}Project`)?.value ?? "").trim();
    const sortRaw = ($input(`${p}Sort`)?.value ?? "").trim();
    const sortOrder = sortRaw === "" ? 0 : Number(sortRaw);
    if (!tag) {
      this._setFieldError(`${p}Name`, false);
      valid = false;
    } else {
      this._setFieldError(`${p}Name`, true);
    }
    if (projectLegacyId && !this.projects.some((proj) => String(proj.id) === projectLegacyId)) {
      this._setFieldError(`${p}Project`, false);
      valid = false;
    } else {
      this._setFieldError(`${p}Project`, true);
    }
    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      this._setFieldError(`${p}Sort`, false);
      valid = false;
    } else {
      this._setFieldError(`${p}Sort`, true);
    }
    if (!valid) return { valid: false };
    const editingId = isAdd ? null : this.currentEditId;
    const duplicate = this.store.get("records").some((r) => String(r.id) !== String(editingId) && String(this.tagName(r)).toLowerCase() === tag.toLowerCase());
    if (duplicate) {
      this._setFieldError(`${p}Name`, false);
      this.toast("A tag with this name already exists.", "danger");
      return { valid: false };
    }
    const projectLegacyIds = projectLegacyId ? [Number(projectLegacyId)] : [];
    const projectTitles = projectLegacyIds.map((id) => this.projectTitleByLegacyId(id)).filter(Boolean);
    return {
      valid: true,
      name: tag,
      slug: slugify(tag),
      projectLegacyIds,
      projectTitles,
      projectCount: projectLegacyIds.length,
      sortOrder
    };
  }
  nextTagLegacyId() {
    const records = this.store.get("records");
    return Math.max(0, ...records.map((r) => Number(r.id) || 0)) + 1;
  }
  buildNewRecord(result) {
    return {
      id: this.nextTagLegacyId(),
      name: result.name,
      slug: result.slug,
      desc: "",
      projectLegacyIds: result.projectLegacyIds,
      projectTitles: result.projectTitles,
      projectCount: result.projectCount,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  applyEditToRecord(record, result) {
    record.name = result.name;
    record.slug = result.slug;
    record.projectLegacyIds = result.projectLegacyIds;
    record.projectTitles = result.projectTitles;
    record.projectCount = result.projectCount;
  }
  async handleAddSubmit() {
    if (PAGE !== this.config.page) return;
    const result = this.validateForm("add");
    if (!result.valid) {
      this.toast("Please fill in all required fields", "danger");
      return;
    }
    const newRecord = this.buildNewRecord(result);
    const prev = this.store.get("records");
    this.store.set("records", prev.concat(newRecord));
    try {
      await this.persist();
      closePanels();
      this.resetFilters();
      this.render();
      this.statusToast(`"${this.getDeleteName(newRecord)}" added successfully!`, "success");
      this.notify(`New tag "${this.getDeleteName(newRecord)}" was added.`, "ri-price-tag-3-line");
    } catch {
      this.store.set("records", prev);
      this.statusToast("Could not save tag. Please try again.", "danger");
    }
  }
  openAddPanel() {
    if (PAGE !== this.config.page) return;
    if (!this.projects.length) {
      this.toast(this.getEntityLabels().addPanelBlockedToast, "danger");
      return;
    }
    this.resetAddForm();
    this.patchEntityLabels();
    this.populateProjectSelects();
    openPanel(this.config.ids.addPanel, [this.config.ids.editPanel]);
    activateTab(this.config.tabGroup || this.config.ids.addPanel, "general");
    setTimeout(() => $id(this.config.addFocusId)?.focus(), 320);
  }
};

export {
  DEFAULT_TAG_ENTITY_LABELS,
  TagsModule
};
//# sourceMappingURL=chunk-UENHZ3BM.js.map
