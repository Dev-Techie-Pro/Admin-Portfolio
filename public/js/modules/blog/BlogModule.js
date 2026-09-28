import { CrudCardModule } from "../../core/CrudCardModule.js";
import { escapeHtml, $id, $all } from "../../utils/dom.js";
import { storage } from "../../core/StorageService.js";
import { syncPaSelect } from "../../utils/paSelect.js";
import { isValidSlug } from "../../utils/strings.js";
import { handleFileValidation } from "../../utils/files.js";
import { uploadCmsFileWithPreview } from "../../utils/media-upload.js";
import { getRteHtml } from "../../utils/rte.js";
import { getChipValues } from "../../utils/chips.js";
import { renderPaBlogCard, renderPaBlogListRow } from "../../utils/paBlogCard.js";
import { BlogPostWorkspace } from "./BlogPostWorkspace.js";
import { setStatTrend, setStatValue } from "../../utils/pageStats.js";
import { sortByNewestFirst } from "../../utils/format.js";
import * as mediaPicker from "../../utils/MediaPicker.js";
const SEED_BLOG_POSTS = [];
class BlogModule extends CrudCardModule {
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
    this.store.set("blogTabFilter", "all");
    this.workspace = new BlogPostWorkspace(this);
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
    const select = $id("paBlogCategoryFilter");
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
    const wsSelect = $id("blogWsCategory");
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
      const active = tab.dataset.blogFilter === filter;
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
      idAttr: "data-blog-id"
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
      idAttr: "data-blog-id"
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
    navigator.clipboard?.writeText(`/blog/${p.slug}`).then(() => this.toast("Slug URL copied to clipboard", "success"));
  }
  buildDuplicate(record, newId) {
    let slug = `${record.slug}-copy`;
    let suffix = 2;
    const slugs = new Set(this.store.get("records").map((r) => r.slug));
    while (slugs.has(slug)) slug = `${record.slug}-copy-${suffix++}`;
    return { ...record, id: newId, title: `${record.title} (Copy)`, slug, status: "Draft", featured: false, tags: [...record.tags], createdAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
  setFeaturedPreview(prefix, dataUrl, alt) {
    const wrap = $id(`${prefix}ImagePreviewWrap`);
    const img = $id(`${prefix}ImagePreviewImg`);
    const dz = $id(`${prefix}ImageDropzone`);
    if (dataUrl) {
      if (img) {
        img.src = dataUrl;
        img.alt = alt || "";
      }
      if (wrap) wrap.style.display = "block";
      if (dz) dz.style.display = "none";
    } else {
      if (wrap) wrap.style.display = "none";
      if (dz) dz.style.display = "block";
    }
  }
  async persist() {
    await this.saveRecords(this.store.get("records"));
    await storage.get("pa_media_library", []).catch(() => []);
  }
  setupMediaPicker(prefix) {
    const btn = $id(`${prefix}FeaturedPickBtn`);
    if (!btn) return;
    this.on(btn, "click", () => {
      mediaPicker.open({
        mode: "featured",
        folder: "blog",
        returnFocus: btn,
        onSelect: (item) => {
          if (prefix === "blogWs") this.workspace.setWsImageData(item.url);
          const altEl = $id(`${prefix}ImageAlt`);
          if (altEl && item.alt && !altEl.value.trim()) altEl.value = item.alt;
          this.setFeaturedPreview(prefix, item.url, item.alt || altEl?.value || "");
          this.toast("Featured image selected from media library", "success");
        }
      });
    });
  }
  setupImageDropzone(prefix) {
    const dropzone = $id(`${prefix}ImageDropzone`);
    const fileInput = $id(`${prefix}ImageFileInput`);
    const removeBtn = $id(`${prefix}ImageRemoveBtn`);
    if (!dropzone || !fileInput || dropzone._wired) return;
    dropzone._wired = true;
    const setData = (dataUrl) => {
      if (prefix === "blogWs") this.workspace.setWsImageData(dataUrl);
      this.setFeaturedPreview(prefix, dataUrl);
    };
    this.on(dropzone, "click", () => fileInput.click());
    this.on(fileInput, "change", async () => {
      const file = fileInput.files?.[0];
      fileInput.value = "";
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
        this.store.update({ blogTabFilter: tab.dataset.blogFilter || "all", page: 1 });
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
    const title = $id(`${p}Title`).value.trim();
    this._toggleErr(`${p}Title`, !title);
    if (!title) valid = false;
    const slugEl = $id(`${p}Slug`);
    const slug = slugEl.value.trim();
    const slugErr = $id(`${p}SlugError`);
    if (!slug) {
      slugEl.classList.add("error");
      if (slugErr) {
        slugErr.classList.add("visible");
        slugErr.querySelector("span").textContent = "URL slug is required";
      }
      valid = false;
    } else if (!isValidSlug(slug)) {
      slugEl.classList.add("error");
      if (slugErr) {
        slugErr.classList.add("visible");
        slugErr.querySelector("span").textContent = 'Slug must be lowercase letters, digits, or hyphens (e.g. "my-post-title")';
      }
      valid = false;
    } else {
      const editingId = this.currentEditId;
      const duplicate = this.store.get("records").find((post) => post.slug === slug && String(post.id) !== String(editingId));
      if (duplicate) {
        slugEl.classList.add("error");
        if (slugErr) {
          slugErr.classList.add("visible");
          slugErr.querySelector("span").textContent = `Slug "${slug}" is already in use`;
        }
        valid = false;
      } else {
        slugEl.classList.remove("error");
        slugErr?.classList.remove("visible");
      }
    }
    const category = $id(`${p}Category`).value;
    this._toggleErr(`${p}Category`, !category);
    if (!category) valid = false;
    const excerpt = $id(`${p}Excerpt`).value.trim();
    this._toggleErr(`${p}Excerpt`, !excerpt);
    if (!excerpt) valid = false;
    const contentEl = $id(`${p}Content`);
    const contentPlain = contentEl.textContent.trim();
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
    const publishedDate = $id("blogWsPublishedDate").value;
    const sortOrderRaw = $id("blogWsSortOrder").value;
    return {
      title: f.title,
      slug: f.slug,
      category: f.category,
      excerpt: f.excerpt,
      content: f.content,
      tags: f.tags,
      status: $id("blogWsStatus").value,
      featured: $id("blogWsFeatured").value === "1",
      imageUrl: this.workspace.getWsImageData() || "",
      imageAlt: $id("blogWsImageAlt").value.trim(),
      publishedAt: publishedDate || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      sortOrder: sortOrderRaw ? parseInt(sortOrderRaw, 10) : this.store.get("records").length + 1,
      metaTitle: $id("blogWsMetaTitle").value.trim(),
      metaDesc: $id("blogWsMetaDesc").value.trim(),
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
    record.status = $id("blogWsStatus").value;
    record.featured = $id("blogWsFeatured").value === "1";
    record.imageUrl = this.workspace.getWsImageData() || "";
    record.imageAlt = $id("blogWsImageAlt").value.trim();
    const publishedDate = $id("blogWsPublishedDate").value;
    record.publishedAt = publishedDate || record.publishedAt;
    const sortOrderRaw = $id("blogWsSortOrder").value;
    record.sortOrder = sortOrderRaw ? parseInt(sortOrderRaw, 10) : record.sortOrder;
    record.metaTitle = $id("blogWsMetaTitle").value.trim();
    record.metaDesc = $id("blogWsMetaDesc").value.trim();
  }
}
export {
  BlogModule
};
