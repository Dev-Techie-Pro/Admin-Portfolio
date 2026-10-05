-- Rate limiting buckets (service role only; used by Next.js public/auth routes).
create table if not exists public.api_rate_limits (
  bucket        text not null,
  window_start  timestamptz not null,
  hit_count     integer not null default 0,
  primary key (bucket, window_start)
);

create index if not exists api_rate_limits_window_idx
  on public.api_rate_limits (window_start);

alter table public.api_rate_limits enable row level security;

-- Atomic rate-limit check (returns true when under max hits for the window).
create or replace function public.pa_rate_limit_allow(
  p_bucket text,
  p_window_seconds integer,
  p_max_hits integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz;
  v_count integer;
begin
  if p_window_seconds < 1 or p_max_hits < 1 then
    return true;
  end if;
  v_window := to_timestamp(
    floor(extract(epoch from timezone('utc', now())) / p_window_seconds) * p_window_seconds
  );
  insert into public.api_rate_limits (bucket, window_start, hit_count)
  values (p_bucket, v_window, 1)
  on conflict (bucket, window_start) do update
  set hit_count = public.api_rate_limits.hit_count + 1
  returning hit_count into v_count;
  return v_count <= p_max_hits;
end;
$$;

revoke all on function public.pa_rate_limit_allow(text, integer, integer) from public;
grant execute on function public.pa_rate_limit_allow(text, integer, integer) to service_role;

-- Contact messages: only server (service role) may insert; portfolio uses /api/public/contact.
drop policy if exists "Anyone can submit contact messages" on public.contact_messages;

-- Content revision snapshots (blog posts; extended later).
create table if not exists public.content_revisions (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid not null references public.sites (id) on delete cascade,
  entity_type   text not null,
  entity_id     uuid not null,
  legacy_id     integer,
  snapshot      jsonb not null,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default timezone('utc', now())
);

create index if not exists content_revisions_entity_idx
  on public.content_revisions (site_id, entity_type, entity_id, created_at desc);

alter table public.content_revisions enable row level security;

create policy "Staff manage content revisions"
  on public.content_revisions for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

-- Staff invite tokens (admin-created; consumed on first staff login).
create table if not exists public.staff_invites (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid not null references public.sites (id) on delete cascade,
  email         text not null,
  role          public.app_role not null default 'editor',
  token_hash    text not null,
  invited_by    uuid references public.profiles (id) on delete set null,
  expires_at    timestamptz not null,
  accepted_at   timestamptz,
  created_at    timestamptz not null default timezone('utc', now())
);

create unique index if not exists staff_invites_site_email_pending_idx
  on public.staff_invites (site_id, lower(email))
  where accepted_at is null;

alter table public.staff_invites enable row level security;

create policy "Admins manage staff invites"
  on public.staff_invites for all
  using (public.is_authenticated_admin())
  with check (public.is_authenticated_admin());
