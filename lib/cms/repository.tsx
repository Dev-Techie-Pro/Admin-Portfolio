// @ts-nocheck
import { createHash, randomUUID } from 'crypto';
import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUuid } from '@/lib/validation/uuid';
import { SITE_ID, legacyUuid } from './constants';
import {
  recentActivityRetentionCutoffIso,
  schedulePurgeExpiredRecentActivities,
} from './activity-retention';
import {
  reconcileEntityMediaForRefs,
  refreshMediaUsageCounts,
  refreshMediaUsageCountsForMediaSave,
  propagateMediaChangesToEntities,
  backfillMediaFileMeta,
  deriveSizeBytes,
  deriveMimeType,
  hashUrl,
  collectProjectMediaRefs,
  collectBlogMediaRefs,
  collectTestimonialMediaRefs,
  collectToolMediaRefs,
  collectContactReplyMediaRefs,
} from './media-sync';
import { saveProjectsBatch, saveBlogPostsBatch } from './batch-writes';
import { getOrCreateLabelIds, resolveTechnologyUuidsByLegacyId, resolveToolUuidsByLegacyId } from './label-catalog';
import { CMS_CACHE_TTL, getCached, invalidateCache, invalidateCachePrefix, invalidateCmsReadCaches } from './server-cache';
import { cmsBatchWritesEnabled } from '@/lib/config/runtime-settings';
import { contactReplyMediaChanged } from './media-reconcile';
import {
  isProjectCategoryKeysUnavailable,
  isProjectToolLinksUnavailable,
  projectToolLinksTableAvailable,
} from './project-tool-links-support';

const RECENT_ACTIVITIES_LIMIT = 150;

const PROJECT_COLUMNS_LEGACY = 'legacy_id, title, category_key, short_description, full_description, is_featured, scene_key, live_url, repo_url, featured_image_url, status, sort_order, created_at';
const PROJECT_COLUMNS = 'legacy_id, title, category_key, category_keys, short_description, full_description, is_featured, scene_key, live_url, repo_url, featured_image_url, status, sort_order, created_at';
const PROJECT_TECH_LINK_COLUMNS = 'sort_order, technologies(legacy_id)';
const PROJECT_TOOL_LINK_COLUMNS = 'sort_order, tool_items(legacy_id)';
const PROJECT_TAG_LINK_COLUMNS = 'sort_order, project_tag_labels(name)';
const PROJECT_GALLERY_COLUMNS = 'url, file_name, sort_order';
const MEDIA_COLUMNS = 'legacy_id, file_name, url, alt_text, folder, size_bytes, mime_type, uploaded_at, usage_count, source';
const TECHNOLOGY_COLUMNS = 'legacy_id, name, category_id, level_key, documentation_url, description, years_experience, is_featured, sort_order, created_at';
const TESTIMONIAL_COLUMNS = 'legacy_id, client_name, client_role, company, quote, rating, avatar_url, avatar_alt, is_featured, created_at';
const BLOG_POST_COLUMNS = 'legacy_id, title, slug, excerpt, category_key, status, is_featured, featured_image_url, featured_image_alt, published_at, sort_order, meta_title, meta_description, comments_enabled, likes_enabled, comments_auto_approve, created_at';
const BLOG_POST_TAG_COLUMNS = 'sort_order, blog_tags(name)';
const EXPERIENCE_COLUMNS = 'legacy_id, job_title, company, location, employment_type, start_date, end_date, is_current, description, sort_order, created_at';
const CONTACT_MESSAGE_COLUMNS = 'id, legacy_id, sender_name, sender_email, subject, snippet, body, status, sender_ip, reply_body, replied_at, is_starred, created_at';
const CONTACT_REPLY_COLUMNS = 'id, message_id, body, subject, cc, attachment_url, attachment_name, attachment_mime, attachment_size, sent_at, created_at, updated_at';
const RECENT_ACTIVITY_COLUMNS = 'id, user_id, action_title, action_description, type, status, metadata, created_at';
const CATEGORY_COLUMNS = 'key, label, description, is_builtin, created_at';
const SITE_SETTINGS_COLUMNS = 'site_title, site_tagline, site_url, admin_email, site_description, date_format, time_format, timezone, items_per_page, default_view, language, maintenance_mode, profile_full_name, profile_username, profile_role, profile_phone, profile_dob, profile_bio, profile_location, profile_website, profile_social_links, contact_message_columns';
const TOOL_ITEM_COLUMNS = 'legacy_id, category_id, name, icon_class, icon_url, sort_order, created_at';
const BLOG_CATEGORY_COLUMNS = 'legacy_id, key, label, description, proficiency_pct, icon_class, color, sort_order, created_at';
const TOOL_CATEGORY_COLUMNS = 'legacy_id, key, label, description, proficiency_pct, icon_class, color, sort_order, created_at';

function supabase() {
  return createAdminClient();
}

/** Standard newest-first ordering for list queries (null-safe at DB level). */
const ORDER_BY_NEWEST = { ascending: false, nullsFirst: false };

// ─── Projects ────────────────────────────────────────────────────────────────

function mapProjectTagLinks(tagLinks = []) {
  return tagLinks
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((l) => l.project_tag_labels?.name)
    .filter(Boolean);
}

function mapProjectTechnologyLinks(techLinks = []) {
  return techLinks
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((l) => l.technologies?.legacy_id)
    .filter((id) => id != null);
}

function mapProjectToolLinks(toolLinks = []) {
  return toolLinks
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((l) => l.tool_items?.legacy_id)
    .filter((id) => id != null);
}

function mapBlogTagRows(tagRows = []) {
  return tagRows
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((t) => t.blog_tags?.name)
    .filter(Boolean);
}

export function projectFromDb(row, tagLinks = [], techLinks = [], gallery = [], toolLinks = []) {
  return {
    id: row.legacy_id,
    title: row.title,
    catKey: row.category_key,
    catKeys: Array.isArray(row.category_keys) && row.category_keys.length
      ? row.category_keys
      : (row.category_key ? [row.category_key] : []),
    desc: row.short_description,
    fullDesc: row.full_description,
    tags: mapProjectTagLinks(tagLinks),
    technologies: mapProjectTechnologyLinks(techLinks),
    tools: mapProjectToolLinks(toolLinks),
    featured: row.is_featured,
    scene: row.scene_key,
    liveUrl: row.live_url || '',
    repoUrl: row.repo_url || '',
    bannerImgUrl: row.featured_image_url || '',
    imageUrl: row.featured_image_url || '',
    status: row.status,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    gallery: gallery.map((g) => ({ url: g.url, name: g.file_name || '' })),
  };
}

const PROJECT_STATUSES = new Set(['Completed', 'In Progress', 'Pending', 'On Hold', 'Cancelled']);

function normalizeProjectStatus(status) {
  if (PROJECT_STATUSES.has(status)) return status;
  if (status === 'Archived') return 'Cancelled';
  return 'Pending';
}

function projectToDb(p) {
  const catKeys = Array.isArray(p.catKeys) && p.catKeys.length
    ? p.catKeys.map((k) => String(k).trim()).filter(Boolean)
    : (p.catKey ? [String(p.catKey)] : []);
  const primaryCat = catKeys[0] || p.catKey || '';
  return {
    title: p.title,
    category_key: primaryCat,
    category_keys: catKeys,
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
    legacy_id: p.id,
  };
}

const PROJECT_LIST_EMBED = `project_technology_links(${PROJECT_TECH_LINK_COLUMNS}), project_tag_links(${PROJECT_TAG_LINK_COLUMNS}), project_gallery_images(${PROJECT_GALLERY_COLUMNS})`;
const PROJECT_LIST_EMBED_WITH_TOOLS = `project_technology_links(${PROJECT_TECH_LINK_COLUMNS}), project_tool_links(${PROJECT_TOOL_LINK_COLUMNS}), project_tag_links(${PROJECT_TAG_LINK_COLUMNS}), project_gallery_images(${PROJECT_GALLERY_COLUMNS})`;

function selectProjectsList(sb, columns, embed) {
  return sb
    .from('projects')
    .select(`${columns}, ${embed}`)
    .eq('site_id', SITE_ID)
    .is('deleted_at', null)
    .order('created_at', ORDER_BY_NEWEST);
}

export async function getProjects() {
  return getCached('cms:projects', CMS_CACHE_TTL.lists, async () => {
    const sb = supabase();
    let rows;
    let withToolLinks = true;
    let columns = PROJECT_COLUMNS;

    let primary = await selectProjectsList(sb, columns, PROJECT_LIST_EMBED_WITH_TOOLS);
    if (primary.error && isProjectCategoryKeysUnavailable(primary.error)) {
      columns = PROJECT_COLUMNS_LEGACY;
      primary = await selectProjectsList(sb, columns, PROJECT_LIST_EMBED_WITH_TOOLS);
    }
    if (primary.error && isProjectToolLinksUnavailable(primary.error)) {
      withToolLinks = false;
      let fallback = await selectProjectsList(sb, columns, PROJECT_LIST_EMBED);
      if (fallback.error && isProjectCategoryKeysUnavailable(fallback.error)) {
        columns = PROJECT_COLUMNS_LEGACY;
        fallback = await selectProjectsList(sb, columns, PROJECT_LIST_EMBED);
      }
      if (fallback.error) throw fallback.error;
      rows = fallback.data;
    } else {
      if (primary.error) throw primary.error;
      rows = primary.data;
    }
    if (!rows?.length) return [];

    return rows.map((row) => {
      const tagLinks = row.project_tag_links || [];
      const techLinks = row.project_technology_links || [];
      const toolLinks = withToolLinks ? (row.project_tool_links || []) : [];
      const gallery = (row.project_gallery_images || []).sort((a, b) => a.sort_order - b.sort_order);
      const {
        project_tag_links: _tagLinks,
        project_technology_links: _techLinks,
        project_tool_links: _toolLinks,
        project_gallery_images: _gallery,
        ...projectRow
      } = row;
      return projectFromDb(projectRow, tagLinks, techLinks, gallery, toolLinks);
    });
  });
}

