import {
  addChip,
  addProjectCategoryChip,
  addStackChip,
  getChipValues,
  getProjectCategoryChipKeys,
  getProjectStackFromChips,
  getRteHtml,
  getStackChipSelections,
  populateChips,
  populateProjectCategoryChips,
  populateProjectStackChips,
  setRteHtml,
  setupRte
} from "./chunk-R2LA3DKF.js";
import {
  open
} from "./chunk-IOV5MAOP.js";
import {
  mountFloatingLayer,
  syncPaSelect
} from "./chunk-L55M3E7N.js";
import {
  handleFileValidation,
  uploadCmsFileWithPreview
} from "./chunk-GAIU223M.js";
import {
  normalizeCategoryKey
} from "./chunk-CP27TRUO.js";
import {
  isValidUrl
} from "./chunk-SCZE3YCL.js";
import {
  arrangeForLayout,
  renderGroupedCards
} from "./chunk-A5DY2KK7.js";
import {
  BulkSelectController
} from "./chunk-E7DJ24TR.js";
import {
  formatDate,
  sortByNewestFirst
} from "./chunk-3FVVIY3E.js";
import {
  DEFAULT_LIST_COLUMNS,
  applyListGridClasses,
  closeListRow,
  listActionBtn,
  renderListActionsCell,
  renderListDateCell,
  renderListIndexCell,
  renderListProjectCell,
  renderListRowStart,
  renderListStatusCell,
  renderListTableShell,
  renderListTextCell,
  syncListPaginationChrome
} from "./chunk-7EBYGU7Z.js";
import {
  PAGE
} from "./chunk-6FU35BUB.js";
import {
  closeAllCardMenus,
  toggleCardMenu
} from "./chunk-UUTTVH4R.js";
import {
  Module,
  requestDelete,
  storage
} from "./chunk-O5GAO5DZ.js";
import {
  $all,
  $id,
  escapeHtml
} from "./chunk-S5QBHCBR.js";

// client/utils/projectCategories.ts
var CATEGORY_META_PROJECTS = {
  enterprise: { label: "Enterprise Platform", cls: "pa-cat-enterprise" },
  educational: { label: "Educational Platform", cls: "pa-cat-educational" },
  desktop: { label: "Desktop Application", cls: "pa-cat-desktop" },
  medical: { label: "Medical System", cls: "pa-cat-medical" },
  ecommerce: { label: "E-Commerce", cls: "pa-cat-ecommerce" },
  travel: { label: "Travel Platform", cls: "pa-cat-travel" },
  web: { label: "Web Application", cls: "pa-cat-web" },
  nonprofit: { label: "Non Profit Organization", cls: "pa-cat-nonprofit" }
};
function projectCatKeys(project) {
  if (!project) return [];
  if (Array.isArray(project.catKeys) && project.catKeys.length) {
    return project.catKeys.map((k) => String(k).trim()).filter(Boolean);
  }
  const single = project.catKey ? String(project.catKey).trim() : "";
  return single ? [single] : [];
}
function primaryProjectCatKey(project) {
  const keys = projectCatKeys(project);
  return keys[0] || "";
}
function withNormalizedProjectCategories(project) {
  const catKeys = projectCatKeys(project);
  const catKey = catKeys[0] || String(project.catKey || "");
  return { ...project, catKeys, catKey };
}
function projectMatchesCategoryFilter(project, filter) {
  if (!filter || filter === "all") return true;
  return projectCatKeys(project).includes(filter);
}
function projectCategoryLabels(project, meta) {
  return projectCatKeys(project).map((k) => meta[k]?.label || k).filter(Boolean).join(" \xB7 ");
}

// client/modules/projects/ProjectWorkspace.ts
var ProjectWorkspace = class {
  constructor(projects) {
    this.wired = false;
    this.wsEditorMode = "edit";
    this.closing = false;
    this.closeTimer = null;
    this.projects = projects;
  }
  bind() {
    if (this.wired) return;
    const root = $id("paProjectWorkspace");
    if (!root) return;
    this.wired = true;
    this.projects.on($id("paProjWsBackBtn"), "click", () => this.close());
    this.projects.on($id("paProjWsSaveBtn"), "click", () => {
      void this.save();
    });
    this.projects.on($id("paProjWsDeleteBtn"), "click", () => this.requestDelete());
    $all("#paProjWsModeToggle .pa-view-btn").forEach((btn) => {
      this.projects.on(btn, "click", () => {
        const mode = btn.getAttribute("data-ws-mode");
        if (mode) this.setEditorMode(mode);
      });
    });
    this.projects.on($id("projWsTitle"), "input", () => this.updateTitleCount());
    this.projects.on($id("projWsShortDesc"), "input", () => this.updateShortDescCount());
    this.projects.on($id("projWsTagInput"), "keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addChip($id("projWsTagChips"), e.target.value);
        e.target.value = "";
      }
    });
    this.projects.on($id("projWsTagAddBtn"), "click", () => {
      const input = $id("projWsTagInput");
      if (!input) return;
      addChip($id("projWsTagChips"), input.value);
      input.value = "";
    });
  }
  openAdd() {
    this.bind();
    this.projects.currentEditId = null;
    this.projects.resetWorkspaceForm();
    this.setEditorMode("edit");
    this.show();
    $id("paProjWsHeadTitleText").textContent = "Add New Project";
    $id("paProjWsHeadSubtitle").textContent = "Create a portfolio project with media and links";
    $id("paProjWsDeleteBtn").setAttribute("hidden", "");
    const saveLabel = $id("paProjWsSaveBtn")?.querySelector(".pa-btn-label");
    if (saveLabel) saveLabel.innerHTML = '<i class="ri-add-line"></i> Add project';
    void this.projects.techSuggest?.refreshCatalog();
    setTimeout(() => $id("projWsTitle")?.focus(), 420);
  }
  openEdit(id) {
    this.bind();
    const project = this.projects.findById(id);
    if (!project) {
      this.projects.toast("Project not found", "danger");
      return;
    }
    this.projects.currentEditId = id;
    this.projects.clearFormErrors("projWs");
    this.populateForm(project);
    this.setEditorMode("edit");
    this.show();
    $id("paProjWsHeadTitleText").textContent = "Edit Project";
    $id("paProjWsHeadSubtitle").textContent = project.title || "Update project details and media";
    $id("paProjWsDeleteBtn")?.removeAttribute("hidden");
    const saveLabel = $id("paProjWsSaveBtn")?.querySelector(".pa-btn-label");
    if (saveLabel) saveLabel.innerHTML = '<i class="ri-save-line"></i> Save changes';
    void this.projects.techSuggest?.refreshCatalog();
    setTimeout(() => $id("projWsTitle")?.focus(), 420);
  }
  close() {
    const body = $id("paBody");
    const ws = $id("paProjectWorkspace");
    if (!body || !ws) return;
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    if (!ws.classList.contains("is-open")) {
      this.finishClose();
      return;
    }
    if (this.closing) return;
    this.closing = true;
    ws.classList.add("is-closing");
    ws.classList.remove("is-open");
    body.classList.remove("pa-blog-page-body--editing");
    const finish = () => {
      if (!this.closing) return;
      this.finishClose();
    };
    ws.addEventListener("transitionend", (e) => {
      if (e.target === ws) finish();
    }, { once: true });
    this.closeTimer = window.setTimeout(finish, 520);
  }
  finishClose() {
    const ws = $id("paProjectWorkspace");
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    this.closing = false;
    if (ws) {
      ws.classList.remove("is-closing");
      ws.setAttribute("aria-hidden", "true");
    }
  }
  show() {
    const body = $id("paBody");
    const ws = $id("paProjectWorkspace");
    if (!body || !ws) return;
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    this.closing = false;
    ws.classList.remove("is-closing");
    body.classList.add("pa-blog-page-body--editing");
    ws.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ws.classList.add("is-open");
      });
    });
    body.scrollTo?.(0, 0);
  }
  populateForm(project) {
    $id("projWsTitle").value = String(project.title || "");
    populateProjectCategoryChips($id("projWsCategoryChips"), projectCatKeys(project), CATEGORY_META_PROJECTS);
    const catPick = $id("projWsCategoryPick");
    if (catPick) catPick.value = "";
    $id("projWsShortDesc").value = String(project.desc || "");
    setRteHtml($id("projWsFullDesc"), String(project.fullDesc || ""));
    populateProjectStackChips(
      $id("projWsTechChips"),
      this.projects.technologiesCatalog,
      this.projects.toolsCatalog,
      project.technologies || [],
      project.tools || []
    );
    populateChips($id("projWsTagChips"), Array.isArray(project.tags) ? project.tags : []);
    $id("projWsImageUrl").value = String(project.imageUrl || "");
    $id("projWsLiveUrl").value = String(project.liveUrl || "");
    $id("projWsRepoUrl").value = String(project.repoUrl || "");
    $id("projWsStatus").value = String(project.status || "Completed");
    syncPaSelect($id("projWsStatus"));
    $id("projWsFeatured").value = project.featured ? "1" : "0";
    syncPaSelect($id("projWsFeatured"));
    $id("projWsSortOrder").value = project.sortOrder != null ? String(project.sortOrder) : "";
    this.projects.wsGalleryImages = Array.isArray(project.gallery) ? [...project.gallery] : [];
    this.projects.renderGalleryGrid("projWs");
    this.projects.wsFeaturedImage = project.imageUrl ? { url: String(project.imageUrl), name: "Current image" } : null;
    this.projects.renderFeaturedPreview("projWs");
    this.updateTitleCount();
    this.updateShortDescCount();
    this.projects.clearFormErrors("projWs");
  }
  setEditorMode(mode) {
    this.wsEditorMode = mode;
    $all("#paProjWsModeToggle .pa-view-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-ws-mode") === mode);
    });
    const editorPane = $id("paProjWsEditorPane");
    const previewPane = $id("paProjWsPreviewPane");
    const body = $id("projWsFullDesc");
    if (mode === "preview") {
      if (editorPane) editorPane.hidden = true;
      if (previewPane) previewPane.hidden = false;
      const preview = $id("paProjWsPreviewContent");
      if (preview) preview.innerHTML = getRteHtml(body);
    } else {
      if (editorPane) editorPane.hidden = false;
      if (previewPane) previewPane.hidden = true;
    }
  }
  updateTitleCount() {
    const el = $id("projWsTitle");
    const count = $id("projWsTitleCount");
    if (el && count) count.textContent = `${el.value.length}/60`;
  }
  updateShortDescCount() {
    const el = $id("projWsShortDesc");
    const count = $id("projWsShortDescCount");
    if (el && count) count.textContent = String(el.value.length);
  }
  requestDelete() {
    const p = this.projects.findById(this.projects.currentEditId);
    if (p) requestDelete(p.id, "project", p.title);
  }
  async save() {
    if (this.projects.currentEditId == null) await this.projects.handleAddSubmit();
    else await this.projects.handleEditSubmit();
  }
};

