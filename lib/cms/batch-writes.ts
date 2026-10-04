import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_ID, legacyUuid } from './constants';
import { getOrCreateLabelIds, resolveTechnologyUuidsByLegacyId, resolveToolUuidsByLegacyId } from './label-catalog';
import { isProjectCategoryKeysUnavailable } from './project-tool-links-support';

const PROJECT_STATUSES = new Set(['Completed', 'In Progress', 'Pending', 'On Hold', 'Cancelled']);

function admin() {
  return createAdminClient();
}

function normalizeProjectStatus(status) {
  if (PROJECT_STATUSES.has(status)) return status;
  if (status === 'Archived') return 'Cancelled';
  return 'Pending';
}

/** Build RPC payload from client records (stable UUIDs). */
export async function projectsToBatchPayload(records, existingRows) {
  const sb = admin();
  const existingByLegacy = new Map(
    (existingRows || []).map((r) => [String(r.legacy_id), r.id]),
  );

  const allTagNames = [];
  const allTechLegacy = [];
  const allToolLegacy = [];
  for (const p of records || []) {
    for (const tag of p.tags || []) allTagNames.push(tag);
    for (const tid of p.technologies || []) allTechLegacy.push(Number(tid));
    for (const tid of p.tools || []) allToolLegacy.push(Number(tid));
  }

  const orderedUniqueTags = [];
  const seenTagLower = new Set();
  for (const tag of allTagNames) {
    const trimmed = String(tag || '').trim();
    const lower = trimmed.toLowerCase();
    if (!trimmed || seenTagLower.has(lower)) continue;
    seenTagLower.add(lower);
    orderedUniqueTags.push(trimmed);
  }
  const tagLabelIds = await getOrCreateLabelIds(sb, SITE_ID, 'project_tag_labels', orderedUniqueTags);
  const tagIdByLower = new Map(orderedUniqueTags.map((name, i) => [name.toLowerCase(), tagLabelIds[i]]));

  const techUuidMap = await resolveTechnologyUuidsByLegacyId(sb, SITE_ID, allTechLegacy);
  const toolUuidMap = await resolveToolUuidsByLegacyId(sb, SITE_ID, allToolLegacy);

  const projects = (records || []).map((p) => {
    const tag_links = (p.tags || []).map((tag, i) => ({
      tag_label_id: tagIdByLower.get(String(tag).trim().toLowerCase()),
      sort_order: i,
    })).filter((l) => l.tag_label_id);

    const technology_links = (p.technologies || []).map((legacyId, i) => {
      const uuid = techUuidMap.get(Number(legacyId));
      return uuid ? { technology_id: uuid, sort_order: i } : null;
    }).filter(Boolean);

    const tool_links = (p.tools || []).map((legacyId, i) => {
      const uuid = toolUuidMap.get(Number(legacyId));
      return uuid ? { tool_item_id: uuid, sort_order: i } : null;
    }).filter(Boolean);

    return {
      id: existingByLegacy.get(String(p.id)) || legacyUuid('project', p.id),
      legacy_id: Number(p.id),
      title: p.title,
      category_key: (Array.isArray(p.catKeys) && p.catKeys[0]) ? p.catKeys[0] : p.catKey,
      category_keys: Array.isArray(p.catKeys) && p.catKeys.length
        ? p.catKeys
        : (p.catKey ? [p.catKey] : []),
      short_description: p.desc,
      full_description: p.fullDesc,
      is_featured: !!p.featured,
      scene_key: p.scene || null,
      live_url: p.liveUrl || null,
      repo_url: p.repoUrl || null,
      featured_image_url: p.bannerImgUrl || p.imageUrl || null,
      status: normalizeProjectStatus(p.status),
      sort_order: p.sortOrder ?? 0,
      created_at: p.createdAt || new Date().toISOString(),
      tag_links,
      technology_links,
      tool_links,
      gallery: (p.gallery || []).map((img, i) => ({
        url: img.url,
        file_name: img.name || null,
        sort_order: i,
      })),
    };
  });

  const incomingLegacy = new Set((records || []).map((r) => String(r.id)));
  const deleteIds = (existingRows || [])
    .filter((e) => !incomingLegacy.has(String(e.legacy_id)))
    .map((e) => e.id);

  return { projects, deleteIds };
}

