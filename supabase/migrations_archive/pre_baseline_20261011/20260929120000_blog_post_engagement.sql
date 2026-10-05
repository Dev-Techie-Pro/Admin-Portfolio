-- Blog post comments & likes (portfolio site engagement; moderated in admin)

create type public.blog_post_comment_status as enum (
  'pending',
  'approved',
  'spam',
  'rejected'
);

alter table public.blog_posts
  add column if not exists comments_enabled boolean not null default true,
  add column if not exists likes_enabled boolean not null default true,
  add column if not exists comments_auto_approve boolean not null default false;

create table public.blog_post_comments (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid not null references public.sites (id) on delete cascade,
  blog_post_id  uuid not null references public.blog_posts (id) on delete cascade,
  legacy_id     integer,
  author_name   text not null,
  author_email  text,
  body          text not null,
  status        public.blog_post_comment_status not null default 'pending',
  sender_ip     inet,
  created_at    timestamptz not null default timezone('utc', now()),
  updated_at    timestamptz not null default timezone('utc', now()),
  deleted_at    timestamptz,
  version       integer not null default 1,
  constraint blog_post_comments_body_len check (char_length(body) between 1 and 4000)
);

create index blog_post_comments_post_idx on public.blog_post_comments (blog_post_id, created_at desc);
create index blog_post_comments_site_status_idx on public.blog_post_comments (site_id, status);
create unique index blog_post_comments_site_legacy_id_idx on public.blog_post_comments (site_id, legacy_id)
  where legacy_id is not null and deleted_at is null;

create trigger blog_post_comments_set_updated_at
  before update on public.blog_post_comments
  for each row execute function public.set_updated_at();

create table public.blog_post_likes (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid not null references public.sites (id) on delete cascade,
  blog_post_id uuid not null references public.blog_posts (id) on delete cascade,
  visitor_key  text not null,
  created_at   timestamptz not null default timezone('utc', now()),
  constraint blog_post_likes_visitor_key_len check (char_length(visitor_key) between 8 and 128),
  unique (blog_post_id, visitor_key)
);

create index blog_post_likes_post_idx on public.blog_post_likes (blog_post_id);

alter table public.blog_post_comments enable row level security;
alter table public.blog_post_likes enable row level security;

create policy "Public read approved blog comments"
  on public.blog_post_comments for select
  using (
    deleted_at is null
    and status = 'approved'
    and exists (
      select 1 from public.blog_posts b
      where b.id = blog_post_id
        and b.deleted_at is null
        and b.status = 'Published'
        and b.comments_enabled = true
    )
  );

create policy "Public read blog like counts"
  on public.blog_post_likes for select
  using (
    exists (
      select 1 from public.blog_posts b
      where b.id = blog_post_id
        and b.deleted_at is null
        and b.status = 'Published'
        and b.likes_enabled = true
    )
  );

create policy "Staff manage blog comments"
  on public.blog_post_comments for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

create policy "Staff manage blog likes"
  on public.blog_post_likes for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

-- Extend batch save for engagement toggles on posts
create or replace function public.pa_save_blog_posts_batch(
  p_site_id uuid,
  p_posts jsonb,
  p_delete_post_ids uuid[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(array_length(p_delete_post_ids, 1), 0) > 0 then
    delete from public.blog_post_likes
    where blog_post_id = any(p_delete_post_ids);

    delete from public.blog_post_comments
    where blog_post_id = any(p_delete_post_ids);

    delete from public.blog_post_tags
    where blog_post_id = any(p_delete_post_ids);

    delete from public.blog_posts
    where site_id = p_site_id
      and id = any(p_delete_post_ids);
  end if;

  if jsonb_array_length(coalesce(p_posts, '[]'::jsonb)) = 0 then
    return;
  end if;

  insert into public.blog_posts (
    id, site_id, legacy_id, title, slug, excerpt, content, category_key, status,
    is_featured, featured_image_url, featured_image_alt, published_at, sort_order,
    meta_title, meta_description, comments_enabled, likes_enabled, comments_auto_approve,
    created_at
  )
  select
    (r->>'id')::uuid,
    p_site_id,
    (r->>'legacy_id')::int,
    r->>'title',
    r->>'slug',
    r->>'excerpt',
    coalesce(r->>'content', ''),
    r->>'category_key',
    coalesce(r->>'status', 'Draft')::public.blog_post_status,
    coalesce((r->>'is_featured')::boolean, false),
    r->>'featured_image_url',
    r->>'featured_image_alt',
    (r->>'published_at')::date,
    coalesce((r->>'sort_order')::int, 0),
    nullif(r->>'meta_title', ''),
    nullif(r->>'meta_description', ''),
    coalesce((r->>'comments_enabled')::boolean, true),
    coalesce((r->>'likes_enabled')::boolean, true),
    coalesce((r->>'comments_auto_approve')::boolean, false),
    coalesce((r->>'created_at')::timestamptz, timezone('utc', now()))
  from jsonb_array_elements(p_posts) as r
  on conflict (id) do update set
    legacy_id = excluded.legacy_id,
    title = excluded.title,
    slug = excluded.slug,
    excerpt = excluded.excerpt,
    content = excluded.content,
    category_key = excluded.category_key,
    status = excluded.status,
    is_featured = excluded.is_featured,
    featured_image_url = excluded.featured_image_url,
    featured_image_alt = excluded.featured_image_alt,
    published_at = excluded.published_at,
    sort_order = excluded.sort_order,
    meta_title = excluded.meta_title,
    meta_description = excluded.meta_description,
    comments_enabled = excluded.comments_enabled,
    likes_enabled = excluded.likes_enabled,
    comments_auto_approve = excluded.comments_auto_approve,
    updated_at = timezone('utc', now());

  delete from public.blog_post_tags
  where blog_post_id in (
    select (r->>'id')::uuid from jsonb_array_elements(p_posts) r
  );

  insert into public.blog_post_tags (blog_post_id, tag, sort_order)
  select
    (p.elem->>'id')::uuid,
    t.elem->>'tag',
    coalesce((t.elem->>'sort_order')::int, (t.ord - 1)::int)
  from jsonb_array_elements(p_posts) as p(elem),
       jsonb_array_elements(coalesce(p.elem->'tags', '[]'::jsonb)) with ordinality as t(elem, ord)
  where coalesce(t.elem->>'tag', '') <> '';
end;
$$;
