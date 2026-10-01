import {
  syncPaSelect
} from "./chunk-DWHWK43L.js";
import {
  addChip,
  getChipValues,
  getRteHtml,
  populateChips,
  setRteHtml,
  setupRte
} from "./chunk-Q2CNCSP4.js";
import {
  open
} from "./chunk-GR3SHIB7.js";
import "./chunk-C4U44KQD.js";
import {
  handleFileValidation,
  uploadCmsFileWithPreview
} from "./chunk-GAIU223M.js";
import {
  isValidSlug,
  slugify
} from "./chunk-SCZE3YCL.js";
import {
  normalizeCategoryKey
} from "./chunk-CP27TRUO.js";
import {
  CrudCardModule,
  setStatTrend,
  setStatValue
} from "./chunk-O7SJP42B.js";
import "./chunk-A5DY2KK7.js";
import "./chunk-5GYID3MB.js";
import {
  closeListRow,
  listActionBtn,
  renderListActionsCell,
  renderListDateCell,
  renderListIndexCell,
  renderListProjectCell,
  renderListRowStart,
  renderListStatusCell,
  renderListTextCell
} from "./chunk-7EBYGU7Z.js";
import {
  formatDate,
  sortByNewestFirst
} from "./chunk-3FVVIY3E.js";
import "./chunk-YQW5T2D3.js";
import "./chunk-UUTTVH4R.js";
import {
  canManageContent,
  requestDelete,
  storage
} from "./chunk-2KLDEWPL.js";
import {
  $all,
  $field,
  $id,
  $img,
  $input,
  $select,
  escapeHtml
} from "./chunk-S5QBHCBR.js";

// client/utils/paBlogCard.ts
function getBlogStatusClass(status) {
  return (status || "Draft") === "Published" ? "published" : "draft";
}
function blogTagsHtml(tags, maxVisible = 4) {
  const list = Array.isArray(tags) ? tags : [];
  const visible = list.slice(0, maxVisible);
  const extra = list.length - visible.length;
  let html = visible.map((t) => `<span class="pa-proj-tech pa-proj-tech--blue">${escapeHtml(t)}</span>`).join("");
  if (extra > 0) html += `<span class="pa-proj-tech pa-proj-tech--more">+${extra}</span>`;
  return html;
}
function renderCardMenu(p, idAttr) {
  const id = p.id;
  const title = escapeHtml(p.title);
  return `<div class="pa-card-menu" ${idAttr}="${id}">
    <div class="pa-card-menu-item" data-action="duplicate" ${idAttr}="${id}"><i class="ri-file-copy-line"></i> Duplicate</div>
    <div class="pa-card-menu-item" data-action="copy-slug" ${idAttr}="${id}"><i class="ri-links-line"></i> Copy slug URL</div>
  </div>`;
}
function renderActions(p, idAttr) {
  const id = p.id;
  const title = escapeHtml(p.title);
  return `<button type="button" class="pa-action-btn pa-action-edit" title="Edit post" ${idAttr}="${id}" aria-label="Edit ${title}"><i class="ri-pencil-line"></i></button>
    <button type="button" class="pa-action-btn pa-action-delete" title="Delete post" ${idAttr}="${id}" aria-label="Delete ${title}"><i class="ri-delete-bin-line"></i></button>`;
}
function formatEngagementShort(engagement) {
  if (!engagement) return "";
  const parts = [];
  if (engagement.likes) parts.push(`${engagement.likes} likes`);
  if (engagement.comments) parts.push(`${engagement.comments} comments`);
  if (engagement.pending) parts.push(`${engagement.pending} pending`);
  return parts.join(" \xB7 ");
}
function engagementMetaHtml(engagement) {
  if (!engagement) return "";
  const likes = engagement.likes ?? 0;
  const comments = engagement.comments ?? 0;
  const pending = engagement.pending ?? 0;
  if (!likes && !comments && !pending) return "";
  const pendingBadge = pending ? `<span class="pa-blog-engagement-pending">${pending} pending</span>` : "";
  return `<div class="pa-proj-card__meta-item">
      <i class="ri-thumb-up-line" aria-hidden="true"></i>
      <span class="pa-proj-card__meta-label">Engagement</span>
      <span class="pa-proj-card__meta-value">${likes} likes \xB7 ${comments} comments ${pendingBadge}</span>
    </div>`;
}
function renderMeta(p, engagement) {
  const published = formatDate(p.publishedAt || p.createdAt);
  const slug = escapeHtml(p.slug || "\u2014");
  const tagCount = Array.isArray(p.tags) ? p.tags.length : 0;
  return `<div class="pa-proj-card__meta-item">
      <i class="ri-calendar-line" aria-hidden="true"></i>
      <span class="pa-proj-card__meta-label">Published</span>
      <span class="pa-proj-card__meta-value">${escapeHtml(published)}</span>
    </div>
    <div class="pa-proj-card__meta-item">
      <i class="ri-link" aria-hidden="true"></i>
      <span class="pa-proj-card__meta-label">Slug</span>
      <span class="pa-proj-card__meta-value">${slug}</span>
    </div>
    <div class="pa-proj-card__meta-item">
      <i class="ri-price-tag-3-line" aria-hidden="true"></i>
      <span class="pa-proj-card__meta-label">Tags</span>
      <span class="pa-proj-card__meta-value">${tagCount}</span>
    </div>
    <div class="pa-proj-card__meta-item pa-proj-card__meta-item--demo">
      <i class="ri-article-line" aria-hidden="true"></i>
      <span class="pa-proj-card__meta-label">Status</span>
      <span class="pa-proj-card__meta-value">${escapeHtml(p.status || "Draft")}</span>
    </div>
    ${engagementMetaHtml(engagement)}`;
}
function renderPaBlogListRow(p, opts = {}) {
  const {
    meta = { label: p.category, cls: "" },
    thumbHtml = "",
    rowIndex,
    cardClass = "",
    idAttr = "data-blog-id",
    engagement = null
  } = opts;
  const title = p.title || "";
  const category = meta.label || p.category || "\u2014";
  const engShort = formatEngagementShort(engagement);
  const categoryCell = engShort ? `${category} \u2014 ${engShort}` : category;
  const created = formatDate(p.publishedAt || p.createdAt);
  const statusLabel = p.status || "Draft";
  const variant = getBlogStatusClass(p.status) === "published" ? "active" : "planning";
  const thumbInner = thumbHtml || '<i class="ri-article-line"></i>';
  const actions = `${listActionBtn("pa-action-edit", "ri-pencil-line", "Edit post", idAttr, p.id, "Edit")}
    ${listActionBtn("pa-action-delete", "ri-delete-bin-line", "Delete post", idAttr, p.id, "Delete")}`;
  return `${renderListRowStart(cardClass)}
    ${renderListIndexCell(rowIndex)}
    ${renderListProjectCell(title, thumbInner)}
    ${renderListTextCell(categoryCell)}
    ${renderListStatusCell(statusLabel, variant)}
    ${renderListDateCell(created)}
    ${renderListActionsCell(actions)}
  ${closeListRow()}`;
}
function renderPaBlogCard(p, opts = {}) {
  const {
    meta = { label: p.category, cls: "" },
    thumbHtml,
    bulkCheckbox = "",
    cardClass = "",
    animationDelay = 0,
    idAttr = "data-blog-id",
    engagement = null
  } = opts;
  const id = p.id;
  const title = escapeHtml(p.title);
  const category = escapeHtml(meta.label || p.category || "\u2014");
  const desc = escapeHtml(p.excerpt || "");
  const statusClass = getBlogStatusClass(p.status);
  const statusLabel = p.status || "Draft";
  const featuredBadge = p.featured ? '<span class="pa-proj-card__featured"><i class="ri-star-fill"></i> FEATURED</span>' : "";
  const statusBadge = `<span class="pa-proj-card__status pa-proj-card__status--${statusClass}"><span class="pa-proj-card__status-dot" aria-hidden="true"></span>${escapeHtml(statusLabel)}</span>`;
  const tagsHtml = blogTagsHtml(p.tags);
  const metaHtml = renderMeta(p, engagement);
  const actionsHtml = renderActions(p, idAttr);
  const menuHtml = renderCardMenu(p, idAttr);
  const catKey = escapeHtml(normalizeCategoryKey(meta.catKey || p.category));
  return `<div class="pa-card pa-proj-card pa-blog-card${cardClass}" ${idAttr}="${id}" data-cat-key="${catKey}" style="animation-delay:${animationDelay}ms;">
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
            <span class="pa-proj-card__type-icon" aria-hidden="true"><i class="ri-article-line"></i></span>
            <div class="pa-proj-card__title-block">
              <h3 class="pa-proj-card__title" title="${title}">${title}</h3>
              <div class="pa-proj-card__category"><i class="ri-price-tag-3-line"></i> ${category}</div>
            </div>
          </div>
          <div class="pa-proj-card__head-more">
            <button type="button" class="pa-action-btn pa-action-more" ${idAttr}="${id}" title="More options" aria-label="More options for ${title}"><i class="ri-more-2-fill"></i></button>
            ${menuHtml}
          </div>
        </div>
        <p class="pa-proj-card__desc">${desc}</p>
        <div class="pa-proj-card__tags">${tagsHtml}</div>
        <div class="pa-proj-card__meta">${metaHtml}</div>
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
              <button type="button" class="pa-action-btn pa-action-more" ${idAttr}="${id}" title="More options" aria-label="More options for ${title}"><i class="ri-more-2-fill"></i></button>
              ${menuHtml}
            </div>
          </div>
        </div>
        <p class="pa-proj-card__desc">${desc}</p>
        <div class="pa-proj-card__tags">${tagsHtml}</div>
      </div>
      <div class="pa-proj-card__list-meta">${metaHtml}</div>
      <div class="pa-proj-card__list-actions">${actionsHtml}</div>
    </div>
  </div>`;
}

