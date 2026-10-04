import { randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

function slugifyName(name: string): string {
  const base = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'tag';
}

type LabelTable = 'project_tag_labels' | 'blog_tags';

/**
 * Resolve display names to catalog row ids (case-insensitive). Creates missing rows.
 */
export async function getOrCreateLabelIds(
  sb: SupabaseClient,
  siteId: string,
  table: LabelTable,
  names: string[],
): Promise<string[]> {
  const ordered = (names || [])
    .map((n) => String(n || '').trim())
    .filter(Boolean);
  if (!ordered.length) return [];

  const uniqueLower = [...new Set(ordered.map((n) => n.toLowerCase()))];

  const { data: existing, error: fetchError } = await sb
    .from(table)
    .select('id, name, legacy_id')
    .eq('site_id', siteId)
    .is('deleted_at', null);
  if (fetchError) throw fetchError;

  const byLower = new Map<string, { id: string; name: string }>();
  for (const row of existing || []) {
    byLower.set(String(row.name).toLowerCase(), { id: row.id, name: row.name });
  }

  const maxLegacy = Math.max(0, ...(existing || []).map((r) => Number(r.legacy_id) || 0));

  const toInsert: { id: string; site_id: string; legacy_id: number; name: string; slug: string }[] = [];
  let nextLegacy = maxLegacy + 1;

  for (const lower of uniqueLower) {
    if (byLower.has(lower)) continue;
    const displayName = ordered.find((n) => n.toLowerCase() === lower) || lower;
    let slug = slugifyName(displayName);
    const id = randomUUID();
    toInsert.push({
      id,
      site_id: siteId,
      legacy_id: nextLegacy++,
      name: displayName,
      slug,
    });
    byLower.set(lower, { id, name: displayName });
  }

  if (toInsert.length) {
    for (const row of toInsert) {
      let attempt = 0;
      while (attempt < 5) {
        const { error } = await sb.from(table).insert(row);
        if (!error) break;
        if (error.code === '23505') {
          row.slug = `${row.slug}-${nextLegacy}`;
          attempt += 1;
          continue;
        }
        throw error;
      }
    }
  }

  return ordered.map((n) => {
    const hit = byLower.get(n.toLowerCase());
    if (!hit) throw new Error(`Failed to resolve label: ${n}`);
    return hit.id;
  });
}

/**
 * Map technology legacy_ids to UUIDs for the site.
 */
export async function resolveToolUuidsByLegacyId(
  sb: SupabaseClient,
  siteId: string,
  legacyIds: number[],
): Promise<Map<number, string>> {
  const ids = [...new Set((legacyIds || []).map((id) => Number(id)).filter((n) => !Number.isNaN(n)))];
  const map = new Map<number, string>();
  if (!ids.length) return map;

  const { data: categories, error: catError } = await sb
    .from('tool_categories')
    .select('id')
    .eq('site_id', siteId)
    .is('deleted_at', null);
  if (catError) throw catError;
  const categoryIds = (categories || []).map((c) => c.id);
  if (!categoryIds.length) return map;

  const { data, error } = await sb
    .from('tool_items')
    .select('id, legacy_id')
    .in('category_id', categoryIds)
    .in('legacy_id', ids);
  if (error) throw error;

  for (const row of data || []) {
    if (row.legacy_id != null) map.set(Number(row.legacy_id), row.id);
  }
  return map;
}

export async function resolveTechnologyUuidsByLegacyId(
  sb: SupabaseClient,
  siteId: string,
  legacyIds: number[],
): Promise<Map<number, string>> {
  const ids = [...new Set((legacyIds || []).map((id) => Number(id)).filter((n) => !Number.isNaN(n)))];
  const map = new Map<number, string>();
  if (!ids.length) return map;

  const { data, error } = await sb
    .from('technologies')
    .select('id, legacy_id')
    .eq('site_id', siteId)
    .is('deleted_at', null)
    .in('legacy_id', ids);
  if (error) throw error;

  for (const row of data || []) {
    if (row.legacy_id != null) map.set(Number(row.legacy_id), row.id);
  }
  return map;
}

const DEFAULT_LEVEL = 'intermediate';

/**
 * Find technology by name or create minimal row for project assignment.
 */
export async function getOrCreateTechnologyByName(
  sb: SupabaseClient,
  siteId: string,
  name: string,
  categoryUuid: string | null,
): Promise<{ legacyId: number; uuid: string }> {
  const trimmed = String(name || '').trim();
  if (!trimmed) throw new Error('Technology name is required');

  const { data: existing, error: findError } = await sb
    .from('technologies')
    .select('id, legacy_id, name')
    .eq('site_id', siteId)
    .is('deleted_at', null)
    .ilike('name', trimmed)
    .limit(1)
    .maybeSingle();
  if (findError) throw findError;
  if (existing?.id && existing.legacy_id != null) {
    return { legacyId: existing.legacy_id, uuid: existing.id };
  }

  const { data: allTech, error: allError } = await sb
    .from('technologies')
    .select('legacy_id')
    .eq('site_id', siteId);
  if (allError) throw allError;
  const nextLegacy = Math.max(0, ...(allTech || []).map((t) => Number(t.legacy_id) || 0)) + 1;

  if (!categoryUuid) {
    const { data: cat } = await sb
      .from('tool_categories')
      .select('id')
      .eq('site_id', siteId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    categoryUuid = cat?.id || null;
  }
  if (!categoryUuid) throw new Error('No tool category available for new technology');

  const id = randomUUID();
  const { error: insertError } = await sb.from('technologies').insert({
    id,
    site_id: siteId,
    legacy_id: nextLegacy,
    name: trimmed,
    category_id: categoryUuid,
    level_key: DEFAULT_LEVEL,
    sort_order: nextLegacy,
    deleted_at: null,
  });
  if (insertError) {
    if (insertError.code === '23505') {
      const { data: retry } = await sb
        .from('technologies')
        .select('id, legacy_id')
        .eq('site_id', siteId)
        .is('deleted_at', null)
        .ilike('name', trimmed)
        .limit(1)
        .maybeSingle();
      if (retry?.id && retry.legacy_id != null) {
        return { legacyId: retry.legacy_id, uuid: retry.id };
      }
    }
    throw insertError;
  }
  return { legacyId: nextLegacy, uuid: id };
}