async function ensureProjectCategoryKeys(sb, records) {
  const keys = [...new Set(
    (records || []).flatMap((r) => {
      if (Array.isArray(r.catKeys) && r.catKeys.length) return r.catKeys.map((k) => String(k).trim()).filter(Boolean);
      const single = String(r.catKey || '').trim();
      return single ? [single] : [];
    }),
  )];
  if (!keys.length) return;
  const { data: existing, error: fetchError } = await sb
    .from('categories')
    .select('key')
    .eq('site_id', SITE_ID)
    .in('key', keys)
    .is('deleted_at', null);
  if (fetchError) throw fetchError;
  const have = new Set((existing || []).map((c) => c.key));
  for (const key of keys) {
    if (have.has(key)) continue;
    const label = key
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    const { error } = await sb.from('categories').upsert({
      site_id: SITE_ID,
      key,
      label: label || key,
      description: null,
      is_builtin: true,
      deleted_at: null,
    }, { onConflict: 'site_id,key' });
    if (error) throw error;
  }
}

async function saveProjectsLegacy(records) {
  const sb = supabase();
  const toolLinksEnabled = await projectToolLinksTableAvailable(sb);
  const { data: existing } = await sb.from('projects').select('id, legacy_id').eq('site_id', SITE_ID);
  const incomingIds = new Set(records.map((r) => String(r.id)));
  const toDelete = (existing || []).filter((e) => !incomingIds.has(String(e.legacy_id)));
  if (toDelete.length) {
    const delIds = toDelete.map((d) => d.id);
    const { error: tagLinkError } = await sb.from('project_tag_links').delete().in('project_id', delIds);
    if (tagLinkError) throw tagLinkError;
    const { error: techLinkError } = await sb.from('project_technology_links').delete().in('project_id', delIds);
    if (techLinkError) throw techLinkError;
    if (toolLinksEnabled) {
      const { error: toolLinkError } = await sb.from('project_tool_links').delete().in('project_id', delIds);
      if (toolLinkError) throw toolLinkError;
    }
    const { error: galleryError } = await sb.from('project_gallery_images').delete().in('project_id', delIds);
    if (galleryError) throw galleryError;
    const { error: deleteError } = await sb.from('projects').delete().in('id', delIds);
    if (deleteError) throw deleteError;
  }

  for (const p of records) {
    const ex = (existing || []).find((e) => String(e.legacy_id) === String(p.id));
    const projectId = ex?.id || legacyUuid('project', p.id);
    const { error } = await sb.from('projects').upsert({
      id: projectId,
      site_id: SITE_ID,
      ...projectToDb(p),
    });
    if (error) throw error;

    await sb.from('project_technology_links').delete().eq('project_id', projectId);
    const techUuidMap = await resolveTechnologyUuidsByLegacyId(sb, SITE_ID, p.technologies || []);
    const techRows = (p.technologies || [])
      .map((legacyId, i) => {
        const technology_id = techUuidMap.get(Number(legacyId));
        return technology_id ? { project_id: projectId, technology_id, sort_order: i } : null;
      })
      .filter(Boolean);
    if (techRows.length) {
      const { error: techInsertError } = await sb.from('project_technology_links').insert(techRows);
      if (techInsertError) throw techInsertError;
    }

    if (toolLinksEnabled) {
      await sb.from('project_tool_links').delete().eq('project_id', projectId);
      const toolUuidMap = await resolveToolUuidsByLegacyId(sb, SITE_ID, p.tools || []);
      const toolRows = (p.tools || [])
        .map((legacyId, i) => {
          const tool_item_id = toolUuidMap.get(Number(legacyId));
          return tool_item_id ? { project_id: projectId, tool_item_id, sort_order: i } : null;
        })
        .filter(Boolean);
      if (toolRows.length) {
        const { error: toolInsertError } = await sb.from('project_tool_links').insert(toolRows);
        if (toolInsertError) throw toolInsertError;
      }
    }

    await sb.from('project_tag_links').delete().eq('project_id', projectId);
    if (p.tags?.length) {
      const labelIds = await getOrCreateLabelIds(sb, SITE_ID, 'project_tag_labels', p.tags);
      const tagRows = labelIds.map((tag_label_id, i) => ({
        project_id: projectId,
        tag_label_id,
        sort_order: i,
      }));
      const { error: tagInsertError } = await sb.from('project_tag_links').insert(tagRows);
      if (tagInsertError) throw tagInsertError;
    }

    await sb.from('project_gallery_images').delete().eq('project_id', projectId);
    if (p.gallery?.length) {
      await sb.from('project_gallery_images').insert(
        p.gallery.map((img, i) => ({
          project_id: projectId,
          url: img.url,
          file_name: img.name || null,
          sort_order: i,
        })),
      );
    }
  }
}

export async function saveProjects(records, { reconcileMedia = true } = {}) {
  const sb = supabase();
  await ensureProjectCategoryKeys(sb, records);
  const { data: existing, error: fetchError } = await sb
    .from('projects')
    .select('id, legacy_id')
    .eq('site_id', SITE_ID);
  if (fetchError) throw fetchError;

  if (!(await cmsBatchWritesEnabled())) {
    await saveProjectsLegacy(records);
  } else {
    try {
      await saveProjectsBatch(records, existing || []);
    } catch (error) {
      if (isProjectToolLinksUnavailable(error)) {
        await saveProjectsLegacy(records);
      } else {
        throw error;
      }
    }
  }

  if (reconcileMedia) {
    await reconcileEntityMediaForRefs(collectProjectMediaRefs(records));
  }
  invalidateCmsReadCaches();
}

// ─── Project tag labels (/project-tags) ─────────────────────────────────────

function slugifyLabelName(name) {
  const base = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'tag';
}

export async function getProjectTagLabels() {
  return getCached('cms:project-tag-labels', CMS_CACHE_TTL.lists, async () => {
    const sb = supabase();
    const { data: labels, error } = await sb
      .from('project_tag_labels')
      .select('id, legacy_id, name, slug, description, created_at, project_tag_links(project_id, projects(legacy_id, title))')
      .eq('site_id', SITE_ID)
      .is('deleted_at', null)
      .order('created_at', ORDER_BY_NEWEST);
    if (error) throw error;

    return (labels || []).map((row) => {
      const links = row.project_tag_links || [];
      const projectLegacyIds = [];
      const projectTitles = [];
      for (const link of links) {
        const proj = link.projects;
        if (proj?.legacy_id != null) {
          projectLegacyIds.push(proj.legacy_id);
          projectTitles.push(proj.title || '');
        }
      }
      return {
        id: row.legacy_id,
        uuid: row.id,
        name: row.name,
        slug: row.slug,
        desc: row.description || '',
        projectLegacyIds,
        projectTitles,
        projectCount: projectLegacyIds.length,
        createdAt: row.created_at,
      };
    });
  });
}

/** @deprecated Use getProjectTagLabels */
export async function getProjectTags() {
  return getProjectTagLabels();
}

export async function saveProjectTagLabels(records) {
  const sb = supabase();
  const { data: existing, error: fetchError } = await sb
    .from('project_tag_labels')
    .select('id, legacy_id')
    .eq('site_id', SITE_ID);
  if (fetchError) throw fetchError;

  const { data: projects, error: projectError } = await sb
    .from('projects')
    .select('id, legacy_id')
    .eq('site_id', SITE_ID)
    .is('deleted_at', null);
  if (projectError) throw projectError;
  const projectByLegacy = new Map((projects || []).map((p) => [String(p.legacy_id), p.id]));

  const incomingLegacy = new Set((records || []).map((r) => String(r.id)));
  const toSoftDelete = (existing || []).filter((e) => e.legacy_id != null && !incomingLegacy.has(String(e.legacy_id)));
  if (toSoftDelete.length) {
    const { error: delError } = await sb
      .from('project_tag_labels')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', toSoftDelete.map((r) => r.id));
    if (delError) throw delError;
    const { error: linkDelError } = await sb
      .from('project_tag_links')
      .delete()
      .in('tag_label_id', toSoftDelete.map((r) => r.id));
    if (linkDelError) throw linkDelError;
  }

  let maxLegacy = Math.max(0, ...(existing || []).map((e) => Number(e.legacy_id) || 0));

  const labelUuidByLegacy = new Map();
  for (const record of records || []) {
    const name = String(record.name || record.tag || '').trim();
    if (!name) continue;
    const legacyId = record.id != null ? Number(record.id) : (++maxLegacy);
    const ex = (existing || []).find((e) => String(e.legacy_id) === String(legacyId));
    const id = ex?.id || record.uuid || randomUUID();
    labelUuidByLegacy.set(String(legacyId), id);

    const { error: upsertError } = await sb.from('project_tag_labels').upsert({
      id,
      site_id: SITE_ID,
      legacy_id: legacyId,
      name,
      slug: String(record.slug || slugifyLabelName(name)).trim() || slugifyLabelName(name),
      description: record.desc || record.description || null,
      deleted_at: null,
    }, { onConflict: 'id' });
    if (upsertError) throw upsertError;
  }

  const labelIds = [...labelUuidByLegacy.values()];
  if (labelIds.length) {
    const { error: clearLinksError } = await sb
      .from('project_tag_links')
      .delete()
      .in('tag_label_id', labelIds);
    if (clearLinksError) throw clearLinksError;
  }

  const linkRows = [];
  for (const record of records || []) {
    const legacyId = record.id;
    const labelUuid = labelUuidByLegacy.get(String(legacyId));
    if (!labelUuid) continue;
    const projectIds = record.projectLegacyIds || (record.projectLegacyId != null ? [record.projectLegacyId] : []);
    for (const projLegacy of projectIds) {
      const projectId = projectByLegacy.get(String(projLegacy));
      if (!projectId) continue;
      linkRows.push({
        project_id: projectId,
        tag_label_id: labelUuid,
        sort_order: linkRows.filter((r) => r.project_id === projectId).length,
      });
    }
  }

  if (linkRows.length) {
    const { error: linkError } = await sb.from('project_tag_links').insert(linkRows);
    if (linkError) throw linkError;
  }
  invalidateCmsReadCaches();
}

/** @deprecated Use saveProjectTagLabels */
export async function saveProjectTags(records) {
  return saveProjectTagLabels(records);
}

// ─── Project technology usage (/project-technologies) ───────────────────────

export async function getProjectTechnologyUsage() {
  return getCached('cms:project-technology-usage', CMS_CACHE_TTL.lists, async () => {
    const sb = supabase();
    const { data, error } = await sb
      .from('technologies')
      .select('legacy_id, name, description, project_technology_links(project_id, projects(legacy_id, title))')
      .eq('site_id', SITE_ID)
      .is('deleted_at', null)
      .order('name', { ascending: true });
    if (error) throw error;

    return (data || []).map((row) => {
      const links = row.project_technology_links || [];
      const projectLegacyIds = [];
      const projectTitles = [];
      for (const link of links) {
        const proj = link.projects;
        if (proj?.legacy_id != null) {
          projectLegacyIds.push(proj.legacy_id);
          projectTitles.push(proj.title || '');
        }
      }
      return {
        id: row.legacy_id,
        name: row.name,
        desc: row.description || '',
        projectLegacyIds,
        projectTitles,
        projectCount: projectLegacyIds.length,
      };
    });
  });
}