export async function blogPostsToBatchPayload(records, existingRows) {
  const sb = admin();
  const existingByLegacy = new Map(
    (existingRows || []).map((r) => [String(r.legacy_id), r.id]),
  );

  const allTagNames = [];
  for (const p of records || []) {
    for (const tag of p.tags || []) allTagNames.push(tag);
  }
  const orderedUniqueTags = [];
  const seenTagLower = new Set();
  for (const tag of allTagNames) {
    const trimmed = String(tag || '').trim();
    const lower = trimmed.toLowerCase();
    if (!trimmed || seenTagLower.has(lower)) continue;
    seenTagLower.add(lower);
    orderedUniqueTags.push(trimmed);
  }
  const blogTagIds = await getOrCreateLabelIds(sb, SITE_ID, 'blog_tags', orderedUniqueTags);
  const tagIdByLower = new Map(orderedUniqueTags.map((name, i) => [name.toLowerCase(), blogTagIds[i]]));

  const posts = (records || []).map((p) => ({
    id: existingByLegacy.get(String(p.id)) || legacyUuid('blog', p.id),
    legacy_id: Number(p.id),
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    content: p.content || '',
    category_key: p.category,
    status: p.status || 'Draft',
    is_featured: !!p.featured,
    featured_image_url: p.imageUrl || null,
    featured_image_alt: p.imageAlt || null,
    published_at: p.publishedAt || null,
    sort_order: p.sortOrder ?? 0,
    meta_title: p.metaTitle || null,
    meta_description: p.metaDesc || null,
    comments_enabled: p.commentsEnabled !== false,
    likes_enabled: p.likesEnabled !== false,
    comments_auto_approve: !!p.commentsAutoApprove,
    created_at: p.createdAt || new Date().toISOString(),
    tag_links: (p.tags || []).map((tag, i) => ({
      blog_tag_id: tagIdByLower.get(String(tag).trim().toLowerCase()),
      sort_order: i,
    })).filter((l) => l.blog_tag_id),
  }));

  const incomingLegacy = new Set((records || []).map((r) => String(r.id)));
  const deleteIds = (existingRows || [])
    .filter((e) => !incomingLegacy.has(String(e.legacy_id)))
    .map((e) => e.id);

  return { posts, deleteIds };
}

function stripCategoryKeysFromBatchPayload(projects) {
  return (projects || []).map((p) => {
    const { category_keys: _omit, ...rest } = p;
    return rest;
  });
}

export async function saveProjectsBatch(records, existingRows) {
  const { projects, deleteIds } = await projectsToBatchPayload(records, existingRows);
  let payload = projects;
  let { error } = await admin().rpc('pa_save_projects_batch', {
    p_site_id: SITE_ID,
    p_projects: payload,
    p_delete_project_ids: deleteIds,
  });
  if (error && isProjectCategoryKeysUnavailable(error)) {
    payload = stripCategoryKeysFromBatchPayload(projects);
    ({ error } = await admin().rpc('pa_save_projects_batch', {
      p_site_id: SITE_ID,
      p_projects: payload,
      p_delete_project_ids: deleteIds,
    }));
  }
  if (error) throw error;
}

export async function saveBlogPostsBatch(records, existingRows) {
  const { posts, deleteIds } = await blogPostsToBatchPayload(records, existingRows);
  const { error } = await admin().rpc('pa_save_blog_posts_batch', {
    p_site_id: SITE_ID,
    p_posts: posts,
    p_delete_post_ids: deleteIds,
  });
  if (error) throw error;
}
