// @ts-nocheck
import nodemailer from 'nodemailer';
import {
  escapeHtml,
  ensureEmailRuntimeConfig,
  getBrand,
  getFromAddress,
  getSmtpConfig,
  nl2br,
} from './shared';
import { warmRuntimeSettings, getRuntimeSettingSync } from '@/lib/config/runtime-settings';

function applyTemplate(template: string, vars: Record<string, string>) {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{{${key}}}`).join(value);
  }
  return out;
}

export async function maybeSendContactAutoReply(input: {
  senderName: string;
  senderEmail: string;
  subject: string;
}) {
  await warmRuntimeSettings();
  if (getRuntimeSettingSync('CONTACT_AUTO_REPLY_ENABLED') !== 'true') return;

  await ensureEmailRuntimeConfig();
  const smtp = getSmtpConfig();
  if (!smtp) return;

  const brand = getBrand();
  const subjectTemplate = getRuntimeSettingSync('CONTACT_AUTO_REPLY_SUBJECT')?.trim()
    || 'We received your message';
  const bodyTemplate = getRuntimeSettingSync('CONTACT_AUTO_REPLY_BODY')?.trim()
    || 'Hi {{name}},\n\nThank you for contacting us. We have received your message and will get back to you soon.\n\n— {{brand}}';

  const vars = {
    name: input.senderName,
    email: input.senderEmail,
    subject: input.subject,
    brand: brand.name || 'Portfolio',
  };

  const subject = applyTemplate(subjectTemplate, vars);
  const text = applyTemplate(bodyTemplate, vars);
  const html = `<div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#e8e8e8;background:#12141a;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#1a1d24;border-radius:12px;padding:24px;">
      ${nl2br(escapeHtml(text))}
    </div>
  </div>`;

  const transport = nodemailer.createTransport(smtp);
  await transport.sendMail({
    from: getFromAddress(smtp.auth.user),
    to: input.senderEmail,
    subject,
    text,
    html,
  });
}
