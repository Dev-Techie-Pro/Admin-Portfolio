-- blog_post_status enum values: 'Draft', 'Published' (see baseline migration)

create index if not exists blog_posts_published_at_idx
  on public.blog_posts (published_at desc)
  where status = 'Published' and deleted_at is null;

create index if not exists blog_posts_scheduled_draft_at_idx
  on public.blog_posts (published_at)
  where status = 'Draft' and published_at is not null and deleted_at is null;

create index if not exists blog_post_comments_post_created_idx
  on public.blog_post_comments (blog_post_id, created_at desc)
  where deleted_at is null;

create index if not exists recent_activities_created_idx
  on public.recent_activities (created_at desc);
