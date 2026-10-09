// @ts-nocheck

export type BlogPostVisibilityRow = {
  status?: string | null;
  published_at?: string | null;
};

/** ISO timestamp for PostgREST `published_at <= cutoff` filters. */
export function publicBlogVisibilityCutoff(now = new Date()): string {
  return now.toISOString();
}

/**
 * Public portfolio visibility: not Draft, has publish time, and that time has passed.
 * Status may still be non-Published until the daily cron syncs bookkeeping.
 */
export function isBlogPostPubliclyVisible(
  row: BlogPostVisibilityRow,
  now = new Date(),
): boolean {
  if (row.status === 'Draft') return false;
  const raw = row.published_at;
  if (!raw) return false;
  const t = new Date(raw).getTime();
  if (!Number.isFinite(t)) return false;
  return t <= now.getTime();
}
