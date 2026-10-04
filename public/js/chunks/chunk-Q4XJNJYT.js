import{l as s}from"./chunk-74367365.js";var x=[{label:"#",className:"pa-lv-col-num"},{label:"Project",className:"pa-lv-col-project"},{label:"Category"},{label:"Status",className:"pa-lv-col-status"},{label:"Created",className:"pa-lv-col-date"},{label:"Actions",className:"pa-lv-col-actions"}];function g(t){let e=(t||"").trim().toLowerCase();return e==="active"||e==="published"||e==="in progress"?"active":e==="completed"||e==="archived"?"completed":e==="on hold"||e==="inactive"||e==="cancelled"?"hold":"planning"}function h(t,e){return`<div class="pa-lv-shell">
    <div class="pa-lv-scroll">
      <table class="pa-lv-table">
        <thead><tr>${t.map(l=>`<th scope="col" class="${l.className||""}">${s(l.label)}</th>`).join("")}</tr></thead>
        <tbody>${e}</tbody>
      </table>
    </div>
  </div>`}function C(t,e){t&&(t.classList.toggle("list-view",e),t.classList.toggle("pa-lv-mode",e))}function T(t,e){let n=e||document.querySelector(".pa-pagination");n&&n.classList.toggle("pa-pagination--list",t)}function y(t=""){return`<tr class="pa-lv-row${t?` ${t}`:""}">`}function A(t){return`<td class="pa-lv-col-num"><span class="pa-lv-index">${t}</span></td>`}function b(t,e){let n=s(t);return`<td class="pa-lv-col-project">
    <div class="pa-lv-project">
      <div class="pa-lv-thumb" aria-hidden="true"><div class="pa-lv-thumb-inner">${e}</div></div>
      <span class="pa-lv-project-name" title="${n}">${n}</span>
    </div>
  </td>`}function S(t,e){let n=`<div class="pa-lv-icon-thumb">${e}</div>`;return b(t,n)}function m(t,e=""){return`<td class="${e}"><span class="pa-lv-text">${s(t||"\u2014")}</span></td>`}function j(t,e){return`<td class="pa-lv-col-status"><span class="pa-lv-status pa-lv-status--${e||g(t)}">${s(t||"\u2014")}</span></td>`}function N(t){return m(t,"pa-lv-col-date")}function o(t,e,n,l,r,i,a=""){let c=s(String(r)),p=s(n),d=s(i?`${i} ${n}`:n),u=t.includes("delete")?" pa-lv-action--delete":"",v=a?` ${a}`:"";return`<button type="button" class="pa-lv-action pa-action-btn ${t}${u}${v}" ${l}="${c}" title="${s(n)}" aria-label="${d} ${p}"><i class="${e}"></i></button>`}function $(t){return`<td class="pa-lv-col-actions"><div class="pa-lv-actions">${t}</div></td>`}function D(t){let{idAttr:e,id:n,title:l,extraHtml:r=""}=t,i=`${r}
    ${o("pa-action-edit","ri-pencil-line","Edit",e,n,"Edit")}
    ${o("pa-action-delete","ri-delete-bin-line","Delete",e,n,"Delete")}`;return $(i)}function E(){return"</tr>"}export{x as a,h as b,C as c,T as d,y as e,A as f,b as g,S as h,m as i,j,N as k,o as l,$ as m,D as n,E as o};