// client/modules/blog/BlogPostWorkspace.ts
var BlogPostWorkspace = class {
  constructor(blog) {
    this.wired = false;
    this.wsSlugTouched = false;
    this.wsImageData = null;
    this.wsEditorMode = "edit";
    this.wsOpenMode = "edit";
    this.closing = false;
    this.closeTimer = null;
    this.engagementPostId = null;
    this.blog = blog;
  }
  bind() {
    if (this.wired) return;
    const root = $id("paBlogWorkspace");
    if (!root) return;
    this.wired = true;
    setupRte("blogWsRteWrap", "blogWsContent");
    this.blog.setupImageDropzone("blogWs");
    this.blog.setupMediaPicker("blogWs");
    this.blog.on($id("paBlogWsBackBtn"), "click", () => this.close());
    this.blog.on($id("paBlogWsSaveBtn"), "click", () => {
      void this.save();
    });
    this.blog.on($id("paBlogWsSaveDraftBtn"), "click", () => {
      void this.saveAsDraft();
    });
    this.blog.on($id("paBlogWsPublishNowBtn"), "click", () => {
      void this.publishNow();
    });
    this.blog.on($id("paBlogWsCopyPreviewLinkBtn"), "click", () => {
      void this.copyPublicPreviewLink();
    });
    this.blog.on($id("paBlogWsDeleteBtn"), "click", () => this.requestDelete());
    $all("#paBlogWsModeToggle .pa-view-btn").forEach((btn) => {
      this.blog.on(btn, "click", () => {
        const mode = btn.getAttribute("data-ws-mode");
        if (mode) this.setEditorMode(mode);
      });
    });
    $all("[data-ws-panel-toggle]").forEach((btn) => {
      this.blog.on(btn, "click", () => {
        const panel = btn.closest("[data-ws-panel]");
        if (!panel) return;
        const isOpen = panel.classList.toggle("is-collapsed");
        btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    });
    this.blog.on($id("blogWsTitle"), "input", (e) => {
      const el = e.target;
      this.updateTitleCount();
      if (!this.wsSlugTouched) {
        const slugEl = $id("blogWsSlug");
        if (slugEl) slugEl.value = slugify(el.value);
      }
    });
    this.blog.on($id("blogWsSlug"), "input", () => {
      this.wsSlugTouched = true;
    });
    this.blog.on($id("blogWsExcerpt"), "input", () => this.updateExcerptCount());
    this.blog.on($id("blogWsMetaTitle"), "input", () => this.updateMetaCounts());
    this.blog.on($id("blogWsMetaDesc"), "input", () => this.updateMetaCounts());
    this.blog.on($id("blogWsTagInput"), "keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addChip($id("blogWsTagChips"), e.target.value);
        e.target.value = "";
      }
    });
    this.blog.on($id("blogWsTagAddBtn"), "click", () => {
      const input = $id("blogWsTagInput");
      if (!input) return;
      addChip($id("blogWsTagChips"), input.value);
      input.value = "";
    });
    this.blog.on($id("blogWsContentHtml"), "input", () => {
      const body = $id("blogWsContent");
      if (body) setRteHtml(body, $id("blogWsContentHtml").value);
    });
  }
  openAdd() {
    if (!canManageContent()) return;
    this.bind();
    this.wsOpenMode = "add";
    this.blog.currentEditId = null;
    this.resetForm();
    this.blog._populateCategorySelects();
    this.syncCategorySelect();
    this.setEditorMode("edit");
    this.show();
    $id("paBlogWsHeadTitleText").textContent = "Add New Post";
    $id("paBlogWsHeadSubtitle").textContent = "Create a new article for your portfolio";
    $id("paBlogWsDeleteBtn").setAttribute("hidden", "");
    this.resetEngagementUi();
    setTimeout(() => $id("blogWsTitle")?.focus(), 420);
  }
  async open(id, mode = "edit") {
    if (!canManageContent() && mode !== "preview") return;
    this.bind();
    let record = this.blog.findById(id);
    if (!record) {
      this.blog.toast("Post not found", "danger");
      return;
    }
    const contentMissing = record.content == null || String(record.content).trim() === "";
    if (contentMissing) {
      try {
        const res = await fetch(`/api/blog-posts/${encodeURIComponent(String(id))}`, {
          credentials: "same-origin",
          headers: { Accept: "application/json" }
        });
        if (res.ok) {
          const full = await res.json();
          const records = [...this.blog.store.get("records")];
          const idx = records.findIndex((p) => String(p.id) === String(id));
          if (idx >= 0) records[idx] = { ...records[idx], ...full };
          this.blog.store.set("records", records);
          record = this.blog.findById(id) || full;
        }
      } catch {
      }
    }
    this.wsOpenMode = mode === "preview" ? "preview" : "edit";
    this.blog.currentEditId = id;
    this.blog._populateCategorySelects();
    this.syncCategorySelect();
    this.populateForm(record);
    this.setEditorMode(mode === "preview" ? "preview" : "edit");
    this.show();
    $id("paBlogWsHeadTitleText").textContent = "Edit Post";
    $id("paBlogWsHeadSubtitle").textContent = record.slug ? `/${record.slug}` : "Update content and publishing settings";
    $id("paBlogWsDeleteBtn")?.removeAttribute("hidden");
    this.engagementPostId = id;
    void this.loadEngagement(id);
    void this.loadRevisions(id);
    if (mode !== "preview") setTimeout(() => $id("blogWsTitle")?.focus(), 420);
  }
  close() {
    const body = $id("paBlogBody");
    const ws = $id("paBlogWorkspace");
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
    const ws = $id("paBlogWorkspace");
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    this.closing = false;
    if (ws) {
      ws.classList.remove("is-closing");
      ws.setAttribute("aria-hidden", "true");
    }
    this.wsImageData = null;
  }
  show() {
    const body = $id("paBlogBody");
    const ws = $id("paBlogWorkspace");
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
  syncCategorySelect() {
    const sorted = this.blog._blogCategories || [];
    const options = sorted.map((c) => `<option value="${escapeHtml(c.key)}">${escapeHtml(c.label)}</option>`).join("");
    const select = $id("blogWsCategory");
    if (!select) return;
    select.innerHTML = '<option value="">Select category</option>' + options;
    syncPaSelect(select);
  }
  resetForm() {
    this.wsSlugTouched = false;
    this.wsImageData = null;
    ["blogWsTitle", "blogWsSlug", "blogWsExcerpt", "blogWsImageAlt", "blogWsSortOrder", "blogWsMetaTitle", "blogWsMetaDesc"].forEach((id) => {
      const el = $id(id);
      if (el) el.value = "";
    });
    $id("blogWsContent").innerHTML = "";
    $id("blogWsContentHtml").value = "";
    $id("blogWsTagChips").innerHTML = "";
    $id("blogWsTagInput").value = "";
    $id("blogWsStatus").value = "Draft";
    $id("blogWsFeatured").value = "0";
    $id("blogWsPublishedDate").value = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    $id("blogWsCommentsEnabled").value = "1";
    $id("blogWsLikesEnabled").value = "1";
    $id("blogWsCommentsAutoApprove").value = "0";
    syncPaSelect($id("blogWsCommentsEnabled"));
    syncPaSelect($id("blogWsLikesEnabled"));
    syncPaSelect($id("blogWsCommentsAutoApprove"));
    this.engagementPostId = null;
    this.resetEngagementUi();
    this.blog.setFeaturedPreview("blogWs", null);
    this.updateTitleCount();
    this.updateExcerptCount();
    this.updateMetaCounts();
    this.clearFieldErrors();
  }
  populateForm(p) {
    this.wsSlugTouched = true;
    $id("blogWsTitle").value = String(p.title || "");
    $id("blogWsSlug").value = String(p.slug || "");
    $id("blogWsCategory").value = String(p.category || "");
    syncPaSelect($id("blogWsCategory"));
    $id("blogWsExcerpt").value = String(p.excerpt || "");
    setRteHtml($id("blogWsContent"), String(p.content || ""));
    $id("blogWsContentHtml").value = String(p.content || "");
    populateChips($id("blogWsTagChips"), Array.isArray(p.tags) ? p.tags : []);
    $id("blogWsImageAlt").value = String(p.imageAlt || "");
    $id("blogWsStatus").value = String(p.status || "Draft");
    syncPaSelect($id("blogWsStatus"));
    $id("blogWsFeatured").value = p.featured ? "1" : "0";
    syncPaSelect($id("blogWsFeatured"));
    $id("blogWsPublishedDate").value = String(p.publishedAt || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
    $id("blogWsSortOrder").value = p.sortOrder != null ? String(p.sortOrder) : "";
    $id("blogWsMetaTitle").value = String(p.metaTitle || "");
    $id("blogWsMetaDesc").value = String(p.metaDesc || "");
    $id("blogWsCommentsEnabled").value = p.commentsEnabled === false ? "0" : "1";
    $id("blogWsLikesEnabled").value = p.likesEnabled === false ? "0" : "1";
    $id("blogWsCommentsAutoApprove").value = p.commentsAutoApprove ? "1" : "0";
    syncPaSelect($id("blogWsCommentsEnabled"));
    syncPaSelect($id("blogWsLikesEnabled"));
    syncPaSelect($id("blogWsCommentsAutoApprove"));
    this.wsImageData = p.imageUrl || null;
    this.blog.setFeaturedPreview("blogWs", this.wsImageData, String(p.imageAlt || ""));
    this.updateTitleCount();
    this.updateExcerptCount();
    this.updateMetaCounts();
    this.clearFieldErrors();
  }
  setEditorMode(mode) {
    this.wsEditorMode = mode;
    $all("#paBlogWsModeToggle .pa-view-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-ws-mode") === mode);
    });
    const editorPane = $id("paBlogWsEditorPane");
    const previewPane = $id("paBlogWsPreviewPane");
    const body = $id("blogWsContent");
    if (mode === "preview") {
      if (editorPane) editorPane.hidden = true;
      if (previewPane) previewPane.hidden = false;
      const html = getRteHtml(body);
      const preview = $id("paBlogWsPreviewContent");
      if (preview) preview.innerHTML = html;
      return;
    }
    if (previewPane) previewPane.hidden = true;
    if (editorPane) editorPane.hidden = false;
    const rteWrap = $id("blogWsRteWrap");
    if (rteWrap) rteWrap.hidden = false;
  }
  updateTitleCount() {
    const el = $id("blogWsTitle");
    const count = $id("blogWsTitleCount");
    if (el && count) count.textContent = `${el.value.length}/100`;
  }
  updateExcerptCount() {
    const el = $id("blogWsExcerpt");
    const count = $id("blogWsExcerptCount");
    if (el && count) count.textContent = String(el.value.length);
  }
  updateMetaCounts() {
    const title = $id("blogWsMetaTitle");
    const desc = $id("blogWsMetaDesc");
    if (title) $id("blogWsMetaTitleCount").textContent = String(title.value.length);
    if (desc) $id("blogWsMetaDescCount").textContent = String(desc.value.length);
  }
  clearFieldErrors() {
    ["Title", "Slug", "Category", "Excerpt", "Content"].forEach((f) => {
      $id(`blogWs${f}Error`)?.classList.remove("visible");
      $id(f === "Content" ? "blogWsRteWrap" : `blogWs${f}`)?.classList.remove("error");
    });
  }
  getWsImageData() {
    return this.wsImageData;
  }
  setWsImageData(url) {
    this.wsImageData = url;
  }
  async saveAsDraft() {
    $id("blogWsStatus").value = "Draft";
    syncPaSelect($id("blogWsStatus"));
    await this.save();
  }
  async publishNow() {
    $id("blogWsStatus").value = "Published";
    syncPaSelect($id("blogWsStatus"));
    await this.save();
  }
  async save() {
    if (!canManageContent()) return;
    const f = this.blog.validateForm("ws");
    if (!f.valid) return;
    const btn = $id("paBlogWsSaveBtn");
    btn?.classList.add("loading");
    try {
      if (this.wsOpenMode === "add") {
        const newPost = this.blog.buildNewRecord(f);
        newPost.id = this.blog.nextId++;
        const records = [...this.blog.store.get("records"), newPost];
        this.blog.store.set("records", records);
        await this.blog.persist();
        await this.blog.refreshEngagementSummaries();
        this.blog.render();
        this.blog.toast("Blog post added", "success");
        this.blog.notify(`New blog post "${newPost.title}" was added.`, "ri-article-line");
        this.close();
      } else {
        const record = this.blog.findById(this.blog.currentEditId);
        if (!record) return;
        this.blog.applyEditToRecord(record, f);
        await this.blog.persist();
        await this.blog.refreshEngagementSummaries();
        this.blog.render();
        this.blog.toast("Blog post saved", "success");
        if (this.engagementPostId) void this.loadEngagement(this.engagementPostId);
        $id("paBlogWsHeadSubtitle").textContent = record.slug ? `/${record.slug}` : "";
      }
    } catch {
      this.blog.toast("Could not save changes", "danger");
    } finally {
      btn?.classList.remove("loading");
    }
  }
  requestDelete() {
    if (!canManageContent()) return;
    const id = this.blog.currentEditId;
    if (!id) return;
    const record = this.blog.findById(id);
    if (!record) return;
    requestDelete(id, this.blog.config.deleteType, this.blog.getDeleteName(record));
  }
  resetEngagementUi() {
    $id("paBlogWsLikeCount").textContent = "0";
    $id("paBlogWsCommentCount").textContent = "0";
    $id("paBlogWsPendingCount").textContent = "0";
    $id("paBlogWsPendingWrap").hidden = true;
    const badge = $id("paBlogWsEngagementBadge");
    if (badge) {
      badge.hidden = true;
      badge.textContent = "";
    }
    const list = $id("paBlogWsCommentsList");
    const empty = $id("paBlogWsCommentsEmpty");
    if (list && empty) {
      list.querySelectorAll(".pa-blog-ws-comment-item").forEach((el) => el.remove());
      empty.hidden = false;
    }
  }
  renderEngagement(data) {
    const likes = data.likeCount ?? 0;
    const comments = data.comments || [];
    const approved = comments.filter((c) => c.status === "approved").length;
    const pending = comments.filter((c) => c.status === "pending").length;
    $id("paBlogWsLikeCount").textContent = String(likes);
    $id("paBlogWsCommentCount").textContent = String(approved);
    $id("paBlogWsPendingCount").textContent = String(pending);
    $id("paBlogWsPendingWrap").hidden = pending === 0;
    const badge = $id("paBlogWsEngagementBadge");
    if (badge) {
      if (pending > 0) {
        badge.hidden = false;
        badge.textContent = `${pending} pending`;
      } else {
        badge.hidden = true;
        badge.textContent = "";
      }
    }
    const list = $id("paBlogWsCommentsList");
    const empty = $id("paBlogWsCommentsEmpty");
    if (!list || !empty) return;
    list.querySelectorAll(".pa-blog-ws-comment-item").forEach((el) => el.remove());
    if (!comments.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    const postId = this.engagementPostId;
    comments.forEach((c) => {
      const item = document.createElement("article");
      item.className = "pa-blog-ws-comment-item";
      item.dataset.commentId = c.id;
      const statusLabel = escapeHtml(c.status);
      const date = escapeHtml(new Date(c.createdAt).toLocaleString());
      const email = c.authorEmail ? `<span class="pa-blog-ws-comment-email">${escapeHtml(c.authorEmail)}</span>` : "";
      const modActions = c.status === "pending" ? `<button type="button" class="pa-btn pa-btn-cancel pa-btn-sm" data-comment-action="approve" data-comment-id="${escapeHtml(c.id)}">Approve</button>
           <button type="button" class="pa-btn pa-btn-cancel pa-btn-sm" data-comment-action="spam" data-comment-id="${escapeHtml(c.id)}">Spam</button>` : `<button type="button" class="pa-btn pa-btn-cancel pa-btn-sm" data-comment-action="reject" data-comment-id="${escapeHtml(c.id)}">Hide</button>`;
      item.innerHTML = `
        <header class="pa-blog-ws-comment-head">
          <strong>${escapeHtml(c.authorName)}</strong>${email}
          <span class="pa-blog-ws-comment-meta">${statusLabel} \xB7 ${date}</span>
        </header>
        <p class="pa-blog-ws-comment-body">${escapeHtml(c.body)}</p>
        <div class="pa-blog-ws-comment-actions">
          ${modActions}
          <button type="button" class="pa-btn pa-btn-cancel pa-btn-sm pa-blog-ws-comment-delete" data-comment-action="delete" data-comment-id="${escapeHtml(c.id)}">Delete</button>
        </div>`;
      list.appendChild(item);
    });
    if (postId) {
      $all("[data-comment-action]", list).forEach((btn) => {
        this.blog.on(btn, "click", () => {
          const action = btn.getAttribute("data-comment-action");
          const commentId = btn.getAttribute("data-comment-id");
          if (!action || !commentId) return;
          void this.moderateComment(postId, commentId, action);
        });
      });
    }
  }
  async loadEngagement(postId) {
    try {
      const res = await fetch(`/api/blog-posts/${encodeURIComponent(String(postId))}/engagement`, {
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });
      if (!res.ok) {
        this.resetEngagementUi();
        return;
      }
      const data = await res.json();
      if (data?.commentsEnabled != null) {
        $id("blogWsCommentsEnabled").value = data.commentsEnabled ? "1" : "0";
        $id("blogWsLikesEnabled").value = data.likesEnabled ? "1" : "0";
        $id("blogWsCommentsAutoApprove").value = data.commentsAutoApprove ? "1" : "0";
        syncPaSelect($id("blogWsCommentsEnabled"));
        syncPaSelect($id("blogWsLikesEnabled"));
        syncPaSelect($id("blogWsCommentsAutoApprove"));
      }
      this.renderEngagement(data);
    } catch {
      this.resetEngagementUi();
    }
  }
  async moderateComment(postId, commentId, action) {
    const statusMap = {
      approve: "approved",
      reject: "rejected",
      spam: "spam"
    };
    try {
      if (action === "delete") {
        const res2 = await fetch(
          `/api/blog-posts/${encodeURIComponent(String(postId))}/engagement?commentId=${encodeURIComponent(commentId)}`,
          { method: "DELETE", credentials: "same-origin" }
        );
        if (!res2.ok) throw new Error("delete failed");
        const payload2 = await res2.json();
        this.renderEngagement(payload2.engagement || {});
        this.blog.toast("Comment removed", "success");
        void this.blog.refreshEngagementSummaries();
        return;
      }
      const status = statusMap[action];
      if (!status) return;
      const res = await fetch(`/api/blog-posts/${encodeURIComponent(String(postId))}/engagement`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ commentId, status })
      });
      if (!res.ok) throw new Error("update failed");
      const payload = await res.json();
      this.renderEngagement(payload.engagement || {});
      this.blog.toast(action === "approve" ? "Comment approved" : "Comment updated", "success");
      void this.blog.refreshEngagementSummaries();
    } catch {
      this.blog.toast("Could not update comment", "danger");
    }
  }
  async copyPublicPreviewLink() {
    const id = this.blog.currentEditId;
    if (id == null || !canManageContent()) return;
    try {
      const res = await fetch(`/api/blog-posts/${encodeURIComponent(String(id))}/preview-token`, {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not create preview link");
      const url = data.previewUrl;
      if (!url) throw new Error("No preview URL returned");
      await navigator.clipboard.writeText(url);
      this.blog.toast("Preview API URL copied (1h)", "success");
    } catch (err) {
      this.blog.toast(err.message || "Could not copy preview link", "danger");
    }
  }
  async loadRevisions(postId) {
    const list = $id("paBlogWsRevisionsList");
    const empty = $id("paBlogWsRevisionsEmpty");
    if (!list || !empty) return;
    list.innerHTML = "";
    if (postId == null) {
      empty.hidden = false;
      return;
    }
    try {
      const res = await fetch(
        `/api/content-revisions?entityType=blog_post&legacyId=${encodeURIComponent(String(postId))}`,
        { credentials: "same-origin" }
      );
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      const revisions = Array.isArray(data.revisions) ? data.revisions : [];
      empty.hidden = revisions.length > 0;
      list.innerHTML = revisions.map((row) => {
        const when = new Date(row.created_at).toLocaleString();
        return `<li class="pa-blog-ws-revision-item"><span>${escapeHtml(when)}</span><button type="button" class="pa-btn pa-btn-cancel" data-revision-restore="${escapeHtml(row.id)}">Restore</button></li>`;
      }).join("");
      list.querySelectorAll("[data-revision-restore]").forEach((btn) => {
        this.blog.on(btn, "click", () => {
          const id = btn.getAttribute("data-revision-restore");
          void this.restoreRevision(id);
        });
      });
    } catch {
      empty.hidden = false;
    }
  }
  async restoreRevision(revisionId) {
    if (!revisionId || !canManageContent()) return;
    if (!window.confirm("Restore this version into the editor? Click Save to persist changes.")) return;
    try {
      const res = await fetch(`/api/content-revisions/${encodeURIComponent(revisionId)}/restore`, {
        method: "POST",
        credentials: "same-origin"
      });
      if (!res.ok) throw new Error("restore failed");
      const data = await res.json();
      const id = data.legacyId ?? this.blog.currentEditId;
      if (id != null) {
        this.openEdit(id);
        this.blog.toast("Revision restored \u2014 review and save", "success");
      }
    } catch {
      this.blog.toast("Could not restore revision", "danger");
    }
  }
};

// client/modules/blog/BlogModule.ts
var SEED_BLOG_POSTS = [];
var wiredImageDropzones = /* @__PURE__ */ new WeakSet();
var BlogModule = class extends CrudCardModule {
  constructor() {
    super({
      name: "BlogPosts",
      storageKey: "pa_blog_posts",
      deleteType: "blogpost",
      page: "blogposts",
      pageSize: 9,
      listTable: true,
      cardIdAttr: "data-blog-id",
      defaultFilters: { category: "all" },
      filterSelectIds: [{ id: "paBlogCategoryFilter", key: "category" }],
      layout: {
        selectId: "paBlogLayout",
        singular: "post",
        plural: "posts",
        getGroupInfo(record) {
          const meta = this.getCategoryMeta(record.category);
          const key = record.category || "uncategorized";
          return {
            key,
            title: meta.label || "Uncategorized",
            icon: "ri-bookmark-line",
            href: "/blog-categories",
            linkLabel: "Open"
          };
        }
      },
      addFocusId: "blogWsTitle",
      editFocusId: "blogWsTitle",
      tabGroup: null,
      bulkLabel: "post",
      ids: {
        grid: "paBlogGrid",
        resultCount: "paBlogResultCount",
        paginationBtns: "paBlogPaginationBtns",
        paginationInfo: "paBlogPaginationInfo",
        pagePrev: "paBlogPagePrev",
        pageNext: "paBlogPageNext",
        bodyScroll: "paBlogBody",
        emptyResetBtn: "paBlogEmptyResetBtn",
        emptyAddBtn: "paBlogEmptyAddBtn",
        addPanel: "paBlogAddPanel",
        editPanel: "paBlogEditPanel",
        addSubmit: "paBlogAddSubmit",
        editSubmit: "paBlogEditSubmit",
        editDelete: "paBlogEditDelete",
        addNewBtn: "paBlogAddNewBtn",
        addPanelClose: "paBlogAddPanelClose",
        editPanelClose: "paBlogEditPanelClose",
        addCancel: "paBlogAddCancel",
        editCancel: "paBlogEditCancel"
      },
      menuActions: { "copy-slug": function copySlug(id) {
        this.copySlugUrl(id);
      } }
    });
    this._pendingOpenId = null;
    this._blogCategories = [];
    this.store.set("blogTabFilter", "all");
    this.workspace = new BlogPostWorkspace(this);
    this._engagementByPostId = {};
  }
  async refreshEngagementSummaries() {
    const records = this.store.get("records") || [];
    if (!records.length) {
      this._engagementByPostId = {};
      return;
    }
    const ids = records.map((r) => r.id).join(",");
    try {
      const res = await fetch(`/api/blog-posts/engagement?ids=${encodeURIComponent(ids)}`, {
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });
      if (!res.ok) return;
      this._engagementByPostId = await res.json();
    } catch {
    }
  }
  getEngagementForPost(id) {
    return this._engagementByPostId?.[String(id)] || null;
  }
  seedData() {
    return [];
  }
  getCategoryMeta(key) {
    const cat = (this._blogCategories || []).find((c) => c.key === key);
    return cat ? { label: cat.label, catKey: cat.key } : { label: key || "Uncategorized", catKey: key };
  }
  async load() {
    storage.invalidate("pa_blog_posts");
    const [records, categories] = await Promise.all([
      this.loadRecords(() => SEED_BLOG_POSTS),
      storage.get("pa_blog_categories", [])
    ]);
    this._blogCategories = Array.isArray(categories) ? categories : [];
    this._populateCategorySelects();
    this._populateCategoryFilter();
    try {
      const pendingCat = sessionStorage.getItem("pa_blog_cat_filter");
      if (pendingCat) {
        sessionStorage.removeItem("pa_blog_cat_filter");
        this.store.set("filters", { ...this.store.get("filters"), category: pendingCat });
      }
    } catch {
    }
    const maxId = Math.max(0, ...records.map((r) => Number(r.id) || 0));
    this.nextId = maxId + 1;
    this.store.set("records", records);
    await this.refreshEngagementSummaries();
    try {
      const params = new URLSearchParams(window.location.search);
      const openId = params.get("open");
      if (openId) {
        this._pendingOpenId = openId;
        params.delete("open");
        const url = new URL(window.location.href);
        url.searchParams.delete("open");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    } catch {
    }
  }
  render() {
    this._populateCategoryFilter();
    super.render();
  }
  _populateCategoryFilter() {
    const select = $select("paBlogCategoryFilter");
    if (!select) return;
    const current = this.store.get("filters")?.category || "all";
    const sorted = sortByNewestFirst(this._blogCategories || []);
    select.innerHTML = '<option value="all">All categories</option>' + sorted.map((c) => `<option value="${escapeHtml(c.key)}">${escapeHtml(c.label)}</option>`).join("");
    select.value = current;
    syncPaSelect(select);
  }
  _populateCategorySelects() {
    const sorted = sortByNewestFirst(this._blogCategories || []);
    const options = sorted.map((c) => `<option value="${escapeHtml(c.key)}">${escapeHtml(c.label)}</option>`).join("");
    const placeholder = '<option value="">Select category</option>';
    const wsSelect = $select("blogWsCategory");
    if (wsSelect) {
      wsSelect.innerHTML = placeholder + options;
      syncPaSelect(wsSelect);
    }
  }
  getFiltered() {
    const results = super.getFiltered();
    const tab = this.store.get("blogTabFilter") || "all";
    if (tab === "featured") return results.filter((p) => p.featured);
    if (tab === "published") return results.filter((p) => p.status === "Published");
    if (tab === "drafts") return results.filter((p) => p.status !== "Published");
    return results;
  }
  renderStats() {
    const records = this.store.get("records");
    setStatValue("paBlogStatTotal", records.length);
    setStatValue("paBlogStatPublished", records.filter((p) => p.status === "Published").length);
    setStatValue("paBlogStatDrafts", records.filter((p) => p.status !== "Published").length);
    setStatValue("paBlogStatFeatured", records.filter((p) => p.featured).length);
    setStatTrend("paBlogStatTotalTrend", records);
    setStatTrend("paBlogStatPublishedTrend", records, (p) => p.status === "Published");
    setStatTrend("paBlogStatDraftsTrend", records, (p) => p.status !== "Published");
    setStatTrend("paBlogStatFeaturedTrend", records, (p) => p.featured);
  }
  syncStatusTabs() {
    const filter = this.store.get("blogTabFilter") || "all";
    $all("#paBlogStatusTabs .pa-status-tab").forEach((tab) => {
      const active = tab.getAttribute("data-blog-filter") === filter;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
  }
  onAfterRender() {
    this.syncStatusTabs();
    if (this._pendingOpenId) {
      const id = this._pendingOpenId;
      this._pendingOpenId = null;
      void this.workspace.open(id, "edit");
    }
  }
  sortRecords(records) {
    return sortByNewestFirst(records);
  }
  matchesFilters(record, filters) {
    if (filters.category !== "all" && record.category !== filters.category) return false;
    return true;
  }
  resetFilters() {
    super.resetFilters();
    this.store.set("blogTabFilter", "all");
  }
  matchesSearch(record, query) {
    const q = query.trim().toLowerCase();
    return record.title.toLowerCase().includes(q) || record.slug.toLowerCase().includes(q) || (record.excerpt || "").toLowerCase().includes(q) || record.tags.some((t) => t.toLowerCase().includes(q)) || (this.getCategoryMeta(record.category)?.label || "").toLowerCase().includes(q);
  }
  getDeleteName(record) {
    return record.title;
  }
  renderListRow(p, rowIndex) {
    const meta = this.getCategoryMeta(p.category);
    const thumb = p.imageUrl ? `<img class="pa-lv-img" src="${escapeHtml(p.imageUrl)}" alt="" loading="lazy" />` : `<i class="ri-article-line"></i>`;
    return renderPaBlogListRow(p, {
      meta,
      thumbHtml: thumb,
      rowIndex,
      cardClass: this.bulkSelect?.cardClass(p.id) || "",
      idAttr: "data-blog-id",
      engagement: this.getEngagementForPost(p.id)
    });
  }
  renderCard(p, index) {
    const meta = this.getCategoryMeta(p.category);
    const thumb = p.imageUrl ? `<img class="pa-thumb-img" src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.imageAlt || p.title)}" loading="lazy" />` : `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;"><i class="ri-article-line" style="font-size:34px;color:var(--pa-text-ghost);"></i></div>`;
    return renderPaBlogCard(p, {
      meta,
      thumbHtml: thumb,
      bulkCheckbox: this.bulkSelect?.checkboxHtml(p.id, `Select ${escapeHtml(p.title)}`) || "",
      cardClass: this.bulkSelect?.cardClass(p.id) || "",
      animationDelay: Math.min(index, 11) * 35,
      idAttr: "data-blog-id",
      engagement: this.getEngagementForPost(p.id)
    });
  }
  attachCardListeners() {
    super.attachCardListeners();
    const grid = $id("paBlogGrid");
    if (!grid) return;
    grid.querySelectorAll(".pa-proj-card__details-btn").forEach((btn) => {
      this.on(btn, "click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-blog-id");
        if (id) void this.workspace.open(id, "edit");
      });
    });
  }
  copySlugUrl(id) {
    const p = this.findById(id);
    if (!p) return;
    navigator.clipboard?.writeText(`/blog/${p.slug}`).then(
      () => this.toast("Slug URL copied to clipboard", "success", 2e3),
      () => this.toast("Clipboard not available.", "danger")
    );
  }
  buildDuplicate(record, newId) {
    let slug = `${record.slug}-copy`;
    let suffix = 2;
    const slugs = new Set(this.store.get("records").map((r) => r.slug));
    while (slugs.has(slug)) slug = `${record.slug}-copy-${suffix++}`;
    return {
      ...record,
      id: newId,
      title: `${record.title} (Copy)`,
      slug,
      status: "Draft",
      featured: false,
      tags: [...record.tags],
      commentsEnabled: record.commentsEnabled !== false,
      likesEnabled: record.likesEnabled !== false,
      commentsAutoApprove: !!record.commentsAutoApprove,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  setFeaturedPreview(prefix, dataUrl, alt) {
    const altText = alt ?? "";
    const wrap = $id(`${prefix}ImagePreviewWrap`);
    const img = $img(`${prefix}ImagePreviewImg`);
    const dz = $id(`${prefix}ImageDropzone`);
    if (dataUrl) {
      if (img) {
        img.src = dataUrl;
        img.alt = altText;
      }
      if (wrap) wrap.style.display = "block";
      if (dz) dz.style.display = "none";
    } else {
      if (wrap) wrap.style.display = "none";
      if (dz) dz.style.display = "block";
    }
  }
  async persist() {
    if (!canManageContent()) return;
    await this.saveRecords(this.store.get("records"));
    await storage.get("pa_media_library", []).catch(() => []);
  }
  setupMediaPicker(prefix) {
    const btn = $id(`${prefix}FeaturedPickBtn`);
    if (!btn) return;
    this.on(btn, "click", () => {
      const pickerOpts = {
        mode: "featured",
        folder: "blog",
        returnFocus: btn,
        onSelect: (item) => {
          if (prefix === "blogWs") this.workspace.setWsImageData(item.url);
          const altEl = $field(`${prefix}ImageAlt`);
          if (altEl && item.alt && !altEl.value.trim()) altEl.value = item.alt;
          this.setFeaturedPreview(prefix, item.url, item.alt || altEl?.value || "");
          this.toast("Featured image selected from media library", "success");
        }
      };
      open(pickerOpts);
    });
  }
  setupImageDropzone(prefix) {
    const dropzone = $id(`${prefix}ImageDropzone`);
    const fileInput = $input(`${prefix}ImageFileInput`);
    const removeBtn = $id(`${prefix}ImageRemoveBtn`);
    if (!dropzone || !fileInput || wiredImageDropzones.has(dropzone)) return;
    const imageFileInput = fileInput;
    wiredImageDropzones.add(dropzone);
    const setData = (dataUrl) => {
      if (prefix === "blogWs") this.workspace.setWsImageData(dataUrl);
      const alt = $field(`${prefix}ImageAlt`)?.value ?? "";
      this.setFeaturedPreview(prefix, dataUrl, alt);
    };
    this.on(dropzone, "click", () => imageFileInput.click());
    this.on(imageFileInput, "change", async () => {
      const file = imageFileInput.files?.[0];
      imageFileInput.value = "";
      if (!file || !handleFileValidation(file)) return;
      try {
        const uploaded = await uploadCmsFileWithPreview(file, {
          folder: "blog",
          page: "blog",
          purpose: "blog-featured",
          optimize: { maxWidth: 1600, maxHeight: 900, quality: 0.88 },
          onPreview: (previewUrl) => setData(previewUrl)
        });
        setData(uploaded.url);
        this.toast("Featured image uploaded", "success");
      } catch {
        this.toast("Could not upload image", "danger");
      }
    });
    ["dragenter", "dragover"].forEach((evt) => this.on(dropzone, evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    }));
    ["dragleave", "drop"].forEach((evt) => this.on(dropzone, evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
    }));
    this.on(dropzone, "drop", async (e) => {
      if (!(e instanceof DragEvent)) return;
      const file = e.dataTransfer?.files?.[0];
      if (!file || !handleFileValidation(file)) return;
      try {
        const uploaded = await uploadCmsFileWithPreview(file, {
          folder: "blog",
          page: "blog",
          purpose: "blog-featured",
          optimize: { maxWidth: 1600, maxHeight: 900, quality: 0.88 },
          onPreview: (previewUrl) => setData(previewUrl)
        });
        setData(uploaded.url);
        this.toast("Featured image uploaded", "success");
      } catch {
        this.toast("Could not upload image", "danger");
      }
    });
    this.on(removeBtn, "click", (e) => {
      e.stopPropagation();
      setData(null);
    });
  }
  bindEvents() {
    super.bindEvents();
    this.workspace.bind();
    $all("#paBlogStatusTabs .pa-status-tab").forEach((tab) => {
      this.on(tab, "click", () => {
        const blogFilter = tab.getAttribute("data-blog-filter") || "all";
        this.store.update({ blogTabFilter: blogFilter, page: 1 });
        this.render();
      });
    });
  }
  openAddPanel() {
    this.workspace.openAdd();
  }
  openEditPanel(id) {
    void this.workspace.open(id, "edit");
  }
  async deleteById(id) {
    await super.deleteById(id);
    if (String(id) === String(this.currentEditId)) {
      this.workspace.close();
      this.currentEditId = null;
    }
  }
  resetAddForm() {
    this.workspace.resetForm();
  }
  populateEditForm(p) {
    this.workspace.populateForm(p);
  }
  validateForm(prefix = "ws") {
    let valid = true;
    const p = "blogWs";
    const title = $field(`${p}Title`)?.value.trim() ?? "";
    this._toggleErr(`${p}Title`, !title);
    if (!title) valid = false;
    const slugEl = $field(`${p}Slug`);
    const slug = slugEl?.value.trim() ?? "";
    const slugErr = $id(`${p}SlugError`);
    if (!slug) {
      slugEl?.classList.add("error");
      if (slugErr) {
        slugErr.classList.add("visible");
        slugErr.querySelector("span").textContent = "URL slug is required";
      }
      valid = false;
    } else if (!isValidSlug(slug)) {
      slugEl?.classList.add("error");
      if (slugErr) {
        slugErr.classList.add("visible");
        slugErr.querySelector("span").textContent = 'Slug must be lowercase letters, digits, or hyphens (e.g. "my-post-title")';
      }
      valid = false;
    } else {
      const editingId = this.currentEditId;
      const duplicate = this.store.get("records").find((post) => post.slug === slug && String(post.id) !== String(editingId));
      if (duplicate) {
        slugEl?.classList.add("error");
        if (slugErr) {
          slugErr.classList.add("visible");
          slugErr.querySelector("span").textContent = `Slug "${slug}" is already in use`;
        }
        valid = false;
      } else {
        slugEl?.classList.remove("error");
        slugErr?.classList.remove("visible");
      }
    }
    const category = $field(`${p}Category`)?.value ?? "";
    this._toggleErr(`${p}Category`, !category);
    if (!category) valid = false;
    const excerpt = $field(`${p}Excerpt`)?.value.trim() ?? "";
    this._toggleErr(`${p}Excerpt`, !excerpt);
    if (!excerpt) valid = false;
    const contentEl = $id(`${p}Content`);
    const contentPlain = contentEl?.textContent?.trim() ?? "";
    const content = getRteHtml(contentEl);
    $id(`${p}ContentError`)?.classList.toggle("visible", !contentPlain);
    $id(`${p}RteWrap`)?.classList.toggle("error", !contentPlain);
    if (!contentPlain) valid = false;
    const tags = getChipValues($id(`${p}TagChips`));
    return { valid, title, slug, category, excerpt, content, tags };
  }
  _toggleErr(id, isError) {
    $id(id)?.classList.toggle("error", isError);
    $id(`${id}Error`)?.classList.toggle("visible", isError);
  }
  buildNewRecord(f) {
    const publishedDate = $field("blogWsPublishedDate")?.value ?? "";
    const sortOrderRaw = $field("blogWsSortOrder")?.value ?? "";
    return {
      title: f.title,
      slug: f.slug,
      category: f.category,
      excerpt: f.excerpt,
      content: f.content,
      tags: f.tags,
      status: $field("blogWsStatus")?.value ?? "Draft",
      featured: $field("blogWsFeatured")?.value === "1",
      imageUrl: this.workspace.getWsImageData() || "",
      imageAlt: $field("blogWsImageAlt")?.value.trim() ?? "",
      publishedAt: publishedDate || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      sortOrder: sortOrderRaw ? parseInt(sortOrderRaw, 10) : this.store.get("records").length + 1,
      metaTitle: $field("blogWsMetaTitle")?.value.trim() ?? "",
      metaDesc: $field("blogWsMetaDesc")?.value.trim() ?? "",
      commentsEnabled: $field("blogWsCommentsEnabled")?.value !== "0",
      likesEnabled: $field("blogWsLikesEnabled")?.value !== "0",
      commentsAutoApprove: $field("blogWsCommentsAutoApprove")?.value === "1",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  applyEditToRecord(record, f) {
    record.title = f.title;
    record.slug = f.slug;
    record.category = f.category;
    record.excerpt = f.excerpt;
    record.content = f.content;
    record.tags = f.tags;
    record.status = $field("blogWsStatus")?.value ?? record.status;
    record.featured = $field("blogWsFeatured")?.value === "1";
    record.imageUrl = this.workspace.getWsImageData() || "";
    record.imageAlt = $field("blogWsImageAlt")?.value.trim() ?? "";
    const publishedDate = $field("blogWsPublishedDate")?.value ?? "";
    record.publishedAt = publishedDate || record.publishedAt;
    const sortOrderRaw = $field("blogWsSortOrder")?.value ?? "";
    record.sortOrder = sortOrderRaw ? parseInt(sortOrderRaw, 10) : record.sortOrder;
    record.metaTitle = $field("blogWsMetaTitle")?.value.trim() ?? "";
    record.metaDesc = $field("blogWsMetaDesc")?.value.trim() ?? "";
    record.commentsEnabled = $field("blogWsCommentsEnabled")?.value !== "0";
    record.likesEnabled = $field("blogWsLikesEnabled")?.value !== "0";
    record.commentsAutoApprove = $field("blogWsCommentsAutoApprove")?.value === "1";
  }
};
export {
  BlogModule
};
