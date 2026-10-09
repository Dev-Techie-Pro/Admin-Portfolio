// @ts-nocheck
/** Inline project editor — injected into the projects list page. */
export const PROJECT_WORKSPACE_HTML = `
<div class="pa-blog-workspace" id="paProjectWorkspace" aria-hidden="true">
  <header class="pa-blog-ws-head">
    <div class="pa-blog-ws-head-left">
      <button type="button" class="pa-btn pa-btn-cancel pa-btn-icon" id="paProjWsBackBtn" title="Back to projects" aria-label="Back to projects"><i class="ri-arrow-left-line"></i></button>
      <div class="pa-blog-ws-head-titles">
        <h2 class="pa-blog-ws-title" id="paProjWsHeadTitle"><i class="ri-folder-open-line" aria-hidden="true"></i> <span id="paProjWsHeadTitleText">Edit Project</span></h2>
        <p class="pa-blog-ws-subtitle" id="paProjWsHeadSubtitle">Update project details and media</p>
      </div>
    </div>
    <div class="pa-blog-ws-head-actions">
      <div class="pa-view-toggle pa-blog-ws-mode-toggle" role="group" aria-label="Editor mode" id="paProjWsModeToggle">
        <button type="button" class="pa-view-btn active" id="paProjWsEditBtn" data-ws-mode="edit" title="Edit project"><i class="ri-edit-line"></i> Edit</button>
        <button type="button" class="pa-view-btn" id="paProjWsPreviewBtn" data-ws-mode="preview" title="Preview description"><i class="ri-eye-line"></i> Preview</button>
      </div>
      <button type="button" class="pa-btn pa-btn-cancel" id="paProjWsDeleteBtn"><i class="ri-delete-bin-line"></i> Delete</button>
      <button type="button" class="pa-btn pa-btn-primary" id="paProjWsSaveBtn">
        <span class="pa-spinner"></span>
        <span class="pa-btn-label"><i class="ri-save-line"></i> Save changes</span>
      </button>
    </div>
  </header>

  <div class="pa-blog-ws-layout">
    <div class="pa-blog-ws-main">
      <div class="pa-form-group pa-blog-ws-field">
        <label class="pa-form-label" for="projWsTitle">Project Title <span class="pa-form-required">*</span></label>
        <div class="pa-blog-ws-input-wrap">
          <input class="pa-form-input" type="text" id="projWsTitle" maxlength="60" autocomplete="off" placeholder="Enter project title" />
          <span class="pa-blog-ws-char-count" id="projWsTitleCount">0/60</span>
        </div>
        <div class="pa-form-error-msg" id="projWsTitleError"><i class="ri-error-warning-line"></i> Project title is required</div>
      </div>

      <div class="pa-form-group pa-blog-ws-field">
        <label class="pa-form-label" for="projWsCategoryPick">Category / Type <span class="pa-form-required">*</span></label>
        <p class="pa-text-mute fs-sm mb-8">Add every type that applies — e.g. Enterprise Platform and Web Application.</p>
        <div class="pa-tech-input-wrap pa-proj-cat-pick">
          <select class="pa-form-select" id="projWsCategoryPick" aria-label="Pick a category to add">
            <option value="">Select category to add</option>
            <option value="enterprise">Enterprise Platform</option>
            <option value="educational">Educational Platform</option>
            <option value="desktop">Desktop Application</option>
            <option value="medical">Medical System</option>
            <option value="ecommerce">E-Commerce</option>
            <option value="travel">Travel Platform</option>
            <option value="web">Web Application</option>
            <option value="nonprofit">Non Profit Organization</option>
          </select>
          <button class="pa-tech-add-btn" type="button" id="projWsCategoryAddBtn">+ Add</button>
        </div>
        <div class="pa-tech-chips" id="projWsCategoryChips"></div>
        <div class="pa-form-error-msg" id="projWsCategoryError"><i class="ri-error-warning-line"></i> Add at least one category</div>
      </div>

      <div class="pa-form-group pa-blog-ws-field">
        <label class="pa-form-label" for="projWsShortDesc">Short Description <span class="pa-form-required">*</span></label>
        <textarea class="pa-form-textarea" id="projWsShortDesc" maxlength="160" rows="3" placeholder="Shown on project cards"></textarea>
        <div class="pa-char-count"><span id="projWsShortDescCount">0</span>/160</div>
        <div class="pa-form-error-msg" id="projWsShortDescError"><i class="ri-error-warning-line"></i> Short description is required</div>
      </div>

      <div class="pa-form-group pa-blog-ws-field pa-blog-ws-content-field">
        <div class="pa-blog-ws-content-label-row">
          <label class="pa-form-label">Full Description <span class="pa-form-required">*</span></label>
        </div>
        <div class="pa-blog-ws-preview-pane" id="paProjWsPreviewPane" hidden>
          <div class="pa-blog-ws-preview-inner pa-rte-body" id="paProjWsPreviewContent"></div>
        </div>
        <div class="pa-blog-ws-editor-pane" id="paProjWsEditorPane">
          <div class="pa-rte pa-blog-ws-rte" id="projWsRteWrap">
            <div class="pa-rte-toolbar">
              <button class="pa-rte-btn" type="button" data-cmd="bold" title="Bold"><b>B</b></button>
              <button class="pa-rte-btn" type="button" data-cmd="italic" title="Italic"><i class="italic">I</i></button>
              <button class="pa-rte-btn" type="button" data-cmd="underline" title="Underline"><u>U</u></button>
              <span class="pa-rte-divider"></span>
              <button class="pa-rte-btn" type="button" data-cmd="insertUnorderedList" title="Bullet list"><i class="ri-list-unordered"></i></button>
              <button class="pa-rte-btn" type="button" data-cmd="insertOrderedList" title="Numbered list"><i class="ri-list-ordered"></i></button>
              <button class="pa-rte-btn" type="button" data-cmd="justifyLeft" title="Align left"><i class="ri-align-left"></i></button>
              <span class="pa-rte-divider"></span>
              <button class="pa-rte-btn" type="button" data-cmd="createLink" title="Link"><i class="ri-link"></i></button>
              <button class="pa-rte-btn" type="button" data-cmd="formatBlock" data-value="blockquote" title="Quote"><i class="ri-double-quotes-l"></i></button>
            </div>
            <div class="pa-rte-body" contenteditable="true" id="projWsFullDesc" data-placeholder="Enter full project description…"></div>
          </div>
        </div>
        <div class="pa-form-error-msg" id="projWsFullDescError"><i class="ri-error-warning-line"></i> Full description is required</div>
      </div>
    </div>

    <aside class="pa-blog-ws-sidebar" aria-label="Project settings">
      <section class="pa-blog-ws-panel is-collapsed" data-ws-panel data-pa-collapse data-pa-collapse-inverted data-pa-collapse-class="is-collapsed">
        <button type="button" class="pa-blog-ws-panel-head pa-collapse-trigger" data-ws-panel-toggle data-pa-collapse-trigger aria-expanded="true">
          <span class="pa-blog-ws-panel-head-left"><i class="ri-settings-3-line"></i> Status &amp; visibility</span>
          <i class="ri-arrow-down-s-line pa-blog-ws-panel-chevron" aria-hidden="true"></i>
        </button>
        <div class="pa-blog-ws-panel-body pa-collapse-panel" data-pa-collapse-panel>
          <div class="pa-form-group">
            <label class="pa-form-label" for="projWsStatus">Project Status</label>
            <select class="pa-form-select" id="projWsStatus">
              <option>Completed</option>
              <option>In Progress</option>
              <option>Pending</option>
              <option>On Hold</option>
              <option>Cancelled</option>
            </select>
          </div>
          <div class="pa-form-group">
            <label class="pa-form-label" for="projWsFeatured">Featured Project</label>
            <select class="pa-form-select" id="projWsFeatured">
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>
          <div class="pa-form-group">
            <label class="pa-form-label" for="projWsSortOrder">Sort order</label>
            <input class="pa-form-input" type="number" min="0" id="projWsSortOrder" placeholder="0" />
          </div>
        </div>
      </section>

      <section class="pa-blog-ws-panel is-collapsed" data-ws-panel data-pa-collapse data-pa-collapse-inverted data-pa-collapse-class="is-collapsed">
        <button type="button" class="pa-blog-ws-panel-head pa-collapse-trigger" data-ws-panel-toggle data-pa-collapse-trigger aria-expanded="true">
          <span class="pa-blog-ws-panel-head-left"><i class="ri-stack-line"></i> Stack &amp; tags</span>
          <i class="ri-arrow-down-s-line pa-blog-ws-panel-chevron" aria-hidden="true"></i>
        </button>
        <div class="pa-blog-ws-panel-body pa-collapse-panel" data-pa-collapse-panel>
          <div class="pa-form-group">
            <label class="pa-form-label">Tools &amp; Technologies <span class="pa-form-required">*</span></label>
            <div class="pa-tech-suggest">
              <div class="pa-tech-input-wrap">
                <input class="pa-tech-input" type="text" placeholder="Search tools and technologies…" id="projWsTechInput" autocomplete="off" />
                <button class="pa-tech-add-btn" type="button" id="projWsTechAddBtn">+ Add</button>
              </div>
              <div class="pa-tech-suggest-list" id="projWsTechSuggestList" role="listbox" hidden></div>
            </div>
            <div class="pa-tech-chips" id="projWsTechChips"></div>
            <div class="pa-form-error-msg" id="projWsTechError"><i class="ri-error-warning-line"></i> Add at least one tool or technology</div>
          </div>
          <div class="pa-form-group">
            <label class="pa-form-label">Tags</label>
            <div class="pa-tech-input-wrap">
              <input class="pa-tech-input" type="text" placeholder="Add tags…" id="projWsTagInput" />
              <button class="pa-tech-add-btn" type="button" id="projWsTagAddBtn">+ Add</button>
            </div>
            <div class="pa-tech-chips" id="projWsTagChips"></div>
          </div>
        </div>
      </section>

      <section class="pa-blog-ws-panel is-collapsed" data-ws-panel data-pa-collapse data-pa-collapse-inverted data-pa-collapse-class="is-collapsed">
        <button type="button" class="pa-blog-ws-panel-head pa-collapse-trigger" data-ws-panel-toggle data-pa-collapse-trigger aria-expanded="true">
          <span class="pa-blog-ws-panel-head-left"><i class="ri-image-add-line"></i> Media</span>
          <i class="ri-arrow-down-s-line pa-blog-ws-panel-chevron" aria-hidden="true"></i>
        </button>
        <div class="pa-blog-ws-panel-body pa-collapse-panel" data-pa-collapse-panel>
          <div class="pa-form-group">
            <div class="pa-form-label-row">
              <label class="pa-form-label">Featured image</label>
              <button type="button" class="pa-btn pa-btn-cancel pa-btn-sm" id="projWsFeaturedPickBtn"><i class="ri-image-add-line"></i> Media library</button>
            </div>
            <div class="pa-media-upload" id="projWsMediaUpload">
              <i class="ri-upload-cloud-2-line"></i>
              <div class="pa-media-upload-text">Upload images or drag &amp; drop</div>
              <div class="pa-media-upload-hint">PNG, JPG, WebP up to 5MB</div>
              <input type="file" id="projWsFeaturedFile" accept="image/png,image/jpeg,image/webp" />
            </div>
            <div id="projWsFeaturedPreviewWrap"></div>
          </div>
          <div class="pa-form-group">
            <label class="pa-form-label" for="projWsImageUrl">Image URL (optional)</label>
            <input class="pa-form-input" type="url" id="projWsImageUrl" placeholder="https://…" />
          </div>
          <div class="pa-form-group">
            <div class="pa-form-label-row">
              <label class="pa-form-label">Gallery images</label>
              <button type="button" class="pa-btn pa-btn-cancel pa-btn-sm" id="projWsGalleryPickBtn"><i class="ri-image-add-line"></i> Media library</button>
            </div>
            <div class="pa-media-upload" id="projWsGalleryUpload">
              <i class="ri-gallery-line"></i>
              <div class="pa-media-upload-text">Upload multiple screenshots</div>
              <div class="pa-media-upload-hint">PNG, JPG, WebP up to 5MB each</div>
              <input type="file" id="projWsGalleryFile" accept="image/png,image/jpeg,image/webp" multiple />
            </div>
            <div class="pa-gallery-grid" id="projWsGalleryGrid"></div>
          </div>
        </div>
      </section>

      <section class="pa-blog-ws-panel is-collapsed" data-ws-panel data-pa-collapse data-pa-collapse-inverted data-pa-collapse-class="is-collapsed">
        <button type="button" class="pa-blog-ws-panel-head pa-collapse-trigger" data-ws-panel-toggle data-pa-collapse-trigger aria-expanded="true">
          <span class="pa-blog-ws-panel-head-left"><i class="ri-link"></i> Links</span>
          <i class="ri-arrow-down-s-line pa-blog-ws-panel-chevron" aria-hidden="true"></i>
        </button>
        <div class="pa-blog-ws-panel-body pa-collapse-panel" data-pa-collapse-panel>
          <div class="pa-form-group">
            <label class="pa-form-label" for="projWsLiveUrl">Live URL</label>
            <input class="pa-form-input" type="url" id="projWsLiveUrl" placeholder="https://example.com" />
          </div>
          <div class="pa-form-group">
            <label class="pa-form-label" for="projWsRepoUrl">GitHub repository</label>
            <input class="pa-form-input" type="url" id="projWsRepoUrl" placeholder="https://github.com/…" />
          </div>
        </div>
      </section>
    </aside>
  </div>
</div>`;
