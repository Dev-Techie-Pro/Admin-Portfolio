// @ts-nocheck
export const STAFF_INVITE_LINK_MODAL_HTML = `<div class="pa-invite-link-overlay" id="paStaffInviteLinkOverlay" aria-hidden="true">
  <div class="pa-invite-link-dialog" role="dialog" aria-modal="true" aria-labelledby="paStaffInviteLinkTitle">
    <button type="button" class="pa-invite-link-close" id="paStaffInviteLinkClose" aria-label="Close"><i class="ri-close-line"></i></button>
    <div class="pa-invite-link-icon"><i class="ri-mail-send-line"></i></div>
    <h2 class="pa-invite-link-title" id="paStaffInviteLinkTitle">Send invitation manually</h2>
    <p class="pa-invite-link-text" id="paStaffInviteLinkHint">Supabase could not send the invitation email (rate limit). Send the link below with your configured SMTP, or copy it for the user.</p>
    <div class="pa-form-group">
      <label class="pa-form-label" for="paStaffInviteLinkEmail">Recipient</label>
      <input class="pa-form-input" id="paStaffInviteLinkEmail" type="email" readonly />
    </div>
    <div class="pa-form-group">
      <label class="pa-form-label" for="paStaffInviteLinkRole">Role</label>
      <input class="pa-form-input" id="paStaffInviteLinkRole" type="text" readonly />
    </div>
    <div class="pa-form-group">
      <label class="pa-form-label" for="paStaffInviteLinkUrl">Invite link</label>
      <input class="pa-form-input pa-invite-link-url-input" id="paStaffInviteLinkUrl" type="url" readonly />
    </div>
    <p class="pa-invite-link-status pa-text-mute fs-sm" id="paStaffInviteLinkStatus" hidden></p>
    <div class="pa-invite-link-actions">
      <button type="button" class="pa-btn pa-btn-secondary flex" id="paStaffInviteLinkCopy"><i class="ri-file-copy-line"></i> Copy link</button>
      <button type="button" class="pa-btn pa-btn-primary flex" id="paStaffInviteLinkSendEmail"><i class="ri-mail-send-line"></i> Send email</button>
    </div>
  </div>
</div>`;
