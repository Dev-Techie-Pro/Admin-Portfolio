// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_ID } from './constants';
import { isBlogPostPubliclyVisible } from './blog-public-visibility';

function admin() {
  return createAdminClient();
}

/** Client-supplied like identity (not authentication); rate limits apply per IP. */
export function normalizeVisitorKey(visitorKey: string | null | undefined): string | null {
  const key = visitorKey?.trim();
  if (!key || key.length < 8 || key.length > 128) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(key)) return null;
  return key;
}

export type BlogCommentStatus = 'pending' | 'approved' | 'spam' | 'rejected';

export type BlogCommentRecord = {
  id: string;
  legacyId: number | null;
  authorName: string;
  authorEmail: string | null;
  body: string;
  status: BlogCommentStatus;
  createdAt: string;
};

function commentFromRow(row: {
  id: string;
  legacy_id: number | null;
  author_name: string;
  author_email: string | null;
  body: string;
  status: BlogCommentStatus;
  created_at: string;
}): BlogCommentRecord {
  return {
    id: row.id,
    legacyId: row.legacy_id,
    authorName: row.author_name,
    authorEmail: row.author_email,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function getPublishedPostEngagementMetaBySlug(slug: string) {
  const sb = admin();
  const { data: post, error } = await sb
    .from('blog_posts')
    .select('id, slug, legacy_id, comments_enabled, likes_enabled, comments_auto_approve, status, published_at')
    .eq('site_id', SITE_ID)
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  if (!post || !isBlogPostPubliclyVisible(post)) return null;
  return post;
}

export async function getPublicEngagementBySlug(slug: string, visitorKey?: string) {
  const post = await getPublishedPostEngagementMetaBySlug(slug);
  if (!post) return null;

  const sb = admin();
  const [likesRes, commentsRes, likedRes] = await Promise.all([
    post.likes_enabled
      ? sb.from('blog_post_likes').select('id', { count: 'exact', head: true }).eq('blog_post_id', post.id)
      : Promise.resolve({ count: 0 }),
    post.comments_enabled
      ? sb
        .from('blog_post_comments')
        .select('id, author_name, body, created_at')
        .eq('blog_post_id', post.id)
        .eq('status', 'approved')
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(200)
      : Promise.resolve({ data: [] }),
    post.likes_enabled && visitorKey
      ? sb
        .from('blog_post_likes')
        .select('id')
        .eq('blog_post_id', post.id)
        .eq('visitor_key', visitorKey)
        .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const likeCount = likesRes.count ?? 0;
  const liked = !!likedRes.data;

  return {
    postId: post.id,
    legacyId: post.legacy_id,
    slug: post.slug,
    commentsEnabled: !!post.comments_enabled,
    likesEnabled: !!post.likes_enabled,
    likeCount,
    liked,
    comments: (commentsRes.data || []).map((c) => ({
      id: c.id,
      authorName: c.author_name,
      body: c.body,
      createdAt: c.created_at,
    })),
  };
}

export async function submitPublicComment(
  slug: string,
  input: { authorName: string; authorEmail?: string; body: string },
  senderIp?: string | null,
) {
  const post = await getPublishedPostEngagementMetaBySlug(slug);
  if (!post || !post.comments_enabled) {
    return { ok: false as const, error: 'Comments are not available for this post.', status: 404 };
  }

  const authorName = input.authorName?.trim();
  const body = input.body?.trim();
  const authorEmail = input.authorEmail?.trim() || null;
  if (!authorName || authorName.length > 80) {
    return { ok: false as const, error: 'Please enter your name (max 80 characters).', status: 400 };
  }
  if (!body || body.length > 4000) {
    return { ok: false as const, error: 'Comment must be between 1 and 4000 characters.', status: 400 };
  }
  if (authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
    return { ok: false as const, error: 'Please enter a valid email address.', status: 400 };
  }

  const status: BlogCommentStatus = post.comments_auto_approve ? 'approved' : 'pending';
  const sb = admin();
  const { data, error } = await sb
    .from('blog_post_comments')
    .insert({
      site_id: SITE_ID,
      blog_post_id: post.id,
      author_name: authorName,
      author_email: authorEmail,
      body,
      status,
      sender_ip: senderIp || null,
    })
    .select('id, author_name, body, status, created_at')
    .single();
  if (error) throw error;

  return {
    ok: true as const,
    comment: {
      id: data.id,
      authorName: data.author_name,
      body: data.body,
      status: data.status,
      createdAt: data.created_at,
    },
    pending: status === 'pending',
  };
}

export async function togglePublicLike(slug: string, visitorKey: string) {
  const post = await getPublishedPostEngagementMetaBySlug(slug);
  if (!post || !post.likes_enabled) {
    return { ok: false as const, error: 'Likes are not available for this post.', status: 404 };
  }
  const key = normalizeVisitorKey(visitorKey);
  if (!key) {
    return { ok: false as const, error: 'Invalid visitor key.', status: 400 };
  }

  const sb = admin();
  const { data: existing } = await sb
    .from('blog_post_likes')
    .select('id')
    .eq('blog_post_id', post.id)
    .eq('visitor_key', key)
    .maybeSingle();

  if (existing?.id) {
    await sb.from('blog_post_likes').delete().eq('id', existing.id);
  } else {
    await sb.from('blog_post_likes').insert({
      site_id: SITE_ID,
      blog_post_id: post.id,
      visitor_key: key,
    });
  }

  const { count } = await sb
    .from('blog_post_likes')
    .select('id', { count: 'exact', head: true })
    .eq('blog_post_id', post.id);

  const { data: likedRow } = await sb
    .from('blog_post_likes')
    .select('id')
    .eq('blog_post_id', post.id)
    .eq('visitor_key', key)
    .maybeSingle();

  return {
    ok: true as const,
    liked: !!likedRow,
    likeCount: count ?? 0,
  };
}

export async function getEngagementSummariesByLegacyIds(legacyIds: (number | string)[]) {
  const ids = [...new Set(legacyIds.map((id) => Number(id)).filter((n) => Number.isFinite(n)))];
  if (!ids.length) return {};

  const sb = admin();
  const { data: posts, error } = await sb
    .from('blog_posts')
    .select('id, legacy_id')
    .eq('site_id', SITE_ID)
    .in('legacy_id', ids)
    .is('deleted_at', null);
  if (error) throw error;
  if (!posts?.length) return {};

  const postIds = posts.map((p) => p.id);
  const legacyByPostId = new Map(posts.map((p) => [p.id, p.legacy_id]));

  const [likes, comments] = await Promise.all([
    sb.from('blog_post_likes').select('blog_post_id').in('blog_post_id', postIds),
    sb
      .from('blog_post_comments')
      .select('blog_post_id, status')
      .in('blog_post_id', postIds)
      .is('deleted_at', null),
  ]);
  if (likes.error) throw likes.error;
  if (comments.error) throw comments.error;

  const summary: Record<string, { likes: number; comments: number; pending: number }> = {};
  for (const legacyId of ids) {
    summary[String(legacyId)] = { likes: 0, comments: 0, pending: 0 };
  }

  for (const row of likes.data || []) {
    const legacy = legacyByPostId.get(row.blog_post_id);
    if (legacy == null) continue;
    const bucket = summary[String(legacy)];
    if (bucket) bucket.likes += 1;
  }

  for (const row of comments.data || []) {
    const legacy = legacyByPostId.get(row.blog_post_id);
    if (legacy == null) continue;
    const bucket = summary[String(legacy)];
    if (!bucket) continue;
    if (row.status === 'approved') bucket.comments += 1;
    if (row.status === 'pending') bucket.pending += 1;
  }

  return summary;
}

export async function getPostEngagementForStaff(legacyId: string | number) {
  const sb = admin();
  const raw = String(legacyId || '').trim();
  const legacyValue = /^\d+$/.test(raw) ? Number(raw) : raw;
  const { data: post, error } = await sb
    .from('blog_posts')
    .select('id, legacy_id, comments_enabled, likes_enabled, comments_auto_approve')
    .eq('site_id', SITE_ID)
    .eq('legacy_id', legacyValue)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  if (!post) return null;

  const [likesCount, commentsRes] = await Promise.all([
    sb.from('blog_post_likes').select('id', { count: 'exact', head: true }).eq('blog_post_id', post.id),
    sb
      .from('blog_post_comments')
      .select('id, legacy_id, author_name, author_email, body, status, created_at')
      .eq('blog_post_id', post.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);
  if (commentsRes.error) throw commentsRes.error;

  return {
    commentsEnabled: !!post.comments_enabled,
    likesEnabled: !!post.likes_enabled,
    commentsAutoApprove: !!post.comments_auto_approve,
    likeCount: likesCount.count ?? 0,
    comments: (commentsRes.data || []).map(commentFromRow),
  };
}

export async function updateCommentStatus(commentId: string, status: BlogCommentStatus) {
  const sb = admin();
  const { data, error } = await sb
    .from('blog_post_comments')
    .update({ status })
    .eq('id', commentId)
    .eq('site_id', SITE_ID)
    .select('id, status')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteComment(commentId: string) {
  const sb = admin();
  const { error } = await sb
    .from('blog_post_comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('site_id', SITE_ID);
  if (error) throw error;
}

export type BlogCommentListItem = BlogCommentRecord & {
  postLegacyId: number | null;
  postTitle: string;
  postSlug: string;
};

function commentListFromRow(row: {
  id: string;
  legacy_id: number | null;
  author_name: string;
  author_email: string | null;
  body: string;
  status: BlogCommentStatus;
  created_at: string;
  blog_posts: { title: string; slug: string; legacy_id: number | null } | null;
}): BlogCommentListItem {
  const post = row.blog_posts;
  return {
    ...commentFromRow(row),
    postLegacyId: post?.legacy_id ?? null,
    postTitle: post?.title || 'Untitled',
    postSlug: post?.slug || '',
  };
}

function timeRangeStart(timeRange: string): string | null {
  const now = new Date();
  if (timeRange === 'today') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (timeRange === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }
  if (timeRange === 'month') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString();
  }
  return null;
}

export async function getEngagementStats() {
  const sb = admin();
  const base = () => sb
    .from('blog_post_comments')
    .select('id', { count: 'exact', head: true })
    .eq('site_id', SITE_ID)
    .is('deleted_at', null);

  const [total, pending, approved, spam, rejected, likesRes, pendingPostsRes] = await Promise.all([
    base(),
    base().eq('status', 'pending'),
    base().eq('status', 'approved'),
    base().eq('status', 'spam'),
    base().eq('status', 'rejected'),
    sb.from('blog_post_likes').select('id', { count: 'exact', head: true }).eq('site_id', SITE_ID),
    sb
      .from('blog_post_comments')
      .select('blog_post_id')
      .eq('site_id', SITE_ID)
      .eq('status', 'pending')
      .is('deleted_at', null),
  ]);

  const pendingPostIds = new Set((pendingPostsRes.data || []).map((r) => r.blog_post_id));

  return {
    totalComments: total.count ?? 0,
    pending: pending.count ?? 0,
    approved: approved.count ?? 0,
    spam: spam.count ?? 0,
    rejected: rejected.count ?? 0,
    totalLikes: likesRes.count ?? 0,
    postsWithPending: pendingPostIds.size,
  };
}

export async function listCommentsPage({
  cursor = null,
  limit = 25,
  status = 'all',
  postLegacyId = null,
  timeRange = 'all',
  q = '',
} = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const sb = admin();

  let query = sb
    .from('blog_post_comments')
    .select(
      'id, legacy_id, author_name, author_email, body, status, created_at, blog_post_id, blog_posts!inner(title, slug, legacy_id)',
      { count: 'exact' },
    )
    .eq('site_id', SITE_ID)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(safeLimit + 1);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (postLegacyId != null && postLegacyId !== '' && postLegacyId !== 'all') {
    const legacy = Number(postLegacyId);
    if (Number.isFinite(legacy)) {
      const { data: postRow } = await sb
        .from('blog_posts')
        .select('id')
        .eq('site_id', SITE_ID)
        .eq('legacy_id', legacy)
        .is('deleted_at', null)
        .maybeSingle();
      if (!postRow) {
        return { items: [], nextCursor: null, total: 0 };
      }
      query = query.eq('blog_post_id', postRow.id);
    }
  }

  const since = timeRangeStart(timeRange);
  if (since) {
    query = query.gte('created_at', since);
  }

  const term = String(q || '').trim();
  if (term.length >= 2) {
    const escaped = term.replace(/%/g, '').replace(/,/g, '');
    const pattern = `%${escaped}%`;
    query = query.or(`author_name.ilike.${pattern},author_email.ilike.${pattern},body.ilike.${pattern}`);
  }

  if (cursor) {
    const parts = String(cursor).split('|');
    if (parts.length === 2 && parts[0] && parts[1]) {
      const [createdAt, id] = parts;
      query = query.or(`created_at.lt."${createdAt}",and(created_at.eq."${createdAt}",id.lt."${id}")`);
    }
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = data || [];
  const hasMore = rows.length > safeLimit;
  const page = hasMore ? rows.slice(0, safeLimit) : rows;
  const nextCursor = hasMore
    ? `${page[page.length - 1].created_at}|${page[page.length - 1].id}`
    : null;

  return {
    items: page.map((row) => commentListFromRow(row as Parameters<typeof commentListFromRow>[0])),
    nextCursor,
    total: count ?? page.length,
  };
}

export async function bulkUpdateCommentStatus(ids: string[], status: BlogCommentStatus) {
  if (!ids.length) return { updated: 0 };
  const sb = admin();
  const { data, error } = await sb
    .from('blog_post_comments')
    .update({ status })
    .eq('site_id', SITE_ID)
    .in('id', ids)
    .is('deleted_at', null)
    .select('id');
  if (error) throw error;
  return { updated: data?.length ?? 0 };
}

export async function bulkSoftDeleteComments(ids: string[]) {
  if (!ids.length) return { deleted: 0 };
  const sb = admin();
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from('blog_post_comments')
    .update({ deleted_at: now })
    .eq('site_id', SITE_ID)
    .in('id', ids)
    .is('deleted_at', null)
    .select('id');
  if (error) throw error;
  return { deleted: data?.length ?? 0 };
}

export type PostLikeSummary = {
  legacyId: number | null;
  title: string;
  slug: string;
  likeCount: number;
  commentsEnabled: boolean;
  likesEnabled: boolean;
};

export async function listPostsLikeSummary({ limit = 50, offset = 0 } = {}) {
  const sb = admin();
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const { data: posts, error: postsError } = await sb
    .from('blog_posts')
    .select('id, legacy_id, title, slug, comments_enabled, likes_enabled')
    .eq('site_id', SITE_ID)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (postsError) throw postsError;

  const { data: likes, error: likesError } = await sb
    .from('blog_post_likes')
    .select('blog_post_id')
    .eq('site_id', SITE_ID);
  if (likesError) throw likesError;

  const likeCounts = new Map<string, number>();
  for (const row of likes || []) {
    likeCounts.set(row.blog_post_id, (likeCounts.get(row.blog_post_id) || 0) + 1);
  }

  const summaries: PostLikeSummary[] = (posts || []).map((p) => ({
    legacyId: p.legacy_id,
    title: p.title,
    slug: p.slug,
    likeCount: likeCounts.get(p.id) || 0,
    commentsEnabled: p.comments_enabled !== false,
    likesEnabled: p.likes_enabled !== false,
  }));

  summaries.sort((a, b) => b.likeCount - a.likeCount);

  return {
    items: summaries.slice(safeOffset, safeOffset + safeLimit),
    total: summaries.length,
  };
}

export async function clearLikesForPost(legacyId: string | number) {
  const sb = admin();
  const raw = String(legacyId || '').trim();
  const legacyValue = /^\d+$/.test(raw) ? Number(raw) : raw;
  const { data: post, error: postError } = await sb
    .from('blog_posts')
    .select('id')
    .eq('site_id', SITE_ID)
    .eq('legacy_id', legacyValue)
    .is('deleted_at', null)
    .maybeSingle();
  if (postError) throw postError;
  if (!post) {
    const err = new Error('Blog post not found.');
    err.status = 404;
    throw err;
  }

  const { error } = await sb.from('blog_post_likes').delete().eq('blog_post_id', post.id);
  if (error) throw error;
  return { ok: true };
}
