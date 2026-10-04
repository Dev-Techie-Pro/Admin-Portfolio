-- Accelerate CMS title/name search (ILIKE %term%) in lib/cms/content-search.ts
-- Version 20261010130000 (20261010120000 is used by project_category_keys.sql)
create extension if not exists pg_trgm;

create index if not exists projects_title_trgm_idx
  on public.projects using gin (title gin_trgm_ops)
  where deleted_at is null;

create index if not exists blog_posts_title_trgm_idx
  on public.blog_posts using gin (title gin_trgm_ops)
  where deleted_at is null;

create index if not exists media_assets_file_name_trgm_idx
  on public.media_assets using gin (file_name gin_trgm_ops)
  where deleted_at is null;

-- tool_items has no deleted_at; rows are removed when categories are deleted
create index if not exists tool_items_name_trgm_idx
  on public.tool_items using gin (name gin_trgm_ops);
