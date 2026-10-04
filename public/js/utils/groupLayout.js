import{escapeHtml as d}from"./dom.js";function m(e,o,i){if(o!=="grouped"||typeof i!="function")return e;const s=e.map((n,r)=>({item:n,index:r,info:i(n)||{}}));return s.sort((n,r)=>{const a=String(n.info.title||"").localeCompare(String(r.info.title||""),void 0,{sensitivity:"base"});if(a!==0)return a;const c=String(n.info.key||"").localeCompare(String(r.info.key||""));return c!==0?c:n.index-r.index}),s.map(n=>n.item)}function h(e,o,i){return`${e} ${e===1?o:i}`}function y(e,o,i,s){const n=d(e.title||"Uncategorized"),r=e.subtitle?`<span class="pa-group-heading__sub">${d(e.subtitle)}</span>`:"",a=e.actionHtml||(e.href?`<a class="pa-group-heading__link" href="${d(e.href)}">${d(e.linkLabel||"Open")} <i class="ri-arrow-right-line"></i></a>`:"");return`<div class="pa-group-heading" data-group-key="${d(String(e.key||""))}">
    <div class="pa-group-heading__main">
      <i class="${d(e.icon||"ri-folder-line")}" aria-hidden="true"></i>
      <div class="pa-group-heading__copy">
        <h2 class="pa-group-heading__title">${n}</h2>
        ${r}
      </div>
      <span class="pa-group-heading__count">${d(h(o,i,s))}</span>
    </div>
    ${a}
  </div>`}function k(e,o,i,s,n,r){if(!e.length)return"";const a={};o.forEach(t=>{const l=String(i(t)?.key??"");a[l]=(a[l]||0)+1});const c=[];for(const t of e){const l=i(t)||{key:"",title:"Uncategorized"},u=String(l.key??""),p=c[c.length-1];p&&p.key===u?p.items.push(t):c.push({...l,key:u,items:[t]})}let f=0;return c.map(t=>{const l=y(t,a[t.key]||t.items.length,n,r),u=t.items.map(p=>s(p,f++)).join("");return`${l}${u}`}).join("")}export{m as arrangeForLayout,h as itemCountLabel,y as renderGroupHeading,k as renderGroupedCards};
