import{Module as f}from"../../core/Module.js";import{$id as n,escapeHtml as c}from"../../utils/dom.js";import{showToast as l}from"../shell/toast.js";import{requestBulkAction as p}from"../shell/confirm.js";function d(i){if(!i)return"\u2014";try{const e=new Date(i);return Number.isNaN(e.getTime())?"\u2014":e.toLocaleString(void 0,{dateStyle:"medium",timeStyle:"short"})}catch{return"\u2014"}}function h(i){const s={pending:{cls:"warning",label:"Pending"},approved:{cls:"success",label:"Approved"},rejected:{cls:"danger",label:"Rejected"}}[i]||{cls:"info",label:i};return`<span class="pa-badge pa-badge--${s.cls}">${c(s.label)}</span>`}class A extends f{constructor(){super({name:"AccessRequests",storageKey:null,initialState:{items:[],filter:"all",loading:!1}})}async load(){await this.fetchList()}async fetchList(){this.store.set("loading",!0);try{const e=await fetch("/api/admin/access-requests",{credentials:"include"}),s=await e.json();if(!e.ok)throw new Error(s.error||"Could not load requests.");this.store.set("items",Array.isArray(s.items)?s.items:[])}catch(e){l(e?.message||"Could not load requests.","danger"),this.store.set("items",[])}finally{this.store.set("loading",!1),this.render()}}filteredItems(){const e=this.store.get("filter"),s=this.store.get("items")||[];return e==="all"?s:s.filter(t=>t.status===e)}render(){const e=n("paAccessRequestsList"),s=n("paAccessRequestsEmpty"),t=n("paAccessRequestsCount");if(!e)return;const a=this.filteredItems();if(t&&(t.textContent=`${a.length} request${a.length===1?"":"s"}`),!a.length){e.innerHTML="",s?.removeAttribute("hidden");return}s?.setAttribute("hidden",""),e.innerHTML=a.map(r=>this.renderCard(r)).join("")}renderCard(e){const s=c(e.requesterName||e.requesterEmail||"Staff"),t=c(String(e.requesterRole||"").replace(/_/g," ")),a=c(e.message||""),r=c(e.contactEmail||""),o=e.status==="pending",u=o?`<div class="pa-access-request-duration">
          <label class="pa-form-label" for="paAccessDuration-${e.id}">Editor role duration</label>
          <div class="pa-access-request-duration-row">
            <select class="pa-form-select" id="paAccessDuration-${e.id}" data-duration-select="${e.id}">
              <option value="1">1 hour</option>
              <option value="3" selected>3 hours</option>
              <option value="6">6 hours</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours</option>
              <option value="custom">Custom\u2026</option>
            </select>
            <input class="pa-form-input pa-access-duration-custom" type="number" min="1" max="72" step="1"
              placeholder="Hours (1\u201372)" data-duration-custom="${e.id}" hidden>
          </div>
        </div>`:"",m=o?`${u}<div class="pa-access-request-actions">
          <button type="button" class="pa-btn pa-btn-primary pa-btn-sm" data-access-approve="${e.id}">
            <i class="ri-check-line"></i> Approve
          </button>
          <button type="button" class="pa-btn pa-btn-cancel pa-btn-sm" data-access-reject="${e.id}">
            <i class="ri-close-line"></i> Reject
          </button>
        </div>`:`<div class="pa-text-mute fs-sm">Reviewed ${d(e.reviewedAt)}</div>`;return`<article class="pa-access-request-card" data-request-id="${e.id}">
      <div class="pa-access-request-head">
        <div>
          <div class="pa-access-request-title">${s}</div>
          <div class="pa-text-mute fs-sm">${t} \xB7 ${r}</div>
        </div>
        ${h(e.status)}
      </div>
      <p class="pa-access-request-message">${a}</p>
      <div class="pa-access-request-meta">
        <span>Submitted ${d(e.createdAt)}</span>
        ${e.durationHours?`<span>Duration: ${e.durationHours}h</span>`:""}
        ${e.elevatedUntil?`<span>Access until ${d(e.elevatedUntil)}</span>`:""}
      </div>
      ${m}
    </article>`}bindEvents(){n("paAccessRequestsRefresh")?.addEventListener("click",()=>{this.fetchList()}),document.querySelectorAll("[data-access-filter]").forEach(s=>{s.addEventListener("click",()=>{const t=s.getAttribute("data-access-filter")||"all";this.store.set("filter",t),document.querySelectorAll("[data-access-filter]").forEach(a=>{const r=a.getAttribute("data-access-filter")===t;a.classList.toggle("active",r),a.setAttribute("aria-selected",r?"true":"false")}),this.render()})});const e=n("paAccessRequestsList");e?.addEventListener("change",s=>{const t=s.target.closest("[data-duration-select]");if(!t)return;const a=t.getAttribute("data-duration-select"),r=e.querySelector(`[data-duration-custom="${a}"]`);if(!r)return;const o=t.value==="custom";r.hidden=!o,o&&r.focus()}),e?.addEventListener("click",s=>{const t=s.target.closest("[data-access-approve], [data-access-reject]");if(!t)return;const a=t.getAttribute("data-access-approve")||t.getAttribute("data-access-reject");a&&(t.hasAttribute("data-access-approve")?this.review(a,"approve"):this.review(a,"reject"))})}getDurationHours(e){const s=n("paAccessRequestsList"),t=s?.querySelector(`[data-duration-select="${e}"]`);if(!t)return 3;if(t.value==="custom"){const r=s?.querySelector(`[data-duration-custom="${e}"]`),o=parseInt(String(r?.value??""),10);if(!Number.isFinite(o)||o<1||o>72)throw new Error("Enter a custom duration between 1 and 72 hours.");return o}const a=parseInt(t.value,10);return Number.isFinite(a)?a:3}review(e,s){if(s==="approve"){let t=3;try{t=this.getDurationHours(e)}catch(r){l(r?.message||"Invalid duration.","danger");return}const a=t===1?"1 hour":`${t} hours`;p({title:"Approve temporary editor role?",message:`The user\u2019s role will change from <strong>viewer</strong> to <strong>editor</strong> for <strong>${a}</strong>, then revert automatically. User management stays restricted.`,confirmLabel:"Approve",danger:!1,iconClass:"ri-check-line",iconTone:"warning",onConfirm:()=>this.patchReview(e,"approve","",t)});return}p({title:"Reject access request?",message:"The requester will be notified by email and in the app.",confirmLabel:"Reject",iconClass:"ri-close-circle-line",onConfirm:()=>{const t=window.prompt("Optional note for the requester:")?.trim()||"";this.patchReview(e,"reject",t)}})}async patchReview(e,s,t,a){try{const r={action:s,rejectionNote:t};s==="approve"&&a!=null&&(r.durationHours=a);const o=await fetch(`/api/admin/access-requests/${encodeURIComponent(e)}`,{method:"PATCH",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)}),u=await o.json();if(!o.ok)throw new Error(u.error||"Request failed.");l(s==="approve"?"Access approved.":"Request rejected.","success"),await this.fetchList()}catch(r){l(r?.message||"Could not update request.","danger")}}}export{A as AccessRequestsModule};
