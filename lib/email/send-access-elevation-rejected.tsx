import nodemailer from 'nodemailer';
import {
  THEME,
  buildBrandSignatureHtml,
  escapeHtml,
  ensureEmailRuntimeConfig,
  getBrand,
  getFromAddress,
  getSmtpConfig,
  nl2br,
  normalizeFromEmail,
} from './shared';

export async function sendAccessElevationRejectedEmail({
  to,
  recipientName,
  rejectionNote,
}) {
  await ensureEmailRuntimeConfig();
  const smtp = getSmtpConfig();
  if (!smtp) {
    return { sent: false, reason: 'SMTP is not configured.' };
  }

  const brand = getBrand();
  const from = normalizeFromEmail(getFromAddress(smtp.auth.user));
  const recipient = String(to || '').trim();
  if (!recipient) return { sent: false, reason: 'Recipient email is missing.' };

  const subject = `[${brand.portfolioLabel}] Access request update`;
  const noteBlock = rejectionNote
    ? `<div style="margin-top:16px;padding:16px;border-radius:12px;background:${THEME.quoteBg};border:1px solid ${THEME.border};font-size:14px;color:${THEME.soft};">${nl2br(rejectionNote)}</div>`
    : '';

  const html = `
    <div style="margin:0;padding:0;background:${THEME.bg};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${THEME.bg};padding:32px 16px;">
        <tr><td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:${THEME.card};border:1px solid ${THEME.border};border-radius:16px;">
            <tr><td style="padding:28px;">
              <h1 style="margin:0 0 12px;font-size:22px;color:${THEME.text};">Request not approved</h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:${THEME.soft};">
                Hi ${escapeHtml(recipientName || 'there')}, an administrator reviewed your temporary access request and did not approve it at this time.
                You can contact your admin or submit a new request later from Settings → Security.
              </p>
              ${noteBlock}
            </td></tr>
            <tr><td style="padding:0 28px 28px;border-top:1px solid ${THEME.border};">${buildBrandSignatureHtml(brand)}</td></tr>
          </table>
        </td></tr>
      </table>
    </div>`;

  const text = [
    `Hi ${recipientName || 'there'},`,
    '',
    'Your temporary access request was not approved.',
    rejectionNote ? `Note: ${rejectionNote}` : '',
  ].filter(Boolean).join('\n');

  try {
    const transporter = nodemailer.createTransport(smtp);
    await transporter.sendMail({ from, to: recipient, subject, text, html });
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: error?.message || 'Could not send email.' };
  }
}
