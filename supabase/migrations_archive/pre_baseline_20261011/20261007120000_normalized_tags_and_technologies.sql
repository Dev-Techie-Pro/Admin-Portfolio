-- Normalized project technologies (junction to skills table), project tag catalog, blog tag catalog.
-- Rollback: restore from backup; old project_tags / blog_post_tags text columns are dropped.

-- -----------------------------------------------------------------------------
-- Project tag labels (site catalog)
-- -----------------------------------------------------------------------------

create table public.project_tag_labels (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references public.sites (id) on delete cascade,
  legacy_id   integer,
  name        text not null,
  slug        text not null,
  description text,
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now()),
  deleted_at  timestamptz,
  version     integer not null default 1
);

create index project_tag_labels_site_id_idx on public.project_tag_labels (site_id);
create unique index project_tag_labels_site_name_idx
  on public.project_tag_labels (site_id, lower(name))
  where deleted_at is null;
create unique index project_tag_labels_site_slug_idx
  on public.project_tag_labels (site_id, lower(slug))
  where deleted_at is null;
create unique index project_tag_labels_site_legacy_id_idx
  on public.project_tag_labels (site_id, legacy_id)
  where legacy_id is not null and deleted_at is null;

create trigger project_tag_labels_set_updated_at
  before update on public.project_tag_labels
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Project tag links (project ↔ label)
-- -----------------------------------------------------------------------------

create table public.project_tag_links (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  tag_label_id  uuid not null references public.project_tag_labels (id) on delete cascade,
  sort_order    integer not null default 0,
  unique (project_id, tag_label_id)
);

create index project_tag_links_project_id_idx on public.project_tag_links (project_id);
create index project_tag_links_tag_label_id_idx on public.project_tag_links (tag_label_id);

-- -----------------------------------------------------------------------------
-- Project technology links (project ↔ technologies skills table)
-- -----------------------------------------------------------------------------

create table public.project_technology_links (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects (id) on delete cascade,
  technology_id  uuid not null references public.technologies (id) on delete restrict,
  sort_order     integer not null default 0,
  unique (project_id, technology_id)
);

create index project_technology_links_project_id_idx on public.project_technology_links (project_id);
create index project_technology_links_technology_id_idx on public.project_technology_links (technology_id);

-- -----------------------------------------------------------------------------
-- Blog tags (site catalog)
-- -----------------------------------------------------------------------------

create table public.blog_tags (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references public.sites (id) on delete cascade,
  legacy_id   integer,
  name        text not null,
  slug        text not null,
  description text,
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now()),
  deleted_at  timestamptz,
  version     integer not null default 1
);

create index blog_tags_site_id_idx on public.blog_tags (site_id);
create unique index blog_tags_site_name_idx
  on public.blog_tags (site_id, lower(name))
  where deleted_at is null;
create unique index blog_tags_site_slug_idx
  on public.blog_tags (site_id, lower(slug))
  where deleted_at is null;
create unique index blog_tags_site_legacy_id_idx
  on public.blog_tags (site_id, legacy_id)
  where legacy_id is not null and deleted_at is null;

create trigger blog_tags_set_updated_at
  before update on public.blog_tags
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Backfill from legacy project_tags
-- -----------------------------------------------------------------------------

