// @ts-nocheck
import nodemailer from 'nodemailer';
import {
  THEME,
  buildBrandSignatureHtml,
  escapeHtml,
  ensureEmailRuntimeConfig,
  getBrand,
  getFromAddress,
  getLoginUrl,
  getSmtpConfig,
  normalizeFromEmail,
} from './shared';

export async function sendAccessElevationApprovedEmail({
  to,
  recipientName,
  elevatedUntil,
  durationHours,
  dashboardUrl,
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

  const hours = typeof durationHours === 'number' && durationHours > 0 ? durationHours : 3;
  const untilLabel = elevatedUntil
    ? new Date(elevatedUntil).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : `in ${hours} hours`;
  const loginUrl = dashboardUrl || getLoginUrl().replace(/\/login$/, '') || getLoginUrl();
  const subject = `[${brand.portfolioLabel}] Temporary dashboard access approved`;

  const html = `
    <div style="margin:0;padding:0;background:${THEME.bg};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${THEME.bg};padding:32px 16px;">
        <tr><td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:${THEME.card};border:1px solid ${THEME.border};border-radius:16px;">
            <tr><td style="padding:28px;">
              <h1 style="margin:0 0 12px;font-size:22px;color:${THEME.text};">Access approved</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${THEME.soft};">
                Hi ${escapeHtml(recipientName || 'there')}, an administrator approved your request on ${escapeHtml(brand.portfolioLabel)}.
                Your role is <strong style="color:${THEME.text};">editor</strong> for <strong style="color:${THEME.text};">${hours}</strong> hour${hours === 1 ? '' : 's'}, until <strong style="color:${THEME.text};">${escapeHtml(untilLabel)}</strong>, then it reverts automatically.
                User management remains restricted.
              </p>
              <a href="${escapeHtml(loginUrl)}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:${THEME.accent};color:#fff;text-decoration:none;font-size:14px;font-weight:600;">Open dashboard</a>
            </td></tr>
            <tr><td style="padding:0 28px 28px;border-top:1px solid ${THEME.border};">${buildBrandSignatureHtml(brand)}</td></tr>
          </table>
        </td></tr>
      </table>
    </div>`;

  const text = [
    `Hi ${recipientName || 'there'},`,
    '',
    `Your role was set to editor for ${hours} hour(s).`,
    `Access ends: ${untilLabel}`,
    `Open dashboard: ${loginUrl}`,
  ].join('\n');

  try {
    const transporter = nodemailer.createTransport(smtp);
    await transporter.sendMail({ from, to: recipient, subject, text, html });
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: error?.message || 'Could not send email.' };
  }
}