// client/utils/paProjCard.ts
var TECH_COLORS = {
  html: "orange",
  css: "blue",
  javascript: "yellow",
  js: "yellow",
  typescript: "blue",
  ts: "blue",
  react: "purple",
  vue: "green",
  angular: "red",
  node: "green",
  "node.js": "green",
  next: "white",
  "next.js": "white",
  tailwind: "teal",
  bootstrap: "purple",
  sass: "pink",
  scss: "pink",
  python: "yellow",
  django: "green",
  php: "purple",
  laravel: "red",
  mysql: "blue",
  postgresql: "blue",
  mongodb: "green",
  firebase: "yellow",
  figma: "purple",
  wordpress: "blue"
};
var TECH_COLOR_CYCLE = ["orange", "blue", "yellow", "purple", "teal", "green", "pink"];
function getProjectBucket(status) {
  const s = (status || "Completed").trim();
  if (s === "Completed") return "published";
  if (s === "On Hold" || s === "Cancelled") return "archived";
  return "draft";
}
function getProjectStatusLabel(status) {
  const bucket = getProjectBucket(status);
  if (bucket === "published") return "Published";
  if (bucket === "archived") return "Archived";
  return "Draft";
}
function getProjectStatusClass(status) {
  const bucket = getProjectBucket(status);
  if (bucket === "published") return "published";
  if (bucket === "archived") return "archived";
  return "draft";
}
function techColorClass(tag, index) {
  const key = (tag || "").trim().toLowerCase();
  const color = TECH_COLORS[key] || TECH_COLOR_CYCLE[index % TECH_COLOR_CYCLE.length];
  return `pa-proj-tech--${color}`;
}
var PROJECT_TAGS_VISIBLE = 3;
function projectTechTagsHtml(tags, maxVisible = PROJECT_TAGS_VISIBLE) {
  const list = Array.isArray(tags) ? tags.filter(Boolean) : [];
  const visible = list.slice(0, maxVisible);
  const hidden = list.slice(maxVisible);
  let html = visible.map((t, i) => `<span class="pa-proj-tech ${techColorClass(t, i)}">${escapeHtml(t)}</span>`).join("");
  if (hidden.length > 0) {
    const moreTitle = escapeHtml(hidden.join(", "));
    html += `<span class="pa-proj-tech pa-proj-tech--more" title="${moreTitle}">+${hidden.length}</span>`;
  }
  return html;
}
function projectUpdatedAt(p) {
  return p.updatedAt || p.createdAt;
}
function renderCardMenu(p) {
  const id = p.id;
  return `<div class="pa-card-menu" data-id="${id}">
    <div class="pa-card-menu-item" data-action="duplicate" data-id="${id}"><i class="ri-file-copy-line"></i> Duplicate</div>
    <div class="pa-card-menu-item" data-action="copy-link" data-id="${id}"><i class="ri-link"></i> Copy live URL</div>
  </div>`;
}
function renderActions(p) {
  const id = p.id;
  const title = escapeHtml(p.title);
  return `<button type="button" class="pa-action-btn pa-action-view" title="View project" data-id="${id}" aria-label="View ${title}"><i class="ri-eye-line"></i></button>
    <button type="button" class="pa-action-btn pa-action-edit" title="Edit project" data-id="${id}" aria-label="Edit ${title}"><i class="ri-pencil-line"></i></button>
    <button type="button" class="pa-action-btn pa-action-duplicate" title="Duplicate project" data-id="${id}" aria-label="Duplicate ${title}"><i class="ri-file-copy-line"></i></button>
    <button type="button" class="pa-action-btn pa-action-delete" title="Delete project" data-id="${id}" aria-label="Delete ${title}"><i class="ri-delete-bin-line"></i></button>`;
}
function renderMeta(p) {
  const created = formatDate(p.createdAt);
  const updated = formatDate(projectUpdatedAt(p));
  return `<div class="pa-proj-card__meta-item">
      <div class="pa-proj-card__meta-item-head">
        <i class="ri-calendar-line" aria-hidden="true"></i>
        <span class="pa-proj-card__meta-label">Created</span>
      </div>
      <span class="pa-proj-card__meta-value">${escapeHtml(created)}</span>
    </div>
    <div class="pa-proj-card__meta-item">
      <div class="pa-proj-card__meta-item-head">
        <i class="ri-time-line" aria-hidden="true"></i>
        <span class="pa-proj-card__meta-label">Updated</span>
      </div>
      <span class="pa-proj-card__meta-value">${escapeHtml(updated)}</span>
    </div>`;
}
function projectListStatus(p) {
  const status = (p.status || "Completed").trim();
  if (status === "Completed") return { label: "Completed", variant: "completed" };
  if (status === "On Hold") return { label: "On Hold", variant: "hold" };
  if (status === "In Progress") return { label: "Active", variant: "active" };
  if (status === "Pending") return { label: "Planning", variant: "planning" };
  if (status === "Cancelled") return { label: "On Hold", variant: "hold" };
  const bucket = getProjectBucket(status);
  if (bucket === "published") return { label: "Active", variant: "active" };
  if (bucket === "archived") return { label: "Completed", variant: "completed" };
  return { label: "Planning", variant: "planning" };
}
function projectListThumbHtml(p, thumbHtml) {
  if (p.bannerImgUrl) {
    return `<img class="pa-lv-img" src="${escapeHtml(p.bannerImgUrl)}" alt="" loading="lazy" />`;
  }
  return thumbHtml;
}
function renderPaProjListRow(p, opts = {}) {
  const {
    meta = { label: p.catKey, cls: "" },
    thumbHtml = "",
    rowIndex,
    cardClass = ""
  } = opts;
  const title = p.title || "";
  const category = meta.label || p.catKey || "\u2014";
  const created = formatDate(p.createdAt);
  const status = projectListStatus(p);
  const thumbInner = projectListThumbHtml(p, thumbHtml);
  const id = p.id;
  const actions = `${listActionBtn("pa-action-view", "ri-eye-line", "View project", "data-id", id, "View")}
    ${listActionBtn("pa-action-edit", "ri-pencil-line", "Edit project", "data-id", id, "Edit")}
    ${listActionBtn("pa-action-duplicate", "ri-file-copy-line", "Duplicate project", "data-id", id, "Duplicate")}
    ${listActionBtn("pa-action-delete", "ri-delete-bin-line", "Delete project", "data-id", id, "Delete")}`;
  return `${renderListRowStart(cardClass)}
    ${renderListIndexCell(rowIndex)}
    ${renderListProjectCell(title, thumbInner)}
    ${renderListTextCell(category)}
    ${renderListStatusCell(status.label, status.variant)}
    ${renderListDateCell(created)}
    ${renderListActionsCell(actions)}
  ${closeListRow()}`;
}
function renderPaProjCard(p, opts = {}) {
  const {
    meta = { label: p.catKey, cls: "" },
    thumbHtml,
    bulkCheckbox = "",
    cardClass = "",
    animationDelay = 0
  } = opts;
  const id = p.id;
  const title = escapeHtml(p.title);
  const category = escapeHtml(meta.label);
  const desc = escapeHtml(p.desc || "");
  const statusLabel = getProjectStatusLabel(p.status);
  const statusClass = getProjectStatusClass(p.status);
  const featuredBadge = p.featured ? '<span class="pa-proj-card__featured"><i class="ri-star-fill"></i> FEATURED</span>' : "";
  const statusBadge = `<span class="pa-proj-card__status pa-proj-card__status--${statusClass}"><span class="pa-proj-card__status-dot" aria-hidden="true"></span>${escapeHtml(statusLabel)}</span>`;
  const techLabels = Array.isArray(p._techLabels) ? p._techLabels : p.technologies || [];
  const tagsHtml = projectTechTagsHtml(techLabels.length ? techLabels : p.tags);
  const metaHtml = renderMeta(p);
  const actionsHtml = renderActions(p);
  const menuHtml = renderCardMenu(p);
  const catKey = escapeHtml(normalizeCategoryKey(p.catKey));
  return `<div class="pa-card pa-proj-card${cardClass}" data-id="${id}" data-cat-key="${catKey}" style="animation-delay:${animationDelay}ms;">
    ${bulkCheckbox}
    <div class="pa-proj-card__grid">
      <div class="pa-proj-card__thumb">
        <div class="pa-proj-card__thumb-inner">${thumbHtml}</div>
        ${featuredBadge}
        ${statusBadge}
      </div>
      <div class="pa-proj-card__body">
        <div class="pa-proj-card__head">
          <div class="pa-proj-card__title-wrap">
            <span class="pa-proj-card__type-icon" aria-hidden="true"><i class="ri-window-line"></i></span>
            <div class="pa-proj-card__title-block">
              <h3 class="pa-proj-card__title" title="${title}">${title}</h3>
              <div class="pa-proj-card__category"><i class="ri-price-tag-3-line"></i> ${category}</div>
            </div>
          </div>
          <div class="pa-proj-card__head-more">
            <button type="button" class="pa-action-btn pa-action-more" data-id="${id}" title="More options" aria-label="More options for ${title}"><i class="ri-more-2-fill"></i></button>
            ${menuHtml}
          </div>
        </div>
        <p class="pa-proj-card__desc">${desc}</p>
        <div class="pa-proj-card__tags">${tagsHtml}</div>
        <div class="pa-proj-card__meta fr-2">${metaHtml}</div>
        <div class="pa-proj-card__footer">
          <div class="pa-proj-card__actions">${actionsHtml}</div>
        </div>
      </div>
    </div>
    <div class="pa-proj-card__list">
      <div class="pa-proj-card__list-thumb">
        <div class="pa-proj-card__thumb-inner">${thumbHtml}</div>
        ${featuredBadge}
      </div>
      <div class="pa-proj-card__list-main">
        <div class="pa-proj-card__list-top">
          <div class="pa-proj-card__title-block">
            <h3 class="pa-proj-card__title" title="${title}">${title}</h3>
            <div class="pa-proj-card__category"><i class="ri-price-tag-3-line"></i> ${category}</div>
          </div>
          <div class="pa-proj-card__list-status-wrap">
            ${statusBadge}
            <div class="pa-proj-card__list-more">
              <button type="button" class="pa-action-btn pa-action-more" data-id="${id}" title="More options" aria-label="More options for ${title}"><i class="ri-more-2-fill"></i></button>
              ${menuHtml}
            </div>
          </div>
        </div>
        <p class="pa-proj-card__desc">${desc}</p>
        <div class="pa-proj-card__tags">${tagsHtml}</div>
      </div>
      <div class="pa-proj-card__list-meta fr-2">${metaHtml}</div>
      <div class="pa-proj-card__list-actions">${actionsHtml}</div>
    </div>
  </div>`;
}

