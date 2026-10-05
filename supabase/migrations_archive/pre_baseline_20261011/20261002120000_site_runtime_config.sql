-- Runtime settings (SMTP, retention, performance) editable from System → Environment.
-- Deployment secrets (Supabase, CRON_SECRET) remain in host environment variables.

create table public.site_runtime_config (
  site_id uuid not null primary key references public.sites (id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  secrets jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create trigger site_runtime_config_set_updated_at
  before update on public.site_runtime_config
  for each row execute function public.set_updated_at();

alter table public.site_runtime_config enable row level security;

create policy "Admins manage site runtime config"
  on public.site_runtime_config for all
  using (public.is_authenticated_admin())
  with check (public.is_authenticated_admin());

insert into public.site_runtime_config (site_id, settings, secrets)
values ('00000000-0000-4000-8000-000000000001', '{}'::jsonb, '{}'::jsonb)
on conflict (site_id) do nothing;
