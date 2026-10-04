(function(){const i=`
      <div class="pa-body-loader__veil" aria-hidden="true"></div>
      <div class="pa-body-loader__panel">
        <div class="pa-body-loader__orbit" aria-hidden="true">
          <span class="pa-body-loader__ring"></span>
          <span class="pa-body-loader__ring pa-body-loader__ring--delay"></span>
          <span class="pa-body-loader__core"><i class="ri-database-2-line"></i></span>
        </div>
        <p class="pa-body-loader__label">Loading your data\u2026</p>
        <div class="pa-body-loader__stream" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>
        <div class="pa-body-loader__skeleton" aria-hidden="true">
          <div class="pa-body-loader__skel-card"></div>
          <div class="pa-body-loader__skel-card"></div>
          <div class="pa-body-loader__skel-card"></div>
          <div class="pa-body-loader__skel-card"></div>
        </div>
      </div>`;function o(){return document.body}window.__paEnsureBodyLoader=function(l,e){const d=o();if(!d)return null;let a=document.getElementById("paBodyLoader");a?a.parentElement!==d&&d.appendChild(a):(a=document.createElement("div"),a.className="pa-body-loader",a.id="paBodyLoader",a.setAttribute("role","status"),a.setAttribute("aria-live","polite"),a.innerHTML=i,d.appendChild(a));const s=a.querySelector(".pa-body-loader__label");return e&&s&&(s.textContent=e),l&&(document.body.classList.add("pa-loading-active"),a.classList.remove("is-hiding"),a.classList.add("visible"),a.setAttribute("aria-busy","true")),a}})();
