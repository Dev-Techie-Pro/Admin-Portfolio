import{a as L}from"./chunk-G6S4KJEA.js";import{e as g,f as w,h,i as x,j as H,k as A,n as D,o as E}from"./chunk-Q4XJNJYT.js";import{l as t}from"./chunk-74367365.js";function q(s,a,e={}){let l=t(String(a)),r=t(e.title||"View"),i=t(e.ariaLabel||e.title||"View");return`<button type="button" class="pa-action-btn pa-action-view pa-cat-card__view-btn${e.extraClasses?` ${e.extraClasses}`:""}" ${s}="${l}" title="${r}" aria-label="${i}"><i class="ri-eye-line"></i></button>`}function G(s){let{idAttr:a,id:e,catKey:l="",cardClass:r="",bulkCheckbox:i="",iconHtml:o,badge:_="",title:$,slug:u,desc:p="",countIcon:b="ri-file-list-line",countLabel:S,status:k="Active",dateLabel:I="Created",dateValue:P="\u2014",viewBtn:d=null,menuHtml:v}=s,n=t(String(e)),c=t($),f=t(u),m=t(L(l)),C=p?t(p):'<em class="pa-cat-card__desc-empty">No description</em>',y=t(S),B=t(k),V=t(I),K=t(P),M=d?q(a,e,{title:d.label,ariaLabel:d.ariaLabel||d.label}):"",j=d?`<button type="button" class="pa-cat-card__chevron" ${a}="${n}" aria-label="${t(d.ariaLabel||d.label)}"><i class="ri-arrow-right-s-line"></i></button>`:"",R=["pa-card","pa-cat-card",r].filter(Boolean).join(" "),T=m?` data-cat-key="${m}"`:"";return`<div class="${R}" ${a}="${n}"${T}>
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
          ${M}
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
      <div class="pa-cat-card__status">${B}</div>
      <div class="pa-cat-card__date">
        <i class="ri-calendar-line"></i>
        <div class="pa-cat-card__date-copy">
          <span class="pa-cat-card__date-label">${V}</span>
          <span class="pa-cat-card__date-value">${K}</span>
        </div>
      </div>
      <div class="pa-cat-card__list-actions">
        <button type="button" class="pa-action-btn pa-action-edit" ${a}="${n}" title="Edit" aria-label="Edit ${c}"><i class="ri-pencil-line"></i></button>
        <button type="button" class="pa-action-btn pa-action-delete" ${a}="${n}" title="Delete" aria-label="Delete ${c}"><i class="ri-delete-bin-line"></i></button>
        <button type="button" class="pa-action-btn pa-action-more" ${a}="${n}" title="More options" aria-label="More options for ${c}"><i class="ri-more-2-fill"></i></button>
        ${v}
      </div>
      ${j}
    </div>
  </div>`}function J(s){let{rowIndex:a,idAttr:e,id:l,iconHtml:r,title:i,category:o="\u2014",status:_="Active",created:$="\u2014",cardClass:u="",viewBtnHtml:p=""}=s;return`${g(u)}
    ${w(a)}
    ${h(i,r)}
    ${x(o)}
    ${H(_)}
    ${A($)}
    ${D({idAttr:e,id:l,title:i,extraHtml:p})}
  ${E()}`}function O(s,a,e){!s||!e||s.querySelectorAll(".pa-cat-card__view-btn, .pa-cat-card__chevron").forEach(l=>{l.addEventListener("click",r=>{r.stopPropagation();let i=l.getAttribute(a);i!=null&&i!==""&&e(i)})})}export{G as a,J as b,O as c};
