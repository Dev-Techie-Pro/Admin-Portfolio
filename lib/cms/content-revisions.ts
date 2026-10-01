import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_ID } from '@/lib/cms/constants';

const MAX_REVISIONS_PER_ENTITY = 10;

export async function saveContentRevision(
  entityType: string,
  entityId: string,
  legacyId: number | null | undefined,
  snapshot: unknown,
  createdBy: string | null,
) {
  const sb = createAdminClient();
  const { error: insertError } = await sb.from('content_revisions').insert({
    site_id: SITE_ID,
    entity_type: entityType,
    entity_id: entityId,
    legacy_id: legacyId ?? null,
    snapshot,
    created_by: createdBy,
  });
  if (insertError) throw insertError;

  const { data: rows, error: listError } = await sb
    .from('content_revisions')
    .select('id, created_at')
    .eq('site_id', SITE_ID)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });
  if (listError) throw listError;

  const excess = (rows || []).slice(MAX_REVISIONS_PER_ENTITY);
  if (excess.length) {
    await sb.from('content_revisions').delete().in('id', excess.map((r) => r.id));
  }
}

export async function getBlogPostUuidByLegacyId(legacyId: number) {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('blog_posts')
    .select('id')
    .eq('site_id', SITE_ID)
    .eq('legacy_id', legacyId)
    .maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

export async function listContentRevisionsByLegacyId(entityType: string, legacyId: number) {
  const sb = createAdminClient();
  let entityId: string | null = null;
  if (entityType === 'blog_post') {
    entityId = await getBlogPostUuidByLegacyId(legacyId);
  }
  if (!entityId) return [];
  return listContentRevisions(entityType, entityId);
}

export async function getContentRevisionById(revisionId: string) {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('content_revisions')
    .select('id, entity_type, entity_id, legacy_id, snapshot, created_at, created_by')
    .eq('site_id', SITE_ID)
    .eq('id', revisionId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listContentRevisions(entityType: string, entityId: string) {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('content_revisions')
    .select('id, legacy_id, created_at, created_by')
    .eq('site_id', SITE_ID)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(MAX_REVISIONS_PER_ENTITY);
  if (error) throw error;
  return data || [];
}
