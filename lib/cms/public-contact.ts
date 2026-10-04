import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_ID } from '@/lib/cms/constants';
import { invalidateCachePrefix } from '@/lib/cms/server-cache';

export type PublicContactInput = {
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
  website?: string;
};

export async function submitPublicContactMessage(
  input: PublicContactInput,
  senderIp: string | null,
) {
  if (input.website?.trim()) {
    return { ok: false as const, error: 'Unable to submit message.', status: 400 };
  }

  const senderName = input.senderName?.trim();
  const senderEmail = input.senderEmail?.trim().toLowerCase();
  const subject = input.subject?.trim();
  const body = input.body?.trim();

  if (!senderName || senderName.length > 120) {
    return { ok: false as const, error: 'Please enter your name (max 120 characters).', status: 400 };
  }
  if (!senderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
    return { ok: false as const, error: 'Please enter a valid email address.', status: 400 };
  }
  if (!subject || subject.length > 200) {
    return { ok: false as const, error: 'Please enter a subject (max 200 characters).', status: 400 };
  }
  if (!body || body.length < 10 || body.length > 8000) {
    return { ok: false as const, error: 'Message must be between 10 and 8000 characters.', status: 400 };
  }

  const sb = createAdminClient();
  const { data: maxRow } = await sb
    .from('contact_messages')
    .select('legacy_id')
    .eq('site_id', SITE_ID)
    .order('legacy_id', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextLegacy = (maxRow?.legacy_id != null ? Number(maxRow.legacy_id) : 0) + 1;
  const snippet = body.length > 160 ? `${body.slice(0, 157)}...` : body;

  const { data, error } = await sb
    .from('contact_messages')
    .insert({
      site_id: SITE_ID,
      legacy_id: nextLegacy,
      sender_name: senderName,
      sender_email: senderEmail,
      subject,
      snippet,
      body,
      status: 'new',
      sender_ip: senderIp,
    })
    .select('id, legacy_id, created_at')
    .single();

  if (error) throw error;
  invalidateCachePrefix('cms:contact-messages');

  return {
    ok: true as const,
    id: data.id,
    legacyId: data.legacy_id,
    createdAt: data.created_at,
  };
}