-- Distinct tag strings per site → project_tag_labels (only those NOT matching a technology name)
insert into public.project_tag_labels (site_id, legacy_id, name, slug, description)
select distinct on (p.site_id, lower(trim(pt.tag)))
  p.site_id,
  row_number() over (partition by p.site_id order by lower(trim(pt.tag)))::int,
  trim(pt.tag),
  regexp_replace(regexp_replace(lower(trim(pt.tag)), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'),
  null
from public.project_tags pt
join public.projects p on p.id = pt.project_id
where trim(pt.tag) <> ''
  and not exists (
    select 1 from public.technologies t
    where t.site_id = p.site_id
      and t.deleted_at is null
      and lower(t.name) = lower(trim(pt.tag))
  )
order by p.site_id, lower(trim(pt.tag)), trim(pt.tag);

-- Technology links from legacy tags that match technologies.name
insert into public.project_technology_links (project_id, technology_id, sort_order)
select
  pt.project_id,
  t.id,
  pt.sort_order
from public.project_tags pt
join public.projects p on p.id = pt.project_id
join public.technologies t
  on t.site_id = p.site_id
  and t.deleted_at is null
  and lower(t.name) = lower(trim(pt.tag))
where trim(pt.tag) <> ''
on conflict (project_id, technology_id) do update set sort_order = excluded.sort_order;

-- Project tag links from legacy tags (non-technology strings)
insert into public.project_tag_links (project_id, tag_label_id, sort_order)
select
  pt.project_id,
  lbl.id,
  pt.sort_order
from public.project_tags pt
join public.projects p on p.id = pt.project_id
join public.project_tag_labels lbl
  on lbl.site_id = p.site_id
  and lbl.deleted_at is null
  and lower(lbl.name) = lower(trim(pt.tag))
where trim(pt.tag) <> ''
  and not exists (
    select 1 from public.technologies t
    where t.site_id = p.site_id
      and t.deleted_at is null
      and lower(t.name) = lower(trim(pt.tag))
  )
on conflict (project_id, tag_label_id) do update set sort_order = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- Blog tags backfill + reshape blog_post_tags
-- -----------------------------------------------------------------------------

insert into public.blog_tags (site_id, legacy_id, name, slug, description)
select distinct on (b.site_id, lower(trim(bpt.tag)))
  b.site_id,
  row_number() over (partition by b.site_id order by lower(trim(bpt.tag)))::int,
  trim(bpt.tag),
  regexp_replace(regexp_replace(lower(trim(bpt.tag)), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'),
  null
from public.blog_post_tags bpt
join public.blog_posts b on b.id = bpt.blog_post_id
where trim(bpt.tag) <> ''
order by b.site_id, lower(trim(bpt.tag)), trim(bpt.tag);

alter table public.blog_post_tags add column if not exists blog_tag_id uuid references public.blog_tags (id) on delete cascade;

update public.blog_post_tags bpt
set blog_tag_id = bt.id
from public.blog_posts bp
join public.blog_tags bt
  on bt.site_id = bp.site_id
  and bt.deleted_at is null
where bp.id = bpt.blog_post_id
  and bpt.blog_tag_id is null
  and lower(bt.name) = lower(trim(bpt.tag));

delete from public.blog_post_tags where blog_tag_id is null;

alter table public.blog_post_tags drop constraint if exists blog_post_tags_blog_post_id_tag_key;
alter table public.blog_post_tags drop column if exists tag;
alter table public.blog_post_tags alter column blog_tag_id set not null;
create unique index blog_post_tags_post_tag_idx on public.blog_post_tags (blog_post_id, blog_tag_id);

-- -----------------------------------------------------------------------------
-- Drop legacy project_tags
-- -----------------------------------------------------------------------------

drop table if exists public.project_tags;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.project_tag_labels enable row level security;
alter table public.project_tag_links enable row level security;
alter table public.project_technology_links enable row level security;
alter table public.blog_tags enable row level security;

create policy "Public read project tag labels"
  on public.project_tag_labels for select
  using (deleted_at is null);

create policy "Public read project tag links"
  on public.project_tag_links for select
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and p.deleted_at is null
  ));

create policy "Public read project technology links"
  on public.project_technology_links for select
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and p.deleted_at is null
  ));

create policy "Public read blog tags"
  on public.blog_tags for select
  using (deleted_at is null);

create policy "Staff manage project tag labels"
  on public.project_tag_labels for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

create policy "Staff manage project tag links"
  on public.project_tag_links for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

create policy "Staff manage project technology links"
  on public.project_technology_links for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

create policy "Staff manage blog tags"
  on public.blog_tags for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

-- -----------------------------------------------------------------------------
-- Batch save: projects (technologies + tag label ids)
-- -----------------------------------------------------------------------------

