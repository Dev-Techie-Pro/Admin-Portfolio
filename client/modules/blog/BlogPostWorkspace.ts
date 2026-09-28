import { $id, $all, escapeHtml } from '../../utils/dom.js';
import { syncPaSelect } from '../../utils/paSelect.js';
import { slugify } from '../../utils/strings.js';
import { setupRte, getRteHtml, setRteHtml } from '../../utils/rte.js';
import { addChip, getChipValues, populateChips } from '../../utils/chips.js';
import { requestDelete } from '../shell/confirm.js';
import type { BlogModule } from './BlogModule.js';

type WsEditorMode = 'visual' | 'text' | 'preview';
type WsOpenMode = 'add' | 'edit' | 'preview';

export class BlogPostWorkspace {
  private blog: BlogModule;
  private wired = false;
  private wsSlugTouched = false;
  private wsImageData: string | null = null;
  private wsEditorMode: WsEditorMode = 'visual';
  private wsOpenMode: WsOpenMode = 'edit';
  private closing = false;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(blog: BlogModule) {
    this.blog = blog;
  }

  bind() {
    if (this.wired) return;
    const root = $id('paBlogWorkspace');
    if (!root) return;
    this.wired = true;

    setupRte('blogWsRteWrap', 'blogWsContent');
    this.blog.setupImageDropzone('blogWs');
    this.blog.setupMediaPicker('blogWs');

    this.blog.on($id('paBlogWsBackBtn'), 'click', () => this.close());
    this.blog.on($id('paBlogWsSaveBtn'), 'click', () => { void this.save(); });
    this.blog.on($id('paBlogWsSaveDraftBtn'), 'click', () => { void this.saveAsDraft(); });
    this.blog.on($id('paBlogWsPublishNowBtn'), 'click', () => { void this.publishNow(); });
    this.blog.on($id('paBlogWsDeleteBtn'), 'click', () => this.requestDelete());

    $all('#paBlogWsModeToggle .pa-view-btn').forEach((btn) => {
      this.blog.on(btn, 'click', () => {
        const mode = btn.getAttribute('data-ws-mode') as WsEditorMode;
        if (mode) this.setEditorMode(mode);
      });
    });

    $all('[data-ws-panel-toggle]').forEach((btn) => {
      this.blog.on(btn, 'click', () => {
        const panel = btn.closest('[data-ws-panel]');
        if (!panel) return;
        const collapsed = panel.classList.toggle('is-collapsed');
        btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      });
    });

    this.blog.on($id('blogWsTitle'), 'input', (e) => {
      const el = e.target as HTMLInputElement;
      this.updateTitleCount();
      if (!this.wsSlugTouched) {
        const slugEl = $id('blogWsSlug');
        if (slugEl) slugEl.value = slugify(el.value);
      }
    });
    this.blog.on($id('blogWsSlug'), 'input', () => { this.wsSlugTouched = true; });

    this.blog.on($id('blogWsExcerpt'), 'input', () => this.updateExcerptCount());
    this.blog.on($id('blogWsMetaTitle'), 'input', () => this.updateMetaCounts());
    this.blog.on($id('blogWsMetaDesc'), 'input', () => this.updateMetaCounts());

    this.blog.on($id('blogWsTagInput'), 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addChip($id('blogWsTagChips'), (e.target as HTMLInputElement).value);
        (e.target as HTMLInputElement).value = '';
      }
    });
    this.blog.on($id('blogWsTagAddBtn'), 'click', () => {
      const input = $id('blogWsTagInput') as HTMLInputElement | null;
      if (!input) return;
      addChip($id('blogWsTagChips'), input.value);
      input.value = '';
    });

    this.blog.on($id('blogWsContentHtml'), 'input', () => {
      const body = $id('blogWsContent');
      if (body) setRteHtml(body, ($id('blogWsContentHtml') as HTMLTextAreaElement).value);
    });
  }

  openAdd() {
    this.bind();
    this.wsOpenMode = 'add';
    this.blog.currentEditId = null;
    this.resetForm();
    this.blog._populateCategorySelects();
    this.syncCategorySelect();
    this.setEditorMode('visual');
    this.show();
    $id('paBlogWsHeadTitleText')!.textContent = 'Add New Post';
    $id('paBlogWsHeadSubtitle')!.textContent = 'Create a new article for your portfolio';
    $id('paBlogWsDeleteBtn')!.setAttribute('hidden', '');
    setTimeout(() => $id('blogWsTitle')?.focus(), 420);
  }

  open(id: string | number, mode: WsOpenMode = 'edit') {
    this.bind();
    const record = this.blog.findById(id);
    if (!record) {
      this.blog.toast('Post not found', 'danger');
      return;
    }
    this.wsOpenMode = mode === 'preview' ? 'preview' : 'edit';
    this.blog.currentEditId = id;
    this.blog._populateCategorySelects();
    this.syncCategorySelect();
    this.populateForm(record);
    this.setEditorMode(mode === 'preview' ? 'preview' : 'visual');
    this.show();
    $id('paBlogWsHeadTitleText')!.textContent = 'Edit Post';
    $id('paBlogWsHeadSubtitle')!.textContent = record.slug ? `/${record.slug}` : 'Update content and publishing settings';
    $id('paBlogWsDeleteBtn')?.removeAttribute('hidden');
    if (mode !== 'preview') setTimeout(() => $id('blogWsTitle')?.focus(), 420);
  }

  close() {
    const body = $id('paBlogBody');
    const ws = $id('paBlogWorkspace');
    if (!body || !ws) return;
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    if (!ws.classList.contains('is-open')) {
      this.finishClose();
      return;
    }
    if (this.closing) return;
    this.closing = true;
    ws.classList.add('is-closing');
    ws.classList.remove('is-open');
    body.classList.remove('pa-blog-page-body--editing');
    const finish = () => {
      if (!this.closing) return;
      this.finishClose();
    };
    ws.addEventListener('transitionend', (e) => {
      if (e.target === ws) finish();
    }, { once: true });
    this.closeTimer = window.setTimeout(finish, 520);
  }

  private finishClose() {
    const ws = $id('paBlogWorkspace');
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    this.closing = false;
    if (ws) {
      ws.classList.remove('is-closing');
      ws.setAttribute('aria-hidden', 'true');
    }
    this.wsImageData = null;
  }

  private show() {
    const body = $id('paBlogBody');
    const ws = $id('paBlogWorkspace');
    if (!body || !ws) return;
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    this.closing = false;
    ws.classList.remove('is-closing');
    body.classList.add('pa-blog-page-body--editing');
    ws.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ws.classList.add('is-open');
      });
    });
    body.scrollTo?.(0, 0);
  }

  private syncCategorySelect() {
    const sorted = this.blog._blogCategories || [];
    const options = sorted
      .map((c) => `<option value="${escapeHtml(c.key)}">${escapeHtml(c.label)}</option>`)
      .join('');
    const select = $id('blogWsCategory');
    if (!select) return;
    select.innerHTML = '<option value="">Select category</option>' + options;
    syncPaSelect(select);
  }

  resetForm() {
    this.wsSlugTouched = false;
    this.wsImageData = null;
    ['blogWsTitle', 'blogWsSlug', 'blogWsExcerpt', 'blogWsImageAlt', 'blogWsSortOrder', 'blogWsMetaTitle', 'blogWsMetaDesc'].forEach((id) => {
      const el = $id(id);
      if (el) el.value = '';
    });
    $id('blogWsContent')!.innerHTML = '';
    ($id('blogWsContentHtml') as HTMLTextAreaElement).value = '';
    $id('blogWsTagChips')!.innerHTML = '';
    ($id('blogWsTagInput') as HTMLInputElement).value = '';
    $id('blogWsStatus')!.value = 'Draft';
    $id('blogWsFeatured')!.value = '0';
    $id('blogWsPublishedDate')!.value = new Date().toISOString().slice(0, 10);
    this.blog.setFeaturedPreview('blogWs', null);
    this.updateTitleCount();
    this.updateExcerptCount();
    this.updateMetaCounts();
    this.clearFieldErrors();
  }

  populateForm(p: Record<string, unknown>) {
    this.wsSlugTouched = true;
    ($id('blogWsTitle') as HTMLInputElement).value = String(p.title || '');
    ($id('blogWsSlug') as HTMLInputElement).value = String(p.slug || '');
    ($id('blogWsCategory') as HTMLSelectElement).value = String(p.category || '');
    syncPaSelect($id('blogWsCategory'));
    ($id('blogWsExcerpt') as HTMLTextAreaElement).value = String(p.excerpt || '');
    setRteHtml($id('blogWsContent')!, String(p.content || ''));
    ($id('blogWsContentHtml') as HTMLTextAreaElement).value = String(p.content || '');
    populateChips($id('blogWsTagChips'), Array.isArray(p.tags) ? p.tags : []);
    ($id('blogWsImageAlt') as HTMLInputElement).value = String(p.imageAlt || '');
    ($id('blogWsStatus') as HTMLSelectElement).value = String(p.status || 'Draft');
    syncPaSelect($id('blogWsStatus'));
    ($id('blogWsFeatured') as HTMLSelectElement).value = p.featured ? '1' : '0';
    syncPaSelect($id('blogWsFeatured'));
    ($id('blogWsPublishedDate') as HTMLInputElement).value = String(p.publishedAt || new Date().toISOString().slice(0, 10));
    ($id('blogWsSortOrder') as HTMLInputElement).value = p.sortOrder != null ? String(p.sortOrder) : '';
    ($id('blogWsMetaTitle') as HTMLInputElement).value = String(p.metaTitle || '');
    ($id('blogWsMetaDesc') as HTMLTextAreaElement).value = String(p.metaDesc || '');
    this.wsImageData = (p.imageUrl as string) || null;
    this.blog.setFeaturedPreview('blogWs', this.wsImageData, String(p.imageAlt || ''));
    this.updateTitleCount();
    this.updateExcerptCount();
    this.updateMetaCounts();
    this.clearFieldErrors();
  }

  setEditorMode(mode: WsEditorMode) {
    this.syncVisualFromActiveEditor();
    this.wsEditorMode = mode;

    $all('#paBlogWsModeToggle .pa-view-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-ws-mode') === mode);
    });

    const editorPane = $id('paBlogWsEditorPane');
    const previewPane = $id('paBlogWsPreviewPane');
    const rteWrap = $id('blogWsRteWrap');
    const htmlTa = $id('blogWsContentHtml') as HTMLTextAreaElement;
    const body = $id('blogWsContent');

    if (mode === 'preview') {
      if (editorPane) editorPane.hidden = true;
      if (previewPane) previewPane.hidden = false;
      const html = getRteHtml(body);
      const preview = $id('paBlogWsPreviewContent');
      if (preview) preview.innerHTML = html;
      return;
    }

    if (previewPane) previewPane.hidden = true;
    if (editorPane) editorPane.hidden = false;

    if (mode === 'text') {
      if (rteWrap) rteWrap.hidden = true;
      if (htmlTa) {
        htmlTa.hidden = false;
        htmlTa.value = getRteHtml(body);
      }
    } else {
      if (rteWrap) rteWrap.hidden = false;
      if (htmlTa) htmlTa.hidden = true;
      if (body && htmlTa) setRteHtml(body, htmlTa.value);
    }
  }

  private syncVisualFromActiveEditor() {
    if (this.wsEditorMode === 'text') {
      const body = $id('blogWsContent');
      const htmlTa = $id('blogWsContentHtml') as HTMLTextAreaElement;
      if (body && htmlTa) setRteHtml(body, htmlTa.value);
    }
  }

  private updateTitleCount() {
    const el = $id('blogWsTitle') as HTMLInputElement | null;
    const count = $id('blogWsTitleCount');
    if (el && count) count.textContent = `${el.value.length}/100`;
  }

  private updateExcerptCount() {
    const el = $id('blogWsExcerpt') as HTMLTextAreaElement | null;
    const count = $id('blogWsExcerptCount');
    if (el && count) count.textContent = String(el.value.length);
  }

  private updateMetaCounts() {
    const title = $id('blogWsMetaTitle') as HTMLInputElement | null;
    const desc = $id('blogWsMetaDesc') as HTMLTextAreaElement | null;
    if (title) $id('blogWsMetaTitleCount')!.textContent = String(title.value.length);
    if (desc) $id('blogWsMetaDescCount')!.textContent = String(desc.value.length);
  }

  private clearFieldErrors() {
    ['Title', 'Slug', 'Category', 'Excerpt', 'Content'].forEach((f) => {
      $id(`blogWs${f}Error`)?.classList.remove('visible');
      $id(f === 'Content' ? 'blogWsRteWrap' : `blogWs${f}`)?.classList.remove('error');
    });
  }

  getWsImageData() {
    return this.wsImageData;
  }

  setWsImageData(url: string | null) {
    this.wsImageData = url;
  }

  async saveAsDraft() {
    ($id('blogWsStatus') as HTMLSelectElement).value = 'Draft';
    syncPaSelect($id('blogWsStatus'));
    await this.save();
  }

  async publishNow() {
    ($id('blogWsStatus') as HTMLSelectElement).value = 'Published';
    syncPaSelect($id('blogWsStatus'));
    await this.save();
  }

  async save() {
    this.syncVisualFromActiveEditor();
    const f = this.blog.validateForm('ws');
    if (!f.valid) return;

    const btn = $id('paBlogWsSaveBtn');
    btn?.classList.add('loading');
    try {
      if (this.wsOpenMode === 'add') {
        const newPost = this.blog.buildNewRecord(f);
        newPost.id = this.blog.nextId++;
        newPost.metaTitle = ($id('blogWsMetaTitle') as HTMLInputElement).value.trim();
        newPost.metaDesc = ($id('blogWsMetaDesc') as HTMLTextAreaElement).value.trim();
        const records = [...this.blog.store.get('records'), newPost];
        this.blog.store.set('records', records);
        await this.blog.persist();
        this.blog.render();
        this.blog.toast('Blog post added', 'success');
        this.blog.notify(`New blog post "${newPost.title}" was added.`, 'ri-article-line');
        this.close();
      } else {
        const record = this.blog.findById(this.blog.currentEditId!);
        if (!record) return;
        this.blog.applyEditToRecord(record, f);
        record.metaTitle = ($id('blogWsMetaTitle') as HTMLInputElement).value.trim();
        record.metaDesc = ($id('blogWsMetaDesc') as HTMLTextAreaElement).value.trim();
        await this.blog.persist();
        this.blog.render();
        this.blog.toast('Blog post saved', 'success');
        $id('paBlogWsHeadSubtitle')!.textContent = record.slug ? `/${record.slug}` : '';
      }
    } catch {
      this.blog.toast('Could not save changes', 'danger');
    } finally {
      btn?.classList.remove('loading');
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
