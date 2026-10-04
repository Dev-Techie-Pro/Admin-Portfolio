import{$id as a,escapeHtml as s}from"./dom.js";import{formatDate as f,formatFileSize as m}from"./format.js";import{getMediaKind as h}from"./paMediaCard.js";const M={general:"General",projects:"Project Screenshots",avatars:"Avatars & Profile",icons:"Icons & Logos",blog:"Blog Posts",testimonials:"Testimonials",contact:"Contact Attachments"},g={image:"ri-image-line",video:"ri-play-circle-line",document:"ri-file-text-line",other:"ri-file-zip-line"};function b(){const e=a("paMediaPreviewOverlay")?.classList.contains("visible")||a("paMediaHistoryOverlay")?.classList.contains("visible");document.body.classList.toggle("pa-media-modal-open",!!e)}function p(e,i){e&&(e.classList.toggle("visible",i),e.setAttribute("aria-hidden",i?"false":"true"),b())}function c(){p(a("paMediaPreviewOverlay"),!1)}function v(){p(a("paMediaHistoryOverlay"),!1)}function $(){c(),v()}function w(e){const i=h(e);return i==="image"?`<img class="pa-media-preview-img" src="${s(e.url)}" alt="${s(e.alt||e.name)}" />`:i==="video"?`<video class="pa-media-preview-video" src="${s(e.url)}" controls playsinline></video>`:`<div class="pa-media-preview-fallback">
    <i class="${g[i]||"ri-file-line"}"></i>
    <p>Preview not available for this file type.</p>
    <a class="pa-btn pa-btn-primary" href="${s(e.url)}" target="_blank" rel="noopener noreferrer">Open file</a>
  </div>`}function k(e){const i=a("paMediaPreviewOverlay"),n=a("paMediaPreviewTitle"),t=a("paMediaPreviewSub"),l=a("paMediaPreviewBody"),r=a("paMediaPreviewMeta");if(!i||!l)return;v();const y=M[e.folder]||e.folder||"General",d=h(e),u=(e.type||d).replace("image/","").replace("video/","").toUpperCase()||d.toUpperCase();n&&(n.textContent=e.name||"Preview"),t&&(t.textContent=`${y} \xB7 ${u}`),l.innerHTML=w(e),r&&(r.innerHTML=`
      <span><i class="ri-calendar-line"></i> ${s(f(e.uploadedAt))}</span>
      <span><i class="ri-database-2-line"></i> ${s(m(e.size,e.url))}</span>
      ${e.alt?`<span><i class="ri-text"></i> ${s(e.alt)}</span>`:""}`),p(i,!0),a("paMediaPreviewClose")?.focus()}function C(e,i=[]){const n=a("paMediaHistoryOverlay"),t=a("paMediaHistoryTitle"),l=a("paMediaHistorySub"),r=a("paMediaHistoryBody");if(!n||!r)return;c();const y=M[e.folder]||e.folder||"General",d=i.length;t&&(t.textContent="File History"),l&&(l.textContent=e.name||"Media file");const u=d>0?i.map(o=>`
      <a class="pa-media-history-usage-item" href="${s(o.path)}">
        <span class="pa-media-history-usage-icon"><i class="${s(o.icon)}"></i></span>
        <span class="pa-media-history-usage-copy">
          <span class="pa-media-history-usage-type">${s(o.type)}</span>
          <span class="pa-media-history-usage-label">${s(o.label)}</span>
          ${o.detail?`<span class="pa-media-history-usage-detail">${s(o.detail)}</span>`:""}
        </span>
        <i class="ri-arrow-right-s-line pa-media-history-usage-arrow" aria-hidden="true"></i>
      </a>`).join(""):'<div class="pa-media-history-empty"><i class="ri-links-line"></i><p>This file is not linked to any portfolio content yet.</p></div>';r.innerHTML=`
    <div class="pa-media-history-section">
      <div class="pa-media-history-section-title"><i class="ri-time-line"></i> Upload details</div>
      <div class="pa-media-history-timeline">
        <div class="pa-media-history-event">
          <span class="pa-media-history-event-dot" aria-hidden="true"></span>
          <div class="pa-media-history-event-copy">
            <span class="pa-media-history-event-label">Uploaded</span>
            <span class="pa-media-history-event-value">${s(f(e.uploadedAt))}</span>
          </div>
        </div>
        <div class="pa-media-history-event">
          <span class="pa-media-history-event-dot" aria-hidden="true"></span>
          <div class="pa-media-history-event-copy">
            <span class="pa-media-history-event-label">Folder</span>
            <span class="pa-media-history-event-value">${s(y)}</span>
          </div>
        </div>
        <div class="pa-media-history-event">
          <span class="pa-media-history-event-dot" aria-hidden="true"></span>
          <div class="pa-media-history-event-copy">
            <span class="pa-media-history-event-label">File size</span>
            <span class="pa-media-history-event-value">${s(m(e.size,e.url))}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="pa-media-history-section">
      <div class="pa-media-history-section-title"><i class="ri-links-line"></i> Used in (${d})</div>
      <div class="pa-media-history-usage-list">${u}</div>
    </div>`,p(n,!0),a("paMediaHistoryClose")?.focus()}function O(e={}){const i=a("paMediaPreviewOverlay"),n=a("paMediaHistoryOverlay");a("paMediaPreviewClose")?.addEventListener("click",()=>c()),a("paMediaHistoryClose")?.addEventListener("click",()=>v()),i?.addEventListener("click",t=>{t.target===i&&c()}),n?.addEventListener("click",t=>{t.target===n&&v()}),e.onEscape&&document.addEventListener("keydown",t=>{t.key==="Escape"&&(!i?.classList.contains("visible")&&!n?.classList.contains("visible")||(t.preventDefault(),t.stopImmediatePropagation(),$()))},!0)}export{O as bindMediaModalEvents,$ as closeAllMediaModals,v as closeMediaHistoryModal,c as closeMediaPreviewModal,C as openMediaHistoryModal,k as openMediaPreviewModal};
