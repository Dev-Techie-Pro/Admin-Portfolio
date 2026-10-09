// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_ID } from '@/lib/cms/constants';
import { saveContentRevision } from '@/lib/cms/content-revisions';

export async function saveBlogPostRevisionsFromPut(
  records: unknown[],
  beforeLegacyIds: Set<string>,
  userId: string,
) {
  if (!Array.isArray(records) || !records.length) return;
  const sb = createAdminClient();

  for (const record of records) {
    const legacyId = record?.legacyId ?? record?.id;
    if (legacyId == null) continue;
    const key = String(legacyId);
    if (!beforeLegacyIds.has(key)) continue;

    const { data: row } = await sb
      .from('blog_posts')
      .select('id')
      .eq('site_id', SITE_ID)
      .eq('legacy_id', legacyId)
      .maybeSingle();
    if (!row?.id) continue;

    await saveContentRevision('blog_post', row.id, Number(legacyId), record, userId);
  }
}
