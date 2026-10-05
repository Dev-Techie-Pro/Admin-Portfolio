-- Multiple category / type keys per project (primary remains category_key for FK).

alter table public.projects
  add column if not exists category_keys text[] not null default '{}';

update public.projects
set category_keys = array[category_key]::text[]
where (category_keys = '{}' or category_keys is null)
  and category_key is not null
  and category_key <> '';

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
    id, site_id, legacy_id, title, category_key, category_keys, short_description, full_description,
    is_featured, scene_key, live_url, repo_url, featured_image_url, status, sort_order, created_at
  )
  select
    (r->>'id')::uuid,
    p_site_id,
    (r->>'legacy_id')::int,
    r->>'title',
    coalesce(r->'category_keys'->>0, r->>'category_key'),
    coalesce(
      (select array_agg(x order by ord) from jsonb_array_elements_text(coalesce(r->'category_keys', '[]'::jsonb)) with ordinality as t(x, ord)),
      case when coalesce(r->>'category_key', '') <> '' then array[r->>'category_key'] else '{}'::text[] end
    ),
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
    category_keys = excluded.category_keys,
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
