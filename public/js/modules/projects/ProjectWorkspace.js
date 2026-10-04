import { $id, $all } from "../../utils/dom.js";
import { syncPaSelect } from "../../utils/paSelect.js";
import { getRteHtml, setRteHtml } from "../../utils/rte.js";
import { addChip, populateChips, populateProjectCategoryChips, populateProjectStackChips } from "../../utils/chips.js";
import { CATEGORY_META_PROJECTS } from "../../utils/projectCategories.js";
import { projectCatKeys } from "../../utils/projectCategories.js";
import { requestDelete } from "../shell/confirm.js";
class ProjectWorkspace {
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
}
export {
  ProjectWorkspace
};
