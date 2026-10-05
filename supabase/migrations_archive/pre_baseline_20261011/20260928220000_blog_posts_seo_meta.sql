-- SEO fields for blog post editor + batch save support
alter table public.blog_posts
  add column if not exists meta_title text,
  add column if not exists meta_description text;

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
    meta_title, meta_description, created_at
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
