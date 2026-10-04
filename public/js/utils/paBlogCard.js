import{escapeHtml as e}from"./dom.js";import{formatDate as y}from"./format.js";import{normalizeCategoryKey as L}from"./categoryClassOptions.js";import{closeListRow as A,listActionBtn as C,renderListActionsCell as x,renderListDateCell as H,renderListIndexCell as E,renderListProjectCell as B,renderListRowStart as M,renderListStatusCell as S,renderListTextCell as w}from"./listDataTable.js";function k(a){return(a||"Draft")==="Published"?"published":"draft"}function P(a,t=4){const s=Array.isArray(a)?a:[],i=s.slice(0,t),r=s.length-i.length;let n=i.map(o=>`<span class="pa-proj-tech pa-proj-tech--blue">${e(o)}</span>`).join("");return r>0&&(n+=`<span class="pa-proj-tech pa-proj-tech--more">+${r}</span>`),n}function R(a,t){const s=a.id,i=e(a.title);return`<div class="pa-card-menu" ${t}="${s}">
    <div class="pa-card-menu-item" data-action="duplicate" ${t}="${s}"><i class="ri-file-copy-line"></i> Duplicate</div>
    <div class="pa-card-menu-item" data-action="copy-slug" ${t}="${s}"><i class="ri-links-line"></i> Copy slug URL</div>
  </div>`}function T(a,t){const s=a.id,i=e(a.title);return`<button type="button" class="pa-action-btn pa-action-edit" title="Edit post" ${t}="${s}" aria-label="Edit ${i}"><i class="ri-pencil-line"></i></button>
    <button type="button" class="pa-action-btn pa-action-delete" title="Delete post" ${t}="${s}" aria-label="Delete ${i}"><i class="ri-delete-bin-line"></i></button>`}function I(a){if(!a)return"";const t=[];return a.likes&&t.push(`${a.likes} likes`),a.comments&&t.push(`${a.comments} comments`),a.pending&&t.push(`${a.pending} pending`),t.join(" \xB7 ")}function K(a){if(!a)return"";const t=a.likes??0,s=a.comments??0,i=a.pending??0;if(!t&&!s&&!i)return"";const r=i?`<span class="pa-blog-engagement-pending">${i} pending</span>`:"";return`<div class="pa-proj-card__meta-item">
      <i class="ri-thumb-up-line" aria-hidden="true"></i>
      <span class="pa-proj-card__meta-label">Engagement</span>
      <span class="pa-proj-card__meta-value">${t} likes \xB7 ${s} comments ${r}</span>
    </div>`}function U(a,t){const s=y(a.publishedAt||a.createdAt),i=e(a.slug||"\u2014"),r=Array.isArray(a.tags)?a.tags.length:0;return`<div class="pa-proj-card__meta-item">
      <i class="ri-calendar-line" aria-hidden="true"></i>
      <span class="pa-proj-card__meta-label">Published</span>
      <span class="pa-proj-card__meta-value">${e(s)}</span>
    </div>
    <div class="pa-proj-card__meta-item">
      <i class="ri-link" aria-hidden="true"></i>
      <span class="pa-proj-card__meta-label">Slug</span>
      <span class="pa-proj-card__meta-value">${i}</span>
    </div>
    <div class="pa-proj-card__meta-item">
      <i class="ri-price-tag-3-line" aria-hidden="true"></i>
      <span class="pa-proj-card__meta-label">Tags</span>
      <span class="pa-proj-card__meta-value">${r}</span>
    </div>
    <div class="pa-proj-card__meta-item pa-proj-card__meta-item--demo">
      <i class="ri-article-line" aria-hidden="true"></i>
      <span class="pa-proj-card__meta-label">Status</span>
      <span class="pa-proj-card__meta-value">${e(a.status||"Draft")}</span>
    </div>
    ${K(t)}`}function J(a,t={}){const{meta:s={label:a.category,cls:""},thumbHtml:i="",rowIndex:r,cardClass:n="",idAttr:o="data-blog-id",engagement:l=null}=t,v=a.title||"",d=s.label||a.category||"\u2014",c=I(l),p=c?`${d} \u2014 ${c}`:d,u=y(a.publishedAt||a.createdAt),$=a.status||"Draft",b=k(a.status)==="published"?"active":"planning",_=i||'<i class="ri-article-line"></i>',m=`${C("pa-action-edit","ri-pencil-line","Edit post",o,a.id,"Edit")}
    ${C("pa-action-delete","ri-delete-bin-line","Delete post",o,a.id,"Delete")}`;return`${M(n)}
    ${E(r)}
    ${B(v,_)}
    ${w(p)}
    ${S($,b)}
    ${H(u)}
    ${x(m)}
  ${A()}`}function N(a,t={}){const{meta:s={label:a.category,cls:""},thumbHtml:i,bulkCheckbox:r="",cardClass:n="",animationDelay:o=0,idAttr:l="data-blog-id",engagement:v=null}=t,d=a.id,c=e(a.title),p=e(s.label||a.category||"\u2014"),u=e(a.excerpt||""),$=k(a.status),b=a.status||"Draft",_=a.featured?'<span class="pa-proj-card__featured"><i class="ri-star-fill"></i> FEATURED</span>':"",m=`<span class="pa-proj-card__status pa-proj-card__status--${$}"><span class="pa-proj-card__status-dot" aria-hidden="true"></span>${e(b)}</span>`,j=P(a.tags),g=U(a,v),h=T(a,l),f=R(a,l),D=e(L(s.catKey||a.category));return`<div class="pa-card pa-proj-card pa-blog-card${n}" ${l}="${d}" data-cat-key="${D}" style="animation-delay:${o}ms;">
    ${r}
    <div class="pa-proj-card__grid">
      <div class="pa-proj-card__thumb">
        <div class="pa-proj-card__thumb-inner">${i}</div>
        ${_}
        ${m}
      </div>
      <div class="pa-proj-card__body">
        <div class="pa-proj-card__head">
          <div class="pa-proj-card__title-wrap">
            <span class="pa-proj-card__type-icon" aria-hidden="true"><i class="ri-article-line"></i></span>
            <div class="pa-proj-card__title-block">
              <h3 class="pa-proj-card__title" title="${c}">${c}</h3>
              <div class="pa-proj-card__category"><i class="ri-price-tag-3-line"></i> ${p}</div>
            </div>
          </div>
          <div class="pa-proj-card__head-more">
            <button type="button" class="pa-action-btn pa-action-more" ${l}="${d}" title="More options" aria-label="More options for ${c}"><i class="ri-more-2-fill"></i></button>
            ${f}
          </div>
        </div>
        <p class="pa-proj-card__desc">${u}</p>
        <div class="pa-proj-card__tags">${j}</div>
        <div class="pa-proj-card__meta">${g}</div>
        <div class="pa-proj-card__footer">
          <div class="pa-proj-card__actions">${h}</div>
        </div>
      </div>
    </div>
    <div class="pa-proj-card__list">
      <div class="pa-proj-card__list-thumb">
        <div class="pa-proj-card__thumb-inner">${i}</div>
        ${_}
      </div>
      <div class="pa-proj-card__list-main">
        <div class="pa-proj-card__list-top">
          <div class="pa-proj-card__title-block">
            <h3 class="pa-proj-card__title" title="${c}">${c}</h3>
            <div class="pa-proj-card__category"><i class="ri-price-tag-3-line"></i> ${p}</div>
          </div>
          <div class="pa-proj-card__list-status-wrap">
            ${m}
            <div class="pa-proj-card__list-more">
              <button type="button" class="pa-action-btn pa-action-more" ${l}="${d}" title="More options" aria-label="More options for ${c}"><i class="ri-more-2-fill"></i></button>
              ${f}
            </div>
          </div>
        </div>
        <p class="pa-proj-card__desc">${u}</p>
        <div class="pa-proj-card__tags">${j}</div>
      </div>
      <div class="pa-proj-card__list-meta">${g}</div>
      <div class="pa-proj-card__list-actions">${h}</div>
    </div>
  </div>`}export{k as getBlogStatusClass,N as renderPaBlogCard,J as renderPaBlogListRow};
