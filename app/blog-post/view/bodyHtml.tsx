import { BODY_HTML_PREFIX } from '@/app/bodyHtmlParts';

const STANDALONE_MAIN = `
<div class="pa-blog-view-standalone" id="paBlogViewRoot">
  <header class="pa-blog-view-toolbar" id="paBlogViewToolbar">
    <div class="pa-blog-view-toolbar-left">
      <span class="pa-blog-view-toolbar-label"><i class="ri-article-line"></i> Blog post</span>
      <span class="pa-blog-view-toolbar-slug" id="paBlogViewPageSubtitle"></span>
    </div>
    <div class="pa-blog-view-toolbar-right">
      <div class="pa-view-toggle pa-blog-view-mode" role="group" aria-label="Editor mode" id="paBlogViewModeToggle">
        <button type="button" class="pa-view-btn active" id="paBlogViewEditBtn" data-mode="edit" title="Live edit" aria-label="Live edit mode"><i class="ri-edit-line"></i> Live edit</button>
        <button type="button" class="pa-view-btn" id="paBlogViewPreviewBtn" data-mode="preview" title="Preview" aria-label="Preview mode"><i class="ri-eye-line"></i> Preview</button>
      </div>
      <button type="button" class="pa-btn pa-btn-primary" id="paBlogViewSaveBtn">
        <span class="pa-spinner"></span>
        <span class="pa-btn-label"><i class="ri-save-line"></i> Save changes</span>
      </button>
      <button type="button" class="pa-btn pa-btn-cancel pa-btn-icon" id="paBlogViewCloseBtn" title="Close tab" aria-label="Close tab"><i class="ri-close-line"></i></button>
    </div>
  </header>

  <main class="pa-blog-view-standalone-main" id="paBlogViewBody">
    <div class="pa-blog-view-empty" id="paBlogViewEmpty" hidden>
      <div class="pa-empty-state">
        <i class="ri-article-line"></i>
        <div class="pa-empty-state-title">Post not found</div>
        <div class="pa-empty-state-text">This blog post may have been deleted or the link is invalid.</div>
        <button type="button" class="pa-empty-state-btn" id="paBlogViewEmptyClose">Close tab</button>
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
  </main>
</div>`;

export const BODY_HTML = BODY_HTML_PREFIX + STANDALONE_MAIN;
