import{a as p,b as m}from"./chunk-2SHGRAFD.js";import{e as g,f as w,g as L,i as M,j as x,k as C,l as o,m as D,o as S}from"./chunk-Q4XJNJYT.js";import{l as t}from"./chunk-74367365.js";var $={general:"General",projects:"Project Screenshots",avatars:"Avatars & Profile",icons:"Icons & Logos",blog:"Blog Posts",testimonials:"Testimonials",contact:"Contact Attachments"};function b(a){let e=(a.type||"").toLowerCase(),i=(a.name||"").toLowerCase();return e.startsWith("image/")?"image":e.startsWith("video/")?"video":e.includes("pdf")||e.includes("document")||e.includes("msword")||e.includes("spreadsheet")||e.includes("text/")||/\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/i.test(i)?"document":"other"}var F={image:{label:"Image",icon:"ri-image-line",class:"image"},video:{label:"Video",icon:"ri-play-circle-line",class:"video"},document:{label:"PDF",icon:"ri-file-pdf-line",class:"document"},other:{label:"Other",icon:"ri-file-zip-line",class:"other"}};function u(a){let e=b(a),i=F[e];return e==="document"&&!(a.type||"").includes("pdf")&&!/\.pdf$/i.test(a.name||"")?{...i,label:"Document",icon:"ri-file-text-line"}:e==="other"&&/\.(zip|rar|7z)$/i.test(a.name||"")?{...i,label:"ZIP",icon:"ri-file-zip-line"}:i}function z(a){let e=Math.max(0,Math.floor(a)),i=Math.floor(e/60),s=e%60;return`${String(i).padStart(2,"0")}:${String(s).padStart(2,"0")}`}function I(a){if(typeof a.duration=="number"&&a.duration>0)return z(a.duration);let e=(Number(a.id)||1)*13%300;return z(e+45)}function B(a){return a.featured===!0||a.folder==="projects"}function P(a){let e=b(a);if(e==="image"||e==="video"&&a.url)return`<img class="pa-media-card__img" src="${t(a.url)}" alt="${t(a.alt||a.name)}" loading="lazy" />`;let i=u(a);return`<div class="pa-media-card__placeholder pa-media-card__placeholder--${i.class}"><i class="${i.icon}"></i></div>`}function T(a){let e=a.id;return`<div class="pa-card-menu" data-media-id="${e}">
    <div class="pa-card-menu-item" data-action="copy-url" data-media-id="${e}"><i class="ri-links-line"></i> Copy URL</div>
    <div class="pa-card-menu-item" data-action="download" data-media-id="${e}"><i class="ri-download-2-line"></i> Download</div>
    <div class="pa-card-menu-item" data-action="duplicate" data-media-id="${e}"><i class="ri-file-copy-line"></i> Duplicate entry</div>
  </div>`}function U(a){let e=a.id,i=t(a.name);return`<button type="button" class="pa-action-btn pa-action-view" data-media-id="${e}" title="Preview" aria-label="Preview ${i}"><i class="ri-eye-line"></i></button>
    <button type="button" class="pa-action-btn pa-action-edit" data-media-id="${e}" title="Edit details" aria-label="Edit ${i}"><i class="ri-pencil-line"></i></button>
    <button type="button" class="pa-action-btn pa-action-history" data-media-id="${e}" title="File history" aria-label="History for ${i}"><i class="ri-time-line"></i></button>
    <button type="button" class="pa-action-btn pa-action-delete" data-media-id="${e}" title="Delete" aria-label="Delete ${i}"><i class="ri-delete-bin-line"></i></button>`}function j(a){let e=m(a.uploadedAt),i=p(a.size,a.url);return`<div class="pa-media-card__meta-item"><i class="ri-calendar-line" aria-hidden="true"></i><span>${t(e)}</span></div>
    <div class="pa-media-card__meta-item"><i class="ri-download-2-line" aria-hidden="true"></i><span>${t(i)}</span></div>`}function G(a){let e=$[a.folder]||a.folder||"General",i=u(a),s=m(a.uploadedAt),r=p(a.size,a.url),c=a.usageCount>0?`Used \xD7${a.usageCount}`:"Unused";return`<div class="pa-media-card__list-meta-item">
      <i class="ri-calendar-line" aria-hidden="true"></i>
      <span class="pa-media-card__meta-label">Uploaded</span>
      <span class="pa-media-card__meta-value">${t(s)}</span>
    </div>
    <div class="pa-media-card__list-meta-item">
      <i class="ri-database-2-line" aria-hidden="true"></i>
      <span class="pa-media-card__meta-label">Size</span>
      <span class="pa-media-card__meta-value">${t(r)}</span>
    </div>
    <div class="pa-media-card__list-meta-item">
      <i class="${i.icon}" aria-hidden="true"></i>
      <span class="pa-media-card__meta-label">Type</span>
      <span class="pa-media-card__meta-value">${t(i.label)}</span>
    </div>
    <div class="pa-media-card__list-meta-item">
      <i class="ri-links-line" aria-hidden="true"></i>
      <span class="pa-media-card__meta-label">Usage</span>
      <span class="pa-media-card__meta-value">${t(c)}</span>
    </div>`}function V(a,e={}){let{rowIndex:i,cardClass:s=""}=e,r=a.name||"",c=$[a.folder]||a.folder||"General",l=u(a),d=m(a.uploadedAt),_=P(a),n=`${o("pa-action-view","ri-eye-line","Preview","data-media-id",a.id,"Preview")}
    ${o("pa-action-edit","ri-pencil-line","Edit details","data-media-id",a.id,"Edit")}
    ${o("pa-action-history","ri-time-line","File history","data-media-id",a.id,"History for")}
    ${o("pa-action-delete","ri-delete-bin-line","Delete","data-media-id",a.id,"Delete")}`;return`${g(s)}
    ${w(i)}
    ${L(r,_)}
    ${M(c)}
    ${x(l.label,"planning")}
    ${C(d)}
    ${D(n)}
  ${S()}`}function Z(a,e={}){let{selectCheckbox:i="",cardClass:s="",animationDelay:r=0,isSelected:c=!1}=e,l=a.id,d=t(a.name),_=$[a.folder]||a.folder||"General",n=u(a),f=P(a),v=T(a),h=U(a),A=j(a),k=G(a),y=B(a)?'<span class="pa-media-card__featured"><i class="ri-star-fill"></i> FEATURED</span>':"",E=b(a)==="video"?`<span class="pa-media-card__duration">${I(a)}</span>`:"",H=`<span class="pa-media-card__type-badge pa-media-card__type-badge--${n.class}"><i class="${n.icon}"></i> ${t(n.label)}</span>`,R=a.alt?t(a.alt):'<em class="pa-media-card__desc-empty">No alt text set</em>';return`<div class="pa-card pa-media-card${c?" pa-media-card--selected":""}${s}" data-media-id="${l}" style="animation-delay:${r}ms;">
    ${i}
    <div class="pa-media-card__grid">
      <div class="pa-media-card__thumb">
        <div class="pa-media-card__thumb-inner">${f}</div>
        ${H}
        ${E}
        ${y}
        <div class="pa-media-card__thumb-more">
          <button type="button" class="pa-action-btn pa-action-more" data-media-id="${l}" title="More options" aria-label="More options for ${d}"><i class="ri-more-2-fill"></i></button>
          ${v}
        </div>
      </div>
      <div class="pa-media-card__body">
        <h3 class="pa-media-card__name" title="${d}">${d}</h3>
        <div class="pa-media-card__meta-row">${A}</div>
        <div class="pa-media-card__footer">
          <div class="pa-media-card__actions">${h}</div>
          <div class="pa-media-card__footer-more">
            <button type="button" class="pa-action-btn pa-action-more" data-media-id="${l}" title="More options" aria-label="More options for ${d}"><i class="ri-more-2-fill"></i></button>
            ${v}
          </div>
        </div>
      </div>
    </div>
    <div class="pa-media-card__list">
      <div class="pa-media-card__list-thumb">
        <div class="pa-media-card__thumb-inner">${f}</div>
        ${y}
      </div>
      <div class="pa-media-card__list-main">
        <div class="pa-media-card__list-top">
          <div class="pa-media-card__title-block">
            <h3 class="pa-media-card__name" title="${d}">${d}</h3>
            <div class="pa-media-card__folder"><i class="ri-folder-line"></i> ${t(_)}</div>
          </div>
          <div class="pa-media-card__list-more">
            <button type="button" class="pa-action-btn pa-action-more" data-media-id="${l}" title="More options" aria-label="More options for ${d}"><i class="ri-more-2-fill"></i></button>
            ${v}
          </div>
        </div>
        <p class="pa-media-card__desc">${R}</p>
        <div class="pa-media-card__tags">
          <span class="pa-media-card__tag pa-media-card__tag--${n.class}">${t(n.label)}</span>
          <span class="pa-media-card__tag">${t(p(a.size,a.url))}</span>
        </div>
      </div>
      <div class="pa-media-card__list-meta">${k}</div>
      <div class="pa-media-card__list-actions">${h}</div>
    </div>
  </div>`}export{b as a,V as b,Z as c};