// ─── Blog tags (/blog-tags) ─────────────────────────────────────────────────

export async function getBlogTags() {
  return getCached('cms:blog-tags', CMS_CACHE_TTL.lists, async () => {
    const sb = supabase();
    const { data: labels, error } = await sb
      .from('blog_tags')
      .select('id, legacy_id, name, slug, description, created_at, blog_post_tags(blog_post_id, blog_posts(legacy_id, title))')
      .eq('site_id', SITE_ID)
      .is('deleted_at', null)
      .order('created_at', ORDER_BY_NEWEST);
    if (error) throw error;

    return (labels || []).map((row) => {
      const links = row.blog_post_tags || [];
      const postLegacyIds = [];
      const postTitles = [];
      for (const link of links) {
        const post = link.blog_posts;
        if (post?.legacy_id != null) {
          postLegacyIds.push(post.legacy_id);
          postTitles.push(post.title || '');
        }
      }
      return {
        id: row.legacy_id,
        uuid: row.id,
        name: row.name,
        slug: row.slug,
        desc: row.description || '',
        postLegacyIds,
        postTitles,
        postCount: postLegacyIds.length,
        createdAt: row.created_at,
      };
    });
  });
}

export async function saveBlogTags(records) {
  const sb = supabase();
  const { data: existing, error: fetchError } = await sb
    .from('blog_tags')
    .select('id, legacy_id')
    .eq('site_id', SITE_ID);
  if (fetchError) throw fetchError;

  const { data: posts, error: postError } = await sb
    .from('blog_posts')
    .select('id, legacy_id')
    .eq('site_id', SITE_ID)
    .is('deleted_at', null);
  if (postError) throw postError;
  const postByLegacy = new Map((posts || []).map((p) => [String(p.legacy_id), p.id]));

  const incomingLegacy = new Set((records || []).map((r) => String(r.id)));
  const toDelete = (existing || []).filter((e) => e.legacy_id != null && !incomingLegacy.has(String(e.legacy_id)));
  if (toDelete.length) {
    const tagIds = toDelete.map((r) => r.id);
    const { error: linkDelError } = await sb
      .from('blog_post_tags')
      .delete()
      .in('blog_tag_id', tagIds);
    if (linkDelError) throw linkDelError;
    const { error: delError } = await sb.from('blog_tags').delete().in('id', tagIds);
    if (delError) throw delError;
  }

  let maxLegacy = Math.max(0, ...(existing || []).map((e) => Number(e.legacy_id) || 0));
  const labelUuidByLegacy = new Map();

  for (const record of records || []) {
    const name = String(record.name || '').trim();
    if (!name) continue;
    const legacyId = record.id != null ? Number(record.id) : (++maxLegacy);
    const ex = (existing || []).find((e) => String(e.legacy_id) === String(legacyId));
    const id = ex?.id || record.uuid || randomUUID();
    labelUuidByLegacy.set(String(legacyId), id);

    const { error: upsertError } = await sb.from('blog_tags').upsert({
      id,
      site_id: SITE_ID,
      legacy_id: legacyId,
      name,
      slug: String(record.slug || slugifyLabelName(name)).trim() || slugifyLabelName(name),
      description: record.desc || record.description || null,
      deleted_at: null,
    }, { onConflict: 'id' });
    if (upsertError) throw upsertError;
  }

  const labelIds = [...labelUuidByLegacy.values()];
  if (labelIds.length) {
    const { error: clearLinksError } = await sb.from('blog_post_tags').delete().in('blog_tag_id', labelIds);
    if (clearLinksError) throw clearLinksError;
  }

  const linkRows = [];
  for (const record of records || []) {
    const labelUuid = labelUuidByLegacy.get(String(record.id));
    if (!labelUuid) continue;
    const postIds = record.postLegacyIds || [];
    for (const postLegacy of postIds) {
      const blogPostId = postByLegacy.get(String(postLegacy));
      if (!blogPostId) continue;
      linkRows.push({
        blog_post_id: blogPostId,
        blog_tag_id: labelUuid,
        sort_order: linkRows.filter((r) => r.blog_post_id === blogPostId).length,
      });
    }
  }

  if (linkRows.length) {
    const { error: linkError } = await sb.from('blog_post_tags').insert(linkRows);
    if (linkError) throw linkError;
  }
  invalidateCmsReadCaches();
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getCategories() {
  return getCached('cms:categories', CMS_CACHE_TTL.lists, async () => {
    const sb = supabase();
    const { data, error } = await sb
      .from('categories')
      .select(CATEGORY_COLUMNS)
      .eq('site_id', SITE_ID)
      .is('deleted_at', null)
      .order('created_at', ORDER_BY_NEWEST);
    if (error) throw error;
    const map = {};
    (data || []).forEach((c) => {
      map[c.key] = {
        label: c.label,
        desc: c.description || '',
        isBuiltin: !!c.is_builtin,
        createdAt: c.created_at,
      };
    });
    return map;
  });
}

export async function saveCategories(map) {
  const sb = supabase();
  const { data: existing, error: fetchError } = await sb
    .from('categories')
    .select('key, is_builtin')
    .eq('site_id', SITE_ID)
    .is('deleted_at', null);
  if (fetchError) throw fetchError;

  const incomingKeys = new Set(Object.keys(map || {}));
  const toRemove = (existing || []).filter((e) => !incomingKeys.has(e.key));

  for (const cat of toRemove) {
    if (cat.is_builtin) continue;

    const { count, error: countError } = await sb
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', SITE_ID)
      .eq('category_key', cat.key)
      .is('deleted_at', null);
    if (countError) throw countError;
    if (count > 0) {
      throw new Error(`Cannot delete category "${cat.key}" because ${count} project(s) still use it.`);
    }

    const { error: deleteError } = await sb
      .from('categories')
      .delete()
      .eq('site_id', SITE_ID)
      .eq('key', cat.key);
    if (deleteError) throw deleteError;
  }

  for (const [key, meta] of Object.entries(map || {})) {
    const existingCat = (existing || []).find((e) => e.key === key);
    const { error } = await sb.from('categories').upsert({
      site_id: SITE_ID,
      key,
      label: meta.label,
      description: meta.desc || null,
      is_builtin: existingCat?.is_builtin ?? false,
      deleted_at: null,
    }, { onConflict: 'site_id,key' });
    if (error) throw error;
  }
  invalidateCmsReadCaches();
}

// ─── Technologies ────────────────────────────────────────────────────────────

function techFromDb(row, categoryLegacyId) {
  return {
    id: row.legacy_id,
    name: row.name,
    categoryId: categoryLegacyId,
    level: row.level_key,
    url: row.documentation_url || '',
    desc: row.description || '',
    years: row.years_experience,
    featured: row.is_featured,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export async function getTechnologies() {
  return getCached('cms:technologies', CMS_CACHE_TTL.lists, async () => {
    const sb = supabase();
    const [{ data: categories, error: catError }, { data, error }] = await Promise.all([
      sb
        .from('tool_categories')
        .select('id, legacy_id, key')
        .eq('site_id', SITE_ID)
        .is('deleted_at', null),
      sb
        .from('technologies')
        .select(TECHNOLOGY_COLUMNS)
        .eq('site_id', SITE_ID)
        .is('deleted_at', null)
        .order('created_at', ORDER_BY_NEWEST),
    ]);
    if (catError) throw catError;
    if (error) throw error;

    const uuidToLegacy = new Map();
    let maxLegacy = Math.max(0, ...(categories || []).map((c) => Number(c.legacy_id) || 0));
    for (const c of categories || []) {
      const legacy = c.legacy_id != null ? c.legacy_id : (++maxLegacy);
      uuidToLegacy.set(c.id, legacy);
    }

    const defaultLegacy = (() => {
      const other = (categories || []).find((c) => String(c.key).toLowerCase() === 'other');
      if (other) return uuidToLegacy.get(other.id);
      const first = (categories || [])[0];
      return first ? uuidToLegacy.get(first.id) : null;
    })();

    return (data || []).map((row) => {
      const mapped = row.category_id != null ? uuidToLegacy.get(row.category_id) : null;
      return techFromDb(row, mapped ?? defaultLegacy ?? null);
    });
  });
}

export async function saveTechnologies(records) {
  const sb = supabase();
  const [{ data: existing, error: fetchError }, { data: categories, error: catError }] = await Promise.all([
    sb
      .from('technologies')
      .select('id, legacy_id, category_id')
      .eq('site_id', SITE_ID),
    sb
      .from('tool_categories')
      .select('id, legacy_id, key')
      .eq('site_id', SITE_ID)
      .is('deleted_at', null),
  ]);
  if (fetchError) throw fetchError;
  if (catError) throw catError;

  const categoryUuidByLegacy = new Map(
    (categories || [])
      .filter((c) => c.legacy_id != null)
      .map((c) => [String(c.legacy_id), c.id]),
  );
  const defaultCategoryUuid = (
    (categories || []).find((c) => String(c.key).toLowerCase() === 'other')
    || (categories || [])[0]
  )?.id || null;

  const incomingIds = new Set(records.map((r) => String(r.id)));
  const toDelete = (existing || []).filter((e) => !incomingIds.has(String(e.legacy_id)));
  if (toDelete.length) {
    const { error: deleteError } = await sb.from('technologies').delete().in('id', toDelete.map((d) => d.id));
    if (deleteError) throw deleteError;
  }

  for (const t of records) {
    const ex = (existing || []).find((e) => String(e.legacy_id) === String(t.id));
    const years = t.years != null && t.years !== '' ? Number(t.years) : null;
    const mappedCategory = t.categoryId != null && t.categoryId !== ''
      ? categoryUuidByLegacy.get(String(t.categoryId))
      : null;
    const categoryUuid = mappedCategory || ex?.category_id || defaultCategoryUuid;
    if (!categoryUuid) {
      throw new Error('No tool category is configured. Add a category under Tech & Tools first.');
    }
    const { error } = await sb.from('technologies').upsert({
      id: ex?.id || legacyUuid('tech', t.id),
      site_id: SITE_ID,
      legacy_id: t.id,
      name: t.name,
      category_id: categoryUuid,
      level_key: t.level,
      documentation_url: t.url || null,
      description: t.desc || null,
      years_experience: years != null && !Number.isNaN(years) ? years : null,
      is_featured: !!t.featured,
      sort_order: t.sortOrder ?? 0,
      deleted_at: null,
    }, { onConflict: 'id' });
    if (error) {
      if (error.code === '23505') {
        throw new Error(`A technology named "${t.name}" already exists.`);
      }
      throw error;
    }
  }
  invalidateCmsReadCaches();
}

// ─── Media ───────────────────────────────────────────────────────────────────

function mediaFromDb(row) {
  const url = row.url || '';
  return {
    id: row.legacy_id,
    name: row.file_name,
    url,
    alt: row.alt_text || '',
    folder: row.folder,
    size: deriveSizeBytes(url, row.size_bytes),
    type: deriveMimeType(url, row.mime_type),
    uploadedAt: row.uploaded_at,
    usageCount: row.usage_count,
  };
}

export async function getMedia() {
  return getCached('cms:media', CMS_CACHE_TTL.lists, async () => {
    const { data, error } = await supabase()
      .from('media_assets')
      .select(MEDIA_COLUMNS)
      .eq('site_id', SITE_ID)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mediaFromDb);
  });
}

/** Run metadata backfill + return library (sync/admin path). */
export async function getMediaWithBackfill() {
  await backfillMediaFileMeta();
  invalidateCache('cms:media');
  return getMedia();
}

function clientMediaRecordUnchanged(prev, next) {
  if (!prev || !next) return false;
  return (
    String(prev.name || '') === String(next.name || '')
    && String(prev.url || '') === String(next.url || '')
    && String(prev.alt || '') === String(next.alt || '')
    && String(prev.folder || 'general') === String(next.folder || 'general')
    && Number(prev.size || 0) === Number(next.size || 0)
    && String(prev.type || '') === String(next.type || '')
  );
}

export async function saveMedia(records, beforeRecords = null) {
  const before = beforeRecords ?? await getMedia();
  const beforeById = new Map(before.map((r) => [String(r.id), r]));
  const sb = supabase();
  const { data: existing, error: existingError } = await sb
    .from('media_assets')
    .select('id, legacy_id, source')
    .eq('site_id', SITE_ID)
    .is('deleted_at', null);
  if (existingError) throw existingError;

  const incomingIds = new Set(records.map((r) => String(r.id)));
  const toDelete = (existing || []).filter((e) => e.legacy_id != null && !incomingIds.has(String(e.legacy_id)));
  if (toDelete.length) {
    const { error: deleteError } = await sb
      .from('media_assets')
      .delete()
      .in('id', toDelete.map((d) => d.id));
    if (deleteError) throw deleteError;
  }

  const existingByLegacy = new Map(
    (existing || [])
      .filter((e) => e.legacy_id != null)
      .map((e) => [String(e.legacy_id), e]),
  );

  for (const m of records) {
    if (m.id == null || m.id === '') continue;
    const prev = beforeById.get(String(m.id));
    if (prev && clientMediaRecordUnchanged(prev, m) && existingByLegacy.has(String(m.id))) {
      continue;
    }

    const ex = existingByLegacy.get(String(m.id));
    const { error } = await sb.from('media_assets').upsert({
      id: ex?.id || legacyUuid('media', m.id),
      site_id: SITE_ID,
      legacy_id: m.id,
      file_name: m.name,
      url: m.url,
      url_hash: hashUrl(m.url),
      alt_text: m.alt || null,
      folder: m.folder || 'general',
      size_bytes: deriveSizeBytes(m.url, m.size),
      mime_type: deriveMimeType(m.url, m.type),
      usage_count: m.usageCount ?? 0,
      source: ex?.source === 'entity' ? 'entity' : 'manual',
      uploaded_at: m.uploadedAt || new Date().toISOString(),
      deleted_at: null,
    });
    if (error) throw error;
  }

  let propagation = { changed: false };
  try {
    propagation = await propagateMediaChangesToEntities(before, records);
  } catch (propErr) {
    console.error('[saveMedia] entity propagation failed:', propErr?.message || propErr);
    throw propErr;
  }
  try {
    await refreshMediaUsageCountsForMediaSave(before, records);
  } catch (refreshErr) {
    console.warn('[saveMedia] usage refresh failed:', refreshErr?.message || refreshErr);
  }
  invalidateCmsReadCaches();
  return propagation;
}

export async function deleteMediaByLegacyId(legacyId) {
  const before = await getMedia();
  const record = before.find((r) => String(r.id) === String(legacyId));
  if (!record) {
    return { changed: false, records: before, propagation: { changed: false } };
  }
  const after = before.filter((r) => String(r.id) !== String(legacyId));

  const sb = supabase();
  const { data: row, error: rowError } = await sb
    .from('media_assets')
    .select('id')
    .eq('site_id', SITE_ID)
    .eq('legacy_id', legacyId)
    .is('deleted_at', null)
    .maybeSingle();
  if (rowError) throw rowError;
  if (row) {
    const { error } = await sb.from('media_assets').delete().eq('id', row.id);
    if (error) throw error;
  }

  let propagation = { changed: false };
  try {
    propagation = await propagateMediaChangesToEntities(before, after);
  } catch (propErr) {
    console.error('[deleteMediaByLegacyId] entity propagation failed:', propErr?.message || propErr);
  }
  try {
    await refreshMediaUsageCountsForMediaSave(before, after);
  } catch (refreshErr) {
    console.warn('[deleteMediaByLegacyId] usage refresh failed:', refreshErr?.message || refreshErr);
  }
  invalidateCmsReadCaches();
  return { changed: true, records: after, propagation };
}

export async function updateMediaByLegacyId(legacyId, patch) {
  const before = await getMedia();
  const prev = before.find((r) => String(r.id) === String(legacyId));
  if (!prev) throw new Error('Media item not found');

  const next = { ...prev, ...patch, id: prev.id };
  const after = before.map((r) => (String(r.id) === String(legacyId) ? next : r));

  const sb = supabase();
  const { data: ex, error: exError } = await sb
    .from('media_assets')
    .select('id, source')
    .eq('site_id', SITE_ID)
    .eq('legacy_id', legacyId)
    .is('deleted_at', null)
    .maybeSingle();
  if (exError) throw exError;
  if (!ex) throw new Error('Media item not found in database');

  const { error } = await sb.from('media_assets').upsert({
    id: ex.id,
    site_id: SITE_ID,
    legacy_id: legacyId,
    file_name: next.name,
    url: next.url,
    url_hash: hashUrl(next.url),
    alt_text: next.alt || null,
    folder: next.folder || 'general',
    size_bytes: deriveSizeBytes(next.url, next.size),
    mime_type: deriveMimeType(next.url, next.type),
    usage_count: next.usageCount ?? 0,
    source: ex.source === 'entity' ? 'entity' : 'manual',
    uploaded_at: next.uploadedAt || new Date().toISOString(),
    deleted_at: null,
  });
  if (error) throw error;

  let propagation = { changed: false };
  try {
    propagation = await propagateMediaChangesToEntities(before, after);
  } catch (propErr) {
    console.error('[updateMediaByLegacyId] entity propagation failed:', propErr?.message || propErr);
  }
  try {
    await refreshMediaUsageCountsForMediaSave(before, after);
  } catch (refreshErr) {
    console.warn('[updateMediaByLegacyId] usage refresh failed:', refreshErr?.message || refreshErr);
  }
  invalidateCmsReadCaches();
  return { record: next, records: after, propagation };
}

// ─── Testimonials ────────────────────────────────────────────────────────────

function testimonialFromDb(row) {
  return {
    id: row.legacy_id,
    name: row.client_name,
    role: row.client_role || '',
    company: row.company || '',
    quote: row.quote,
    rating: row.rating,
    imageUrl: row.avatar_url || '',
    imageAlt: row.avatar_alt || '',
    featured: row.is_featured,
    createdAt: row.created_at,
  };
}

export async function getTestimonials() {
  return getCached('cms:testimonials', CMS_CACHE_TTL.lists, async () => {
    const { data, error } = await supabase()
      .from('testimonials')
      .select(TESTIMONIAL_COLUMNS)
      .eq('site_id', SITE_ID)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(testimonialFromDb);
  });
}

export async function saveTestimonials(records, { reconcileMedia = true } = {}) {
  const sb = supabase();
  const { data: existing } = await sb.from('testimonials').select('id, legacy_id').eq('site_id', SITE_ID);
  const incomingIds = new Set(records.map((r) => String(r.id)));
  const toDelete = (existing || []).filter((e) => !incomingIds.has(String(e.legacy_id)));
  if (toDelete.length) {
    const { error: deleteError } = await sb.from('testimonials').delete().in('id', toDelete.map((d) => d.id));
    if (deleteError) throw deleteError;
  }

  for (const t of records) {
    const ex = (existing || []).find((e) => String(e.legacy_id) === String(t.id));
    const { error } = await sb.from('testimonials').upsert({
      id: ex?.id || legacyUuid('testi', t.id),
      site_id: SITE_ID,
      legacy_id: t.id,
      client_name: t.name,
      client_role: t.role || null,
      company: t.company || null,
      quote: t.quote,
      rating: t.rating ?? 5,
      avatar_url: t.imageUrl || null,
      avatar_alt: t.imageAlt || null,
      is_featured: !!t.featured,
      created_at: t.createdAt || new Date().toISOString(),
    });
    if (error) throw error;
  }

  if (reconcileMedia) {
    await reconcileEntityMediaForRefs(collectTestimonialMediaRefs(records));
  }
  invalidateCmsReadCaches();
}

function blogFromDb(row, tags = []) {
  return {
    id: row.legacy_id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category_key,
    tags: mapBlogTagRows(tags),
    status: row.status,
    featured: row.is_featured,
    imageUrl: row.featured_image_url || '',
    imageAlt: row.featured_image_alt || '',
    publishedAt: row.published_at,
    sortOrder: row.sort_order,
    metaTitle: row.meta_title || '',
    metaDesc: row.meta_description || '',
    commentsEnabled: row.comments_enabled !== false,
    likesEnabled: row.likes_enabled !== false,
    commentsAutoApprove: !!row.comments_auto_approve,
    createdAt: row.created_at,
  };
}

export async function getBlogPosts({ includeContent = true } = {}) {
  return getCached(`cms:blog-posts:${includeContent ? 'full' : 'list'}`, CMS_CACHE_TTL.lists, async () => {
    const sb = supabase();
    const columns = includeContent
      ? `${BLOG_POST_COLUMNS}, content`
      : BLOG_POST_COLUMNS;
    const { data: rows, error } = await sb
      .from('blog_posts')
      .select(`${columns}, blog_post_tags(${BLOG_POST_TAG_COLUMNS})`)
      .eq('site_id', SITE_ID)
      .is('deleted_at', null)
      .order('created_at', ORDER_BY_NEWEST);
    if (error) throw error;
    if (!rows?.length) return [];

    return rows.map((row) => {
      const { blog_post_tags: tags, ...postRow } = row;
      return blogFromDb(postRow, tags || []);
    });
  });
}

export async function getBlogPostByLegacyId(legacyId) {
  const sb = supabase();
  const raw = String(legacyId || '').trim();
  if (!raw) return null;
  const legacyValue = /^\d+$/.test(raw) ? Number(raw) : raw;
  const { data: row, error } = await sb
    .from('blog_posts')
    .select(`${BLOG_POST_COLUMNS}, content, blog_post_tags(${BLOG_POST_TAG_COLUMNS})`)
    .eq('site_id', SITE_ID)
    .eq('legacy_id', legacyValue)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;
  const { blog_post_tags: tags, ...postRow } = row;
  return blogFromDb(postRow, tags || []);
}

async function saveBlogPostsLegacy(records) {
  const sb = supabase();
  const { data: existing } = await sb.from('blog_posts').select('id, legacy_id').eq('site_id', SITE_ID);
  const incomingIds = new Set(records.map((r) => String(r.id)));
  const toDelete = (existing || []).filter((e) => !incomingIds.has(String(e.legacy_id)));
  if (toDelete.length) {
    const delIds = toDelete.map((d) => d.id);
    const { error: tagError } = await sb.from('blog_post_tags').delete().in('blog_post_id', delIds);
    if (tagError) throw tagError;
    const { error: deleteError } = await sb.from('blog_posts').delete().in('id', delIds);
    if (deleteError) throw deleteError;
  }

  for (const p of records) {
    const ex = (existing || []).find((e) => String(e.legacy_id) === String(p.id));
    const postId = ex?.id || legacyUuid('blog', p.id);
    const { error } = await sb.from('blog_posts').upsert({
      id: postId,
      site_id: SITE_ID,
      legacy_id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      category_key: p.category,
      status: p.status,
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
    });
    if (error) throw error;

    await sb.from('blog_post_tags').delete().eq('blog_post_id', postId);
    if (p.tags?.length) {
      const labelIds = await getOrCreateLabelIds(sb, SITE_ID, 'blog_tags', p.tags);
      const tagRows = labelIds.map((blog_tag_id, i) => ({
        blog_post_id: postId,
        blog_tag_id,
        sort_order: i,
      }));
      const { error: tagInsertError } = await sb.from('blog_post_tags').insert(tagRows);
      if (tagInsertError) throw tagInsertError;
    }
  }
}

export async function saveBlogPosts(records, { reconcileMedia = true } = {}) {
  const sb = supabase();
  const { data: existing, error: fetchError } = await sb
    .from('blog_posts')
    .select('id, legacy_id')
    .eq('site_id', SITE_ID);
  if (fetchError) throw fetchError;

  if (!(await cmsBatchWritesEnabled())) {
    await saveBlogPostsLegacy(records);
  } else {
    await saveBlogPostsBatch(records, existing || []);
  }

  if (reconcileMedia) {
    await reconcileEntityMediaForRefs(collectBlogMediaRefs(records));
  }
  invalidateCmsReadCaches();
}

// ─── Experience ──────────────────────────────────────────────────────────────

function experienceFromDb(row) {
  return {
    id: row.legacy_id,
    title: row.job_title,
    company: row.company,
    location: row.location || '',
    type: row.employment_type,
    startDate: row.start_date,
    endDate: row.end_date || '',
    current: row.is_current,
    desc: row.description || '',
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export async function getExperience() {
  return getCached('cms:experience', CMS_CACHE_TTL.lists, async () => {
    const { data, error } = await supabase()
      .from('experience_entries')
      .select(EXPERIENCE_COLUMNS)
      .eq('site_id', SITE_ID)
      .is('deleted_at', null)
      .order('created_at', ORDER_BY_NEWEST);
    if (error) throw error;
    return (data || []).map(experienceFromDb);
  });
}

export async function saveExperience(records) {
  const sb = supabase();
  const { data: existing } = await sb.from('experience_entries').select('id, legacy_id').eq('site_id', SITE_ID);
  const incomingIds = new Set(records.map((r) => String(r.id)));
  const toDelete = (existing || []).filter((e) => !incomingIds.has(String(e.legacy_id)));
  if (toDelete.length) {
    const { error: deleteError } = await sb.from('experience_entries').delete().in('id', toDelete.map((d) => d.id));
    if (deleteError) throw deleteError;
  }

  for (const e of records) {
    const ex = (existing || []).find((x) => String(x.legacy_id) === String(e.id));
    const { error } = await sb.from('experience_entries').upsert({
      id: ex?.id || legacyUuid('exp', e.id),
      site_id: SITE_ID,
      legacy_id: e.id,
      job_title: e.title,
      company: e.company,
      location: e.location || null,
      employment_type: e.type,
      start_date: e.startDate,
      end_date: e.current ? null : (e.endDate || null),
      is_current: !!e.current,
      description: e.desc || null,
      sort_order: e.sortOrder ?? 0,
    });
    if (error) throw error;
  }
  invalidateCmsReadCaches();
}

// ─── Contact messages ────────────────────────────────────────────────────────

function replyFromDb(row) {
  return {
    id: row.id,
    body: row.body || '',
    subject: row.subject || '',
    cc: row.cc || '',
    attachmentUrl: row.attachment_url || '',
    attachmentName: row.attachment_name || '',
    attachmentMime: row.attachment_mime || '',
    attachmentSize: row.attachment_size ?? null,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function messageFromDb(row, replies = []) {
  const thread = (replies || [])
    .slice()
    .sort((a, b) => new Date(a.sent_at || a.created_at) - new Date(b.sent_at || b.created_at))
    .map(replyFromDb);

  const latest = thread.length ? thread[thread.length - 1] : null;

  // Portfolio contact form inserts often omit legacy_id — fall back to UUID so the inbox can select/reply/delete.
  return {
    id: row.legacy_id != null ? row.legacy_id : row.id,
    dbId: row.id,
    name: row.sender_name,
    email: row.sender_email,
    subject: row.subject,
    snippet: row.snippet || '',
    message: row.body,
    status: row.status,
    createdAt: row.created_at,
    ip: row.sender_ip || '',
    replies: thread,
    reply: latest?.body || row.reply_body || '',
    repliedAt: latest?.sentAt || row.replied_at || null,
    starred: row.is_starred,
  };
}

function findExistingContactMessage(existing, messageId) {
  const id = messageId == null ? '' : String(messageId);
  if (!id || id === 'null' || id === 'undefined') return null;
  if (isUuid(id)) return (existing || []).find((e) => e.id === id) || null;
  return (existing || []).find((e) => e.legacy_id != null && String(e.legacy_id) === id) || null;
}

function nextContactLegacyId(existing, records) {
  let max = 0;
  for (const row of existing || []) {
    if (row.legacy_id != null && Number(row.legacy_id) > max) max = Number(row.legacy_id);
  }
  for (const m of records || []) {
    if (m?.id == null || isUuid(String(m.id))) continue;
    const n = Number(m.id);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

async function loadRepliesByMessageIds(messageIds) {
  if (!messageIds?.length) return new Map();
  const sb = supabase();
  const { data, error } = await sb
    .from('contact_message_replies')
    .select(CONTACT_REPLY_COLUMNS)
    .in('message_id', messageIds)
    .order('sent_at', { ascending: true });
  if (error) throw error;
  const map = new Map();
  for (const row of data || []) {
    const list = map.get(row.message_id) || [];
    list.push(row);
    map.set(row.message_id, list);
  }
  return map;
}

export const CONTACT_PAGE_SIZE = 50;

async function backfillContactMessageLegacyIds(sb, rows) {
  const missing = (rows || []).filter((row) => row.legacy_id == null);
  if (!missing.length) return;

  let nextLegacy = 0;
  for (const row of rows) {
    if (row.legacy_id != null && Number(row.legacy_id) > nextLegacy) nextLegacy = Number(row.legacy_id);
  }
  for (const row of missing.slice().reverse()) {
    nextLegacy += 1;
    const { error: updateError } = await sb
      .from('contact_messages')
      .update({ legacy_id: nextLegacy })
      .eq('id', row.id);
    if (updateError) throw updateError;
    row.legacy_id = nextLegacy;
  }
  invalidateCachePrefix('cms:contact-messages');
}

export async function getContactMessagesPage({ cursor = null, limit = CONTACT_PAGE_SIZE } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || CONTACT_PAGE_SIZE, 1), 100);
  const cacheKey = `cms:contact-messages:${cursor || 'start'}:${safeLimit}`;

  return getCached(cacheKey, CMS_CACHE_TTL.lists, async () => {
    const sb = supabase();
    let query = sb
      .from('contact_messages')
      .select(CONTACT_MESSAGE_COLUMNS, { count: 'exact' })
      .eq('site_id', SITE_ID)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(safeLimit + 1);

    if (cursor) {
      const parts = String(cursor).split('|');
      if (parts.length === 2 && parts[0] && parts[1]) {
        const [createdAt, id] = parts;
        query = query.or(`created_at.lt."${createdAt}",and(created_at.eq."${createdAt}",id.lt."${id}")`);
      } else {
        console.warn('[getContactMessagesPage] invalid cursor, using first page');
      }
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const rows = data || [];
    await backfillContactMessageLegacyIds(sb, rows);

    const hasMore = rows.length > safeLimit;
    const page = hasMore ? rows.slice(0, safeLimit) : rows;
    const nextCursor = hasMore
      ? `${page[page.length - 1].created_at}|${page[page.length - 1].id}`
      : null;

    const replyMap = await loadRepliesByMessageIds(page.map((r) => r.id));
    return {
      items: page.map((row) => messageFromDb(row, replyMap.get(row.id) || [])),
      nextCursor,
      total: count ?? page.length,
    };
  });
}

export async function getAllContactMessages() {
  const items = [];
  let cursor = null;
  do {
    const page = await getContactMessagesPage({ cursor, limit: 100 });
    items.push(...(page.items || []));
    cursor = page.nextCursor;
  } while (cursor);
  return items;
}

/** @deprecated Use getContactMessagesPage or getAllContactMessages */
export async function getContactMessages() {
  return getAllContactMessages();
}

export async function findContactMessageById(messageId) {
  const sb = supabase();
  const id = messageId == null ? '' : String(messageId);
  if (!id || id === 'null' || id === 'undefined') return null;

  let query = sb
    .from('contact_messages')
    .select(CONTACT_MESSAGE_COLUMNS)
    .eq('site_id', SITE_ID)
    .is('deleted_at', null);

  query = isUuid(id) ? query.eq('id', id) : query.eq('legacy_id', Number(id));

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getContactMessageWithReplies(messageId) {
  const row = await findContactMessageById(messageId);
  if (!row) return null;
  const replyMap = await loadRepliesByMessageIds([row.id]);
  return messageFromDb(row, replyMap.get(row.id) || []);
}

async function syncParentReplyFields(messageUuid) {
  const sb = supabase();
  const { data: replies, error } = await sb
    .from('contact_message_replies')
    .select(CONTACT_REPLY_COLUMNS)
    .eq('message_id', messageUuid)
    .order('sent_at', { ascending: false });
  if (error) throw error;

  const latest = (replies || [])[0] || null;
  const { data, error: updateError } = await sb
    .from('contact_messages')
    .update({
      reply_body: latest?.body || null,
      replied_at: latest?.sent_at || null,
      status: latest ? 'replied' : 'read',
    })
    .eq('id', messageUuid)
    .select(CONTACT_MESSAGE_COLUMNS)
    .single();
  if (updateError) throw updateError;
  return messageFromDb(data, replies || []);
}

export async function createContactReply(messageId, payload, { reconcileMedia = true } = {}) {
  const row = await findContactMessageById(messageId);
  if (!row) throw new Error('Message not found');

  const body = String(payload.body || '').trim();
  if (!body) throw new Error('Please write a reply before sending.');

  const sentAt = new Date().toISOString();
  const { data: replyRow, error } = await supabase()
    .from('contact_message_replies')
    .insert({
      message_id: row.id,
      body,
      subject: payload.subject || row.subject || null,
      cc: payload.cc || null,
      attachment_url: payload.attachmentUrl || null,
      attachment_name: payload.attachmentName || null,
      attachment_mime: payload.attachmentMime || null,
      attachment_size: payload.attachmentSize ?? null,
      sent_at: sentAt,
    })
    .select(CONTACT_REPLY_COLUMNS)
    .single();
  if (error) throw error;

  const message = await syncParentReplyFields(row.id);
  if (reconcileMedia && contactReplyMediaChanged(payload)) {
    await reconcileEntityMediaForRefs(collectContactReplyMediaRefs([{
      attachmentUrl: payload.attachmentUrl,
      attachmentName: payload.attachmentName,
      attachmentMime: payload.attachmentMime,
      attachmentSize: payload.attachmentSize,
    }]));
  }
  invalidateCmsReadCaches();
  return { message, reply: replyFromDb(replyRow) };
}

export async function updateContactReply(replyId, payload) {
  const sb = supabase();
  const { data: existing, error: findError } = await sb
    .from('contact_message_replies')
    .select(CONTACT_REPLY_COLUMNS)
    .eq('id', replyId)
    .maybeSingle();
  if (findError) throw findError;
  if (!existing) throw new Error('Reply not found');

  const body = payload.body != null ? String(payload.body).trim() : existing.body;
  if (!body) throw new Error('Reply text cannot be empty.');

  const patch = {
    body,
    subject: payload.subject != null ? payload.subject : existing.subject,
    cc: payload.cc != null ? payload.cc : existing.cc,
  };
  if (payload.attachmentUrl !== undefined) {
    patch.attachment_url = payload.attachmentUrl || null;
    patch.attachment_name = payload.attachmentName || null;
    patch.attachment_mime = payload.attachmentMime || null;
    patch.attachment_size = payload.attachmentSize ?? null;
  }

  const { error } = await sb
    .from('contact_message_replies')
    .update(patch)
    .eq('id', replyId);
  if (error) throw error;

  const message = await syncParentReplyFields(existing.message_id);
  if (contactReplyMediaChanged(payload)) {
    await reconcileEntityMediaForRefs(collectContactReplyMediaRefs([{
      attachmentUrl: payload.attachmentUrl ?? existing.attachment_url,
      attachmentName: payload.attachmentName ?? existing.attachment_name,
      attachmentMime: payload.attachmentMime ?? existing.attachment_mime,
      attachmentSize: payload.attachmentSize ?? existing.attachment_size,
    }]));
  }
  invalidateCmsReadCaches();
  const reply = (message.replies || []).find((r) => String(r.id) === String(replyId));
  return { message, reply };
}

export async function deleteContactReply(replyId) {
  const sb = supabase();
  const { data: existing, error: findError } = await sb
    .from('contact_message_replies')
    .select('id, message_id, attachment_url')
    .eq('id', replyId)
    .maybeSingle();
  if (findError) throw findError;
  if (!existing) throw new Error('Reply not found');

  const { error } = await sb.from('contact_message_replies').delete().eq('id', replyId);
  if (error) throw error;

  const message = await syncParentReplyFields(existing.message_id);
  if (normAttachmentUrl(existing.attachment_url)) {
    await reconcileEntityMediaForRefs(collectContactReplyMediaRefs([{
      attachmentUrl: existing.attachment_url,
      attachmentName: existing.attachment_name,
    }]));
  }
  invalidateCmsReadCaches();
  return { message };
}

function normAttachmentUrl(value) {
  return String(value || '').trim();
}

/** @deprecated Prefer createContactReply — kept for compatibility */
export async function applyContactReply(messageId, replyBody) {
  const { message } = await createContactReply(messageId, { body: replyBody });
  return message;
}

export async function saveContactMessages(records) {
  const sb = supabase();
  const list = Array.isArray(records) ? records : [];
  const { data: existing } = await sb.from('contact_messages').select('id, legacy_id').eq('site_id', SITE_ID);

  const keepIds = new Set();
  for (const m of list) {
    const ex = findExistingContactMessage(existing, m.id);
    if (ex) keepIds.add(ex.id);
  }

  const toDelete = (existing || []).filter((e) => !keepIds.has(e.id));
  if (toDelete.length) {
    const { error: deleteError } = await sb.from('contact_messages').delete().in('id', toDelete.map((d) => d.id));
    if (deleteError) throw deleteError;
  }

  let nextLegacy = nextContactLegacyId(existing, list);

  for (const m of list) {
    const ex = findExistingContactMessage(existing, m.id);
    let legacyId = ex?.legacy_id ?? null;
    if (legacyId == null) {
      if (!isUuid(String(m.id)) && m.id != null && String(m.id) !== '' && Number.isFinite(Number(m.id))) {
        legacyId = Number(m.id);
      } else {
        nextLegacy += 1;
        legacyId = nextLegacy;
      }
    }

    const rowId = ex?.id || (isUuid(String(m.id)) ? m.id : legacyUuid('msg', legacyId));
    const latestReply = Array.isArray(m.replies) && m.replies.length
      ? m.replies[m.replies.length - 1]
      : null;
    const { error } = await sb.from('contact_messages').upsert({
      id: rowId,
      site_id: SITE_ID,
      legacy_id: legacyId,
      sender_name: m.name,
      sender_email: m.email,
      subject: m.subject,
      snippet: m.snippet || null,
      body: m.message,
      status: m.status,
      sender_ip: m.ip || null,
      reply_body: latestReply?.body || m.reply || null,
      replied_at: latestReply?.sentAt || m.repliedAt || null,
      is_starred: !!m.starred,
      created_at: m.createdAt || new Date().toISOString(),
    });
    if (error) throw error;
  }
  invalidateCmsReadCaches();
}

// ─── Site settings (pa_settings) ───────────────────────────────────────────

/** One site_settings row per request — shared by getSettings / getContactColumnVisibility. */
const fetchSiteSettingsRow = cache(async () => getCached('cms:site-settings', CMS_CACHE_TTL.settings, async () => {
  const { data, error } = await supabase()
    .from('site_settings')
    .select(SITE_SETTINGS_COLUMNS)
    .eq('site_id', SITE_ID)
    .maybeSingle();
  if (error) throw error;
  return data;
}));

export async function getSettings() {
  const data = await fetchSiteSettingsRow();
  if (!data) return {};
  return {
    siteTitle: data.site_title,
    title: data.site_title,
    siteTagline: data.site_tagline,
    tagline: data.site_tagline,
    siteUrl: data.site_url,
    url: data.site_url,
    adminEmail: data.admin_email,
    email: data.admin_email,
    siteDescription: data.site_description,
    description: data.site_description,
    dateFormat: data.date_format,
    timeFormat: data.time_format,
    timezone: data.timezone,
    itemsPerPage: String(data.items_per_page ?? 12),
    defaultView: data.default_view === 'list' ? 'list' : 'grid',
    language: data.language || 'en',
    maintenanceMode: data.maintenance_mode,
    fullName: data.profile_full_name || '',
    username: data.profile_username || '',
    role: data.profile_role || '',
    phone: data.profile_phone || '',
    dob: data.profile_dob || '',
    bio: data.profile_bio || '',
    location: data.profile_location || '',
    website: data.profile_website || '',
    socialLinks: data.profile_social_links || [],
  };
}

function parseItemsPerPage(value, fallback = 12) {
  const n = parseInt(String(value ?? '').replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseDefaultView(value, fallback = 'grid') {
  const raw = String(value || '').toLowerCase();
  if (raw === 'list' || raw.includes('list')) return 'list';
  if (raw === 'grid' || raw.includes('grid')) return 'grid';
  return fallback;
}

export async function saveSettings(settings) {
  const existing = await fetchSiteSettingsRow();
  const row = {
    site_id: SITE_ID,
    site_title: settings.siteTitle ?? settings.title ?? existing?.site_title ?? 'My Portfolio',
    site_tagline: settings.siteTagline ?? settings.tagline ?? existing?.site_tagline ?? null,
    site_url: settings.siteUrl ?? settings.url ?? existing?.site_url ?? null,
    admin_email: settings.adminEmail ?? settings.email ?? existing?.admin_email ?? null,
    site_description: settings.siteDescription ?? settings.description ?? existing?.site_description ?? null,
    date_format: settings.dateFormat ?? existing?.date_format ?? null,
    time_format: settings.timeFormat ?? existing?.time_format ?? null,
    timezone: settings.timezone ?? existing?.timezone ?? null,
    items_per_page: settings.itemsPerPage != null
      ? parseItemsPerPage(settings.itemsPerPage, existing?.items_per_page ?? 12)
      : (existing?.items_per_page ?? 12),
    default_view: settings.defaultView != null
      ? parseDefaultView(settings.defaultView, existing?.default_view ?? 'grid')
      : (existing?.default_view ?? 'grid'),
    language: settings.language ?? existing?.language ?? 'en',
    maintenance_mode: settings.maintenanceMode != null
      ? !!settings.maintenanceMode
      : !!existing?.maintenance_mode,
    profile_full_name: settings.fullName ?? existing?.profile_full_name ?? null,
    profile_username: settings.username ?? existing?.profile_username ?? null,
    profile_role: settings.role ?? existing?.profile_role ?? null,
    profile_phone: settings.phone ?? existing?.profile_phone ?? null,
    profile_dob: settings.dob ?? existing?.profile_dob ?? null,
    profile_bio: settings.bio ?? existing?.profile_bio ?? null,
    profile_location: settings.location ?? existing?.profile_location ?? null,
    profile_website: settings.website ?? existing?.profile_website ?? null,
    profile_social_links: settings.socialLinks ?? existing?.profile_social_links ?? [],
  };
  const { error } = await supabase().from('site_settings').upsert(row, { onConflict: 'site_id' });
  if (error) throw error;
  invalidateCache('cms:site-settings');
  invalidateCmsReadCaches();
}

// ─── Contact column visibility ───────────────────────────────────────────────

export async function getContactColumnVisibility() {
  const data = await fetchSiteSettingsRow();
  return data?.contact_message_columns || null;
}

export async function saveContactColumnVisibility(columns) {
  const { error } = await supabase()
    .from('site_settings')
    .upsert({ site_id: SITE_ID, contact_message_columns: columns }, { onConflict: 'site_id' });
  if (error) throw error;
  invalidateCache('cms:site-settings');
  invalidateCmsReadCaches();
}

// ─── Tools showcase (/tools) ─────────────────────────────────────────────────

const CATEGORY_CLS_ICON = {
  'pa-cat-enterprise': 'ri-building-2-line',
  'pa-cat-educational': 'ri-graduation-cap-line',
  'pa-cat-desktop': 'ri-computer-line',
  'pa-cat-medical': 'ri-heart-pulse-line',
  'pa-cat-ecommerce': 'ri-shopping-bag-line',
  'pa-cat-travel': 'ri-flight-takeoff-line',
  'pa-cat-web': 'ri-globe-line',
  'pa-cat-nonprofit': 'ri-hand-heart-line',
};

const CATEGORY_CLS_COLOR = {
  'pa-cat-enterprise': '#22c55e',
  'pa-cat-educational': '#dc12f7',
  'pa-cat-desktop': '#31f1d8',
  'pa-cat-medical': '#ff6600',
  'pa-cat-ecommerce': '#a78bfa',
  'pa-cat-travel': '#ced11b',
  'pa-cat-web': '#445deb',
  'pa-cat-nonprofit': '#f0437e',
};

function toolCategoryFromDb(row, items = []) {
  return {
    id: row.legacy_id,
    key: row.key,
    label: row.label,
    description: row.description || '',
    proficiencyPct: row.proficiency_pct,
    iconClass: row.icon_class || 'ri-tools-line',
    color: row.color || '#34d399',
    sortOrder: row.sort_order,
    items: items
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        id: item.legacy_id,
        name: item.name,
        iconClass: item.icon_class || 'ri-checkbox-blank-circle-line',
        iconUrl: item.icon_url || '',
        sortOrder: item.sort_order,
      })),
  };
}

function toolCategoryToDb(cat) {
  return {
    key: cat.key,
    label: cat.label,
    description: cat.description || null,
    proficiency_pct: cat.proficiencyPct ?? 0,
    icon_class: cat.iconClass || null,
    color: cat.color || '#34d399',
    sort_order: cat.sortOrder ?? 0,
    legacy_id: cat.id,
  };
}

function toolCategoryRowFromDb(row) {
  return {
    id: row.legacy_id,
    key: row.key,
    label: row.label,
    description: row.description || '',
    proficiencyPct: row.proficiency_pct,
    iconClass: row.icon_class || 'ri-tools-line',
    color: row.color || '#34d399',
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function toolItemFromDb(row, categoryLegacyId) {
  return {
    id: row.legacy_id,
    name: row.name,
    iconClass: row.icon_class || 'ri-checkbox-blank-circle-line',
    iconUrl: row.icon_url || '',
    sortOrder: row.sort_order,
    categoryId: categoryLegacyId,
    createdAt: row.created_at,
  };
}

export async function getToolCategories() {
  return getCached('cms:tool-categories', CMS_CACHE_TTL.lists, async () => {
    const sb = supabase();
    const { data: rows, error } = await sb
      .from('tool_categories')
      .select(TOOL_CATEGORY_COLUMNS)
      .eq('site_id', SITE_ID)
      .is('deleted_at', null)
      .order('created_at', ORDER_BY_NEWEST);
    if (error) throw error;
    return (rows || []).map(toolCategoryRowFromDb);
  });
}

export async function saveToolCategories(categories) {
  const sb = supabase();
  const { data: existing, error: fetchError } = await sb
    .from('tool_categories')
    .select('id, legacy_id')
    .eq('site_id', SITE_ID);
  if (fetchError) throw fetchError;

  const incomingIds = new Set((categories || []).map((c) => String(c.id)));
  const toDelete = (existing || []).filter((e) => !incomingIds.has(String(e.legacy_id)));
  if (toDelete.length) {
    const delIds = toDelete.map((d) => d.id);
    const { count: techCount, error: techCountError } = await sb
      .from('technologies')
      .select('id', { count: 'exact', head: true })
      .in('category_id', delIds)
      .is('deleted_at', null);
    if (techCountError) throw techCountError;
    if (techCount > 0) {
      throw new Error(`Cannot delete tool categor${toDelete.length === 1 ? 'y' : 'ies'} because ${techCount} technolog${techCount === 1 ? 'y' : 'ies'} still use ${toDelete.length === 1 ? 'it' : 'them'}.`);
    }
    const { error: itemDelError } = await sb.from('tool_items').delete().in('category_id', delIds);
    if (itemDelError) throw itemDelError;
    const { error: catDelError } = await sb.from('tool_categories').delete().in('id', delIds);
    if (catDelError) throw catDelError;
  }

  for (const cat of categories || []) {
    const ex = (existing || []).find((e) => String(e.legacy_id) === String(cat.id));
    const categoryId = ex?.id || legacyUuid('toolCat', cat.id);
    const { error } = await sb.from('tool_categories').upsert({
      id: categoryId,
      site_id: SITE_ID,
      ...toolCategoryToDb(cat),
      deleted_at: null,
    }, { onConflict: 'id' });
    if (error) throw error;
  }
  invalidateCmsReadCaches();
}

// ─── Blog categories (/blog-categories) ──────────────────────────────────────

function categoryClassFromKey(key) {
  const normalized = String(key || '').trim().toLowerCase();
  const candidate = `pa-cat-${normalized}`;
  return CATEGORY_CLS_ICON[candidate] ? candidate : 'pa-cat-web';
}

function blogCategoryToDb(cat) {
  const cls = categoryClassFromKey(cat.key);
  return {
    key: cat.key,
    label: cat.label,
    description: cat.desc || cat.description || null,
    proficiency_pct: cat.proficiencyPct ?? 0,
    icon_class: cat.iconClass || CATEGORY_CLS_ICON[cls] || 'ri-article-line',
    color: cat.color || CATEGORY_CLS_COLOR[cls] || '#ff6600',
    sort_order: cat.sortOrder ?? 0,
    legacy_id: cat.id,
  };
}

function blogCategoryRowFromDb(row) {
  return {
    id: row.legacy_id,
    key: row.key,
    label: row.label,
    desc: row.description || '',
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export async function getBlogCategories() {
  return getCached('cms:blog-categories', CMS_CACHE_TTL.lists, async () => {
    const sb = supabase();
    const { data: rows, error } = await sb
      .from('blog_categories')
      .select(BLOG_CATEGORY_COLUMNS)
      .eq('site_id', SITE_ID)
      .is('deleted_at', null)
      .order('created_at', ORDER_BY_NEWEST);
    if (error) throw error;
    return (rows || []).map(blogCategoryRowFromDb);
  });
}

export async function saveBlogCategories(categories) {
  const sb = supabase();
  const { data: existing, error: fetchError } = await sb
    .from('blog_categories')
    .select('id, legacy_id, key')
    .eq('site_id', SITE_ID);
  if (fetchError) throw fetchError;

  const incomingIds = new Set((categories || []).map((c) => String(c.id)));
  const toDelete = (existing || []).filter((e) => !incomingIds.has(String(e.legacy_id)));
  for (const cat of toDelete) {
    const { count, error: countError } = await sb
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', SITE_ID)
      .eq('category_key', cat.key)
      .is('deleted_at', null);
    if (countError) throw countError;
    if (count > 0) {
      throw new Error(`Cannot delete category "${cat.key}" because ${count} blog post(s) still use it.`);
    }
    const { error: deleteError } = await sb.from('blog_categories').delete().eq('id', cat.id);
    if (deleteError) throw deleteError;
  }

  for (const cat of categories || []) {
    const ex = (existing || []).find((e) => String(e.legacy_id) === String(cat.id));
    if (ex && ex.key !== cat.key) {
      const { error: rekeyError } = await sb
        .from('blog_posts')
        .update({ category_key: cat.key })
        .eq('site_id', SITE_ID)
        .eq('category_key', ex.key);
      if (rekeyError) throw rekeyError;
    }
    const categoryId = ex?.id || legacyUuid('blogCat', cat.id);
    const { error } = await sb.from('blog_categories').upsert({
      id: categoryId,
      site_id: SITE_ID,
      ...blogCategoryToDb(cat),
      deleted_at: null,
    }, { onConflict: 'id' });
    if (error) throw error;
  }
  invalidateCmsReadCaches();
}

export async function getToolItems() {
  return getCached('cms:tools', CMS_CACHE_TTL.lists, async () => {
    const sb = supabase();
    const { data: categories, error: catError } = await sb
      .from('tool_categories')
      .select('id, legacy_id')
      .eq('site_id', SITE_ID)
      .is('deleted_at', null);
    if (catError) throw catError;

    const categoryIds = (categories || []).map((c) => c.id);
    if (!categoryIds.length) return [];

    const legacyById = new Map((categories || []).map((c) => [c.id, c.legacy_id]));
    const { data: items, error } = await sb
      .from('tool_items')
      .select(TOOL_ITEM_COLUMNS)
      .in('category_id', categoryIds)
      .order('created_at', ORDER_BY_NEWEST);
    if (error) throw error;

    return (items || []).map((item) => toolItemFromDb(item, legacyById.get(item.category_id)));
  });
}

export async function saveToolItems(items, { reconcileMedia = true } = {}) {
  const sb = supabase();
  const { data: categories, error: catError } = await sb
    .from('tool_categories')
    .select('id, legacy_id')
    .eq('site_id', SITE_ID)
    .is('deleted_at', null);
  if (catError) throw catError;

  const categoryUuidByLegacy = new Map((categories || []).map((c) => [String(c.legacy_id), c.id]));
  const categoryUuids = (categories || []).map((c) => c.id);

  const { data: existingItems, error: fetchError } = categoryUuids.length
    ? await sb
      .from('tool_items')
      .select('id, legacy_id, category_id')
      .in('category_id', categoryUuids)
    : { data: [], error: null };
  if (fetchError) throw fetchError;

  const incomingIds = new Set((items || []).map((i) => String(i.id)));
  const toDelete = (existingItems || []).filter((i) => !incomingIds.has(String(i.legacy_id)));
  if (toDelete.length) {
    const { error: deleteError } = await sb
      .from('tool_items')
      .delete()
      .in('id', toDelete.map((i) => i.id));
    if (deleteError) throw deleteError;
  }

  for (const item of items || []) {
    const categoryUuid = categoryUuidByLegacy.get(String(item.categoryId));
    if (!categoryUuid) {
      throw new Error(`Unknown tool category id: ${item.categoryId}`);
    }
    const exItem = (existingItems || []).find((i) => String(i.legacy_id) === String(item.id));
    const { error: itemError } = await sb.from('tool_items').upsert({
      id: exItem?.id || legacyUuid('toolItem', item.id),
      category_id: categoryUuid,
      legacy_id: item.id,
      name: item.name,
      icon_class: item.iconClass || null,
      icon_url: item.iconUrl || null,
      sort_order: item.sortOrder ?? 0,
    }, { onConflict: 'id' });
    if (itemError) throw itemError;
  }

  if (reconcileMedia) {
    await reconcileEntityMediaForRefs(collectToolMediaRefs(items));
  }
  invalidateCmsReadCaches();
}

/** @deprecated Use getToolCategories + getToolItems */
export async function getTools() {
  const sb = supabase();
  const { data: rows, error } = await sb
    .from('tool_categories')
    .select('*')
    .eq('site_id', SITE_ID)
    .is('deleted_at', null)
    .order('created_at', ORDER_BY_NEWEST);
  if (error) throw error;
  if (!rows?.length) return [];

  const ids = rows.map((r) => r.id);
  const { data: items, error: itemsError } = await sb
    .from('tool_items')
    .select('*')
    .in('category_id', ids)
    .order('created_at', ORDER_BY_NEWEST);
  if (itemsError) throw itemsError;

  return rows.map((row) => toolCategoryFromDb(
    row,
    (items || []).filter((i) => i.category_id === row.id),
  ));
}

/** @deprecated Use saveToolCategories or saveToolItems */
export async function saveTools(categories) {
  const sb = supabase();
  const { data: existing, error: fetchError } = await sb
    .from('tool_categories')
    .select('id, legacy_id')
    .eq('site_id', SITE_ID);
  if (fetchError) throw fetchError;

  const incomingIds = new Set((categories || []).map((c) => String(c.id)));
  const toDelete = (existing || []).filter((e) => !incomingIds.has(String(e.legacy_id)));
  if (toDelete.length) {
    const delIds = toDelete.map((d) => d.id);
    const { error: itemDelError } = await sb.from('tool_items').delete().in('category_id', delIds);
    if (itemDelError) throw itemDelError;
    const { error: catDelError } = await sb.from('tool_categories').delete().in('id', delIds);
    if (catDelError) throw catDelError;
  }

  for (const cat of categories || []) {
    const ex = (existing || []).find((e) => String(e.legacy_id) === String(cat.id));
    const categoryId = ex?.id || legacyUuid('toolCat', cat.id);
    const { error } = await sb.from('tool_categories').upsert({
      id: categoryId,
      site_id: SITE_ID,
      ...toolCategoryToDb(cat),
      deleted_at: null,
    }, { onConflict: 'id' });
    if (error) throw error;

    const { data: existingItems } = await sb
      .from('tool_items')
      .select('id, legacy_id')
      .eq('category_id', categoryId);
    const incomingItemIds = new Set((cat.items || []).map((i) => String(i.id)));
    const itemsToDelete = (existingItems || []).filter((i) => !incomingItemIds.has(String(i.legacy_id)));
    if (itemsToDelete.length) {
      const { error: deleteItemsError } = await sb
        .from('tool_items')
        .delete()
        .in('id', itemsToDelete.map((i) => i.id));
      if (deleteItemsError) throw deleteItemsError;
    }

    for (const item of cat.items || []) {
      const exItem = (existingItems || []).find((i) => String(i.legacy_id) === String(item.id));
      const { error: itemError } = await sb.from('tool_items').upsert({
        id: exItem?.id || legacyUuid('toolItem', item.id),
        category_id: categoryId,
        legacy_id: item.id,
        name: item.name,
        icon_class: item.iconClass || null,
        icon_url: item.iconUrl || null,
        sort_order: item.sortOrder ?? 0,
      }, { onConflict: 'id' });
      if (itemError) throw itemError;
    }
  }

  const toolRefs = (categories || []).flatMap((cat) => collectToolMediaRefs(cat.items || []));
  await reconcileEntityMediaForRefs(toolRefs);
}

// ─── Recent Activities ─────────────────────────────────────────────────────

export function activityFromDb(row, profile = null) {
  const userName = profile?.full_name
    || profile?.username
    || profile?.email
    || row.metadata?.userName
    || 'System';
  return {
    id: row.id,
    userId: row.user_id,
    userName,
    userEmail: profile?.email || row.metadata?.userEmail || null,
    actionTitle: row.action_title,
    actionDescription: row.action_description || '',
    type: row.type,
    status: row.status,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

function computeTypeGrowth(rows, type, nowMs) {
  const week = 7 * 86400000;
  const current = rows.filter((r) => {
    if (r.type !== type) return false;
    const t = new Date(r.created_at).getTime();
    return nowMs - t <= week;
  }).length;
  const previous = rows.filter((r) => {
    if (r.type !== type) return false;
    const t = new Date(r.created_at).getTime();
    return nowMs - t > week && nowMs - t <= week * 2;
  }).length;
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function getRecentActivitiesPayload({ userId = null, scopeAll = true } = {}) {
  const cacheKey = scopeAll
    ? 'cms:recent-activities'
    : `cms:recent-activities:user:${userId || 'unknown'}`;

  return getCached(cacheKey, CMS_CACHE_TTL.recentActivities, async () => {
    schedulePurgeExpiredRecentActivities();

    const sb = supabase();
    let query = sb
      .from('recent_activities')
      .select(RECENT_ACTIVITY_COLUMNS)
      .eq('site_id', SITE_ID)
      .gte('created_at', recentActivityRetentionCutoffIso())
      .order('created_at', { ascending: false })
      .limit(RECENT_ACTIVITIES_LIMIT);

    if (!scopeAll && userId) {
      query = query.eq('user_id', userId);
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    const userIds = [...new Set((rows || []).map((r) => r.user_id).filter(Boolean))];
    let profiles = [];
    if (userIds.length) {
      const { data: profileRows } = await sb
        .from('profiles')
        .select('id, full_name, username, email, avatar_url')
        .in('id', userIds);
      profiles = profileRows || [];
    }
    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const activities = (rows || []).map((row) => activityFromDb(row, profileMap.get(row.user_id)));

    const nowMs = Date.now();
    const stats = {
      userAction: {
        count: activities.filter((a) => a.type === 'user_action').length,
        growth: computeTypeGrowth(rows || [], 'user_action', nowMs),
      },
      systemEvent: {
        count: activities.filter((a) => a.type === 'system_event').length,
        growth: computeTypeGrowth(rows || [], 'system_event', nowMs),
      },
      contentChange: {
        count: activities.filter((a) => a.type === 'content_change').length,
        growth: computeTypeGrowth(rows || [], 'content_change', nowMs),
      },
      other: {
        count: activities.filter((a) => a.type === 'other').length,
        growth: computeTypeGrowth(rows || [], 'other', nowMs),
      },
    };

    const users = profiles.map((p) => ({
      id: p.id,
      name: p.full_name || p.username || p.email || 'Unknown',
      email: p.email,
    }));

    return { activities, stats, users };
  });
}

export async function deleteRecentActivity(id) {
  const sb = supabase();
  const { error } = await sb
    .from('recent_activities')
    .delete()
    .eq('site_id', SITE_ID)
    .eq('id', id);
  if (error) throw error;
  invalidateCache('cms:recent-activities');
  invalidateCachePrefix('cms:recent-activities:user');
}

/** Delete one activity only when it belongs to the given user. Returns false if no row matched. */
export async function deleteRecentActivityForUser(id, userId) {
  const sb = supabase();
  const { data, error } = await sb
    .from('recent_activities')
    .delete()
    .eq('site_id', SITE_ID)
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (data) {
    invalidateCache('cms:recent-activities');
    invalidateCachePrefix('cms:recent-activities:user');
  }
  return !!data;
}

export async function deleteRecentActivities(ids) {
  const uniqueIds = [...new Set((ids || []).map(String).filter(Boolean))];
  if (!uniqueIds.length) return 0;
  const sb = supabase();
  const { data, error } = await sb
    .from('recent_activities')
    .delete()
    .eq('site_id', SITE_ID)
    .in('id', uniqueIds)
    .select('id');
  if (error) throw error;
  invalidateCache('cms:recent-activities');
  invalidateCachePrefix('cms:recent-activities:user');
  return data?.length ?? 0;
}

/** Bulk delete limited to rows owned by userId. */
export async function deleteRecentActivitiesForUser(ids, userId) {
  const uniqueIds = [...new Set((ids || []).map(String).filter(Boolean))];
  if (!uniqueIds.length) return 0;
  const sb = supabase();
  const { data, error } = await sb
    .from('recent_activities')
    .delete()
    .eq('site_id', SITE_ID)
    .eq('user_id', userId)
    .in('id', uniqueIds)
    .select('id');
  if (error) throw error;
  if (data?.length) {
    invalidateCache('cms:recent-activities');
    invalidateCachePrefix('cms:recent-activities:user');
  }
  return data?.length ?? 0;
}

