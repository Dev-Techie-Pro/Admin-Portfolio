import{isValidUrl as U}from"./strings.js";let e=null,l=null,i=null,a=null,o=null,c=!1;function L(t){const r=String(t||"").trim();return r?/^https?:\/\//i.test(r)?r:`https://${r}`:""}function k(){e||(e=document.createElement("div"),e.className="pa-url-prompt-overlay",e.id="paUrlPromptOverlay",e.innerHTML=`
    <div class="pa-url-prompt-box" role="dialog" aria-modal="true" aria-labelledby="paUrlPromptTitle">
      <div class="pa-url-prompt-icon" aria-hidden="true"><i class="ri-link"></i></div>
      <div class="pa-url-prompt-title" id="paUrlPromptTitle">Insert link</div>
      <p class="pa-url-prompt-sub" id="paUrlPromptSub">Add a web address for the selected text.</p>
      <div class="pa-form-group pa-url-prompt-field">
        <label class="pa-form-label" for="paUrlPromptInput">URL</label>
        <input class="pa-form-input" type="url" id="paUrlPromptInput" placeholder="https://example.com" autocomplete="off" spellcheck="false" inputmode="url" />
        <div class="pa-form-error-msg" id="paUrlPromptError"><i class="ri-error-warning-line"></i> <span>Enter a valid URL starting with https://</span></div>
        <p class="pa-url-prompt-hint">Tip: you can paste a full link or type a domain \u2014 we will add https:// for you.</p>
      </div>
      <div class="pa-url-prompt-actions">
        <button type="button" class="pa-btn pa-btn-cancel" id="paUrlPromptCancel">Cancel</button>
        <button type="button" class="pa-btn pa-btn-danger pa-url-prompt-remove" id="paUrlPromptRemove" style="display:none;">Remove link</button>
        <button type="button" class="pa-btn pa-btn-primary" id="paUrlPromptOk">Insert link</button>
      </div>
    </div>`,document.body.appendChild(e),l=e.querySelector("#paUrlPromptInput"),i=e.querySelector("#paUrlPromptError"),a=e.querySelector("#paUrlPromptRemove"),e.querySelector("#paUrlPromptCancel").addEventListener("click",()=>n(null)),e.querySelector("#paUrlPromptOk").addEventListener("click",()=>m()),a.addEventListener("click",()=>n("")),e.addEventListener("click",t=>{t.target===e&&n(null)}),l.addEventListener("input",()=>{l.classList.remove("error"),i?.classList.remove("visible")}),l.addEventListener("keydown",t=>{t.key==="Enter"&&(t.preventDefault(),m())}),document.addEventListener("keydown",E))}function E(t){e?.classList.contains("visible")&&t.key==="Escape"&&(t.preventDefault(),n(null))}function d(t){const r=i?.querySelector("span");r&&t&&(r.textContent=t),l?.classList.add("error"),i?.classList.add("visible")}function m(){const t=L(l?.value);if(!t){d("URL is required"),l?.focus();return}if(!U(t)){d("Enter a valid URL starting with https://"),l?.focus();return}n(t)}function n(t){e?.classList.remove("visible");const r=o;o=null,r?.(t)}function h(t={}){k(),o&&n(null);const{defaultValue:r="",title:v="Insert link",subtitle:f="Add a web address for the selected text.",confirmLabel:b="Insert link"}=t;c=!!r;const s=e.querySelector("#paUrlPromptTitle"),p=e.querySelector("#paUrlPromptSub"),u=e.querySelector("#paUrlPromptOk");return s&&(s.textContent=v),p&&(p.textContent=f),u&&(u.textContent=b),a&&(a.style.display=c?"":"none"),l.value=r||"https://",l.classList.remove("error"),i?.classList.remove("visible"),new Promise(y=>{o=y,e.classList.add("visible"),requestAnimationFrame(()=>{l?.focus(),l?.select()})})}export{h as promptUrl};
