class i{constructor(){this._count=0,this._host=null,this._el=null,this._labelEl=null,this._defaultMessage="Loading your data\u2026",this._hideTimer=null,this._showFrame=null,this._EXIT_MS=220}_resolveHost(){return document.body}_findLoader(){return document.getElementById("paBodyLoader")}_ensureOnBody(s){s&&s.parentElement!==document.body&&document.body.appendChild(s)}_cancelShowFrame(){this._showFrame&&(cancelAnimationFrame(this._showFrame),this._showFrame=null)}mount(){if(typeof window.__paEnsureBodyLoader=="function"){this._el=window.__paEnsureBodyLoader(!1),this._host=this._resolveHost(),this._el&&(this._labelEl=this._el.querySelector(".pa-body-loader__label"));return}if(this._host=this._resolveHost(),!this._host)return;const s=this._findLoader();if(s){this._ensureOnBody(s),this._el=s,this._labelEl=s.querySelector(".pa-body-loader__label");return}const e=document.createElement("div");e.className="pa-body-loader",e.id="paBodyLoader",e.setAttribute("role","status"),e.setAttribute("aria-live","polite"),e.setAttribute("aria-busy","true"),e.innerHTML=`
      <div class="pa-body-loader__veil" aria-hidden="true"></div>
      <div class="pa-body-loader__panel">
        <div class="pa-body-loader__orbit" aria-hidden="true">
          <span class="pa-body-loader__ring"></span>
          <span class="pa-body-loader__ring pa-body-loader__ring--delay"></span>
          <span class="pa-body-loader__core"><i class="ri-database-2-line"></i></span>
        </div>
        <p class="pa-body-loader__label">${this._defaultMessage}</p>
        <div class="pa-body-loader__stream" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>
        <div class="pa-body-loader__skeleton" aria-hidden="true">
          <div class="pa-body-loader__skel-card"></div>
          <div class="pa-body-loader__skel-card"></div>
          <div class="pa-body-loader__skel-card"></div>
          <div class="pa-body-loader__skel-card"></div>
        </div>
      </div>
    `,this._host.appendChild(e),this._el=e,this._labelEl=e.querySelector(".pa-body-loader__label")}begin(s){const e=s||this._defaultMessage;typeof window.__paEnsureBodyLoader=="function"?(this._el=window.__paEnsureBodyLoader(!0,e),this._host=this._resolveHost(),this._labelEl=this._el?.querySelector(".pa-body-loader__label")||null):this.mount(),!(!this._host||!this._el)&&(this._cancelShowFrame(),this._hideTimer&&(clearTimeout(this._hideTimer),this._hideTimer=null),e&&this._labelEl&&(this._labelEl.textContent=e),this._count+=1,document.body.classList.add("pa-loading-active"),this._el.classList.remove("is-hiding"),this._el.classList.add("visible"),this._el.setAttribute("aria-busy","true"))}end(){this._el&&(this._count=Math.max(0,this._count-1),this._count===0&&this._hide())}reset(){this._count=0,this._hide()}_hide(){this._cancelShowFrame(),this._host=this._resolveHost(),!(!this._host||!this._el)&&(this._el.classList.add("is-hiding"),this._el.classList.remove("visible"),this._count===0&&document.body.classList.remove("pa-loading-active"),this._labelEl&&(this._labelEl.textContent=this._defaultMessage),this._el.setAttribute("aria-busy","false"),this._hideTimer&&clearTimeout(this._hideTimer),this._hideTimer=setTimeout(()=>{this._el?.classList.remove("is-hiding"),this._hideTimer=null},this._EXIT_MS))}async wrap(s,e){this.begin(e);try{return await s}finally{this.end()}}}const a=new i;export{a as bodyLoader};
