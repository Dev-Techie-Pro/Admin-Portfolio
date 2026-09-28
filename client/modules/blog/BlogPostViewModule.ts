import { Module } from '../../core/Module.js';
import { escapeHtml, $id } from '../../utils/dom.js';
import { storage } from '../../core/StorageService.js';
import { formatDate } from '../../utils/format.js';
import { setupRte } from '../../utils/rte.js';
import { getBlogPostViewPath, getBlogPostIdFromPath } from '../../core/router.js';

type BlogPost = {
  id: number | string;
  title?: string;
  slug?: string;
  category?: string;
  excerpt?: string;
  content?: string;
  tags?: string[];
  status?: string;
  featured?: boolean;
  imageUrl?: string;
  imageAlt?: string;
  publishedAt?: string;
  createdAt?: string;
};

type BlogCategory = { key: string; label: string };

export class BlogPostViewModule extends Module {
  constructor() {
    super({
      name: 'BlogPostView',
      storageKey: 'pa_blog_posts',
      initialState: {
        mode: 'edit',
        postId: null as string | null,
        dirty: false,
      },
    });
    this._post = null as BlogPost | null;
    this._categories = [] as BlogCategory[];
    this._rteWired = false;
  }

  async load() {
    const postId = getBlogPostIdFromPath();
    this.store.set('postId', postId);
    const [posts, categories] = await Promise.all([
      storage.get('pa_blog_posts', []),
      storage.get('pa_blog_categories', []),
    ]);
    this._categories = Array.isArray(categories) ? categories : [];
    const list = Array.isArray(posts) ? posts : [];
    this._post = list.find((p) => String(p.id) === String(postId)) || null;
  }

  getCategoryLabel(key?: string) {
    const cat = this._categories.find((c) => c.key === key);
    return cat?.label || key || 'Uncategorized';
  }

  render() {
    const empty = $id('paBlogViewEmpty');
    const article = $id('paBlogViewArticle');
    if (!this._post) {
      if (empty) empty.hidden = false;
      if (article) article.hidden = true;
      $id('paBlogViewSaveBtn')?.setAttribute('disabled', 'true');
      return;
    }
    if (empty) empty.hidden = true;
    if (article) article.hidden = false;
    $id('paBlogViewSaveBtn')?.removeAttribute('disabled');

    const p = this._post;
    const subEl = $id('paBlogViewPageSubtitle');
    if (subEl) subEl.textContent = p.slug ? `/${p.slug}` : '';
    document.title = `${p.title || 'Blog post'} — Portfolio Admin`;

    const meta = $id('paBlogViewMeta');
    if (meta) {
      const date = formatDate(p.publishedAt || p.createdAt);
      const status = escapeHtml(p.status || 'Draft');
      const category = escapeHtml(this.getCategoryLabel(p.category));
      const statusClass = p.status === 'Published' ? 'published' : 'draft';
      meta.innerHTML = `<span class="pa-blog-view-meta-item"><i class="ri-calendar-line"></i> ${escapeHtml(date)}</span>
        <span class="pa-blog-view-meta-item"><i class="ri-price-tag-3-line"></i> ${category}</span>
        <span class="pa-proj-card__status pa-proj-card__status--${statusClass} pa-blog-view-status"><span class="pa-proj-card__status-dot"></span>${status}</span>`;
    }

    const titleField = $id('paBlogViewTitle');
    const excerptField = $id('paBlogViewExcerpt');
    const contentField = $id('paBlogViewContent');
    const previewField = $id('paBlogViewPreviewContent');
    if (titleField) titleField.textContent = p.title || '';
    if (excerptField) excerptField.textContent = p.excerpt || '';
    if (contentField) contentField.innerHTML = p.content || '';
    if (previewField) previewField.innerHTML = p.content || '';

    const tagsWrap = $id('paBlogViewTags');
    if (tagsWrap) {
      const tags = Array.isArray(p.tags) ? p.tags : [];
      tagsWrap.innerHTML = tags.length
        ? tags.map((t) => `<span class="pa-proj-tech pa-proj-tech--blue">${escapeHtml(t)}</span>`).join('')
        : '';
    }

    const hero = $id('paBlogViewHero');
    const heroImg = $id('paBlogViewHeroImg') as HTMLImageElement | null;
    if (hero && heroImg) {
      if (p.imageUrl) {
        hero.hidden = false;
        heroImg.src = p.imageUrl;
        heroImg.alt = p.imageAlt || p.title || '';
      } else {
        hero.hidden = true;
        heroImg.removeAttribute('src');
      }
    }

    this.syncModeUi();
  }

