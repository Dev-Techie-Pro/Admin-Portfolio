import{$id as i}from"../../utils/dom.js";import{authService as r}from"../../core/AuthService.js";const v="v1",y="pa_role_access_briefing",d={editor:{title:"Editor account",subtitle:"You can manage portfolio content and update selected settings.",icon:"ri-edit-box-line",allowed:["View every dashboard and content page","Create, edit, and delete projects, media, blog posts, and other CMS data","Moderate blog comments and likes on the Comments & Likes page","Update General, Notifications, Profile, and Security settings","Use appearance and customization options"],restricted:["User management or adding new staff accounts","System settings and database tools","Admin-only sidebar links stay hidden for your role"]},viewer:{title:"Viewer account",subtitle:"Your access is read-only across the portfolio dashboard.",icon:"ri-eye-line",allowed:["View dashboard stats and all content pages","Browse projects, media, messages, and other records","Update Notifications, Profile, and Security settings","Use appearance and customization options"],restricted:["Create, edit, or delete any content or records","Access the Comments & Likes moderation page","Dashboard add actions, bulk actions, and edit panels","Changing General site settings (view only)","User management and system settings"]}};let u=!1;function p(e,s){return`${y}_${v}_${e}_${s}`}function g(e,s){try{return localStorage.getItem(p(e,s))==="1"}catch{return!1}}function h(e,s){try{localStorage.setItem(p(e,s),"1")}catch{}}function A(e){return(e||"staff").replace(/_/g," ")}function f(e,s){return e.map(t=>`<li class="pa-role-access-item pa-role-access-item--${s}">
      <i class="${s==="allowed"?"ri-check-line":"ri-close-line"}" aria-hidden="true"></i>
      <span>${t}</span>
    </li>`).join("")}function m(){if(i("paRoleAccessOverlay"))return;const e=document.createElement("div");e.className="pa-role-access-overlay",e.id="paRoleAccessOverlay",e.hidden=!0,e.setAttribute("role","dialog"),e.setAttribute("aria-modal","true"),e.setAttribute("aria-labelledby","paRoleAccessTitle"),e.innerHTML=`
    <div class="pa-role-access-box">
      <div class="pa-role-access-head">
        <div class="pa-role-access-icon" id="paRoleAccessIcon" aria-hidden="true">
          <i class="ri-shield-user-line"></i>
        </div>
        <div>
          <div class="pa-role-access-eyebrow" id="paRoleAccessEyebrow">Account access</div>
          <div class="pa-role-access-title" id="paRoleAccessTitle">Your permissions</div>
          <div class="pa-role-access-subtitle" id="paRoleAccessSubtitle"></div>
        </div>
      </div>
      <div class="pa-role-access-body">
        <div class="pa-role-access-section">
          <div class="pa-role-access-section-title allowed"><i class="ri-check-double-line"></i> You can</div>
          <ul class="pa-role-access-list" id="paRoleAccessAllowed"></ul>
        </div>
        <div class="pa-role-access-section">
          <div class="pa-role-access-section-title restricted"><i class="ri-forbid-line"></i> You cannot</div>
          <ul class="pa-role-access-list" id="paRoleAccessRestricted"></ul>
        </div>
      </div>
      <div class="pa-role-access-foot">
        <p class="pa-role-access-note">These limits are enforced in the sidebar, settings, and API. To request a role change, open Settings \u2192 Security and use the "Request role update" form.</p>
        <button type="button" class="pa-btn pa-btn-primary w-100" id="paRoleAccessOk">Got it</button>
      </div>
    </div>`,document.body.appendChild(e)}function b(){if(u)return;u=!0;const e=i("paRoleAccessOverlay"),s=i("paRoleAccessOk");if(!e||!s)return;const t=()=>{e.classList.remove("visible"),e.hidden=!0,document.body.classList.remove("pa-role-access-open"),e.dataset.userId="",e.dataset.role=""};s.addEventListener("click",()=>{const a=e.dataset.userId,o=e.dataset.role;a&&o&&h(a,o),t()}),e.addEventListener("click",a=>{a.target===e&&t()}),document.addEventListener("keydown",a=>{a.key==="Escape"&&e.classList.contains("visible")&&t()})}function R(e){const s=d[e];if(!s)return;const t=i("paRoleAccessIcon"),a=i("paRoleAccessEyebrow"),o=i("paRoleAccessTitle"),c=i("paRoleAccessSubtitle"),n=i("paRoleAccessAllowed"),l=i("paRoleAccessRestricted");t&&(t.innerHTML=`<i class="${s.icon}"></i>`),a&&(a.textContent=`${A(e)} access`),o&&(o.textContent=s.title),c&&(c.textContent=s.subtitle),n&&(n.innerHTML=f(s.allowed,"allowed")),l&&(l.innerHTML=f(s.restricted,"restricted"))}function w(e,s){m(),b();const t=i("paRoleAccessOverlay");t&&(R(s),t.dataset.userId=e,t.dataset.role=s,t.hidden=!1,t.classList.add("visible"),document.body.classList.add("pa-role-access-open"),i("paRoleAccessOk")?.focus())}async function S(e=null){if(typeof window>"u"||window.location.pathname.includes("/login"))return;let s=e?.id,t=e?.role;if(!t||!s)try{const a=await r.session();if(s=s||a?.user?.id,!t){const o=await r.getProfile().catch(()=>null);t=o?.role||a?.user?.role,s=s||o?.id}}catch{return}!s||!t||!d[t]||g(s,t)||requestAnimationFrame(()=>{w(s,t)})}function k(){m(),b()}export{k as initRoleAccessModal,S as maybeShowRoleAccessModal};