// client/utils/stackCatalog.ts
async function loadStackCatalog() {
  storage.invalidate("pa_technologies");
  storage.invalidate("pa_tools");
  const [technologies, tools] = await Promise.all([
    storage.get("pa_technologies", []),
    storage.get("pa_tools", [])
  ]);
  const items = [];
  (Array.isArray(technologies) ? technologies : []).forEach((row) => {
    if (!row?.name) return;
    const id = Number(row.id);
    if (Number.isNaN(id)) return;
    items.push({ kind: "technology", id, name: String(row.name) });
  });
  (Array.isArray(tools) ? tools : []).forEach((row) => {
    if (!row?.name) return;
    const id = Number(row.id);
    if (Number.isNaN(id)) return;
    items.push({ kind: "tool", id, name: String(row.name) });
  });
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

// client/utils/technologyCategorySelect.ts
async function loadToolCategories() {
  const rows = await storage.get("pa_tool_categories", []);
  return Array.isArray(rows) ? sortByNewestFirst(rows) : [];
}
function defaultTechnologyCategoryId(categories) {
  const other = categories.find((c) => String(c.key).toLowerCase() === "other");
  const pick = other ?? categories[0];
  return pick?.id != null ? Number(pick.id) : null;
}

// client/utils/technologyResolve.ts
async function resolveTechnologyByName(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return null;
  storage.invalidate("pa_technologies");
  let techs = await storage.get("pa_technologies", []);
  if (!Array.isArray(techs)) techs = [];
  const hit = techs.find((t) => String(t.name || "").toLowerCase() === trimmed.toLowerCase());
  if (hit) return hit;
  const categories = await loadToolCategories();
  const defaultCat = defaultTechnologyCategoryId(categories);
  const newId = Math.max(0, ...techs.map((t) => Number(t.id) || 0)) + 1;
  const newTech = {
    id: newId,
    name: trimmed,
    level: "intermediate",
    url: "",
    desc: "",
    years: null,
    featured: false,
    sortOrder: newId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (defaultCat != null) {
    newTech.categoryId = defaultCat;
  }
  await storage.set("pa_technologies", techs.concat(newTech));
  storage.invalidate("pa_recent_activities");
  return newTech;
}

// client/utils/toolResolve.ts
async function resolveToolByName(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return null;
  storage.invalidate("pa_tools");
  let tools = await storage.get("pa_tools", []);
  if (!Array.isArray(tools)) tools = [];
  const hit = tools.find((t) => String(t.name || "").toLowerCase() === trimmed.toLowerCase());
  if (hit) return hit;
  const categories = await loadToolCategories();
  const defaultCat = defaultTechnologyCategoryId(categories);
  if (defaultCat == null) return null;
  const newId = Math.max(0, ...tools.map((t) => Number(t.id) || 0)) + 1;
  const newTool = {
    id: newId,
    name: trimmed,
    categoryId: defaultCat,
    iconClass: "ri-checkbox-blank-circle-line",
    iconUrl: "",
    sortOrder: newId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await storage.set("pa_tools", tools.concat(newTool));
  storage.invalidate("pa_recent_activities");
  return newTool;
}

// client/utils/stackResolve.ts
function toStackItem(kind, row) {
  return { kind, id: Number(row.id), name: String(row.name) };
}
async function resolveStackItemByName(name, preferredKind) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const catalog = await loadStackCatalog();
  const techHit = catalog.find((i) => i.kind === "technology" && i.name.toLowerCase() === lower);
  const toolHit = catalog.find((i) => i.kind === "tool" && i.name.toLowerCase() === lower);
  if (techHit && toolHit) {
    if (preferredKind === "tool") return toolHit;
    if (preferredKind === "technology") return techHit;
    return techHit;
  }
  if (toolHit) return toolHit;
  if (techHit) return techHit;
  storage.invalidate("pa_tools");
  storage.invalidate("pa_technologies");
  const [tools, technologies] = await Promise.all([
    storage.get("pa_tools", []),
    storage.get("pa_technologies", [])
  ]);
  const toolRow = (Array.isArray(tools) ? tools : []).find(
    (t) => String(t.name || "").toLowerCase() === lower
  );
  const techRow = (Array.isArray(technologies) ? technologies : []).find(
    (t) => String(t.name || "").toLowerCase() === lower
  );
  if (toolRow) return toStackItem("tool", toolRow);
  if (techRow) return toStackItem("technology", techRow);
  if (preferredKind === "tool") {
    const created = await resolveToolByName(trimmed);
    return created ? toStackItem("tool", created) : null;
  }
  if (preferredKind === "technology") {
    const created = await resolveTechnologyByName(trimmed);
    return created ? toStackItem("technology", created) : null;
  }
  return null;
}

// client/utils/stackKindPrompt.ts
var activeOverlay = null;
function removeOverlay() {
  activeOverlay?.remove();
  activeOverlay = null;
}
function promptStackKind(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return Promise.resolve(null);
  return new Promise((resolve) => {
    removeOverlay();
    const overlay = document.createElement("div");
    overlay.className = "pa-confirm-overlay visible pa-stack-kind-overlay";
    overlay.setAttribute("role", "presentation");
    overlay.innerHTML = `
      <div class="pa-confirm-box" role="dialog" aria-modal="true" aria-labelledby="paStackKindTitle">
        <div class="pa-confirm-icon pa-confirm-icon--warning">
          <i class="ri-question-line" aria-hidden="true"></i>
        </div>
        <div class="pa-confirm-title" id="paStackKindTitle">Add "${escapeHtml(trimmed)}" as</div>
        <div class="pa-confirm-text">This name was not found in Tools or Technologies. Choose where to save it.</div>
        <div class="pa-confirm-actions pa-stack-kind-actions">
          <button type="button" class="pa-btn pa-btn-cancel flex-1" data-stack-kind-cancel>Cancel</button>
          <button type="button" class="pa-btn pa-btn-secondary flex-1" data-stack-kind="tool">Tool</button>
          <button type="button" class="pa-btn pa-btn-primary flex-1" data-stack-kind="technology">Technology</button>
        </div>
      </div>
    `;
    const finish = (kind) => {
      removeOverlay();
      resolve(kind);
    };
    overlay.addEventListener("click", (e) => {
      const target = e.target;
      if (target.closest("[data-stack-kind-cancel]")) {
        finish(null);
        return;
      }
      const btn = target.closest("[data-stack-kind]");
      if (!btn) return;
      const kind = btn.getAttribute("data-stack-kind");
      if (kind === "tool" || kind === "technology") finish(kind);
    });
    document.body.appendChild(overlay);
    activeOverlay = overlay;
    overlay.querySelector('[data-stack-kind="technology"]')?.focus();
  });
}

// client/utils/technologySuggest.ts
var MAX_SUGGESTIONS = 8;
function selectedKeys(chipsEl) {
  return new Set(
    getStackChipSelections(chipsEl).map((row) => `${row.kind}:${row.id}`)
  );
}
function kindLabel(kind) {
  return kind === "tool" ? "Tool" : "Technology";
}
function bindTechnologySuggest(inputEl, chipsEl, listEl, options = {}) {
  if (!inputEl || !chipsEl || !listEl) return null;
  let catalog = [];
  let visible = [];
  let highlight = -1;
  let hideTimer = null;
  let floating = null;
  const wrap = inputEl.closest(".pa-tech-suggest") || inputEl.parentElement;
  if (!listEl.id) {
    listEl.id = `pa-tech-suggest-${Math.random().toString(36).slice(2, 9)}`;
  }
  async function refreshCatalog() {
    catalog = await loadStackCatalog();
  }
  function positionList() {
    if (listEl.hidden) return;
    if (!floating) {
      floating = mountFloatingLayer(listEl, inputEl, { maxHeight: 220, align: "match-width" });
    } else {
      floating.reposition();
    }
    inputEl.setAttribute("aria-expanded", "true");
  }
  function renderSuggestionList(items, highlightIndex) {
    if (!items.length) {
      listEl.hidden = true;
      listEl.innerHTML = "";
      floating?.release();
      floating = null;
      inputEl.setAttribute("aria-expanded", "false");
      return;
    }
    listEl.hidden = false;
    listEl.innerHTML = items.map((item, i) => {
      const active = i === highlightIndex ? " active" : "";
      const name = escapeHtml(item.name || "");
      const badge = escapeHtml(kindLabel(item.kind));
      return `<button type="button" class="pa-tech-suggest-item${active}" role="option" aria-selected="${i === highlightIndex}" data-chip-kind="${escapeHtml(item.kind)}" data-legacy-id="${escapeHtml(String(item.id))}"><span class="pa-tech-suggest-name">${name}</span><span class="pa-tech-suggest-kind">${badge}</span></button>`;
    }).join("");
    requestAnimationFrame(() => positionList());
  }
  function hideList() {
    floating?.release();
    floating = null;
    listEl.hidden = true;
    listEl.innerHTML = "";
    highlight = -1;
    visible = [];
    inputEl.setAttribute("aria-expanded", "false");
  }
  function filterVisible(query) {
    const q = query.trim().toLowerCase();
    const taken = selectedKeys(chipsEl);
    visible = catalog.filter((item) => !taken.has(`${item.kind}:${item.id}`)).filter((item) => !q || String(item.name).toLowerCase().includes(q)).slice(0, MAX_SUGGESTIONS);
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
  function pickItem(item) {
    if (!item) return;
    addStackChip(chipsEl, item.kind, item.id, item.name);
    inputEl.value = "";
    hideList();
    inputEl.focus();
  }
  async function commitFreeText() {
    const raw = inputEl.value.trim();
    if (!raw) return;
    const lower = raw.toLowerCase();
    const exactTech = catalog.find((i) => i.kind === "technology" && i.name.toLowerCase() === lower);
    const exactTool = catalog.find((i) => i.kind === "tool" && i.name.toLowerCase() === lower);
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
      options.onCreateFailed?.("Could not add item. Add a tool category under Tech & Tools first.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save item.";
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
  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
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
    if (e.key === "ArrowUp") {
      if (!visible.length) return;
      e.preventDefault();
      highlight = Math.max(0, highlight - 1);
      renderSuggestionList(visible, highlight);
      return;
    }
    if (e.key === "Escape") {
      hideList();
      return;
    }
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      void commitFreeText();
      return;
    }
  }
  function onListMouseDown(e) {
    e.preventDefault();
    cancelHide();
  }
  function onListClick(e) {
    const btn = e.target.closest(".pa-tech-suggest-item");
    if (!btn) return;
    const kind = btn.getAttribute("data-chip-kind") === "tool" ? "tool" : "technology";
    const id = Number(btn.getAttribute("data-legacy-id"));
    const item = catalog.find((i) => i.kind === kind && Number(i.id) === id) || visible.find((i) => i.kind === kind && Number(i.id) === id);
    if (item) pickItem(item);
  }
  function onDocClick(e) {
    const t = e.target;
    if (!(t instanceof Node)) return;
    if (wrap?.contains(t) || listEl.contains(t)) return;
    if (t instanceof Element && t.closest(".pa-tech-suggest-list, .pa-tech-suggest-item")) return;
    hideList();
  }
  inputEl.setAttribute("autocomplete", "off");
  inputEl.setAttribute("role", "combobox");
  inputEl.setAttribute("aria-expanded", "false");
  inputEl.setAttribute("aria-controls", listEl.id);
  listEl.setAttribute("role", "listbox");
  inputEl.addEventListener("input", onInput);
  inputEl.addEventListener("focus", onFocus);
  inputEl.addEventListener("blur", onBlur);
  inputEl.addEventListener("keydown", onKeyDown);
  listEl.addEventListener("mousedown", onListMouseDown);
  listEl.addEventListener("click", onListClick);
  document.addEventListener("click", onDocClick, true);
  void refreshCatalog();
  return {
    refreshCatalog,
    commit: commitFreeText,
    destroy: () => {
      inputEl.removeEventListener("input", onInput);
      inputEl.removeEventListener("focus", onFocus);
      inputEl.removeEventListener("blur", onBlur);
      inputEl.removeEventListener("keydown", onKeyDown);
      listEl.removeEventListener("mousedown", onListMouseDown);
      listEl.removeEventListener("click", onListClick);
      document.removeEventListener("click", onDocClick, true);
      if (hideTimer) clearTimeout(hideTimer);
      hideList();
    }
  };
}

// client/modules/projects/ProjectsModule.ts
var SCENES = {
  enterprise: { bg: "linear-gradient(135deg,#10202e 0%,#16314a 60%,#0c1722 100%)", accent: "#ff6600", chrome: "#1c2733" },
  educational: { bg: "linear-gradient(135deg,#1c1230 0%,#2d1b4d 55%,#160f26 100%)", accent: "#a78bfa", chrome: "#211a30" },
  desktop: { bg: "linear-gradient(135deg,#3a0f63 0%,#7b2ff7 50%,#1d0b38 100%)", accent: "#38bdf8", chrome: "#241338" },
  medical: { bg: "linear-gradient(135deg,#241016 0%,#3a0f1f 55%,#160a0e 100%)", accent: "#f472b6", chrome: "#241319" },
  ecommerce1: { bg: "linear-gradient(135deg,#0d1f1a 0%,#0f2e22 60%,#081410 100%)", accent: "#34d399", chrome: "#11211b" },
  ecommerce2: { bg: "linear-gradient(135deg,#1a1006 0%,#2a1c08 55%,#120a04 100%)", accent: "#fb923c", chrome: "#1e1409" },
  travel: { bg: "linear-gradient(135deg,#0a0a0c 0%,#181818 55%,#050505 100%)", accent: "#facc15", chrome: "#161616" },
  web: { bg: "linear-gradient(135deg,#0e1a3a 0%,#16275c 55%,#0a1226 100%)", accent: "#60a5fa", chrome: "#121d3a" },
  nonprofit: { bg: "linear-gradient(135deg,#16140d 0%,#241f12 55%,#0e0c08 100%)", accent: "#facc15", chrome: "#1c180f" }
};
var SEED_PROJECTS = [];
function pickSceneForCategory(catKey) {
  if (catKey === "ecommerce") return Math.random() > 0.5 ? "ecommerce1" : "ecommerce2";
  return SCENES[catKey] ? catKey : "web";
}
function buildDeviceScene(scene) {
  const a = scene.accent;
  const id = a.replace("#", "");
  return `<svg viewBox="0 0 248 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="g1-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}" stop-opacity="0.9"/><stop offset="1" stop-color="${a}" stop-opacity="0.45"/></linearGradient></defs><g transform="translate(18,14)"><rect x="0" y="0" width="148" height="92" rx="6" fill="#0d0d10" stroke="rgba(255,255,255,0.12)" stroke-width="1"/><rect x="5" y="5" width="138" height="82" rx="2" fill="#15151a"/><rect x="5" y="5" width="138" height="11" fill="rgba(255,255,255,0.06)"/><circle cx="10" cy="10.5" r="1.6" fill="#e55"/><circle cx="15" cy="10.5" r="1.6" fill="#ea0"/><circle cx="20" cy="10.5" r="1.6" fill="#3c3"/><rect x="12" y="22" width="70" height="6" rx="2" fill="url(#g1-${id})"/><rect x="12" y="32" width="100" height="3.2" rx="1.6" fill="#ffffff" opacity="0.22"/><rect x="12" y="38" width="80" height="3.2" rx="1.6" fill="#ffffff" opacity="0.14"/><rect x="12" y="47" width="32" height="10" rx="2.5" fill="${a}" opacity="0.85"/><rect x="12" y="63" width="38" height="20" rx="3" fill="#ffffff" opacity="0.08"/><rect x="54" y="63" width="38" height="20" rx="3" fill="#ffffff" opacity="0.08"/><rect x="96" y="63" width="38" height="20" rx="3" fill="#ffffff" opacity="0.08"/><rect x="16" y="67" width="14" height="3" rx="1.5" fill="${a}" opacity="0.7"/><rect x="58" y="67" width="14" height="3" rx="1.5" fill="${a}" opacity="0.5"/><rect x="100" y="67" width="14" height="3" rx="1.5" fill="${a}" opacity="0.6"/><path d="M -6 92 L 154 92 L 144 99 L 4 99 Z" fill="#1a1a1f"/></g><g transform="translate(180,4)"><rect x="0" y="0" width="44" height="92" rx="7" fill="#101013" stroke="rgba(255,255,255,0.14)" stroke-width="1"/><rect x="3" y="6" width="38" height="80" rx="2" fill="#16161b"/><rect x="3" y="6" width="38" height="13" fill="rgba(255,255,255,0.07)"/><circle cx="22" cy="12" r="2" fill="${a}" opacity="0.7"/><rect x="8" y="24" width="28" height="16" rx="2.5" fill="${a}" opacity="0.55"/><rect x="8" y="44" width="28" height="3" rx="1.5" fill="#fff" opacity="0.2"/><rect x="8" y="50" width="20" height="3" rx="1.5" fill="#fff" opacity="0.14"/><rect x="8" y="60" width="28" height="9" rx="2" fill="#fff" opacity="0.08"/><rect x="8" y="72" width="28" height="9" rx="2" fill="#fff" opacity="0.08"/></g></svg>`;
}
function buildBrowserMockup(p) {
  const scene = SCENES[p.scene] || SCENES.web;
  if (p.bannerImgUrl) {
    return `<div class="pa-thumb-frame" style="background:${scene.bg};">
      <img src="${escapeHtml(p.bannerImgUrl)}" 
           alt="${escapeHtml(p.title)} screenshot" 
           class="pa-thumb-img" 
           onerror="this.style.display='none'; this.parentElement.innerHTML = '<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:14px;padding:20px;text-align:center;\\'>URL not found</div>';" />
    </div>`;
  }
  return `<div class="pa-thumb-frame" style="background:${scene.bg};">${buildDeviceScene(scene)}</div>`;
}
var PAGE_SIZE = 9;
function countInMonth(records, monthOffset = 0) {
  const now = /* @__PURE__ */ new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1);
  return records.filter((p) => {
    const t = p.createdAt ? new Date(p.createdAt).getTime() : NaN;
    return !Number.isNaN(t) && t >= start.getTime() && t < end.getTime();
  }).length;
}
function setStatTrend(elId, records, predicate) {
  const el = $id(elId);
  if (!el) return;
  const filtered = predicate ? records.filter(predicate) : records;
  const current = countInMonth(filtered, 0);
  const previous = countInMonth(filtered, -1);
  let pct = 0;
  if (previous > 0) pct = Math.round((current - previous) / previous * 100);
  else if (current > 0) pct = 100;
  if (pct > 0) {
    el.className = "pa-dash-stat-change up";
    el.innerHTML = `<i class="ri-arrow-up-line"></i> +${pct}%`;
  } else if (pct < 0) {
    el.className = "pa-dash-stat-change down";
    el.innerHTML = `<i class="ri-arrow-down-line"></i> ${pct}%`;
  } else {
    el.className = "pa-dash-stat-change neutral";
    el.innerHTML = `<i class="ri-subtract-line"></i> 0%`;
  }
}
var PROJ_WS_PREFIX = "projWs";
var ProjectsModule = class extends Module {
  constructor() {
    super({
      name: "Projects",
      storageKey: "pa_projects",
      initialState: { records: [], searchQuery: "", categoryFilter: "all", statusFilter: "all", layoutMode: "flat", viewMode: "grid", page: 1 }
    });
    this.nextId = 1;
    this.currentEditId = null;
    this.wsGalleryImages = [];
    this.wsFeaturedImage = null;
    this.technologiesCatalog = [];
    this.toolsCatalog = [];
    this.techSuggest = null;
    this.workspace = new ProjectWorkspace(this);
    this.bulkSelect = new BulkSelectController(this, {
      containerId: "paProjectGrid",
      itemSelector: ".pa-card",
      idAttr: "data-id",
      label: "project",
      getVisibleIds: () => this.getFiltered().map((p) => p.id),
      onBulkDelete: (ids) => this.bulkDelete(ids)
    });
  }
  async bulkDelete(ids) {
    const n = ids.size;
    if (n === 0) return;
    const prev = this.store.get("records");
    this.store.set("records", prev.filter((p) => !ids.has(String(p.id))));
    try {
      await this.persist();
      this.render();
      this.statusToast(`${n} project${n > 1 ? "s" : ""} deleted.`, "danger");
      this.notify(`${n} project${n > 1 ? "s" : ""} deleted in bulk.`, "ri-delete-bin-line");
    } catch {
      this.store.set("records", prev);
      this.statusToast("Could not delete projects. Please try again.", "danger");
    }
  }
  async load() {
    const [records, technologies, tools] = await Promise.all([
      this.loadRecords(() => []),
      storage.get("pa_technologies", []),
      storage.get("pa_tools", [])
    ]);
    this.technologiesCatalog = Array.isArray(technologies) ? technologies : [];
    this.toolsCatalog = Array.isArray(tools) ? tools : [];
    this.nextId = Math.max(0, ...records.map((p) => p.id)) + 1;
    this.store.set("records", records.map((p) => {
      const normalized = withNormalizedProjectCategories({
        ...p,
        technologies: Array.isArray(p.technologies) ? p.technologies : [],
        tools: Array.isArray(p.tools) ? p.tools : [],
        tags: Array.isArray(p.tags) ? p.tags : []
      });
      return normalized;
    }));
    try {
      const pendingCat = sessionStorage.getItem("pa_projects_cat_filter");
      if (pendingCat) {
        sessionStorage.removeItem("pa_projects_cat_filter");
        this.store.set("categoryFilter", pendingCat);
      }
    } catch {
    }
  }
  async persist() {
    await this.saveRecords(this.store.get("records"));
    await storage.get("pa_media_library", []).catch(() => {
    });
  }
  findById(id) {
    return this.store.get("records").find((p) => p.id === id);
  }
  stackNamesForProject(project) {
    const techById = new Map(this.technologiesCatalog.map((t) => [String(t.id), t.name]));
    const toolById = new Map(this.toolsCatalog.map((t) => [String(t.id), t.name]));
    const techNames = (project.technologies || []).map((id) => techById.get(String(id)) || "").filter(Boolean);
    const toolNames = (project.tools || []).map((id) => toolById.get(String(id)) || "").filter(Boolean);
    return [...techNames, ...toolNames];
  }
  technologyNamesForProject(project) {
    return this.stackNamesForProject(project);
  }
  techSuggestOptions() {
    return {
      onStackItemCreated: (item) => {
        void (async () => {
          const [techs, tools] = await Promise.all([
            storage.get("pa_technologies", []),
            storage.get("pa_tools", [])
          ]);
          this.technologiesCatalog = Array.isArray(techs) ? techs : [];
          this.toolsCatalog = Array.isArray(tools) ? tools : [];
          if (item.kind === "tool") {
            this.toast(`"${item.name}" added to Tools. You can set its category on the Tools page.`, "success", 4e3);
          } else {
            this.toast(`"${item.name}" added to Technologies. You can set its category on the Technologies page.`, "success", 4e3);
          }
        })();
      },
      onCreateFailed: (msg) => this.toast(msg, "danger")
    };
  }
  getFiltered() {
    const { records, searchQuery, categoryFilter, statusFilter } = this.store._raw;
    let results = sortByNewestFirst(records);
    if (categoryFilter !== "all") results = results.filter((p) => projectMatchesCategoryFilter(p, categoryFilter));
    if (statusFilter === "featured") results = results.filter((p) => p.featured);
    else if (statusFilter === "published") results = results.filter((p) => getProjectBucket(p.status) === "published");
    else if (statusFilter === "drafts") results = results.filter((p) => getProjectBucket(p.status) === "draft");
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      results = results.filter(
        (p) => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.fullDesc && p.fullDesc.toLowerCase().includes(q) || (p.tags || []).some((t) => t.toLowerCase().includes(q)) || this.technologyNamesForProject(p).some((t) => t.toLowerCase().includes(q)) || projectCatKeys(p).some((k) => CATEGORY_META_PROJECTS[k]?.label?.toLowerCase().includes(q))
      );
    }
    return arrangeForLayout(results, this.store.get("layoutMode"), (project) => this.projectGroupInfo(project));
  }
  projectGroupInfo(project) {
    const primary = primaryProjectCatKey(project) || "uncategorized";
    const meta = CATEGORY_META_PROJECTS[primary] || { label: primary || "Uncategorized" };
    return {
      key: primary,
      title: meta.label || "Uncategorized",
      icon: "ri-folder-line",
      href: "/project-categories",
      linkLabel: "Open"
    };
  }
  renderStats() {
    const records = this.store.get("records");
    const set = (id, val) => {
      const el = $id(id);
      if (el) el.textContent = val;
    };
    set("paProjStatTotal", records.length);
    set("paProjStatPublished", records.filter((p) => getProjectBucket(p.status) === "published").length);
    set("paProjStatDrafts", records.filter((p) => getProjectBucket(p.status) === "draft").length);
    set("paProjStatArchived", records.filter((p) => getProjectBucket(p.status) === "archived").length);
    setStatTrend("paProjStatTotalTrend", records);
    setStatTrend("paProjStatPublishedTrend", records, (p) => getProjectBucket(p.status) === "published");
    setStatTrend("paProjStatDraftsTrend", records, (p) => getProjectBucket(p.status) === "draft");
    setStatTrend("paProjStatArchivedTrend", records, (p) => getProjectBucket(p.status) === "archived");
  }
  syncStatusTabs() {
    const filter = this.store.get("statusFilter") || "all";
    $all("#paProjStatusTabs .pa-status-tab").forEach((tab) => {
      const active = tab.dataset.projFilter === filter;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
  }
  renderCard(p, index = 0) {
    const primary = primaryProjectCatKey(p);
    const meta = {
      label: projectCategoryLabels(p, CATEGORY_META_PROJECTS),
      cls: CATEGORY_META_PROJECTS[primary]?.cls || ""
    };
    const withTech = { ...p, _techLabels: this.technologyNamesForProject(p) };
    return renderPaProjCard(withTech, {
      meta,
      thumbHtml: buildBrowserMockup(p),
      bulkCheckbox: this.bulkSelect.checkboxHtml(p.id, `Select ${escapeHtml(p.title)}`),
      cardClass: this.bulkSelect.cardClass(p.id),
      animationDelay: Math.min(index, 8) * 35
    });
  }
  renderListRow(p, rowIndex) {
    const primary = primaryProjectCatKey(p);
    const meta = {
      label: projectCategoryLabels(p, CATEGORY_META_PROJECTS),
      cls: CATEGORY_META_PROJECTS[primary]?.cls || ""
    };
    return renderPaProjListRow(p, {
      meta,
      thumbHtml: buildBrowserMockup(p),
      rowIndex,
      cardClass: this.bulkSelect.cardClass(p.id)
    });
  }
  render() {
    this.renderStats();
    this.syncStatusTabs();
    const catFilterEl = $id("paCategoryFilter");
    const catFilterVal = this.store.get("categoryFilter") || "all";
    if (catFilterEl && catFilterEl.value !== catFilterVal) catFilterEl.value = catFilterVal;
    const layoutEl = $id("paProjectLayout");
    const layoutMode = this.store.get("layoutMode") || "flat";
    if (layoutEl && layoutEl.value !== layoutMode) layoutEl.value = layoutMode;
    const all = this.getFiltered();
    const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    let page = this.store.get("page");
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    this.store.set("page", page);
    const start = (page - 1) * PAGE_SIZE;
    const pageItems = all.slice(start, start + PAGE_SIZE);
    const grid = $id("paProjectGrid");
    const isList = this.store.get("viewMode") === "list";
    if (grid) {
      applyListGridClasses(grid, isList);
      if (pageItems.length === 0) {
        const hasFilters = this.store.get("searchQuery").trim() || this.store.get("categoryFilter") !== "all" || this.store.get("statusFilter") !== "all";
        grid.innerHTML = `<div class="pa-empty-state"><i class="ri-folder-open-line"></i><div class="pa-empty-state-title">${hasFilters ? "No projects match your filters" : "No projects yet"}</div><div class="pa-empty-state-text">${hasFilters ? "Try adjusting your search or category filter to find what you're looking for." : "Get started by adding your first portfolio project."}</div>${hasFilters ? `<button class="pa-empty-state-btn" id="paEmptyResetBtn">Reset filters</button>` : `<button class="pa-empty-state-btn" id="paEmptyAddBtn">+ Add New Project</button>`}</div>`;
        this.on($id("paEmptyResetBtn"), "click", () => this.resetFilters());
        this.on($id("paEmptyAddBtn"), "click", () => this.openAddPanel());
      } else if (isList) {
        const rows = pageItems.map((p, i) => this.renderListRow(p, start + i + 1)).join("");
        grid.innerHTML = renderListTableShell(DEFAULT_LIST_COLUMNS, rows);
      } else if (layoutMode === "grouped") {
        grid.innerHTML = renderGroupedCards(
          pageItems,
          all,
          (project) => this.projectGroupInfo(project),
          (project, i) => this.renderCard(project, i),
          "project",
          "projects"
        );
      } else {
        grid.innerHTML = pageItems.map((p, i) => this.renderCard(p, i)).join("");
      }
    }
    syncListPaginationChrome(isList && pageItems.length > 0, $id("paPaginationBtns")?.closest(".pa-pagination"));
    this.renderPagination(all.length, totalPages, page);
    this.attachCardListeners();
    this.bulkSelect.onRender();
    this.setViewModeFromStore();
  }
  setViewModeFromStore() {
    const mode = this.store.get("viewMode") || "grid";
    const gridBtn = $id("paGridViewBtn");
    const listBtn = $id("paListViewBtn");
    if (gridBtn) {
      gridBtn.classList.toggle("active", mode === "grid");
    }
    if (listBtn) {
      listBtn.classList.toggle("active", mode === "list");
    }
    document.querySelectorAll(".pa-view-btn[data-view]").forEach((btn) => {
      const view = btn.dataset.view;
      if (view === "grid") {
        btn.classList.toggle("active", mode === "grid");
      } else if (view === "list") {
        btn.classList.toggle("active", mode === "list");
      }
    });
  }
  renderPagination(totalItems, totalPages, page) {
    const btnsWrap = $id("paPaginationBtns");
    const info = $id("paPaginationInfo");
    if (!btnsWrap || !info) return;
    if (totalItems === 0) {
      btnsWrap.innerHTML = "";
      info.textContent = "Showing 0 of 0 projects";
      return;
    }
    let html = `<div class="pa-page-nav ${page === 1 ? "disabled" : ""}" id="paPagePrev" role="button" aria-label="Previous page"><i class="ri-arrow-left-s-line"></i></div>`;
    let lastShown = 0;
    for (let p = 1; p <= totalPages; p++) {
      const show = p === 1 || p === totalPages || Math.abs(p - page) <= 1;
      if (!show) continue;
      if (p - lastShown > 1) html += `<span style="color:var(--pa-text-faint); padding:0 4px; font-size:12px;">\u2026</span>`;
      html += `<button class="pa-page-btn ${p === page ? "active" : ""}" data-page="${p}">${p}</button>`;
      lastShown = p;
    }
    html += `<div class="pa-page-nav ${page === totalPages ? "disabled" : ""}" id="paPageNext" role="button" aria-label="Next page"><i class="ri-arrow-right-s-line"></i></div>`;
    btnsWrap.innerHTML = html;
    const startN = (page - 1) * PAGE_SIZE + 1;
    const endN = Math.min(page * PAGE_SIZE, totalItems);
    info.textContent = `Showing ${startN} to ${endN} of ${totalItems} projects`;
    btnsWrap.querySelectorAll(".pa-page-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.store.set("page", parseInt(btn.dataset.page, 10));
        this.render();
        $id("paBody")?.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
    const prevBtn = $id("paPagePrev");
    const nextBtn = $id("paPageNext");
    if (prevBtn && !prevBtn.classList.contains("disabled")) prevBtn.addEventListener("click", () => {
      this.store.set("page", page - 1);
      this.render();
    });
    if (nextBtn && !nextBtn.classList.contains("disabled")) nextBtn.addEventListener("click", () => {
      this.store.set("page", page + 1);
      this.render();
    });
  }
  resetFilters() {
    this.store.batch(() => {
      this.store.set("searchQuery", "");
      this.store.set("categoryFilter", "all");
      this.store.set("statusFilter", "all");
      this.store.set("layoutMode", "flat");
      this.store.set("page", 1);
    });
    const searchInput = $id("paSearchInput");
    if (searchInput) {
      searchInput.value = "";
      $id("paSearchWrap")?.classList.remove("has-value");
    }
    const catFilter = $id("paCategoryFilter");
    if (catFilter) catFilter.value = "all";
    const layoutEl = $id("paProjectLayout");
    if (layoutEl) layoutEl.value = "flat";
    this.render();
  }
  attachCardListeners() {
    $all(".pa-action-edit").forEach((btn) => btn.addEventListener("click", () => this.openEditPanel(parseInt(btn.dataset.id, 10))));
    $all(".pa-action-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = this.findById(parseInt(btn.dataset.id, 10));
        if (p) requestDelete(p.id, "project", p.title);
      });
    });
    $all(".pa-action-view").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = this.findById(parseInt(btn.dataset.id, 10));
        if (!p) return;
        if (p.liveUrl) {
          this.toast(`Opening "${p.title}" in a new tab\u2026`, "info");
          window.open(p.liveUrl, "_blank", "noopener");
        } else this.toast(`"${p.title}" has no live URL set yet`, "info");
      });
    });
    $all(".pa-proj-card .pa-action-more").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const host = btn.closest(".pa-proj-card__head-more, .pa-proj-card__list-more, .pa-lv-more-wrap, .pa-card-actions");
        const menu = host?.querySelector(".pa-card-menu");
        if (menu) toggleCardMenu(menu, btn);
      });
    });
    $all(".pa-action-duplicate").forEach((btn) => {
      btn.addEventListener("click", () => this.duplicateProject(parseInt(btn.dataset.id, 10)));
    });
    $all(".pa-proj-card__demo-link").forEach((link) => {
      link.addEventListener("click", (e) => e.stopPropagation());
    });
    $all(".pa-card-menu-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = parseInt(item.dataset.id, 10);
        const action = item.dataset.action;
        closeAllCardMenus();
        if (action === "edit") this.openEditPanel(id);
        else if (action === "duplicate") this.duplicateProject(id);
        else if (action === "copy-link") this.copyLiveUrl(id);
        else if (action === "delete") {
          const p = this.findById(id);
          if (p) requestDelete(id, "project", p.title);
        }
      });
    });
  }
  async duplicateProject(id) {
    const p = this.findById(id);
    if (!p) return;
    const copy = {
      ...p,
      id: this.nextId++,
      title: `${p.title} (Copy)`,
      featured: false,
      sortOrder: this.store.get("records").length + 1,
      tags: [...p.tags || []],
      technologies: [...p.technologies || []],
      tools: [...p.tools || []],
      catKeys: [...projectCatKeys(p)]
    };
    const prev = this.store.get("records");
    this.store.set("records", prev.concat(copy));
    try {
      await this.persist();
      this.render();
      this.statusToast(`Duplicated "${p.title}"`, "success");
      this.notify(`"${p.title}" was duplicated.`, "ri-file-copy-line");
    } catch {
      this.store.set("records", prev);
      this.statusToast("Could not duplicate project. Please try again.", "danger");
    }
  }
  copyLiveUrl(id) {
    const p = this.findById(id);
    if (!p) return;
    if (!p.liveUrl) {
      this.toast("This project has no live URL set", "info");
      return;
    }
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(p.liveUrl).then(() => this.toast("Live URL copied to clipboard", "success"));
    else this.toast("Live URL copied to clipboard", "success");
  }
  async deleteById(id) {
    const p = this.findById(id);
    if (!p) return;
    const prev = this.store.get("records");
    this.store.set("records", prev.filter((x) => x.id !== id));
    try {
      await this.persist();
      if (String(id) === String(this.currentEditId)) {
        this.workspace.close();
        this.currentEditId = null;
      }
      this.render();
      this.statusToast(`"${p.title}" was deleted.`, "danger");
      this.notify(`"${p.title}" was deleted.`, "ri-delete-bin-line");
    } catch {
      this.store.set("records", prev);
      this.statusToast("Could not delete project. Please try again.", "danger");
    }
  }
  clearFormErrors(prefix) {
    ["Title", "Category", "ShortDesc", "FullDesc", "Tech"].forEach((field) => {
      $id(`${prefix}${field}Error`)?.classList.remove("visible");
      let inputId = `${prefix}${field}`;
      if (field === "FullDesc") inputId = `${prefix}RteWrap`;
      else if (field === "Category") inputId = `${prefix}CategoryChips`;
      $id(inputId)?.classList.remove("error");
    });
  }
  showFieldError(prefix, field, isRte) {
    $id(`${prefix}${field}Error`)?.classList.add("visible");
    let inputId = `${prefix}${field}`;
    if (isRte) inputId = `${prefix}RteWrap`;
    else if (field === "Category") inputId = `${prefix}CategoryChips`;
    $id(inputId)?.classList.add("error");
  }
  resetWorkspaceForm() {
    const p = PROJ_WS_PREFIX;
    const safeSetText = (id, text) => {
      const el = $id(id);
      if (el) el.textContent = text;
    };
    [`${p}Title`, `${p}ShortDesc`, `${p}ImageUrl`, `${p}LiveUrl`, `${p}RepoUrl`, `${p}SortOrder`].forEach((id) => {
      const el = $id(id);
      if (el) el.value = "";
    });
    safeSetText(`${p}ShortDescCount`, "0");
    safeSetText(`${p}TitleCount`, "0/60");
    const shortDescParent = $id(`${p}ShortDescCount`)?.parentElement;
    if (shortDescParent) shortDescParent.classList.remove("warn", "max");
    const fullDesc = $id(`${p}FullDesc`);
    if (fullDesc) fullDesc.innerHTML = "";
    const catChips = $id(`${p}CategoryChips`);
    if (catChips) catChips.innerHTML = "";
    const catPick = $id(`${p}CategoryPick`);
    if (catPick) catPick.value = "";
    const techChips = $id(`${p}TechChips`);
    if (techChips) techChips.innerHTML = "";
    const tagChips = $id(`${p}TagChips`);
    if (tagChips) tagChips.innerHTML = "";
    const techInput = $id(`${p}TechInput`);
    if (techInput) techInput.value = "";
    const status = $id(`${p}Status`);
    if (status) status.value = "Completed";
    const featured = $id(`${p}Featured`);
    if (featured) featured.value = "0";
    const featuredPreview = $id(`${p}FeaturedPreviewWrap`);
    if (featuredPreview) featuredPreview.innerHTML = "";
    const galleryGrid = $id(`${p}GalleryGrid`);
    if (galleryGrid) galleryGrid.innerHTML = "";
    const mediaUpload = $id(`${p}MediaUpload`);
    if (mediaUpload) mediaUpload.style.display = "";
    this.wsGalleryImages = [];
    this.wsFeaturedImage = null;
    this.clearFormErrors(p);
  }
  openAddPanel() {
    if (PAGE !== "projects") return;
    this.workspace.openAdd();
  }
  openEditPanel(id) {
    if (PAGE !== "projects") return;
    this.workspace.openEdit(id);
  }
  renderFeaturedPreview(prefix) {
    const wrap = $id(`${prefix}FeaturedPreviewWrap`);
    const uploadBox = $id(`${prefix}MediaUpload`);
    const image = this.wsFeaturedImage;
    if (!image) {
      if (wrap) wrap.innerHTML = "";
      if (uploadBox) uploadBox.style.display = "";
      return;
    }
    if (uploadBox) uploadBox.style.display = "none";
    if (wrap) {
      wrap.innerHTML = `<div class="pa-media-preview"><img src="${image.url}" alt="${escapeHtml(image.name)}" /><button type="button" class="pa-media-preview-remove" aria-label="Remove image"><i class="ri-close-line"></i></button></div>`;
      const removeBtn = wrap.querySelector(".pa-media-preview-remove");
      if (removeBtn) {
        removeBtn.addEventListener("click", () => {
          this.wsFeaturedImage = null;
          this.renderFeaturedPreview(prefix);
        });
      }
    }
  }
  renderGalleryGrid(prefix) {
    const grid = $id(`${prefix}GalleryGrid`);
    const images = this.wsGalleryImages;
    if (!grid) return;
    grid.innerHTML = images.map((img, i) => `<div class="pa-gallery-thumb"><img src="${img.url}" alt="${escapeHtml(img.name || "Gallery image")}" /><div class="pa-gallery-thumb-remove" data-i="${i}" role="button" aria-label="Remove image"><i class="ri-close-line"></i></div></div>`).join("");
    grid.querySelectorAll(".pa-gallery-thumb-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.i, 10);
        this.wsGalleryImages.splice(i, 1);
        this.renderGalleryGrid(prefix);
      });
    });
  }
  setupMediaUpload(prefix) {
    const uploadBox = $id(`${prefix}MediaUpload`);
    const fileInput = $id(`${prefix}FeaturedFile`);
    if (!uploadBox || !fileInput) return;
    this.on(uploadBox, "click", () => fileInput.click());
    this.on(uploadBox, "keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fileInput.click();
      }
    });
    uploadBox.setAttribute("tabindex", "0");
    uploadBox.setAttribute("role", "button");
    const acceptFile = async (file) => {
      if (!handleFileValidation(file)) return;
      try {
        const uploaded = await uploadCmsFileWithPreview(file, {
          folder: "projects",
          page: "projects",
          purpose: "project-featured",
          optimize: { maxWidth: 1920, maxHeight: 1080, quality: 0.88 },
          onPreview: (previewUrl) => {
            const entry2 = { url: previewUrl, name: file.name };
            this.wsFeaturedImage = entry2;
            this.renderFeaturedPreview(prefix);
          }
        });
        const entry = { url: uploaded.url, name: uploaded.fileName || file.name };
        this.wsFeaturedImage = entry;
        this.renderFeaturedPreview(prefix);
        this.toast("Image uploaded", "success");
      } catch {
        this.toast("Could not upload that image", "danger");
      }
    };
    this.on(fileInput, "change", async () => {
      const file = fileInput.files[0];
      fileInput.value = "";
      if (file) await acceptFile(file);
    });
    ["dragenter", "dragover"].forEach((evt) => this.on(uploadBox, evt, (e) => {
      e.preventDefault();
      uploadBox.classList.add("dragover");
    }));
    ["dragleave", "drop"].forEach((evt) => this.on(uploadBox, evt, (e) => {
      e.preventDefault();
      uploadBox.classList.remove("dragover");
    }));
    this.on(uploadBox, "drop", async (e) => {
      const file = e.dataTransfer.files?.[0];
      if (file) await acceptFile(file);
    });
  }
  setupMediaPicker(prefix, target) {
    const btnId = `${prefix}${target === "gallery" ? "Gallery" : "Featured"}PickBtn`;
    const btn = $id(btnId);
    if (!btn) return;
    this.on(btn, "click", () => {
      open({
        mode: target,
        folder: "projects",
        returnFocus: btn,
        onSelect: (item) => {
          const entry = { url: item.url, name: item.name || "Selected image" };
          if (target === "gallery") {
            this.wsGalleryImages.push(entry);
            this.renderGalleryGrid(prefix);
            this.toast("Gallery image added from media library", "success");
            return;
          }
          this.wsFeaturedImage = entry;
          const imageUrlEl = $id(`${prefix}ImageUrl`);
          if (imageUrlEl) imageUrlEl.value = item.url;
          this.renderFeaturedPreview(prefix);
          this.toast("Featured image selected from media library", "success");
        }
      });
    });
  }
  setupGalleryUpload(prefix) {
    const uploadBox = $id(`${prefix}GalleryUpload`);
    const fileInput = $id(`${prefix}GalleryFile`);
    if (!uploadBox || !fileInput) return;
    this.on(uploadBox, "click", () => fileInput.click());
    this.on(fileInput, "change", async () => {
      const files = Array.from(fileInput.files || []);
      const baseCount = this.wsGalleryImages.length;
      let seq = baseCount;
      for (const file of files) {
        if (!handleFileValidation(file)) continue;
        seq += 1;
        try {
          const uploaded = await uploadCmsFileWithPreview(file, {
            folder: "projects",
            page: "projects",
            purpose: "project-gallery",
            sequence: seq,
            optimize: { maxWidth: 1920, maxHeight: 1080, quality: 0.88 }
          });
          const entry = { url: uploaded.url, name: uploaded.fileName || file.name };
          this.wsGalleryImages.push(entry);
        } catch {
        }
      }
      this.renderGalleryGrid(prefix);
      if (files.length) this.toast(`${files.length} image${files.length > 1 ? "s" : ""} added to gallery`, "success");
      fileInput.value = "";
    });
  }
  validateForm(prefix) {
    this.clearFormErrors(prefix);
    let valid = true;
    const titleEl = $id(`${prefix}Title`);
    const title = titleEl ? titleEl.value.trim() : "";
    if (!title) {
      this.showFieldError(prefix, "Title");
      valid = false;
    }
    const categoryChipsEl = $id(`${prefix}CategoryChips`);
    const catKeys = categoryChipsEl ? getProjectCategoryChipKeys(categoryChipsEl) : [];
    if (catKeys.length === 0) {
      this.showFieldError(prefix, "Category");
      valid = false;
    }
    const shortDescEl = $id(`${prefix}ShortDesc`);
    const shortDesc = shortDescEl ? shortDescEl.value.trim() : "";
    if (!shortDesc) {
      this.showFieldError(prefix, "ShortDesc");
      valid = false;
    }
    const fullDescEl = $id(`${prefix}FullDesc`);
    const fullDesc = fullDescEl ? getRteHtml(fullDescEl).trim() : "";
    if (!fullDesc) {
      this.showFieldError(prefix, "FullDesc", true);
      valid = false;
    }
    const techChipsEl = $id(`${prefix}TechChips`);
    const stack = techChipsEl ? getProjectStackFromChips(techChipsEl) : { technologies: [], tools: [] };
    const technologies = stack.technologies;
    const tools = stack.tools;
    if (technologies.length === 0 && tools.length === 0) {
      this.showFieldError(prefix, "Tech");
      valid = false;
    }
    const tagChipsEl = $id(`${prefix}TagChips`);
    const tags = tagChipsEl ? getChipValues(tagChipsEl) : [];
    const liveUrlEl = $id(`${prefix}LiveUrl`);
    const liveUrl = liveUrlEl ? liveUrlEl.value.trim() : "";
    const repoUrlEl = $id(`${prefix}RepoUrl`);
    const repoUrl = repoUrlEl ? repoUrlEl.value.trim() : "";
    if (liveUrl && !isValidUrl(liveUrl)) {
      this.toast("Live URL is not valid \u2014 include https://", "danger");
      valid = false;
    }
    if (repoUrl && !isValidUrl(repoUrl)) {
      this.toast("GitHub Repository URL is not valid \u2014 include https://", "danger");
      valid = false;
    }
    return { valid, title, catKeys, shortDesc, fullDesc, technologies, tools, tags, liveUrl, repoUrl };
  }
  async handleAddSubmit() {
    if (PAGE !== "projects") return;
    const p = PROJ_WS_PREFIX;
    const result = this.validateForm(p);
    if (!result.valid) {
      this.toast("Please fill in all required fields", "danger");
      return;
    }
    const statusEl = $id(`${p}Status`);
    const status = statusEl ? statusEl.value : "Completed";
    const featuredEl = $id(`${p}Featured`);
    const featured = featuredEl ? featuredEl.value === "1" : false;
    const sortOrderRawEl = $id(`${p}SortOrder`);
    const sortOrderRaw = sortOrderRawEl ? sortOrderRawEl.value : "";
    const catKeys = result.catKeys;
    const primaryCat = catKeys[0] || "web";
    const imageUrlEl = $id(`${p}ImageUrl`);
    const imageUrl = imageUrlEl ? imageUrlEl.value.trim() : "";
    const newProject = {
      id: this.nextId++,
      title: result.title,
      catKey: primaryCat,
      catKeys,
      desc: result.shortDesc,
      fullDesc: result.fullDesc,
      technologies: result.technologies,
      tools: result.tools,
      tags: result.tags,
      featured,
      scene: pickSceneForCategory(primaryCat),
      liveUrl: result.liveUrl,
      repoUrl: result.repoUrl,
      status,
      sortOrder: sortOrderRaw ? parseInt(sortOrderRaw, 10) : this.store.get("records").length + 1,
      imageUrl: this.wsFeaturedImage && this.wsFeaturedImage.url || imageUrl || "",
      bannerImgUrl: this.wsFeaturedImage && this.wsFeaturedImage.url || imageUrl || "",
      gallery: this.wsGalleryImages.slice(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const prev = this.store.get("records");
    this.store.set("records", prev.concat(newProject));
    try {
      await this.persist();
      this.workspace.close();
      this.resetFilters();
      this.render();
      this.statusToast(`"${newProject.title}" added successfully!`, "success");
      this.notify(`New project "${newProject.title}" was added.`, "ri-add-circle-line");
    } catch {
      this.store.set("records", prev);
      this.statusToast("Could not save project. Please try again.", "danger");
    }
  }
  async handleEditSubmit() {
    if (PAGE !== "projects" || this.currentEditId == null) return;
    const ws = PROJ_WS_PREFIX;
    const result = this.validateForm(ws);
    if (!result.valid) {
      this.toast("Please fill in all required fields", "danger");
      return;
    }
    const p = this.findById(this.currentEditId);
    if (!p) return;
    const snapshot = {
      ...p,
      tags: [...p.tags || []],
      technologies: [...p.technologies || []],
      tools: [...p.tools || []],
      gallery: [...p.gallery || []],
      catKeys: [...projectCatKeys(p)]
    };
    p.title = result.title;
    p.catKeys = result.catKeys.length ? result.catKeys : projectCatKeys(p);
    p.catKey = p.catKeys[0] || p.catKey;
    p.desc = result.shortDesc;
    p.fullDesc = result.fullDesc;
    p.technologies = result.technologies;
    p.tools = result.tools;
    p.tags = result.tags;
    p.liveUrl = result.liveUrl;
    p.repoUrl = result.repoUrl;
    const statusEl = $id(`${ws}Status`);
    p.status = statusEl ? statusEl.value : p.status;
    const featuredEl = $id(`${ws}Featured`);
    p.featured = featuredEl ? featuredEl.value === "1" : p.featured;
    const sortOrderRawEl = $id(`${ws}SortOrder`);
    const sortOrderRaw = sortOrderRawEl ? sortOrderRawEl.value : "";
    p.sortOrder = sortOrderRaw ? parseInt(sortOrderRaw, 10) : p.sortOrder;
    const imageUrlEl = $id(`${ws}ImageUrl`);
    const img = this.wsFeaturedImage && this.wsFeaturedImage.url || (imageUrlEl ? imageUrlEl.value.trim() : "") || "";
    p.imageUrl = img;
    p.bannerImgUrl = img;
    p.gallery = this.wsGalleryImages.slice();
    if (!SCENES[p.scene]) p.scene = pickSceneForCategory(p.catKey);
    p.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await this.persist();
      this.workspace.close();
      this.render();
      this.statusToast(`"${p.title}" updated successfully!`, "success");
      this.notify(`"${p.title}" was updated.`, "ri-pencil-line");
    } catch {
      Object.assign(p, snapshot);
      p.tags = snapshot.tags;
      p.technologies = snapshot.technologies;
      p.tools = snapshot.tools;
      p.gallery = snapshot.gallery;
      p.catKeys = snapshot.catKeys;
      p.catKey = snapshot.catKey;
      this.statusToast("Could not save project. Please try again.", "danger");
    }
  }
  bindEvents() {
    this.workspace.bind();
    const ws = PROJ_WS_PREFIX;
    this.setupMediaUpload(ws);
    this.setupGalleryUpload(ws);
    this.setupMediaPicker(ws, "featured");
    this.setupMediaPicker(ws, "gallery");
    setupRte(`${ws}RteWrap`, `${ws}FullDesc`);
    const addNewBtn = $id("paAddNewBtn");
    if (addNewBtn) this.on(addNewBtn, "click", () => this.openAddPanel());
    this.techSuggest?.destroy();
    this.techSuggest = bindTechnologySuggest(
      $id(`${ws}TechInput`),
      $id(`${ws}TechChips`),
      $id(`${ws}TechSuggestList`),
      this.techSuggestOptions()
    );
    const techAddBtn = $id(`${ws}TechAddBtn`);
    if (techAddBtn) this.on(techAddBtn, "click", () => {
      void this.techSuggest?.commit();
    });
    const addCategoryFromPick = () => {
      const pick = $id(`${ws}CategoryPick`);
      const chips = $id(`${ws}CategoryChips`);
      if (!pick || !chips || !pick.value) return;
      const key = pick.value;
      const label = pick.options[pick.selectedIndex]?.text || key;
      addProjectCategoryChip(chips, key, label);
      pick.value = "";
      $id(`${ws}CategoryChips`)?.classList.remove("error");
      $id(`${ws}CategoryError`)?.classList.remove("visible");
    };
    const catAddBtn = $id(`${ws}CategoryAddBtn`);
    if (catAddBtn) this.on(catAddBtn, "click", () => addCategoryFromPick());
    const searchInput = $id("paSearchInput");
    if (searchInput) {
      this.on(searchInput, "input", () => {
        this.store.set("searchQuery", searchInput.value);
        this.store.set("page", 1);
        $id("paSearchWrap")?.classList.toggle("has-value", !!searchInput.value);
        this.render();
      });
    }
    const searchClear = $id("paSearchClear");
    if (searchClear) {
      this.on(searchClear, "click", () => {
        if (!searchInput) return;
        searchInput.value = "";
        this.store.set("searchQuery", "");
        $id("paSearchWrap")?.classList.remove("has-value");
        this.render();
      });
    }
    const categoryFilter = $id("paCategoryFilter");
    if (categoryFilter) {
      this.on(categoryFilter, "change", (e) => {
        this.store.update({ categoryFilter: e.target.value, page: 1 });
        this.render();
      });
    }
    const layoutFilter = $id("paProjectLayout");
    if (layoutFilter) {
      this.on(layoutFilter, "change", (e) => {
        this.store.update({ layoutMode: e.target.value === "grouped" ? "grouped" : "flat", page: 1 });
        this.render();
      });
    }
    $all("#paProjStatusTabs .pa-status-tab").forEach((tab) => {
      this.on(tab, "click", () => {
        this.store.update({ statusFilter: tab.dataset.projFilter || "all", page: 1 });
        this.render();
      });
    });
    const gridBtn = $id("paGridViewBtn");
    const listBtn = $id("paListViewBtn");
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
    this.onBus("confirm:confirmed", ({ id, type }) => {
      if (type === "project") this.deleteById(id);
    });
    this.onBus("shortcut:new-item", ({ page }) => {
      if (page === PAGE) this.openAddPanel();
    });
  }
};

export {
  CATEGORY_META_PROJECTS,
  bindTechnologySuggest,
  SEED_PROJECTS,
  pickSceneForCategory,
  PROJ_WS_PREFIX,
  ProjectsModule
};