  syncModeUi() {
    const mode = this.store.get('mode') || 'edit';
    const isEdit = mode === 'edit';
    $id('paBlogViewEditBtn')?.classList.toggle('active', isEdit);
    $id('paBlogViewPreviewBtn')?.classList.toggle('active', !isEdit);
    $id('paBlogViewEditWrap')?.toggleAttribute('hidden', !isEdit);
    $id('paBlogViewPreviewWrap')?.toggleAttribute('hidden', isEdit);
    $id('paBlogViewRteToolbar')?.toggleAttribute('hidden', !isEdit);

    const editable = isEdit;
    $id('paBlogViewTitle')?.setAttribute('contenteditable', editable ? 'true' : 'false');
    $id('paBlogViewExcerpt')?.setAttribute('contenteditable', editable ? 'true' : 'false');

    if (!isEdit) {
      const preview = $id('paBlogViewPreviewContent');
      const content = $id('paBlogViewContent');
      if (preview && content) preview.innerHTML = content.innerHTML;
      const title = $id('paBlogViewTitle')?.textContent || '';
      document.title = `${title || 'Blog post'} — Portfolio Admin`;
    }
  }

  collectFields() {
    return {
      title: ($id('paBlogViewTitle')?.textContent || '').trim(),
      excerpt: ($id('paBlogViewExcerpt')?.textContent || '').trim(),
      content: $id('paBlogViewContent')?.innerHTML || '',
    };
  }

  markDirty() {
    if (!this.store.get('dirty')) this.store.set('dirty', true);
  }

  async persistPost(updates: Partial<BlogPost>) {
    if (!this._post) return;
    const posts = await storage.get('pa_blog_posts', []);
    const list = Array.isArray(posts) ? [...posts] : [];
    const idx = list.findIndex((p) => String(p.id) === String(this._post!.id));
    if (idx < 0) return;
    Object.assign(list[idx], updates);
    await storage.set('pa_blog_posts', list);
    this._post = list[idx];
    this.store.set('dirty', false);
  }

  async save() {
    if (!this._post) return;
    const fields = this.collectFields();
    if (!fields.title) {
      this.toast('Post title is required', 'danger');
      return;
    }
    if (!fields.content.replace(/<[^>]*>/g, '').trim()) {
      this.toast('Post content is required', 'danger');
      return;
    }
    const btn = $id('paBlogViewSaveBtn');
    btn?.classList.add('loading');
    try {
      await this.persistPost({
        title: fields.title,
        excerpt: fields.excerpt,
        content: fields.content,
      });
      this.render();
      this.toast('Blog post saved', 'success');
      this.notify(`"${fields.title}" was updated.`, 'ri-article-line');
    } catch {
      this.toast('Could not save changes. Please try again.', 'danger');
    } finally {
      btn?.classList.remove('loading');
    }
  }

  bindEvents() {
    if (!this._rteWired) {
      setupRte('paBlogViewRteWrap', 'paBlogViewContent');
      this._rteWired = true;
    }

    this.on($id('paBlogViewEditBtn'), 'click', () => {
      this.store.set('mode', 'edit');
      this.syncModeUi();
    });
    this.on($id('paBlogViewPreviewBtn'), 'click', () => {
      this.store.set('mode', 'preview');
      this.syncModeUi();
    });
    this.on($id('paBlogViewSaveBtn'), 'click', () => { void this.save(); });

    const closeTab = () => { window.close(); };
    this.on($id('paBlogViewCloseBtn'), 'click', closeTab);
    this.on($id('paBlogViewEmptyClose'), 'click', closeTab);

    ['paBlogViewTitle', 'paBlogViewExcerpt', 'paBlogViewContent'].forEach((id) => {
      const el = $id(id);
      if (!el) return;
      this.on(el, 'input', () => this.markDirty());
    });

    this.on(window, 'beforeunload', (e) => {
      if (this.store.get('dirty')) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }
}

/** Opens the standalone editor in a new tab. Returns false if the popup was blocked. */
export function navigateToBlogPostView(id: string | number) {
  const url = getBlogPostViewPath(id);
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  return Boolean(opened);
}
