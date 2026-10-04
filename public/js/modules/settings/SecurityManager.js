import{$id as a,escapeHtml as b}from"../../utils/dom.js";import{showToast as n}from"../shell/toast.js";import{addNotification as m}from"../shell/notifications.js";import{authService as d}from"../../core/AuthService.js";import{setupAllPasswordToggles as g}from"../../utils/password-toggle.js";function u(o={}){const e=o.qrCodeSvg||(String(o.qrCode||"").trim().startsWith("<svg")?o.qrCode:""),t=o.qrCode&&!String(o.qrCode).trim().startsWith("<svg")?o.qrCode:"";return{svg:e,dataUrl:t,hasQr:!!(e||t)}}function v(o){const e=a("sec2faQrActions"),t=a("sec2faDownloadQrBtn");e&&(e.hidden=!o),t&&(t.disabled=!o)}function w(o,e={}){if(!o)return;o.hidden=!1,o.classList.remove("pa-sec-2fa-qr--svg"),o.innerHTML="";const{svg:t,dataUrl:s,hasQr:c}=u(e);if(v(c),t){o.classList.add("pa-sec-2fa-qr--svg"),o.innerHTML=t;return}if(s){const l=document.createElement("img");l.src=s,l.alt="Authenticator QR code",l.width=180,l.height=180,o.appendChild(l);return}const i=e.secret||"",r=e.uri||"";o.innerHTML=`
    <div class="pa-sec-2fa-fallback">
      ${i?`<code class="pa-sec-2fa-secret">${b(i)}</code>`:""}
      ${r?'<p class="pa-text-mute fs-sm mt-8">If the QR code does not appear, add this key manually in your authenticator app.</p>':""}
    </div>`}function p(o,e){const t=document.createElement("a");t.href=o,t.download=e,t.rel="noopener",document.body.appendChild(t),t.click(),t.remove()}function h(o){return new Promise((e,t)=>{const s=new Image;s.onload=()=>{const i=document.createElement("canvas");i.width=512,i.height=512;const r=i.getContext("2d");if(!r){t(new Error("Could not create QR image."));return}r.fillStyle="#ffffff",r.fillRect(0,0,512,512),r.drawImage(s,0,0,512,512),i.toBlob(l=>{l?e(l):t(new Error("Could not create QR image."))},"image/png")},s.onerror=()=>t(new Error("Could not load QR image.")),s.src=o})}async function y(o={}){const{svg:e,dataUrl:t,hasQr:s}=u(o);if(!s)throw new Error("No QR code available to download.");const c="authenticator-qr-code.png";if(e){const l=await h(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(e)}`),f=URL.createObjectURL(l);p(f,c),URL.revokeObjectURL(f);return}if(/^data:image\/(?:png|jpe?g|webp)/i.test(t)){p(t,c);return}const i=await h(t),r=URL.createObjectURL(i);p(r,c),URL.revokeObjectURL(r)}class T{constructor({on:e,getProfile:t}){this.on=e,this.getProfile=t,this.state={twoFactorEnabled:!1,factorId:null,backupCodesRemaining:0,pendingEnrollment:null,backupCodes:[]},this._wired=!1,this._enrolling=!1}wireDom(){if(this._wired)return;const e=document.querySelector('.pa-tab-panel[data-content="security"]');if(!e)return;const t=e.querySelector(".pa-badge");t&&!t.id&&(t.id="sec2faStatusBadge");const s=e.querySelector(".pa-backup-codes");s&&!s.id&&(s.id="secBackupCodes"),e.querySelectorAll(".pa-security-card .pa-settings-actions .pa-btn-secondary").forEach(i=>{const r=i.textContent||"";r.includes("Regenerate")&&!i.id&&(i.id="secRegenBackupBtn"),r.includes("Copy Codes")&&!i.id&&(i.id="secCopyBackupBtn")}),e.querySelector("#sec2faModal")?e.querySelector("#sec2faQrActions")||e.querySelector("#sec2faQrWrap")?.insertAdjacentHTML("afterend",`
        <div class="pa-sec-2fa-qr-actions" id="sec2faQrActions" hidden>
          <button type="button" class="pa-btn pa-btn-secondary pa-btn-sm" id="sec2faDownloadQrBtn">
            <i class="ri-download-2-line"></i> Download QR code
          </button>
        </div>`):e.insertAdjacentHTML("beforeend",`
        <div class="pa-confirm-overlay" id="sec2faModal" aria-hidden="true">
          <div class="pa-confirm-box pa-sec-2fa-modal" role="dialog" aria-modal="true" aria-labelledby="sec2faModalTitle">
            <div class="pa-confirm-title" id="sec2faModalTitle">Set up authenticator app</div>
            <div class="pa-confirm-text" id="sec2faModalText">Scan the QR code with your authenticator app, then enter the 6-digit code.</div>
            <div class="pa-sec-2fa-qr-wrap">
              <div class="pa-sec-2fa-qr" id="sec2faQrWrap" hidden></div>
              <div class="pa-sec-2fa-qr-actions" id="sec2faQrActions" hidden>
                <button type="button" class="pa-btn pa-btn-secondary pa-btn-sm" id="sec2faDownloadQrBtn">
                  <i class="ri-download-2-line"></i></button>
              </div>
            </div>
            <div class="pa-form-group mt-12">
              <label class="pa-form-label" for="sec2faCodeInput">Verification code</label>
              <input class="pa-form-input" id="sec2faCodeInput" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="123456" />
            </div>
            <div class="pa-confirm-actions mt-16">
              <button type="button" class="pa-btn pa-btn-cancel flex-1" id="sec2faModalCancel">Cancel</button>
              <button type="button" class="pa-btn pa-btn-primary flex-1" id="sec2faModalConfirm">Verify & Enable</button>
            </div>
          </div>
        </div>
        <div class="pa-confirm-overlay" id="secDisable2faModal" aria-hidden="true">
          <div class="pa-confirm-box" role="dialog" aria-modal="true" aria-labelledby="secDisable2faTitle">
            <div class="pa-confirm-title" id="secDisable2faTitle">Disable two-factor authentication</div>
            <div class="pa-confirm-text">Enter your current password to disable 2FA on this account.</div>
            <div class="pa-form-group mt-12">
              <label class="pa-form-label" for="secDisablePassword">Current password</label>
              <input class="pa-form-input" type="password" id="secDisablePassword" autocomplete="current-password" />
            </div>
            <div class="pa-form-group mt-8">
              <label class="pa-form-label" for="secDisableCode">Authenticator code (optional)</label>
              <input class="pa-form-input" id="secDisableCode" inputmode="numeric" maxlength="8" placeholder="123456" />
            </div>
            <div class="pa-confirm-actions mt-16">
              <button type="button" class="pa-btn pa-btn-cancel flex-1" id="secDisableCancel">Cancel</button>
              <button type="button" class="pa-btn pa-btn-primary pa-red flex-1" id="secDisableConfirm">Disable 2FA</button>
            </div>
          </div>
        </div>
        <div class="pa-confirm-overlay" id="secDeleteAccountModal" aria-hidden="true">
          <div class="pa-confirm-box" role="dialog" aria-modal="true" aria-labelledby="secDeleteAccountTitle">
            <div class="pa-confirm-title" id="secDeleteAccountTitle">Delete account</div>
            <div class="pa-confirm-text">This permanently deletes your account and cannot be undone. Type <strong>DELETE</strong> and enter your password.</div>
            <div class="pa-form-group mt-12">
              <label class="pa-form-label" for="secDeleteConfirmText">Confirmation</label>
              <input class="pa-form-input" id="secDeleteConfirmText" placeholder="DELETE" />
            </div>
            <div class="pa-form-group mt-8">
              <label class="pa-form-label" for="secDeletePassword">Current password</label>
              <input class="pa-form-input" type="password" id="secDeletePassword" autocomplete="current-password" />
            </div>
            <div class="pa-confirm-actions mt-16">
              <button type="button" class="pa-btn pa-btn-cancel flex-1" id="secDeleteCancel">Cancel</button>
              <button type="button" class="pa-btn pa-btn-primary pa-red flex-1" id="secDeleteConfirm">Delete Account</button>
            </div>
          </div>
        </div>`),this._wired=!0,g(e)}bindEvents(){this.wireDom(),this.on(a("setup2faBtn"),"click",()=>{this.startEnrollment()}),this.on(a("disable2faBtn"),"click",()=>this.openModal("secDisable2faModal")),this.on(a("sec2faModalCancel"),"click",()=>this.closeModal("sec2faModal")),this.on(a("secDisableCancel"),"click",()=>this.closeModal("secDisable2faModal")),this.on(a("secDeleteCancel"),"click",()=>this.closeModal("secDeleteAccountModal")),this.on(a("sec2faModalConfirm"),"click",()=>{this.confirmEnrollment()}),this.on(a("sec2faDownloadQrBtn"),"click",()=>{this.downloadEnrollmentQr()}),this.on(a("secDisableConfirm"),"click",()=>{this.disableTwoFactor()}),this.on(a("secRegenBackupBtn"),"click",()=>{this.regenerateBackupCodes()}),this.on(a("secCopyBackupBtn"),"click",()=>this.copyBackupCodes()),this.on(a("deleteAccountBtn"),"click",()=>this.openModal("secDeleteAccountModal")),this.on(a("secDeleteConfirm"),"click",()=>{this.deleteAccount()})}openModal(e){const t=a(e);t&&(t.classList.add("visible"),t.setAttribute("aria-hidden","false"))}closeModal(e){const t=a(e);t&&(t.classList.remove("visible"),t.setAttribute("aria-hidden","true"))}async load(){this.wireDom();try{const e=await d.getSecuritySettings();this.state.twoFactorEnabled=!!e?.mfa?.verified||!!e?.settings?.twoFactorEnabled,this.state.factorId=e?.mfa?.factorId||null,this.state.backupCodesRemaining=e?.backupCodesRemaining||0,this.render()}catch(e){console.warn("[Security] settings load failed:",e)}}render(){const e=a("sec2faStatusBadge"),t=a("setup2faBtn"),s=a("disable2faBtn"),c=a("secBackupCodes"),i=a("secRegenBackupBtn"),r=a("secCopyBackupBtn");e&&(this.state.twoFactorEnabled?(e.className="pa-badge pa-badge--success",e.innerHTML='<i class="ri-check-line"></i> Enabled'):(e.className="pa-badge pa-badge--muted",e.innerHTML='<i class="ri-close-line"></i> Disabled')),t&&(t.textContent="",t.innerHTML=this.state.twoFactorEnabled?'<i class="ri-settings-line"></i> Reconfigure':'<i class="ri-shield-check-line"></i> Enable 2FA'),s&&(s.disabled=!this.state.twoFactorEnabled),c&&(this.state.backupCodes.length?c.innerHTML=this.state.backupCodes.map(l=>`<span>${b(l)}</span>`).join(""):this.state.twoFactorEnabled?c.innerHTML=`<span class="pa-text-mute">${this.state.backupCodesRemaining} unused backup codes on file</span>`:c.innerHTML='<span class="pa-text-mute">Enable 2FA to generate backup codes</span>'),i&&(i.disabled=!this.state.twoFactorEnabled),r&&(r.disabled=!this.state.backupCodes.length)}async startEnrollment(){if(this._enrolling)return;this._enrolling=!0;const e=a("setup2faBtn");e&&(e.disabled=!0);try{const t=await d.enrollMfa();this.state.pendingEnrollment=t;const s=a("sec2faQrWrap"),c=a("sec2faCodeInput");w(s,t),c&&(c.value=""),this.openModal("sec2faModal")}catch(t){n(t.message||"Could not start 2FA setup.","danger")}finally{this._enrolling=!1,e&&(e.disabled=!1)}}async downloadEnrollmentQr(){const e=this.state.pendingEnrollment;if(!e){n("No QR code available to download.","info");return}const t=a("sec2faDownloadQrBtn");t&&(t.disabled=!0);try{await y(e),n("QR code downloaded. Open the image to scan it in your authenticator app.","success")}catch(s){n(s.message||"Could not download QR code.","danger")}finally{t&&u(e).hasQr&&(t.disabled=!1)}}async confirmEnrollment(){const e=a("sec2faCodeInput")?.value?.trim(),t=this.state.pendingEnrollment?.factorId;if(!t||!e){n("Enter the verification code from your authenticator app.","danger");return}try{const s=await d.verifyMfaEnrollment(t,e);this.state.twoFactorEnabled=!0,this.state.factorId=t,this.state.backupCodes=s.backupCodes||[],this.state.backupCodesRemaining=this.state.backupCodes.length,this.state.pendingEnrollment=null,this.closeModal("sec2faModal"),this.render(),n("Two-factor authentication enabled!","success"),m("Two-factor authentication was enabled","ri-shield-check-line",{category:"system_alerts",linkPath:"/settings/security"})}catch(s){n(s.message||"Invalid verification code.","danger")}}async disableTwoFactor(){const e=a("secDisablePassword")?.value||"",t=a("secDisableCode")?.value?.trim()||"";if(!e){n("Enter your current password.","danger");return}try{await d.unenrollMfa({currentPassword:e,code:t}),this.state.twoFactorEnabled=!1,this.state.factorId=null,this.state.backupCodes=[],this.state.backupCodesRemaining=0,this.closeModal("secDisable2faModal"),this.render(),n("Two-factor authentication disabled.","success"),m("Two-factor authentication was disabled","ri-shield-line",{category:"system_alerts",linkPath:"/settings/security"})}catch(s){n(s.message||"Could not disable 2FA.","danger")}}async regenerateBackupCodes(){const e=window.prompt("Enter your current password to regenerate backup codes:");if(e)try{const t=await d.regenerateBackupCodes(e);this.state.backupCodes=t.backupCodes||[],this.state.backupCodesRemaining=this.state.backupCodes.length,this.render(),n("New backup codes generated. Copy and store them safely.","success")}catch(t){n(t.message||"Could not regenerate backup codes.","danger")}}copyBackupCodes(){if(!this.state.backupCodes.length){n("No backup codes to copy. Regenerate codes first.","info");return}const e=this.state.backupCodes.join(`
`);navigator.clipboard?.writeText(e).then(()=>{n("Backup codes copied to clipboard","success")}).catch(()=>{n("Could not copy backup codes","danger")})}async deleteAccount(){const e=a("secDeleteConfirmText")?.value?.trim(),t=a("secDeletePassword")?.value||"";if(e!=="DELETE"){n("Type DELETE to confirm.","danger");return}if(!t){n("Enter your current password.","danger");return}try{await d.deleteAccount({currentPassword:t,confirmText:e}),this.closeModal("secDeleteAccountModal"),n("Account deleted. Redirecting\u2026","info"),window.location.href="/login"}catch(s){n(s.message||"Could not delete account.","danger")}}}export{T as SecurityManager};
