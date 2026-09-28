import { $id, $all, escapeHtml } from "../../utils/dom.js";
import { syncPaSelect } from "../../utils/paSelect.js";
import { slugify } from "../../utils/strings.js";
import { setupRte, getRteHtml, setRteHtml } from "../../utils/rte.js";
import { addChip, populateChips } from "../../utils/chips.js";
import { requestDelete } from "../shell/confirm.js";
class BlogPostWorkspace {
  constructor(blog) {
    this.wired = false;
    this.wsSlugTouched = false;
    this.wsImageData = null;
    this.wsEditorMode = "edit";
    this.wsOpenMode = "edit";
    this.closing = false;
    this.closeTimer = null;
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
    setTimeout(() => $id("blogWsTitle")?.focus(), 420);
  }
  async open(id, mode = "edit") {
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
        this.blog.render();
        this.blog.toast("Blog post added", "success");
        this.blog.notify(`New blog post "${newPost.title}" was added.`, "ri-article-line");
        this.close();
      } else {
        const record = this.blog.findById(this.blog.currentEditId);
        if (!record) return;
        this.blog.applyEditToRecord(record, f);
        await this.blog.persist();
        this.blog.render();
        this.blog.toast("Blog post saved", "success");
        $id("paBlogWsHeadSubtitle").textContent = record.slug ? `/${record.slug}` : "";
      }
    } catch {
      this.blog.toast("Could not save changes", "danger");
    } finally {
      btn?.classList.remove("loading");
    }
  }
  requestDelete() {
    const id = this.blog.currentEditId;
    if (!id) return;
    const record = this.blog.findById(id);
    if (!record) return;
    requestDelete(id, this.blog.config.deleteType, this.blog.getDeleteName(record));
  }
}
export {
  BlogPostWorkspace
};
