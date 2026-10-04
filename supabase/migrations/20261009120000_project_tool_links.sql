-- Project ↔ tool_items links (alongside project_technology_links)

create table public.project_tool_links (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  tool_item_id  uuid not null references public.tool_items (id) on delete restrict,
  sort_order    integer not null default 0,
  unique (project_id, tool_item_id)
);

create index project_tool_links_project_id_idx on public.project_tool_links (project_id);
create index project_tool_links_tool_item_id_idx on public.project_tool_links (tool_item_id);

alter table public.project_tool_links enable row level security;

create policy "Public read project tool links"
  on public.project_tool_links for select
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and p.deleted_at is null
  ));

create policy "Staff manage project tool links"
  on public.project_tool_links for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

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

    delete from public.project_tool_links
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

  delete from public.project_tool_links
  where project_id in (
    select (r->>'id')::uuid from jsonb_array_elements(p_projects) r
  );

  insert into public.project_tool_links (project_id, tool_item_id, sort_order)
  select
    (p.elem->>'id')::uuid,
    (t.elem->>'tool_item_id')::uuid,
    coalesce((t.elem->>'sort_order')::int, (t.ord - 1)::int)
  from jsonb_array_elements(p_projects) as p(elem),
       jsonb_array_elements(coalesce(p.elem->'tool_links', '[]'::jsonb)) with ordinality as t(elem, ord)
  where coalesce(t.elem->>'tool_item_id', '') <> '';

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
