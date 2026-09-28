import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const blogPostPath = path.join(root, 'app/blog-post/bodyHtml.tsx');
const outPath = path.join(root, 'app/blog-post/view/bodyHtml.tsx');

const raw = fs.readFileSync(blogPostPath, 'utf8');
const marker = 'export const BODY_HTML = "';
const start = raw.indexOf(marker) + marker.length;
const end = raw.lastIndexOf('";');
let html = raw.slice(start, end);
html = html
  .replace(/\\n/g, '\n')
  .replace(/\\"/g, '"')
  .replace(/\\\\/g, '\\');

const bodyStart = html.indexOf('id="paBlogBody"');
if (bodyStart < 0) {
  console.error('Could not locate paBlogBody');
  process.exit(1);
}
const bodyOpen = html.lastIndexOf('<div class="pa-body"', bodyStart);
const shellPrefix = html.slice(0, bodyOpen);

const viewMain = `<div class="pa-body" id="paBlogViewBody">
      <div class="pa-header-page pa-blog-view-header">
        <div class="pa-header-page-left">
          <button class="pa-mobile-toggle" id="paMobileToggle" aria-label="Toggle menu"><i class="ri-menu-line"></i></button>
          <a href="/blog-post" class="pa-btn pa-btn-cancel pa-btn-sm pa-blog-view-back" id="paBlogViewBack"><i class="ri-arrow-left-line"></i> All posts</a>
          <div class="pa-header-title-block">
            <span class="pa-header-accent" aria-hidden="true"></span>
            <div class="pa-header-left">
              <div class="pa-page-eyebrow">Blog post</div>
              <div class="pa-page-title" id="paBlogViewPageTitle">View post</div>
              <div class="pa-page-subtitle" id="paBlogViewPageSubtitle">Live edit and preview your article</div>
            </div>
          </div>
        </div>
        <div class="pa-header-page-right pa-blog-view-header-actions">
          <div class="pa-view-toggle pa-blog-view-mode" role="group" aria-label="Editor mode" id="paBlogViewModeToggle">
            <button type="button" class="pa-view-btn active" id="paBlogViewEditBtn" data-mode="edit" title="Live edit" aria-label="Live edit mode"><i class="ri-edit-line"></i> Live edit</button>
            <button type="button" class="pa-view-btn" id="paBlogViewPreviewBtn" data-mode="preview" title="Preview" aria-label="Preview mode"><i class="ri-eye-line"></i> Preview</button>
          </div>
          <button type="button" class="pa-btn pa-btn-primary" id="paBlogViewSaveBtn">
            <span class="pa-spinner"></span>
            <span class="pa-btn-label"><i class="ri-save-line"></i> Save changes</span>
          </button>
        </div>
      </div>

      <div class="pa-blog-view-empty" id="paBlogViewEmpty" hidden>
        <div class="pa-empty-state">
          <i class="ri-article-line"></i>
          <div class="pa-empty-state-title">Post not found</div>
          <div class="pa-empty-state-text">This blog post may have been deleted or the link is invalid.</div>
          <a href="/blog-post" class="pa-empty-state-btn">Back to blog posts</a>
        </div>
      </div>

      <article class="pa-blog-view" id="paBlogViewArticle" aria-live="polite">
        <div class="pa-blog-view-hero" id="paBlogViewHero" hidden>
          <img class="pa-blog-view-hero-img" id="paBlogViewHeroImg" src="" alt="" />
        </div>
        <header class="pa-blog-view-head">
          <div class="pa-blog-view-meta" id="paBlogViewMeta"></div>
          <h1 class="pa-blog-view-title" id="paBlogViewTitle" contenteditable="false"></h1>
          <p class="pa-blog-view-excerpt" id="paBlogViewExcerpt" contenteditable="false"></p>
          <div class="pa-blog-view-tags" id="paBlogViewTags"></div>
        </header>
        <div class="pa-blog-view-edit-wrap" id="paBlogViewEditWrap">
          <div class="pa-rte pa-blog-view-rte" id="paBlogViewRteWrap">
            <div class="pa-rte-toolbar" id="paBlogViewRteToolbar">
              <button class="pa-rte-btn" type="button" data-cmd="bold" title="Bold"><b>B</b></button>
              <button class="pa-rte-btn" type="button" data-cmd="italic" title="Italic"><i class="italic">I</i></button>
              <button class="pa-rte-btn" type="button" data-cmd="underline" title="Underline"><u>U</u></button>
              <span class="pa-rte-divider"></span>
              <button class="pa-rte-btn" type="button" data-cmd="insertUnorderedList" title="Bullet List"><i class="ri-list-unordered"></i></button>
              <button class="pa-rte-btn" type="button" data-cmd="insertOrderedList" title="Numbered List"><i class="ri-list-ordered"></i></button>
              <span class="pa-rte-divider"></span>
              <button class="pa-rte-btn" type="button" data-cmd="createLink" title="Link"><i class="ri-link"></i></button>
              <button class="pa-rte-btn" type="button" data-cmd="formatBlock" data-value="blockquote" title="Quote"><i class="ri-double-quotes-l"></i></button>
            </div>
            <div class="pa-rte-body pa-blog-view-content" contenteditable="true" id="paBlogViewContent" data-placeholder="Write the full article content..."></div>
          </div>
        </div>
        <div class="pa-blog-view-preview-wrap" id="paBlogViewPreviewWrap" hidden>
          <div class="pa-blog-view-preview pa-rte-body" id="paBlogViewPreviewContent"></div>
        </div>
      </article>
    </div>`;

const customPanelStart = html.indexOf('<div class="pa-panel" id="paCustomPanel"');
const suffix = customPanelStart >= 0 ? html.slice(customPanelStart) : '';

const composed = shellPrefix + viewMain + '\n  ' + suffix;

const escaped = composed
  .replace(/\\/g, '\\\\')
  .replace(/"/g, '\\"')
  .replace(/\n/g, '\\n');

const out = `export const BODY_HTML = "${escaped}";\n`;
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out, 'utf8');
console.log('Wrote', outPath);