create or replace function public.pa_save_projects_batch(
  p_site_id uuid,
  p_projects jsonb,
  p_delete_project_ids uuid[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(array_length(p_delete_project_ids, 1), 0) > 0 then
    delete from public.project_tag_links
    where project_id = any(p_delete_project_ids);

    delete from public.project_technology_links
    where project_id = any(p_delete_project_ids);

    delete from public.project_gallery_images
    where project_id = any(p_delete_project_ids);

    delete from public.projects
    where site_id = p_site_id
      and id = any(p_delete_project_ids);
  end if;

  if jsonb_array_length(coalesce(p_projects, '[]'::jsonb)) = 0 then
    return;
  end if;

  insert into public.projects (
    id, site_id, legacy_id, title, category_key, short_description, full_description,
    is_featured, scene_key, live_url, repo_url, featured_image_url, status, sort_order, created_at
  )
  select
    (r->>'id')::uuid,
    p_site_id,
    (r->>'legacy_id')::int,
    r->>'title',
    r->>'category_key',
    r->>'short_description',
    r->>'full_description',
    coalesce((r->>'is_featured')::boolean, false),
    r->>'scene_key',
    r->>'live_url',
    r->>'repo_url',
    r->>'featured_image_url',
    coalesce(r->>'status', 'Pending')::public.project_status,
    coalesce((r->>'sort_order')::int, 0),
    coalesce((r->>'created_at')::timestamptz, timezone('utc', now()))
  from jsonb_array_elements(p_projects) as r
  on conflict (id) do update set
    legacy_id = excluded.legacy_id,
    title = excluded.title,
    category_key = excluded.category_key,
    short_description = excluded.short_description,
    full_description = excluded.full_description,
    is_featured = excluded.is_featured,
    scene_key = excluded.scene_key,
    live_url = excluded.live_url,
    repo_url = excluded.repo_url,
    featured_image_url = excluded.featured_image_url,
    status = excluded.status,
    sort_order = excluded.sort_order,
    updated_at = timezone('utc', now());

  delete from public.project_technology_links
  where project_id in (
    select (r->>'id')::uuid from jsonb_array_elements(p_projects) r
  );

  insert into public.project_technology_links (project_id, technology_id, sort_order)
  select
    (p.elem->>'id')::uuid,
    (t.elem->>'technology_id')::uuid,
    coalesce((t.elem->>'sort_order')::int, (t.ord - 1)::int)
  from jsonb_array_elements(p_projects) as p(elem),
       jsonb_array_elements(coalesce(p.elem->'technology_links', '[]'::jsonb)) with ordinality as t(elem, ord)
  where coalesce(t.elem->>'technology_id', '') <> '';

  delete from public.project_tag_links
  where project_id in (
    select (r->>'id')::uuid from jsonb_array_elements(p_projects) r
  );

  insert into public.project_tag_links (project_id, tag_label_id, sort_order)
  select
    (p.elem->>'id')::uuid,
    (t.elem->>'tag_label_id')::uuid,
    coalesce((t.elem->>'sort_order')::int, (t.ord - 1)::int)
  from jsonb_array_elements(p_projects) as p(elem),
       jsonb_array_elements(coalesce(p.elem->'tag_links', '[]'::jsonb)) with ordinality as t(elem, ord)
  where coalesce(t.elem->>'tag_label_id', '') <> '';

  delete from public.project_gallery_images
  where project_id in (
    select (r->>'id')::uuid from jsonb_array_elements(p_projects) r
  );

  insert into public.project_gallery_images (project_id, url, file_name, sort_order)
  select
    (p.elem->>'id')::uuid,
    g.elem->>'url',
    g.elem->>'file_name',
    coalesce((g.elem->>'sort_order')::int, (g.ord - 1)::int)
  from jsonb_array_elements(p_projects) as p(elem),
       jsonb_array_elements(coalesce(p.elem->'gallery', '[]'::jsonb)) with ordinality as g(elem, ord)
  where coalesce(g.elem->>'url', '') <> '';
end;
$$;

-- -----------------------------------------------------------------------------
-- Batch save: blog posts (blog_tag_id links)
-- -----------------------------------------------------------------------------

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

  insert into public.blog_post_tags (blog_post_id, blog_tag_id, sort_order)
  select
    (p.elem->>'id')::uuid,
    (t.elem->>'blog_tag_id')::uuid,
    coalesce((t.elem->>'sort_order')::int, (t.ord - 1)::int)
  from jsonb_array_elements(p_posts) as p(elem),
       jsonb_array_elements(coalesce(p.elem->'tag_links', '[]'::jsonb)) with ordinality as t(elem, ord)
  where coalesce(t.elem->>'blog_tag_id', '') <> '';
end;
$$;

revoke all on function public.pa_save_projects_batch(uuid, jsonb, uuid[]) from public;
revoke all on function public.pa_save_blog_posts_batch(uuid, jsonb, uuid[]) from public;
grant execute on function public.pa_save_projects_batch(uuid, jsonb, uuid[]) to service_role;
grant execute on function public.pa_save_blog_posts_batch(uuid, jsonb, uuid[]) to service_role;
