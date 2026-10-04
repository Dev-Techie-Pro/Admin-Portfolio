import{l as o}from"./chunk-74367365.js";function m(e,s,i){if(s!=="grouped"||typeof i!="function")return e;let c=e.map((n,r)=>({item:n,index:r,info:i(n)||{}}));return c.sort((n,r)=>{let a=String(n.info.title||"").localeCompare(String(r.info.title||""),void 0,{sensitivity:"base"});if(a!==0)return a;let l=String(n.info.key||"").localeCompare(String(r.info.key||""));return l!==0?l:n.index-r.index}),c.map(n=>n.item)}function h(e,s,i){return`${e} ${e===1?s:i}`}function y(e,s,i,c){let n=o(e.title||"Uncategorized"),r=e.subtitle?`<span class="pa-group-heading__sub">${o(e.subtitle)}</span>`:"",a=e.actionHtml||(e.href?`<a class="pa-group-heading__link" href="${o(e.href)}">${o(e.linkLabel||"Open")} <i class="ri-arrow-right-line"></i></a>`:"");return`<div class="pa-group-heading" data-group-key="${o(String(e.key||""))}">
    <div class="pa-group-heading__main">
      <i class="${o(e.icon||"ri-folder-line")}" aria-hidden="true"></i>
      <div class="pa-group-heading__copy">
        <h2 class="pa-group-heading__title">${n}</h2>
        ${r}
      </div>
      <span class="pa-group-heading__count">${o(h(s,i,c))}</span>
    </div>
    ${a}
  </div>`}function k(e,s,i,c,n,r){if(!e.length)return"";let a={};s.forEach(t=>{let d=String(i(t)?.key??"");a[d]=(a[d]||0)+1});let l=[];for(let t of e){let d=i(t)||{key:"",title:"Uncategorized"},u=String(d.key??""),p=l[l.length-1];p&&p.key===u?p.items.push(t):l.push({...d,key:u,items:[t]})}let f=0;return l.map(t=>{let d=y(t,a[t.key]||t.items.length,n,r),u=t.items.map(p=>c(p,f++)).join("");return`${d}${u}`}).join("")}export{m as a,k as b};
