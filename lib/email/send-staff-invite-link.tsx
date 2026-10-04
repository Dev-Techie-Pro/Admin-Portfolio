import nodemailer from 'nodemailer';
import {
  THEME,
  buildBrandSignatureHtml,
  escapeHtml,
  ensureEmailRuntimeConfig,
  getBrand,
  getFromAddress,
  getSmtpConfig,
  normalizeFromEmail,
} from './shared';

const ROLE_LABELS: Record<string, string> = {
  editor: 'Editor',
  viewer: 'Viewer',
};

function formatRoleLabel(role: string) {
  return ROLE_LABELS[role] || String(role || 'Staff').replace(/_/g, ' ');
}

export function buildStaffInviteLinkText({
  email,
  role,
  actionLink,
}: {
  email: string;
  role: string;
  actionLink: string;
}) {
  const roleLabel = formatRoleLabel(role);
  const brand = getBrand();
  return [
    'Hi there,',
    '',
    `You have been invited to join the ${brand.name} dashboard as ${roleLabel}.`,
    '',
    'Open this link to accept the invitation and set your password:',
    actionLink,
    '',
    'If you did not expect this invitation, you can ignore this email.',
    '',
    '—',
    brand.name,
  ].join('\n');
}

export function buildStaffInviteLinkHtml({
  email,
  role,
  actionLink,
}: {
  email: string;
  role: string;
  actionLink: string;
}) {
  const brand = getBrand();
  const roleLabel = formatRoleLabel(role);
  const subjectTitle = `Invitation to ${brand.name}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subjectTitle)}</title>
</head>
<body style="margin:0;padding:0;background:${THEME.bg};font-family:Inter,Segoe UI,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${THEME.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${THEME.card};border:1px solid ${THEME.border};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px;color:${THEME.text};font-size:20px;font-weight:700;">
              You're invited
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 20px;color:${THEME.soft};font-size:15px;line-height:1.6;">
              You have been invited to join <strong style="color:${THEME.text};">${escapeHtml(brand.name)}</strong>
              as <strong style="color:${THEME.text};">${escapeHtml(roleLabel)}</strong>.
              Click the button below to accept and set your password.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;">
              <a href="${escapeHtml(actionLink)}" style="display:inline-block;background:${THEME.accent};color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;">
                Accept invitation
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;color:${THEME.mute};font-size:13px;line-height:1.5;word-break:break-all;">
              Or paste this link into your browser:<br />
              <a href="${escapeHtml(actionLink)}" style="color:${THEME.accent};">${escapeHtml(actionLink)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 28px;border-top:1px solid ${THEME.border};">
              ${buildBrandSignatureHtml(brand, brand.email)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendStaffInviteLinkEmail(payload: {
  to: string;
  role: string;
  actionLink: string;
}) {
  await ensureEmailRuntimeConfig();
  const smtp = getSmtpConfig();
  if (!smtp) {
    return {
      sent: false,
      reason: 'SMTP is not configured. Set SMTP in Settings → System → Environment.',
    };
  }

  const to = String(payload.to || '').trim();
  const actionLink = String(payload.actionLink || '').trim();
  const role = String(payload.role || 'editor').trim();

  if (!to || !actionLink) {
    return { sent: false, reason: 'Missing recipient or invite link.' };
  }

  const brand = getBrand();
  const subject = `Invitation to ${brand.name}`;

  try {
    const from = getFromAddress(smtp.auth.user);
    const transporter = nodemailer.createTransport(smtp);
    await transporter.sendMail({
      from: `"${brand.name}" <${normalizeFromEmail(from)}>`,
      to,
      replyTo: normalizeFromEmail(from),
      subject,
      text: buildStaffInviteLinkText({ email: to, role, actionLink }),
      html: buildStaffInviteLinkHtml({ email: to, role, actionLink }),
    });
    return { sent: true, provider: 'smtp' };
  } catch (err) {
    console.error('[email] Failed to send staff invite link:', err);
    return {
      sent: false,
      reason: err instanceof Error ? err.message : 'Failed to send email.',
    };
  }
}
