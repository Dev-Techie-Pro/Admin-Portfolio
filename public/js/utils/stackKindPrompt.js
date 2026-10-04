import{escapeHtml as u}from"./dom.js";let e=null;function s(){e?.remove(),e=null}function p(r){const i=String(r||"").trim();return i?new Promise(d=>{s();const t=document.createElement("div");t.className="pa-confirm-overlay visible pa-stack-kind-overlay",t.setAttribute("role","presentation"),t.innerHTML=`
      <div class="pa-confirm-box" role="dialog" aria-modal="true" aria-labelledby="paStackKindTitle">
        <div class="pa-confirm-icon pa-confirm-icon--warning">
          <i class="ri-question-line" aria-hidden="true"></i>
        </div>
        <div class="pa-confirm-title" id="paStackKindTitle">Add "${u(i)}" as</div>
        <div class="pa-confirm-text">This name was not found in Tools or Technologies. Choose where to save it.</div>
        <div class="pa-confirm-actions pa-stack-kind-actions">
          <button type="button" class="pa-btn pa-btn-cancel flex-1" data-stack-kind-cancel>Cancel</button>
          <button type="button" class="pa-btn pa-btn-secondary flex-1" data-stack-kind="tool">Tool</button>
          <button type="button" class="pa-btn pa-btn-primary flex-1" data-stack-kind="technology">Technology</button>
        </div>
      </div>
    `;const o=n=>{s(),d(n)};t.addEventListener("click",n=>{const l=n.target;if(l.closest("[data-stack-kind-cancel]")){o(null);return}const c=l.closest("[data-stack-kind]");if(!c)return;const a=c.getAttribute("data-stack-kind");(a==="tool"||a==="technology")&&o(a)}),document.body.appendChild(t),e=t,t.querySelector('[data-stack-kind="technology"]')?.focus()}):Promise.resolve(null)}export{p as promptStackKind};
