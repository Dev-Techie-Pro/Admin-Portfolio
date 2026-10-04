import{escapeHtml as e}from"./dom.js";import{normalizeCategoryKey as I}from"./categoryClassOptions.js";import{closeListRow as P,renderListDateCell as B,renderListEditDeleteActions as V,renderListIconProjectCell as K,renderListIndexCell as M,renderListRowStart as j,renderListStatusCell as R,renderListTextCell as T}from"./listDataTable.js";function q(s,a,t={}){const l=e(String(a)),r=e(t.title||"View"),i=e(t.ariaLabel||t.title||"View");return`<button type="button" class="pa-action-btn pa-action-view pa-cat-card__view-btn${t.extraClasses?` ${t.extraClasses}`:""}" ${s}="${l}" title="${r}" aria-label="${i}"><i class="ri-eye-line"></i></button>`}function G(s){const{idAttr:a,id:t,catKey:l="",cardClass:r="",bulkCheckbox:i="",iconHtml:o,badge:_="",title:$,slug:u,desc:p="",countIcon:b="ri-file-list-line",countLabel:L,status:g="Active",dateLabel:w="Created",dateValue:h="\u2014",viewBtn:d=null,menuHtml:v}=s,n=e(String(t)),c=e($),f=e(u),m=e(I(l)),C=p?e(p):'<em class="pa-cat-card__desc-empty">No description</em>',y=e(L),x=e(g),H=e(w),A=e(h),D=d?q(a,t,{title:d.label,ariaLabel:d.ariaLabel||d.label}):"",E=d?`<button type="button" class="pa-cat-card__chevron" ${a}="${n}" aria-label="${e(d.ariaLabel||d.label)}"><i class="ri-arrow-right-s-line"></i></button>`:"",S=["pa-card","pa-cat-card",r].filter(Boolean).join(" "),k=m?` data-cat-key="${m}"`:"";return`<div class="${S}" ${a}="${n}"${k}>
    ${i}
    <div class="pa-cat-card__bg" aria-hidden="true"></div>
    <div class="pa-cat-card__grid">
      <div class="pa-cat-card__top justify-between">
        <div class="pa-cat-card__top__head">
          <div class="pa-cat-card__icon">${o}</div>
          <div class="pa-cat-card__top-content">
            <h3 class="pa-cat-card__title" title="${c}">${c}</h3>
            <div class="pa-cat-card__slug"><span class="pa-cat-card__slug-mark" aria-hidden="true">\u25C6</span>${f}</div>
          </div>
        </div>
        ${_}
      </div>
      <p class="pa-cat-card__desc">${C}</p>
      <div class="pa-cat-card__count"><i class="${b}"></i><span>${y}</span></div>
      <div class="pa-cat-card__footer pa-cat-card__footer--solo">
        <div class="pa-cat-card__footer-more">
          ${D}
          <button type="button" class="pa-action-btn pa-action-edit" ${a}="${n}" title="Edit" aria-label="Edit ${c}"><i class="ri-pencil-line"></i></button>
          <button type="button" class="pa-action-btn pa-action-delete" ${a}="${n}" title="Delete" aria-label="Delete ${c}"><i class="ri-delete-bin-line"></i></button>
          <button type="button" class="pa-action-btn pa-action-more" ${a}="${n}" title="More options" aria-label="More options for ${c}"><i class="ri-more-2-fill"></i></button>
          ${v}
        </div>
      </div>
    </div>
    <div class="pa-cat-card__list">
      <div class="pa-cat-card__icon">${o}</div>
      <div class="pa-cat-card__list-main">
        <div class="pa-cat-card__title" title="${c}">${c}</div>
        <div class="pa-cat-card__slug"><span class="pa-cat-card__slug-mark" aria-hidden="true">\u25C6</span>${f}</div>
        <div class="pa-cat-card__desc">${C}</div>
      </div>
      <div class="pa-cat-card__count"><i class="${b}"></i><span>${y}</span></div>
      <div class="pa-cat-card__status">${x}</div>
      <div class="pa-cat-card__date">
        <i class="ri-calendar-line"></i>
        <div class="pa-cat-card__date-copy">
          <span class="pa-cat-card__date-label">${H}</span>
          <span class="pa-cat-card__date-value">${A}</span>
        </div>
      </div>
      <div class="pa-cat-card__list-actions">
        <button type="button" class="pa-action-btn pa-action-edit" ${a}="${n}" title="Edit" aria-label="Edit ${c}"><i class="ri-pencil-line"></i></button>
        <button type="button" class="pa-action-btn pa-action-delete" ${a}="${n}" title="Delete" aria-label="Delete ${c}"><i class="ri-delete-bin-line"></i></button>
        <button type="button" class="pa-action-btn pa-action-more" ${a}="${n}" title="More options" aria-label="More options for ${c}"><i class="ri-more-2-fill"></i></button>
        ${v}
      </div>
      ${E}
    </div>
  </div>`}function J(s){const{rowIndex:a,idAttr:t,id:l,iconHtml:r,title:i,category:o="\u2014",status:_="Active",created:$="\u2014",cardClass:u="",viewBtnHtml:p=""}=s;return`${j(u)}
    ${M(a)}
    ${K(i,r)}
    ${T(o)}
    ${R(_)}
    ${B($)}
    ${V({idAttr:t,id:l,title:i,extraHtml:p})}
  ${P()}`}function O(s,a,t){!s||!t||s.querySelectorAll(".pa-cat-card__view-btn, .pa-cat-card__chevron").forEach(l=>{l.addEventListener("click",r=>{r.stopPropagation();const i=l.getAttribute(a);i!=null&&i!==""&&t(i)})})}export{O as attachPaCatCardViewListeners,G as renderPaCatCard,q as renderPaCatCardViewBtn,J as renderPaCatListRow};
