import{escapeHtml as i}from"./dom.js";import{normalizeCategoryKey as A}from"./categoryClassOptions.js";import{formatDate as b}from"./format.js";import{closeListRow as k,listActionBtn as v,renderListActionsCell as H,renderListDateCell as D,renderListIndexCell as P,renderListProjectCell as x,renderListRowStart as E,renderListStatusCell as T,renderListTextCell as O}from"./listDataTable.js";const I={html:"orange",css:"blue",javascript:"yellow",js:"yellow",typescript:"blue",ts:"blue",react:"purple",vue:"green",angular:"red",node:"green","node.js":"green",next:"white","next.js":"white",tailwind:"teal",bootstrap:"purple",sass:"pink",scss:"pink",python:"yellow",django:"green",php:"purple",laravel:"red",mysql:"blue",postgresql:"blue",mongodb:"green",firebase:"yellow",figma:"purple",wordpress:"blue"},w=["orange","blue","yellow","purple","teal","green","pink"];function m(t){const a=(t||"Completed").trim();return a==="Completed"?"published":a==="On Hold"||a==="Cancelled"?"archived":"draft"}function R(t){const a=m(t);return a==="published"?"Published":a==="archived"?"Archived":"Draft"}function S(t){const a=m(t);return a==="published"?"published":a==="archived"?"archived":"draft"}function B(t,a){const e=(t||"").trim().toLowerCase();return`pa-proj-tech--${I[e]||w[a%w.length]}`}const K=3;function M(t,a=K){const e=Array.isArray(t)?t.filter(Boolean):[],l=e.slice(0,a),c=e.slice(a);let o=l.map((r,n)=>`<span class="pa-proj-tech ${B(r,n)}">${i(r)}</span>`).join("");if(c.length>0){const r=i(c.join(", "));o+=`<span class="pa-proj-tech pa-proj-tech--more" title="${r}">+${c.length}</span>`}return o}function U(t){return t.updatedAt||t.createdAt}function V(t){const a=t.id;return`<div class="pa-card-menu" data-id="${a}">
    <div class="pa-card-menu-item" data-action="duplicate" data-id="${a}"><i class="ri-file-copy-line"></i> Duplicate</div>
    <div class="pa-card-menu-item" data-action="copy-link" data-id="${a}"><i class="ri-link"></i> Copy live URL</div>
  </div>`}function q(t){const a=t.id,e=i(t.title);return`<button type="button" class="pa-action-btn pa-action-view" title="View project" data-id="${a}" aria-label="View ${e}"><i class="ri-eye-line"></i></button>
    <button type="button" class="pa-action-btn pa-action-edit" title="Edit project" data-id="${a}" aria-label="Edit ${e}"><i class="ri-pencil-line"></i></button>
    <button type="button" class="pa-action-btn pa-action-duplicate" title="Duplicate project" data-id="${a}" aria-label="Duplicate ${e}"><i class="ri-file-copy-line"></i></button>
    <button type="button" class="pa-action-btn pa-action-delete" title="Delete project" data-id="${a}" aria-label="Delete ${e}"><i class="ri-delete-bin-line"></i></button>`}function z(t){const a=b(t.createdAt),e=b(U(t));return`<div class="pa-proj-card__meta-item">
      <div class="pa-proj-card__meta-item-head">
        <i class="ri-calendar-line" aria-hidden="true"></i>
        <span class="pa-proj-card__meta-label">Created</span>
      </div>
      <span class="pa-proj-card__meta-value">${i(a)}</span>
    </div>
    <div class="pa-proj-card__meta-item">
      <div class="pa-proj-card__meta-item-head">
        <i class="ri-time-line" aria-hidden="true"></i>
        <span class="pa-proj-card__meta-label">Updated</span>
      </div>
      <span class="pa-proj-card__meta-value">${i(e)}</span>
    </div>`}function F(t){const a=(t.status||"Completed").trim();if(a==="Completed")return{label:"Completed",variant:"completed"};if(a==="On Hold")return{label:"On Hold",variant:"hold"};if(a==="In Progress")return{label:"Active",variant:"active"};if(a==="Pending")return{label:"Planning",variant:"planning"};if(a==="Cancelled")return{label:"On Hold",variant:"hold"};const e=m(a);return e==="published"?{label:"Active",variant:"active"}:e==="archived"?{label:"Completed",variant:"completed"}:{label:"Planning",variant:"planning"}}function G(t,a){return t.bannerImgUrl?`<img class="pa-lv-img" src="${i(t.bannerImgUrl)}" alt="" loading="lazy" />`:a}function W(t,a={}){const{meta:e={label:t.catKey,cls:""},thumbHtml:l="",rowIndex:c,cardClass:o=""}=a,r=t.title||"",n=e.label||t.catKey||"\u2014",s=b(t.createdAt),p=F(t),u=G(t,l),d=t.id,_=`${v("pa-action-view","ri-eye-line","View project","data-id",d,"View")}
    ${v("pa-action-edit","ri-pencil-line","Edit project","data-id",d,"Edit")}
    ${v("pa-action-duplicate","ri-file-copy-line","Duplicate project","data-id",d,"Duplicate")}
    ${v("pa-action-delete","ri-delete-bin-line","Delete project","data-id",d,"Delete")}`;return`${E(o)}
    ${P(c)}
    ${x(r,u)}
    ${O(n)}
    ${T(p.label,p.variant)}
    ${D(s)}
    ${H(_)}
  ${k()}`}function X(t,a={}){const{meta:e={label:t.catKey,cls:""},thumbHtml:l,bulkCheckbox:c="",cardClass:o="",animationDelay:r=0}=a,n=t.id,s=i(t.title),p=i(e.label),u=i(t.desc||""),d=R(t.status),_=S(t.status),j=t.featured?'<span class="pa-proj-card__featured"><i class="ri-star-fill"></i> FEATURED</span>':"",$=`<span class="pa-proj-card__status pa-proj-card__status--${_}"><span class="pa-proj-card__status-dot" aria-hidden="true"></span>${i(d)}</span>`,h=Array.isArray(t._techLabels)?t._techLabels:t.technologies||[],f=M(h.length?h:t.tags),g=z(t),y=q(t),C=V(t),L=i(A(t.catKey));return`<div class="pa-card pa-proj-card${o}" data-id="${n}" data-cat-key="${L}" style="animation-delay:${r}ms;">
    ${c}
    <div class="pa-proj-card__grid">
      <div class="pa-proj-card__thumb">
        <div class="pa-proj-card__thumb-inner">${l}</div>
        ${j}
        ${$}
      </div>
      <div class="pa-proj-card__body">
        <div class="pa-proj-card__head">
          <div class="pa-proj-card__title-wrap">
            <span class="pa-proj-card__type-icon" aria-hidden="true"><i class="ri-window-line"></i></span>
            <div class="pa-proj-card__title-block">
              <h3 class="pa-proj-card__title" title="${s}">${s}</h3>
              <div class="pa-proj-card__category"><i class="ri-price-tag-3-line"></i> ${p}</div>
            </div>
          </div>
          <div class="pa-proj-card__head-more">
            <button type="button" class="pa-action-btn pa-action-more" data-id="${n}" title="More options" aria-label="More options for ${s}"><i class="ri-more-2-fill"></i></button>
            ${C}
          </div>
        </div>
        <p class="pa-proj-card__desc">${u}</p>
        <div class="pa-proj-card__tags">${f}</div>
        <div class="pa-proj-card__meta fr-2">${g}</div>
        <div class="pa-proj-card__footer">
          <div class="pa-proj-card__actions">${y}</div>
        </div>
      </div>
    </div>
    <div class="pa-proj-card__list">
      <div class="pa-proj-card__list-thumb">
        <div class="pa-proj-card__thumb-inner">${l}</div>
        ${j}
      </div>
      <div class="pa-proj-card__list-main">
        <div class="pa-proj-card__list-top">
          <div class="pa-proj-card__title-block">
            <h3 class="pa-proj-card__title" title="${s}">${s}</h3>
            <div class="pa-proj-card__category"><i class="ri-price-tag-3-line"></i> ${p}</div>
          </div>
          <div class="pa-proj-card__list-status-wrap">
            ${$}
            <div class="pa-proj-card__list-more">
              <button type="button" class="pa-action-btn pa-action-more" data-id="${n}" title="More options" aria-label="More options for ${s}"><i class="ri-more-2-fill"></i></button>
              ${C}
            </div>
          </div>
        </div>
        <p class="pa-proj-card__desc">${u}</p>
        <div class="pa-proj-card__tags">${f}</div>
      </div>
      <div class="pa-proj-card__list-meta fr-2">${g}</div>
      <div class="pa-proj-card__list-actions">${y}</div>
    </div>
  </div>`}export{K as PROJECT_TAGS_VISIBLE,m as getProjectBucket,S as getProjectStatusClass,R as getProjectStatusLabel,M as projectTechTagsHtml,X as renderPaProjCard,W as renderPaProjListRow};
