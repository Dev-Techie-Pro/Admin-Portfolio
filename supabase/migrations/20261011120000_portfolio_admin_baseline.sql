-- =============================================================================
-- Portfolio Admin — squashed baseline (generated; do not edit by hand)
-- Generated: 2026-10-05T10:40:52.583Z
-- Source: 58 files from supabase\migrations
-- Regenerate: npm run db:baseline
-- =============================================================================

-- === section: 20260906120000_initial_schema.sql ===
-- =============================================================================
-- Portfolio Admin Dashboard — Supabase schema (v1.0.0)
-- Covers: all CMS pages, settings tabs, appearance, auth profiles, backups
-- =============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------

create type public.app_role as enum (
  'super_admin',
  'admin',
  'editor',
  'viewer'
);

create type public.project_status as enum (
  'Completed',
  'In Progress',
  'Pending',
  'On Hold',
  'Cancelled'
);

create type public.blog_post_status as enum (
  'Draft',
  'Published'
);

create type public.blog_category_key as enum (
  'tutorial',
  'case-study',
  'career',
  'news',
  'tips',
  'opinion',
  'devlog',
  'announcement'
);

create type public.contact_message_status as enum (
  'new',
  'read',
  'replied',
  'spam'
);

create type public.employment_type as enum (
  'full-time',
  'part-time',
  'contract',
  'freelance',
  'internship'
);

create type public.technology_group as enum (
  'frontend',
  'backend',
  'database',
  'devops',
  'mobile',
  'design',
  'other'
);

create type public.technology_level as enum (
  'beginner',
  'intermediate',
  'advanced',
  'expert'
);

create type public.media_folder as enum (
  'general',
  'projects',
  'avatars',
  'icons',
  'blog',
  'testimonials'
);

create type public.default_view as enum (
  'grid',
  'list'
);

create type public.notification_frequency as enum (
  'instant',
  'daily',
  'weekly'
);

create type public.theme_mode as enum (
  'light',
  'dark',
  'system'
);

create type public.two_factor_method as enum (
  'authenticator',
  'sms',
  'email'
);

create type public.integration_provider as enum (
  'google_analytics',
  'google_search_console',
  'emailjs',
  'cloudinary',
  'github',
  'slack',
  'zapier',
  'webhooks'
);

create type public.backup_status as enum (
  'pending',
  'completed',
  'failed'
);

-- -----------------------------------------------------------------------------
-- SHARED TRIGGER: updated_at
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- SITE (single-tenant root; extend with more rows for multi-site later)
-- -----------------------------------------------------------------------------

create table public.sites (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique default 'default',
  name          text not null default 'My Portfolio',
  created_at    timestamptz not null default timezone('utc', now()),
  updated_at    timestamptz not null default timezone('utc', now()),
  deleted_at    timestamptz,
  version       integer not null default 1
);

create trigger sites_set_updated_at
  before update on public.sites
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- PROFILES (extends Supabase auth.users)
-- -----------------------------------------------------------------------------

create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  site_id         uuid not null references public.sites (id) on delete restrict,
  role            public.app_role not null default 'viewer',
  full_name       text,
  username        text,
  email           text,
  phone           text,
  date_of_birth   date,
  bio             text,
  location        text,
  website_url     text,
  avatar_url      text,
  cover_image_url text,
  social_links    jsonb not null default '[]'::jsonb,
  is_active       boolean not null default true,
  email_verified_at timestamptz,
  last_login_at   timestamptz,
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now()),
  deleted_at      timestamptz,
  version         integer not null default 1,
  constraint profiles_username_unique unique (username),
  constraint profiles_email_unique unique (email),
  constraint profiles_social_links_is_array check (jsonb_typeof(social_links) = 'array')
);

create index profiles_site_id_idx on public.profiles (site_id);
create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- SITE SETTINGS (/settings — General + Other tabs)
-- -----------------------------------------------------------------------------

create table public.site_settings (
  id                uuid primary key default gen_random_uuid(),
  site_id           uuid not null unique references public.sites (id) on delete cascade,
  site_title        text not null default 'My Portfolio',
  site_tagline      text,
  site_url          text,
  admin_email       text,
  site_description  text,
  date_format       text default 'May 19, 2024',
  time_format       text default '12 Hour (AM/PM)',
  timezone          text default '(GMT+05:00) Islamabad, Pakistan',
  items_per_page    integer not null default 12 check (items_per_page > 0),
  default_view      public.default_view not null default 'grid',
  language          text not null default 'en',
  maintenance_mode  boolean not null default false,
  created_at        timestamptz not null default timezone('utc', now()),
  updated_at        timestamptz not null default timezone('utc', now()),
  version           integer not null default 1
);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- USER PREFERENCES (UI state, column visibility, active settings tab)
-- -----------------------------------------------------------------------------

create table public.user_preferences (
  user_id       uuid primary key references public.profiles (id) on delete cascade,
  preferences   jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default timezone('utc', now()),
  updated_at    timestamptz not null default timezone('utc', now()),
  constraint user_preferences_is_object check (jsonb_typeof(preferences) = 'object')
);

comment on column public.user_preferences.preferences is
  'Keys: settings_active_tab, contact_messages_column_visibility, projects_view_mode, etc.';

create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- APPEARANCE SETTINGS (global customization panel)
-- -----------------------------------------------------------------------------

create table public.appearance_settings (
  user_id        uuid primary key references public.profiles (id) on delete cascade,
  theme          public.theme_mode not null default 'dark',
  accent_color   char(7) not null default '#ff6600',
  font_size      text not null default '14px',
  font_family_id text not null default 'inter',
  font_weight    text not null default '400',
  corner_radius  text not null default '14px',
  card_spacing   text not null default '10px',
  created_at     timestamptz not null default timezone('utc', now()),
  updated_at     timestamptz not null default timezone('utc', now()),
  constraint appearance_accent_color_hex check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint appearance_font_size_allowed check (font_size in ('10px', '14px', '18px', '20px', '30px')),
  constraint appearance_font_weight_allowed check (font_weight in ('300', '400', '600', '700')),
  constraint appearance_corner_radius_allowed check (corner_radius in ('0px', '5px', '14px', '25px')),
  constraint appearance_card_spacing_allowed check (card_spacing in ('5px', '10px', '15px'))
);

create trigger appearance_settings_set_updated_at
  before update on public.appearance_settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- NOTIFICATION PREFERENCES (/settings — Notifications tab)
-- -----------------------------------------------------------------------------

create table public.notification_preferences (
  user_id                   uuid primary key references public.profiles (id) on delete cascade,
  email_project_updates     boolean not null default true,
  email_new_messages        boolean not null default true,
  email_contact_submissions boolean not null default true,
  email_blog_updates        boolean not null default false,
  email_system_alerts       boolean not null default true,
  email_marketing           boolean not null default false,
  channel_email             boolean not null default true,
  channel_browser           boolean not null default true,
  frequency                 public.notification_frequency not null default 'instant',
  quiet_hours_start         time not null default '22:00',
  quiet_hours_end           time not null default '07:00',
  quiet_hours_timezone      text not null default '(GMT+05:00) Islamabad, Pakistan',
  created_at                timestamptz not null default timezone('utc', now()),
  updated_at                timestamptz not null default timezone('utc', now())
);

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- SECURITY SETTINGS (/settings — Security tab; no secrets in plain text)
-- -----------------------------------------------------------------------------

create table public.security_settings (
  user_id              uuid primary key references public.profiles (id) on delete cascade,
  two_factor_enabled   boolean not null default false,
  two_factor_method    public.two_factor_method,
  created_at           timestamptz not null default timezone('utc', now()),
  updated_at           timestamptz not null default timezone('utc', now())
);

create table public.two_factor_backup_codes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  code_hash    text not null,
  used_at      timestamptz,
  created_at   timestamptz not null default timezone('utc', now())
);

create index two_factor_backup_codes_user_id_idx on public.two_factor_backup_codes (user_id);

create trigger security_settings_set_updated_at
  before update on public.security_settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- AUTH HELPERS (RLS)
-- -----------------------------------------------------------------------------

create or replace function public.get_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

create or replace function public.is_authenticated_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('super_admin', 'admin', 'editor')
  );
$$;

create or replace function public.is_authenticated_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('super_admin', 'admin')
  );
$$;

-- Auto-create profile row when a Supabase Auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_site_id uuid;
begin
  select id into default_site_id from public.sites where slug = 'default' limit 1;

  insert into public.profiles (id, site_id, role, full_name, username, email)
  values (
    new.id,
    default_site_id,
    'viewer',
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.email
  );

  insert into public.user_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.appearance_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.notification_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.security_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- USER SESSIONS (recent login activity UI)
-- -----------------------------------------------------------------------------

create table public.user_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  ip_address    inet,
  user_agent    text,
  device_label  text,
  location      text,
  is_current    boolean not null default false,
  expires_at    timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz not null default timezone('utc', now())
);

create index user_sessions_user_id_idx on public.user_sessions (user_id);
create index user_sessions_created_at_idx on public.user_sessions (created_at desc);

-- -----------------------------------------------------------------------------
-- INTEGRATIONS (/settings — Integrations tab)
-- -----------------------------------------------------------------------------

create table public.integrations (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid not null references public.sites (id) on delete cascade,
  provider     public.integration_provider not null,
  is_connected boolean not null default false,
  config       jsonb not null default '{}'::jsonb,
  secret_ref   text,
  connected_at timestamptz,
  created_at   timestamptz not null default timezone('utc', now()),
  updated_at   timestamptz not null default timezone('utc', now()),
  deleted_at   timestamptz,
  version      integer not null default 1,
  unique (site_id, provider),
  constraint integrations_config_is_object check (jsonb_typeof(config) = 'object')
);

create trigger integrations_set_updated_at
  before update on public.integrations
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- CATEGORIES (/categories)
-- -----------------------------------------------------------------------------

create table public.categories (
  site_id      uuid not null references public.sites (id) on delete cascade,
  key          text not null,
  label        text not null,
  css_class    text not null,
  description  text,
  is_builtin   boolean not null default false,
  created_at   timestamptz not null default timezone('utc', now()),
  updated_at   timestamptz not null default timezone('utc', now()),
  deleted_at   timestamptz,
  version      integer not null default 1,
  primary key (site_id, key)
);

create index categories_site_id_idx on public.categories (site_id);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- MEDIA LIBRARY (/media-library)
-- -----------------------------------------------------------------------------

create table public.media_assets (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites (id) on delete cascade,
  legacy_id       integer,
  file_name       text not null,
  url             text not null,
  storage_path    text,
  alt_text        text,
  folder          public.media_folder not null default 'general',
  size_bytes      bigint not null default 0 check (size_bytes >= 0),
  mime_type       text not null default 'application/octet-stream',
  usage_count     integer not null default 0 check (usage_count >= 0),
  uploaded_at     timestamptz not null default timezone('utc', now()),
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now()),
  deleted_at      timestamptz,
  version         integer not null default 1
);

create index media_assets_site_id_idx on public.media_assets (site_id);
create index media_assets_folder_idx on public.media_assets (folder);
create index media_assets_uploaded_at_idx on public.media_assets (uploaded_at desc);
create unique index media_assets_site_legacy_id_idx on public.media_assets (site_id, legacy_id)
  where legacy_id is not null;

create trigger media_assets_set_updated_at
  before update on public.media_assets
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- PROJECTS (/projects)
-- -----------------------------------------------------------------------------

create table public.projects (
  id                  uuid primary key default gen_random_uuid(),
  site_id             uuid not null references public.sites (id) on delete cascade,
  legacy_id           integer,
  title               text not null,
  category_key        text not null,
  foreign key (site_id, category_key) references public.categories (site_id, key) on delete restrict,
  short_description   text not null,
  full_description    text not null,
  is_featured         boolean not null default false,
  scene_key           text,
  live_url            text,
  repo_url            text,
  featured_image_url  text,
  status              public.project_status not null default 'Pending',
  sort_order          integer not null default 0,
  created_at          timestamptz not null default timezone('utc', now()),
  updated_at          timestamptz not null default timezone('utc', now()),
  deleted_at          timestamptz,
  version             integer not null default 1
);

create index projects_site_id_idx on public.projects (site_id);
create index projects_category_key_idx on public.projects (category_key);
create index projects_status_idx on public.projects (status);
create index projects_sort_order_idx on public.projects (sort_order);
create unique index projects_site_legacy_id_idx on public.projects (site_id, legacy_id)
  where legacy_id is not null;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create table public.project_tags (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  tag         text not null,
  sort_order  integer not null default 0,
  unique (project_id, tag)
);

create index project_tags_project_id_idx on public.project_tags (project_id);

create table public.project_gallery_images (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  url         text not null,
  file_name   text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default timezone('utc', now())
);

create index project_gallery_images_project_id_idx on public.project_gallery_images (project_id);

-- -----------------------------------------------------------------------------
-- TECHNOLOGIES (/technologies)
-- -----------------------------------------------------------------------------

create table public.technologies (
  id                 uuid primary key default gen_random_uuid(),
  site_id            uuid not null references public.sites (id) on delete cascade,
  legacy_id          integer,
  name               text not null,
  group_key          public.technology_group not null,
  level_key          public.technology_level not null,
  documentation_url  text,
  description        text,
  years_experience   numeric(4, 1) check (years_experience is null or years_experience >= 0),
  is_featured        boolean not null default false,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default timezone('utc', now()),
  updated_at         timestamptz not null default timezone('utc', now()),
  deleted_at         timestamptz,
  version            integer not null default 1
);

create index technologies_site_id_idx on public.technologies (site_id);
create unique index technologies_site_name_idx on public.technologies (site_id, lower(name))
  where deleted_at is null;
create unique index technologies_site_legacy_id_idx on public.technologies (site_id, legacy_id)
  where legacy_id is not null;

create trigger technologies_set_updated_at
  before update on public.technologies
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- EXPERIENCE (/experience)
-- -----------------------------------------------------------------------------

create table public.experience_entries (
  id               uuid primary key default gen_random_uuid(),
  site_id          uuid not null references public.sites (id) on delete cascade,
  legacy_id        integer,
  job_title        text not null,
  company          text not null,
  location         text,
  employment_type  public.employment_type not null,
  start_date       char(7) not null,
  end_date         char(7),
  is_current       boolean not null default false,
  description      text,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default timezone('utc', now()),
  updated_at       timestamptz not null default timezone('utc', now()),
  deleted_at       timestamptz,
  version          integer not null default 1,
  constraint experience_start_date_format check (start_date ~ '^\d{4}-\d{2}$'),
  constraint experience_end_date_format check (end_date is null or end_date ~ '^\d{4}-\d{2}$'),
  constraint experience_current_end_date check (
    (is_current = true and end_date is null) or (is_current = false)
  )
);

create index experience_entries_site_id_idx on public.experience_entries (site_id);
create unique index experience_entries_site_legacy_id_idx on public.experience_entries (site_id, legacy_id)
  where legacy_id is not null;

create trigger experience_entries_set_updated_at
  before update on public.experience_entries
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- TESTIMONIALS (/testimonials)
-- -----------------------------------------------------------------------------

create table public.testimonials (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid not null references public.sites (id) on delete cascade,
  legacy_id    integer,
  client_name  text not null,
  client_role  text,
  company      text,
  quote        text not null,
  rating       smallint not null default 5 check (rating between 1 and 5),
  avatar_url   text,
  avatar_alt   text,
  is_featured  boolean not null default false,
  created_at   timestamptz not null default timezone('utc', now()),
  updated_at   timestamptz not null default timezone('utc', now()),
  deleted_at   timestamptz,
  version      integer not null default 1
);

create index testimonials_site_id_idx on public.testimonials (site_id);
create unique index testimonials_site_legacy_id_idx on public.testimonials (site_id, legacy_id)
  where legacy_id is not null;

create trigger testimonials_set_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- BLOG POSTS (/blog-post)
-- -----------------------------------------------------------------------------

create table public.blog_posts (
  id                  uuid primary key default gen_random_uuid(),
  site_id             uuid not null references public.sites (id) on delete cascade,
  legacy_id           integer,
  title               text not null,
  slug                text not null,
  excerpt             text not null,
  content             text not null,
  category_key        public.blog_category_key not null,
  status              public.blog_post_status not null default 'Draft',
  is_featured         boolean not null default false,
  featured_image_url  text,
  featured_image_alt  text,
  published_at        date,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default timezone('utc', now()),
  updated_at          timestamptz not null default timezone('utc', now()),
  deleted_at          timestamptz,
  version             integer not null default 1,
  constraint blog_posts_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index blog_posts_site_slug_idx on public.blog_posts (site_id, slug)
  where deleted_at is null;
create index blog_posts_site_status_idx on public.blog_posts (site_id, status);
create unique index blog_posts_site_legacy_id_idx on public.blog_posts (site_id, legacy_id)
  where legacy_id is not null;

create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

create table public.blog_post_tags (
  id           uuid primary key default gen_random_uuid(),
  blog_post_id uuid not null references public.blog_posts (id) on delete cascade,
  tag          text not null,
  sort_order   integer not null default 0,
  unique (blog_post_id, tag)
);

create index blog_post_tags_blog_post_id_idx on public.blog_post_tags (blog_post_id);

-- -----------------------------------------------------------------------------
-- CONTACT MESSAGES (/contact-messages)
-- -----------------------------------------------------------------------------

create table public.contact_messages (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid not null references public.sites (id) on delete cascade,
  legacy_id     integer,
  sender_name   text not null,
  sender_email  text not null,
  subject       text not null,
  snippet       text,
  body          text not null,
  status        public.contact_message_status not null default 'new',
  sender_ip     inet,
  reply_body    text,
  replied_at    timestamptz,
  is_starred    boolean not null default false,
  created_at    timestamptz not null default timezone('utc', now()),
  updated_at    timestamptz not null default timezone('utc', now()),
  deleted_at    timestamptz,
  version       integer not null default 1
);

create index contact_messages_site_id_idx on public.contact_messages (site_id);
create index contact_messages_status_idx on public.contact_messages (status);
create index contact_messages_created_at_idx on public.contact_messages (created_at desc);
create unique index contact_messages_site_legacy_id_idx on public.contact_messages (site_id, legacy_id)
  where legacy_id is not null;

create trigger contact_messages_set_updated_at
  before update on public.contact_messages
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- BACKUP SNAPSHOTS (/backup-restore)
-- -----------------------------------------------------------------------------

create table public.backup_snapshots (
  id             uuid primary key default gen_random_uuid(),
  site_id        uuid not null references public.sites (id) on delete cascade,
  filename       text not null,
  storage_path   text not null,
  size_bytes     bigint not null default 0,
  record_counts  jsonb not null default '{}'::jsonb,
  schema_version text not null default '1.0.0',
  status         public.backup_status not null default 'pending',
  error_message  text,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default timezone('utc', now()),
  completed_at   timestamptz
);

create index backup_snapshots_site_id_idx on public.backup_snapshots (site_id);
create index backup_snapshots_created_at_idx on public.backup_snapshots (created_at desc);

-- -----------------------------------------------------------------------------
-- DASHBOARD VIEW (read-only aggregation for /)
-- -----------------------------------------------------------------------------

create or replace view public.dashboard_stats as
select
  s.id as site_id,
  (select count(*) from public.projects p where p.site_id = s.id and p.deleted_at is null) as total_projects,
  (select count(*) from public.technologies t where t.site_id = s.id and t.deleted_at is null) as total_technologies,
  (select count(*) from public.media_assets m where m.site_id = s.id and m.deleted_at is null) as total_media,
  (select count(*) from public.testimonials tm where tm.site_id = s.id and tm.deleted_at is null) as total_testimonials,
  (select count(*) from public.experience_entries e where e.site_id = s.id and e.deleted_at is null) as total_experience,
  (select count(*) from public.blog_posts b where b.site_id = s.id and b.deleted_at is null) as total_blog_posts,
  (select count(*) from public.contact_messages c where c.site_id = s.id and c.deleted_at is null) as total_contact_messages
from public.sites s
where s.deleted_at is null;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------

alter table public.sites enable row level security;
alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.user_preferences enable row level security;
alter table public.appearance_settings enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.security_settings enable row level security;
alter table public.two_factor_backup_codes enable row level security;
alter table public.user_sessions enable row level security;
alter table public.integrations enable row level security;
alter table public.categories enable row level security;
alter table public.media_assets enable row level security;
alter table public.projects enable row level security;
alter table public.project_tags enable row level security;
alter table public.project_gallery_images enable row level security;
alter table public.technologies enable row level security;
alter table public.experience_entries enable row level security;
alter table public.testimonials enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_post_tags enable row level security;
alter table public.contact_messages enable row level security;
alter table public.backup_snapshots enable row level security;

-- Public read: portfolio content (non-deleted)
create policy "Public read categories"
  on public.categories for select
  using (deleted_at is null);

create policy "Public read projects"
  on public.projects for select
  using (deleted_at is null);

create policy "Public read project tags"
  on public.project_tags for select
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and p.deleted_at is null
  ));

create policy "Public read project gallery"
  on public.project_gallery_images for select
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and p.deleted_at is null
  ));

create policy "Public read technologies"
  on public.technologies for select
  using (deleted_at is null);

create policy "Public read experience"
  on public.experience_entries for select
  using (deleted_at is null);

create policy "Public read testimonials"
  on public.testimonials for select
  using (deleted_at is null);

create policy "Public read published blog posts"
  on public.blog_posts for select
  using (deleted_at is null and status = 'Published');

create policy "Public read blog post tags"
  on public.blog_post_tags for select
  using (exists (
    select 1 from public.blog_posts b
    where b.id = blog_post_id and b.deleted_at is null and b.status = 'Published'
  ));

create policy "Public read media assets"
  on public.media_assets for select
  using (deleted_at is null);

create policy "Public read site settings"
  on public.site_settings for select
  using (true);

-- Staff write: CMS content
create policy "Staff manage categories"
  on public.categories for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

create policy "Staff manage projects"
  on public.projects for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

create policy "Staff manage project tags"
  on public.project_tags for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

create policy "Staff manage project gallery"
  on public.project_gallery_images for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

create policy "Staff manage technologies"
  on public.technologies for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

create policy "Staff manage experience"
  on public.experience_entries for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

create policy "Staff manage testimonials"
  on public.testimonials for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

create policy "Staff manage all blog posts"
  on public.blog_posts for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

create policy "Staff manage blog post tags"
  on public.blog_post_tags for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

create policy "Staff manage media"
  on public.media_assets for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

-- Contact messages: public can submit; staff manage
create policy "Anyone can submit contact messages"
  on public.contact_messages for insert
  with check (true);

create policy "Staff read contact messages"
  on public.contact_messages for select
  using (public.is_authenticated_staff());

create policy "Staff update contact messages"
  on public.contact_messages for update
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

create policy "Staff delete contact messages"
  on public.contact_messages for delete
  using (public.is_authenticated_staff());

-- Profiles & per-user settings
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_authenticated_admin());

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_authenticated_admin())
  with check (auth.uid() = id or public.is_authenticated_admin());

create policy "Admins manage all profiles"
  on public.profiles for all
  using (public.is_authenticated_admin())
  with check (public.is_authenticated_admin());

create policy "Users manage own preferences"
  on public.user_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own appearance"
  on public.appearance_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own notifications"
  on public.notification_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own security settings"
  on public.security_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own 2fa backup codes"
  on public.two_factor_backup_codes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users read own sessions"
  on public.user_sessions for select
  using (auth.uid() = user_id or public.is_authenticated_admin());

create policy "Users manage own sessions"
  on public.user_sessions for update
  using (auth.uid() = user_id or public.is_authenticated_admin())
  with check (auth.uid() = user_id or public.is_authenticated_admin());

-- Admin-only: site settings, integrations, backups, sites
create policy "Admins manage site settings"
  on public.site_settings for all
  using (public.is_authenticated_admin())
  with check (public.is_authenticated_admin());

create policy "Admins manage integrations"
  on public.integrations for all
  using (public.is_authenticated_admin())
  with check (public.is_authenticated_admin());

create policy "Admins manage backup snapshots"
  on public.backup_snapshots for all
  using (public.is_authenticated_admin())
  with check (public.is_authenticated_admin());

create policy "Admins manage sites"
  on public.sites for all
  using (public.is_authenticated_admin())
  with check (public.is_authenticated_admin());

-- -----------------------------------------------------------------------------
-- STORAGE BUCKET (media uploads)
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do nothing;

create policy "Public read media bucket"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "Staff upload media bucket"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and public.is_authenticated_staff()
  );

create policy "Staff update media bucket"
  on storage.objects for update
  using (
    bucket_id = 'media'
    and public.is_authenticated_staff()
  );

create policy "Staff delete media bucket"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and public.is_authenticated_staff()
  );

-- === section: 20260906120001_seed_defaults.sql ===
-- =============================================================================
-- Seed default site, settings, and built-in categories
-- =============================================================================

insert into public.sites (id, slug, name)
values ('00000000-0000-4000-8000-000000000001', 'default', 'Portfolio Admin')
on conflict (slug) do nothing;

insert into public.site_settings (site_id, site_title, site_tagline, site_url, admin_email, site_description)
values (
  '00000000-0000-4000-8000-000000000001',
  'Portfolio Admin',
  'Track, Analyze, and Showcase Your Success',
  'https://myportfolio.com',
  'dev.techiesohaib@gmail.com',
  'A centralized hub to track your projects, monitor performance metrics, and showcase your work — all in one intuitive interface.'
)
on conflict (site_id) do nothing;

insert into public.categories (site_id, key, label, css_class, description, is_builtin) values
  ('00000000-0000-4000-8000-000000000001', 'enterprise',   'Enterprise Platform',      'pa-cat-enterprise',   'Large-scale business and enterprise web applications.', true),
  ('00000000-0000-4000-8000-000000000001', 'educational',  'Educational Platform',     'pa-cat-educational',  'E-learning platforms, portals, and educational tools.', false),
  ('00000000-0000-4000-8000-000000000001', 'desktop',      'Desktop Application',      'pa-cat-desktop',      'Windows, macOS, or cross-platform desktop software.', false),
  ('00000000-0000-4000-8000-000000000001', 'medical',      'Medical System',           'pa-cat-medical',      'Healthcare management, patient records, and clinical tools.', false),
  ('00000000-0000-4000-8000-000000000001', 'ecommerce',    'E-Commerce',               'pa-cat-ecommerce',    'Online stores and commerce platforms.', true),
  ('00000000-0000-4000-8000-000000000001', 'travel',       'Travel Platform',          'pa-cat-travel',       'Travel and booking applications.', false),
  ('00000000-0000-4000-8000-000000000001', 'web',          'Web Application',          'pa-cat-web',          'General web applications and SPAs.', true),
  ('00000000-0000-4000-8000-000000000001', 'nonprofit',    'Non Profit Organization',  'pa-cat-nonprofit',    'Non-profit and community organization websites.', true)
on conflict (site_id, key) do nothing;

-- === section: 20260906120002_site_settings_extras.sql ===
-- Add JSON columns for appearance + contact message column prefs on site_settings
alter table public.site_settings
  add column if not exists appearance_settings jsonb not null default '{
    "theme": "dark",
    "accent": "#ff6600",
    "fontSize": "14px",
    "fontFamily": "inter",
    "fontWeight": "400",
    "cornerRadius": "14px",
    "cardSpacing": "10px"
  }'::jsonb,
  add column if not exists contact_message_columns jsonb not null default '{
    "checkbox": true,
    "from": true,
    "subject": true,
    "status": true,
    "date": true,
    "actions": true
  }'::jsonb,
  add column if not exists profile_full_name text,
  add column if not exists profile_username text,
  add column if not exists profile_role text,
  add column if not exists profile_phone text,
  add column if not exists profile_dob date,
  add column if not exists profile_bio text,
  add column if not exists profile_location text,
  add column if not exists profile_website text,
  add column if not exists profile_social_links jsonb not null default '[]'::jsonb;

-- === section: 20260907120000_tools.sql ===
-- Tools showcase: categories (Frontend, Backend, …) with proficiency % and child tool items.

create table public.tool_categories (
  id               uuid primary key default gen_random_uuid(),
  site_id          uuid not null references public.sites (id) on delete cascade,
  legacy_id        integer,
  key              text not null,
  label            text not null,
  description      text,
  proficiency_pct  smallint not null default 0
                     check (proficiency_pct between 0 and 100),
  icon_class       text,
  color            char(7) default '#34d399',
  sort_order       integer not null default 0,
  created_at       timestamptz not null default timezone('utc', now()),
  updated_at       timestamptz not null default timezone('utc', now()),
  deleted_at       timestamptz,
  version          integer not null default 1
);

create index tool_categories_site_id_idx on public.tool_categories (site_id);
create unique index tool_categories_site_key_idx on public.tool_categories (site_id, lower(key))
  where deleted_at is null;
create unique index tool_categories_site_legacy_id_idx on public.tool_categories (site_id, legacy_id)
  where legacy_id is not null;

create trigger tool_categories_set_updated_at
  before update on public.tool_categories
  for each row execute function public.set_updated_at();

create table public.tool_items (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.tool_categories (id) on delete cascade,
  legacy_id    integer,
  name         text not null,
  icon_class   text,
  icon_url     text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default timezone('utc', now())
);

create index tool_items_category_id_idx on public.tool_items (category_id);
create unique index tool_items_category_name_idx on public.tool_items (category_id, lower(name));

alter table public.tool_categories enable row level security;
alter table public.tool_items enable row level security;

create policy "Public read tool categories"
  on public.tool_categories for select
  using (deleted_at is null);

create policy "Public read tool items"
  on public.tool_items for select
  using (exists (
    select 1 from public.tool_categories c
    where c.id = category_id and c.deleted_at is null
  ));

create policy "Staff manage tool categories"
  on public.tool_categories for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

create policy "Staff manage tool items"
  on public.tool_items for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

-- === section: 20260908120000_login_activity.sql ===
-- Login activity feed (successful, failed, and logout events)

create type public.login_activity_status as enum ('success', 'failed', 'logout');

create table public.login_activity (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  email          text,
  status         public.login_activity_status not null,
  ip_address     text,
  user_agent     text,
  device_label   text,
  device_icon    text,
  location       text,
  failure_reason text,
  is_current     boolean not null default false,
  created_at     timestamptz not null default timezone('utc', now())
);

create index login_activity_user_id_idx on public.login_activity (user_id);
create index login_activity_created_at_idx on public.login_activity (created_at desc);
create index login_activity_user_created_idx on public.login_activity (user_id, created_at desc);

alter table public.login_activity enable row level security;

create policy "Users read own login activity"
  on public.login_activity for select
  using (auth.uid() = user_id or public.is_authenticated_admin());

create policy "Admins insert login activity"
  on public.login_activity for insert
  with check (public.is_authenticated_admin());

create policy "Admins update login activity"
  on public.login_activity for update
  using (public.is_authenticated_admin())
  with check (public.is_authenticated_admin());

-- user_sessions: allow admin API to insert successful sessions
create policy "Admins insert user sessions"
  on public.user_sessions for insert
  with check (public.is_authenticated_admin());

-- === section: 20260908140000_media_assets_url_hash.sql ===
-- Support deduplicating media_assets by URL hash (required for long base64 data URLs).

create extension if not exists pgcrypto with schema extensions;

alter table public.media_assets
  add column if not exists url_hash text;

update public.media_assets
set url_hash = encode(extensions.digest(url, 'sha256'), 'hex')
where url_hash is null;

create unique index if not exists media_assets_site_url_hash_idx
  on public.media_assets (site_id, url_hash)
  where url_hash is not null and deleted_at is null;

create index if not exists media_assets_url_hash_idx
  on public.media_assets (url_hash)
  where url_hash is not null;

-- === section: 20260908150000_media_assets_source.sql ===
-- Track whether a media row was uploaded via Media Library or auto-synced from CMS entities.

create type public.media_source as enum ('manual', 'entity');

alter table public.media_assets
  add column if not exists source public.media_source not null default 'manual';

-- Rows created by entity sync (before this column existed) are safe to prune when unused.
update public.media_assets
set source = 'entity'
where source = 'manual'
  and legacy_id is not null
  and folder in ('projects', 'blog', 'testimonials', 'avatars', 'icons');

create index if not exists media_assets_source_idx
  on public.media_assets (source)
  where deleted_at is null;

-- === section: 20260910120000_recent_activities.sql ===
-- Recent activities audit log for the admin dashboard

create type public.activity_type as enum (
  'user_action',
  'system_event',
  'content_change',
  'other'
);

create type public.activity_status as enum (
  'success',
  'completed',
  'created',
  'info',
  'warning',
  'failed',
  'sent',
  'uploaded'
);

create table public.recent_activities (
  id                  uuid primary key default gen_random_uuid(),
  site_id             uuid not null references public.sites (id) on delete cascade,
  user_id             uuid references public.profiles (id) on delete set null,
  action_title        text not null,
  action_description  text,
  type                public.activity_type not null default 'other',
  status              public.activity_status not null default 'info',
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default timezone('utc', now())
);

create index recent_activities_site_id_idx on public.recent_activities (site_id);
create index recent_activities_user_id_idx on public.recent_activities (user_id);
create index recent_activities_type_idx on public.recent_activities (type);
create index recent_activities_status_idx on public.recent_activities (status);
create index recent_activities_created_at_idx on public.recent_activities (created_at desc);
create index recent_activities_site_created_idx on public.recent_activities (site_id, created_at desc);

alter table public.recent_activities enable row level security;

create policy "Staff read recent activities"
  on public.recent_activities for select
  using (public.is_authenticated_admin());

create policy "Admins insert recent activities"
  on public.recent_activities for insert
  with check (public.is_authenticated_admin());

create policy "Admins delete recent activities"
  on public.recent_activities for delete
  using (public.is_authenticated_admin());

-- === section: 20260910120001_seed_recent_activities.sql ===
-- Sample recent-activity seed removed.
-- Real activity rows are created by the application at runtime.
-- (Previously inserted demo rows for the dashboard; kept as no-op so new
-- Supabase projects do not get fake activity data.)

select 1;

-- === section: 20260910130000_clear_recent_activities.sql ===
-- No-op: paired with removed demo activity seed (20260910120001).
-- Do not bulk-delete recent_activities on fresh installs.

select 1;

-- === section: 20260910140000_recent_activities_retention.sql ===
-- Automatically purge recent_activities rows older than 12 hours.

create or replace function public.purge_expired_recent_activities()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.recent_activities
  where created_at < timezone('utc', now()) - interval '12 hours';
end;
$$;

comment on function public.purge_expired_recent_activities() is
  'Deletes recent_activities rows older than 12 hours. Used by pg_cron and optional manual cleanup.';

-- Schedule hourly cleanup when pg_cron is available (Supabase: enable Database → Extensions → pg_cron).
do $schedule$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'purge-expired-recent-activities';

    perform cron.schedule(
      'purge-expired-recent-activities',
      '0 * * * *',
      $$select public.purge_expired_recent_activities();$$
    );
  end if;
end;
$schedule$;

-- === section: 20260912120000_integrations_dynamic.sql ===
-- Reset demo-connected integrations that have no saved configuration.
update public.integrations
set
  is_connected = false,
  connected_at = null,
  config = '{}'::jsonb,
  updated_at = timezone('utc', now())
where site_id = '00000000-0000-4000-8000-000000000001'
  and is_connected = true
  and (config is null or config = '{}'::jsonb or config = '{"_secrets":{}}'::jsonb);

comment on column public.integrations.config is
  'Public integration settings (measurement IDs, URLs, etc.). Encrypted secrets are stored under config._secrets.';

-- === section: 20260914120000_categories_builtin_subset.sql ===
-- Keep only four built-in categories: enterprise, ecommerce, web, nonprofit
update public.categories
set is_builtin = true
where site_id = '00000000-0000-4000-8000-000000000001'
  and key in ('enterprise', 'ecommerce', 'web', 'nonprofit');

update public.categories
set is_builtin = false
where site_id = '00000000-0000-4000-8000-000000000001'
  and key in ('educational', 'desktop', 'medical', 'travel');

-- === section: 20260915120000_integration_provider_openai.sql ===
-- Add OpenAI to the integration_provider enum (required for Settings → Integrations).
alter type public.integration_provider add value if not exists 'openai';

-- === section: 20260915130000_integration_provider_deepseek.sql ===
-- Add DeepSeek as an AI integration provider (replaces OpenAI in the dashboard UI).
alter type public.integration_provider add value if not exists 'deepseek';

-- === section: 20260915140000_integration_provider_puter.sql ===
-- Puter AI (client-side, user-pays — no API key in dashboard)
ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'puter';

-- === section: 20260915150000_site_settings_agent.sql ===
-- Portfolio Agent site-wide preferences (removed in 20260915160000)
alter table public.site_settings
  add column if not exists agent_settings jsonb not null default '{
    "enabled": true,
    "ollamaMode": null,
    "model": null,
    "ollamaUrl": null,
    "useLocalFallback": true,
    "includeEntityContext": true
  }'::jsonb;

-- === section: 20260915160000_drop_site_settings_agent.sql ===
-- Remove Portfolio Agent settings column
alter table public.site_settings
  drop column if exists agent_settings;

-- === section: 20260915170000_drop_tool_categories.sql ===
-- Upgrade path: migrate legacy tool_categories + tool_items.category_id, then drop tool_categories.
-- No-op when the table was never created (fresh installs use 20260907120000_tools.sql).

alter table public.tool_items
  add column if not exists site_id uuid references public.sites (id) on delete cascade,
  add column if not exists category_key text;

do $migrate$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'tool_categories'
  ) then
    return;
  end if;

  update public.tool_items ti
  set
    site_id = tc.site_id,
    category_key = tc.key
  from public.tool_categories tc
  where ti.category_id = tc.id;

  delete from public.tool_items
  where site_id is null or category_key is null;

  drop policy if exists "Public read tool items" on public.tool_items;

  alter table public.tool_items drop constraint if exists tool_items_category_id_fkey;
  drop index if exists public.tool_items_category_id_idx;
  drop index if exists public.tool_items_category_name_idx;
  alter table public.tool_items drop column if exists category_id;

  drop policy if exists "Public read tool categories" on public.tool_categories;
  drop policy if exists "Staff manage tool categories" on public.tool_categories;
  drop trigger if exists tool_categories_set_updated_at on public.tool_categories;
  drop table public.tool_categories;
end
$migrate$;

alter table public.tool_items
  alter column site_id set not null,
  alter column category_key set not null;

create index if not exists tool_items_site_id_idx on public.tool_items (site_id);
create index if not exists tool_items_site_category_key_idx on public.tool_items (site_id, category_key);
create unique index if not exists tool_items_site_category_name_idx
  on public.tool_items (site_id, category_key, lower(name));

drop policy if exists "Public read tool items" on public.tool_items;
create policy "Public read tool items"
  on public.tool_items for select
  using (exists (
    select 1 from public.categories c
    where c.site_id = tool_items.site_id
      and c.key = tool_items.category_key
      and c.deleted_at is null
  ));

-- === section: 20260915180000_restore_tool_categories.sql ===
-- Restore tool_categories table and tool_items.category_id (reverses 20260915170000).

create table if not exists public.tool_categories (
  id               uuid primary key default gen_random_uuid(),
  site_id          uuid not null references public.sites (id) on delete cascade,
  legacy_id        integer,
  key              text not null,
  label            text not null,
  description      text,
  proficiency_pct  smallint not null default 0
                     check (proficiency_pct between 0 and 100),
  icon_class       text,
  color            char(7) default '#34d399',
  sort_order       integer not null default 0,
  created_at       timestamptz not null default timezone('utc', now()),
  updated_at       timestamptz not null default timezone('utc', now()),
  deleted_at       timestamptz,
  version          integer not null default 1
);

create index if not exists tool_categories_site_id_idx on public.tool_categories (site_id);
create unique index if not exists tool_categories_site_key_idx on public.tool_categories (site_id, lower(key))
  where deleted_at is null;
create unique index if not exists tool_categories_site_legacy_id_idx on public.tool_categories (site_id, legacy_id)
  where legacy_id is not null;

drop trigger if exists tool_categories_set_updated_at on public.tool_categories;
create trigger tool_categories_set_updated_at
  before update on public.tool_categories
  for each row execute function public.set_updated_at();

alter table public.tool_categories enable row level security;

drop policy if exists "Public read tool categories" on public.tool_categories;
create policy "Public read tool categories"
  on public.tool_categories for select
  using (deleted_at is null);

drop policy if exists "Staff manage tool categories" on public.tool_categories;
create policy "Staff manage tool categories"
  on public.tool_categories for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

do $restore$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tool_items'
      and column_name = 'category_key'
  ) then
    return;
  end if;

  alter table public.tool_items
    add column if not exists category_id uuid references public.tool_categories (id) on delete cascade;

  insert into public.tool_categories (
    site_id, legacy_id, key, label, description, proficiency_pct, icon_class, color, sort_order, deleted_at
  )
  select
    ti.site_id,
    row_number() over (partition by ti.site_id order by ti.category_key)::integer,
    ti.category_key,
    coalesce(c.label, initcap(replace(ti.category_key, '-', ' '))),
    coalesce(c.description, ''),
    0,
    'ri-tools-line',
    '#34d399',
    row_number() over (partition by ti.site_id order by ti.category_key)::integer,
    null
  from (
    select distinct site_id, category_key
    from public.tool_items
    where category_key is not null
  ) ti
  left join public.categories c
    on c.site_id = ti.site_id
    and c.key = ti.category_key
    and c.deleted_at is null
  where not exists (
    select 1
    from public.tool_categories tc
    where tc.site_id = ti.site_id
      and lower(tc.key) = lower(ti.category_key)
      and tc.deleted_at is null
  );

  update public.tool_items ti
  set category_id = tc.id
  from public.tool_categories tc
  where ti.category_id is null
    and ti.site_id = tc.site_id
    and lower(ti.category_key) = lower(tc.key)
    and tc.deleted_at is null;

  delete from public.tool_items where category_id is null;

  drop policy if exists "Public read tool items" on public.tool_items;

  drop index if exists public.tool_items_site_category_key_idx;
  drop index if exists public.tool_items_site_category_name_idx;
  drop index if exists public.tool_items_site_id_idx;

  alter table public.tool_items drop column if exists category_key;
  alter table public.tool_items drop column if exists site_id;

  alter table public.tool_items alter column category_id set not null;
end
$restore$;

create index if not exists tool_items_category_id_idx on public.tool_items (category_id);
create unique index if not exists tool_items_category_name_idx on public.tool_items (category_id, lower(name));

drop policy if exists "Public read tool items" on public.tool_items;
create policy "Public read tool items"
  on public.tool_items for select
  using (exists (
    select 1 from public.tool_categories c
    where c.id = category_id and c.deleted_at is null
  ));

-- === section: 20260916120000_blog_categories.sql ===
-- Blog categories CMS table (replaces blog_category_key enum on blog_posts).

create table public.blog_categories (
  id               uuid primary key default gen_random_uuid(),
  site_id          uuid not null references public.sites (id) on delete cascade,
  legacy_id        integer,
  key              text not null,
  label            text not null,
  description      text,
  proficiency_pct  smallint not null default 0
                     check (proficiency_pct between 0 and 100),
  icon_class       text,
  color            char(7) default '#ff6600',
  sort_order       integer not null default 0,
  created_at       timestamptz not null default timezone('utc', now()),
  updated_at       timestamptz not null default timezone('utc', now()),
  deleted_at       timestamptz,
  version          integer not null default 1
);

create index blog_categories_site_id_idx on public.blog_categories (site_id);
create unique index blog_categories_site_key_idx on public.blog_categories (site_id, lower(key))
  where deleted_at is null;
create unique index blog_categories_site_legacy_id_idx on public.blog_categories (site_id, legacy_id)
  where legacy_id is not null;

alter table public.blog_categories
  add constraint blog_categories_site_key_unique unique (site_id, key);

create trigger blog_categories_set_updated_at
  before update on public.blog_categories
  for each row execute function public.set_updated_at();

alter table public.blog_categories enable row level security;

create policy "Public read blog categories"
  on public.blog_categories for select
  using (deleted_at is null);

create policy "Staff manage blog categories"
  on public.blog_categories for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

-- Seed default categories for every site (from former enum values).
insert into public.blog_categories (
  site_id, legacy_id, key, label, description, proficiency_pct, icon_class, color, sort_order
)
select
  s.id,
  v.legacy_id,
  v.key,
  v.label,
  v.description,
  v.proficiency_pct,
  v.icon_class,
  v.color,
  v.sort_order
from public.sites s
cross join (
  values
    (1,  'tutorial',     'Tutorial',         'Step-by-step guides and how-tos', 85, 'ri-book-open-line',     '#3b82f6', 1),
    (2,  'case-study',   'Case Study',       'Project breakdowns and results',  85, 'ri-briefcase-line',     '#a855f7', 2),
    (3,  'career',       'Career & Growth',  'Career advice and professional growth', 80, 'ri-user-star-line', '#8b5cf6', 3),
    (4,  'news',         'News & Updates',   'Announcements and industry news', 75, 'ri-newspaper-line',     '#14b8a6', 4),
    (5,  'tips',         'Tips & Tricks',    'Quick tips and productivity hacks', 80, 'ri-lightbulb-line',   '#22c55e', 5),
    (6,  'opinion',      'Opinion',          'Thoughts and perspectives',       70, 'ri-chat-3-line',        '#f97316', 6),
    (7,  'devlog',       'Dev Log',          'Development progress logs',       75, 'ri-code-box-line',      '#06b6d4', 7),
    (8,  'announcement', 'Announcement',     'Official announcements',          90, 'ri-megaphone-line',     '#ef4444', 8)
) as v(legacy_id, key, label, description, proficiency_pct, icon_class, color, sort_order)
where not exists (
  select 1 from public.blog_categories bc
  where bc.site_id = s.id and lower(bc.key) = lower(v.key) and bc.deleted_at is null
);

-- Convert blog_posts.category_key from enum to text FK.
alter table public.blog_posts
  alter column category_key type text using category_key::text;

alter table public.blog_posts
  add constraint blog_posts_category_fkey
  foreign key (site_id, category_key)
  references public.blog_categories (site_id, key)
  on delete restrict;

drop type if exists public.blog_category_key;

-- === section: 20260916140000_blog_categories_css_class.sql ===
-- Add colour-theme class for blog categories (matches project Categories page picker).

alter table public.blog_categories
  add column if not exists css_class text;

update public.blog_categories
set css_class = case key
  when 'tutorial' then 'pa-cat-web'
  when 'case-study' then 'pa-cat-ecommerce'
  when 'career' then 'pa-cat-educational'
  when 'news' then 'pa-cat-travel'
  when 'tips' then 'pa-cat-nonprofit'
  when 'opinion' then 'pa-cat-medical'
  when 'devlog' then 'pa-cat-desktop'
  when 'announcement' then 'pa-cat-enterprise'
  else coalesce(css_class, 'pa-cat-web')
end
where css_class is null or css_class = '';

-- === section: 20260916160000_drop_tool_css_class.sql ===
-- Remove css_class from tool tables (colour/class is not user-configurable on tool pages).

alter table public.tool_categories
  drop column if exists css_class;

alter table public.tool_items
  drop column if exists css_class;

-- === section: 20260916170000_technologies_category_id.sql ===
-- Link technologies to tool_categories (shared category taxonomy with tools).
-- Replaces technologies.group_key enum with category_id FK.

-- Default category templates (key, label, icon, color, proficiency, sort)
create temporary table _tech_cat_defaults (
  key text primary key,
  label text not null,
  icon_class text not null,
  color char(7) not null,
  proficiency_pct smallint not null,
  sort_order integer not null
) on commit drop;

insert into _tech_cat_defaults (key, label, icon_class, color, proficiency_pct, sort_order) values
  ('frontend', 'Frontend', 'ri-layout-line', '#60a5fa', 85, 1),
  ('backend', 'Backend', 'ri-server-line', '#34d399', 85, 2),
  ('database', 'Database', 'ri-database-2-line', '#a78bfa', 80, 3),
  ('devops', 'DevOps & Cloud', 'ri-cloud-line', '#38bdf8', 75, 4),
  ('mobile', 'Mobile', 'ri-smartphone-line', '#fb923c', 70, 5),
  ('design', 'Design & Tools', 'ri-palette-line', '#f472b6', 80, 6),
  ('other', 'Other', 'ri-more-line', '#9a9aa0', 60, 7);

-- Ensure every site has the default categories (skip keys that already exist).
insert into public.tool_categories (
  site_id, legacy_id, key, label, description, proficiency_pct, icon_class, color, sort_order
)
select
  s.id,
  coalesce(mx.max_legacy, 0) + row_number() over (partition by s.id order by d.sort_order),
  d.key,
  d.label,
  null,
  d.proficiency_pct,
  d.icon_class,
  d.color,
  d.sort_order
from public.sites s
cross join _tech_cat_defaults d
left join lateral (
  select max(tc.legacy_id) as max_legacy
  from public.tool_categories tc
  where tc.site_id = s.id
) mx on true
where not exists (
  select 1
  from public.tool_categories tc
  where tc.site_id = s.id
    and lower(tc.key) = d.key
    and tc.deleted_at is null
);

-- Add nullable FK first
alter table public.technologies
  add column if not exists category_id uuid references public.tool_categories (id) on delete restrict;

-- Backfill from group_key → matching tool_categories.key
update public.technologies t
set category_id = c.id
from public.tool_categories c
where t.category_id is null
  and c.site_id = t.site_id
  and c.deleted_at is null
  and lower(c.key) = t.group_key::text;

-- Fallback: any remaining rows → site "other" category
update public.technologies t
set category_id = c.id
from public.tool_categories c
where t.category_id is null
  and c.site_id = t.site_id
  and c.deleted_at is null
  and lower(c.key) = 'other';

-- Last resort: first category for that site
update public.technologies t
set category_id = (
  select c.id
  from public.tool_categories c
  where c.site_id = t.site_id
    and c.deleted_at is null
  order by c.sort_order, c.created_at
  limit 1
)
where t.category_id is null;

alter table public.technologies
  alter column category_id set not null;

create index if not exists technologies_category_id_idx
  on public.technologies (category_id);

alter table public.technologies
  drop column if exists group_key;

drop type if exists public.technology_group;

-- === section: 20260916180000_tool_categories_legacy_id_backfill.sql ===
-- Ensure every tool_categories row has a stable legacy_id (app uses it as categoryId).
with ranked as (
  select
    tc.id,
    coalesce(
      (
        select max(tc2.legacy_id)
        from public.tool_categories tc2
        where tc2.site_id = tc.site_id
          and tc2.legacy_id is not null
      ),
      0
    ) + row_number() over (
      partition by tc.site_id
      order by tc.sort_order nulls last, tc.created_at, tc.id
    ) as new_legacy_id
  from public.tool_categories tc
  where tc.legacy_id is null
)
update public.tool_categories tc
set legacy_id = ranked.new_legacy_id
from ranked
where tc.id = ranked.id;

-- === section: 20260916210000_seed_portfolio_projects.sql ===
-- Sample portfolio project seed removed (17 demo projects + gallery + media).
-- Add projects through the CMS UI or your own import.
-- Kept as no-op so new Supabase projects start without demo content.
--
-- Required defaults (site, categories, settings) remain in:
--   20260906120001_seed_defaults.sql

select 1;

-- === section: 20260917180000_contact_message_replies.sql ===
-- Contact message reply thread (multiple replies per message)

create table if not exists public.contact_message_replies (
  id               uuid primary key default gen_random_uuid(),
  message_id       uuid not null references public.contact_messages (id) on delete cascade,
  body             text not null,
  subject          text,
  cc               text,
  attachment_url   text,
  attachment_name  text,
  attachment_mime  text,
  attachment_size  integer,
  sent_at          timestamptz not null default timezone('utc', now()),
  created_at       timestamptz not null default timezone('utc', now()),
  updated_at       timestamptz not null default timezone('utc', now())
);

create index if not exists contact_message_replies_message_id_idx
  on public.contact_message_replies (message_id);

create index if not exists contact_message_replies_sent_at_idx
  on public.contact_message_replies (sent_at desc);

create trigger contact_message_replies_set_updated_at
  before update on public.contact_message_replies
  for each row execute function public.set_updated_at();

alter table public.contact_message_replies enable row level security;

create policy "Staff manage contact message replies"
  on public.contact_message_replies for all
  using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

-- Backfill legacy single reply_body into thread rows
insert into public.contact_message_replies (message_id, body, subject, sent_at, created_at, updated_at)
select
  m.id,
  m.reply_body,
  m.subject,
  coalesce(m.replied_at, m.updated_at, m.created_at),
  coalesce(m.replied_at, m.updated_at, m.created_at),
  coalesce(m.replied_at, m.updated_at, m.created_at)
from public.contact_messages m
where m.reply_body is not null
  and length(trim(m.reply_body)) > 0
  and not exists (
    select 1 from public.contact_message_replies r where r.message_id = m.id
  );

-- === section: 20260918120000_media_folder_contact.sql ===
-- Contact message reply attachments folder
alter type public.media_folder add value if not exists 'contact';

-- === section: 20260918130000_user_notifications.sql ===
-- Per-user notification inbox (persistent bell dropdown)

create table if not exists public.user_notifications (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid not null references public.sites (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  actor_user_id uuid references public.profiles (id) on delete set null,
  category      text not null default 'other',
  title         text not null,
  body          text,
  icon          text,
  link_path     text,
  metadata      jsonb not null default '{}'::jsonb,
  activity_id   uuid references public.recent_activities (id) on delete set null,
  read_at       timestamptz,
  created_at    timestamptz not null default timezone('utc', now())
);

create index if not exists user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);

create index if not exists user_notifications_user_unread_idx
  on public.user_notifications (user_id, created_at desc)
  where read_at is null;

alter table public.user_notifications enable row level security;

create policy "Users read own notifications"
  on public.user_notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.user_notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own notifications"
  on public.user_notifications for delete
  using (auth.uid() = user_id);

create policy "Staff insert notifications"
  on public.user_notifications for insert
  with check (public.is_authenticated_staff());

-- === section: 20260918220000_drop_categories_css_class.sql ===
-- Remove user-configurable css_class from project and blog category tables.
-- Card accent classes are derived from category key in the app layer.

alter table public.categories
  drop column if exists css_class;

alter table public.blog_categories
  drop column if exists css_class;

-- === section: 20260921120000_admin_system_helpers.sql ===
-- Admin helper functions for system settings (metrics + backups)

create or replace function public.pa_admin_database_size_bytes()
returns bigint
language sql
security definer
set search_path = public
as $$
  select pg_database_size(current_database());
$$;

create or replace function public.pa_admin_public_tables()
returns table (table_name text)
language sql
security definer
set search_path = public
as $$
  select tablename as table_name
  from pg_catalog.pg_tables
  where schemaname = 'public'
    and tablename not in ('dashboard_stats')
  order by tablename;
$$;

revoke all on function public.pa_admin_database_size_bytes() from public;
revoke all on function public.pa_admin_public_tables() from public;

grant execute on function public.pa_admin_database_size_bytes() to service_role;
grant execute on function public.pa_admin_public_tables() to service_role;

-- === section: 20260921130000_admin_storage_stats.sql ===
-- Storage usage helper for system settings metrics

create or replace function public.pa_admin_storage_stats()
returns table (total_bytes bigint, object_count bigint)
language sql
security definer
set search_path = public, storage
as $$
  select
    coalesce(sum((metadata->>'size')::bigint), 0)::bigint as total_bytes,
    count(*)::bigint as object_count
  from storage.objects;
$$;

revoke all on function public.pa_admin_storage_stats() from public;
grant execute on function public.pa_admin_storage_stats() to service_role;

-- === section: 20260921140000_admin_sql_backup_helpers.sql ===
-- SQL backup helpers (table ordering for INSERT dumps)

create or replace function public.pa_admin_foreign_key_edges()
returns table (child_table text, parent_table text)
language sql
security definer
set search_path = public
as $$
  select distinct
    tc.table_name::text as child_table,
    ccu.table_name::text as parent_table
  from information_schema.table_constraints tc
  join information_schema.constraint_column_usage ccu
    on tc.constraint_name = ccu.constraint_name
   and tc.table_schema = ccu.table_schema
  where tc.constraint_type = 'FOREIGN KEY'
    and tc.table_schema = 'public';
$$;

revoke all on function public.pa_admin_foreign_key_edges() from public;
grant execute on function public.pa_admin_foreign_key_edges() to service_role;

-- === section: 20260921150000_drop_metrics_add_table_stats.sql ===
-- Drop metrics-only RPCs (System tab no longer uses Supabase Management API metrics)
drop function if exists public.pa_admin_database_size_bytes();
drop function if exists public.pa_admin_storage_stats();

-- Table catalog stats for SQL export UI (row counts + approximate on-disk size)
create or replace function public.pa_admin_public_table_stats()
returns table (table_name text, row_count bigint, size_bytes bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  tbl text;
begin
  for tbl in
    select tablename
    from pg_catalog.pg_tables
    where schemaname = 'public'
      and tablename <> 'dashboard_stats'
    order by tablename
  loop
    table_name := tbl;
    execute format('select count(*)::bigint from public.%I', tbl) into row_count;
    select pg_total_relation_size(format('public.%I', tbl)::regclass)::bigint into size_bytes;
    return next;
  end loop;
end;
$$;

revoke all on function public.pa_admin_public_table_stats() from public;
grant execute on function public.pa_admin_public_table_stats() to service_role;

-- === section: 20260922120000_drop_user_preferences_appearance_settings.sql ===
-- Remove unused per-user tables (prefs/theme live in site_settings instead)

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
drop trigger if exists appearance_settings_set_updated_at on public.appearance_settings;

drop table if exists public.user_preferences;
drop table if exists public.appearance_settings;

-- Stop seeding dropped tables when auth.users rows are created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_site_id uuid;
begin
  select id into default_site_id from public.sites where slug = 'default' limit 1;

  insert into public.profiles (id, site_id, role, full_name, username, email)
  values (
    new.id,
    default_site_id,
    'viewer',
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.email
  );

  insert into public.notification_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.security_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- === section: 20260923120000_batch_cms_writes.sql ===
-- Batch CMS writes: projects + blog posts in a single transaction per save.

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
    delete from public.project_tags
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

  delete from public.project_tags
  where project_id in (
    select (r->>'id')::uuid from jsonb_array_elements(p_projects) r
  );

  insert into public.project_tags (project_id, tag, sort_order)
  select
    (p.elem->>'id')::uuid,
    t.elem->>'tag',
    coalesce((t.elem->>'sort_order')::int, (t.ord - 1)::int)
  from jsonb_array_elements(p_projects) as p(elem),
       jsonb_array_elements(coalesce(p.elem->'tags', '[]'::jsonb)) with ordinality as t(elem, ord)
  where coalesce(t.elem->>'tag', '') <> '';

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
    is_featured, featured_image_url, featured_image_alt, published_at, sort_order, created_at
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

revoke all on function public.pa_save_projects_batch(uuid, jsonb, uuid[]) from public;
revoke all on function public.pa_save_blog_posts_batch(uuid, jsonb, uuid[]) from public;
grant execute on function public.pa_save_projects_batch(uuid, jsonb, uuid[]) to service_role;
grant execute on function public.pa_save_blog_posts_batch(uuid, jsonb, uuid[]) to service_role;

-- === section: 20260923130000_list_query_indexes.sql ===
-- List query indexes for contact messages and blog posts.

create index if not exists contact_messages_site_active_created_id_idx
  on public.contact_messages (site_id, created_at desc, id desc)
  where deleted_at is null;

create index if not exists blog_posts_site_active_created_idx
  on public.blog_posts (site_id, created_at desc)
  where deleted_at is null;

-- === section: 20260923140000_dashboard_stats_cache.sql ===
-- Cached dashboard stats (replaces hot reads against dashboard_stats view).

create table if not exists public.site_dashboard_stats (
  site_id uuid primary key references public.sites (id) on delete cascade,
  total_projects bigint not null default 0,
  total_technologies bigint not null default 0,
  total_media bigint not null default 0,
  total_testimonials bigint not null default 0,
  total_experience bigint not null default 0,
  total_blog_posts bigint not null default 0,
  total_contact_messages bigint not null default 0,
  refreshed_at timestamptz not null default timezone('utc', now())
);

alter table public.site_dashboard_stats enable row level security;

create policy "Public read dashboard stats cache"
  on public.site_dashboard_stats for select
  using (true);

create policy "Service role manages dashboard stats cache"
  on public.site_dashboard_stats for all
  using (true)
  with check (true);

create or replace function public.pa_refresh_dashboard_stats(p_site_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.site_dashboard_stats (
    site_id,
    total_projects,
    total_technologies,
    total_media,
    total_testimonials,
    total_experience,
    total_blog_posts,
    total_contact_messages,
    refreshed_at
  )
  select
    p_site_id,
    (select count(*) from public.projects where site_id = p_site_id and deleted_at is null),
    (select count(*) from public.technologies where site_id = p_site_id and deleted_at is null),
    (select count(*) from public.media_assets where site_id = p_site_id and deleted_at is null),
    (select count(*) from public.testimonials where site_id = p_site_id and deleted_at is null),
    (select count(*) from public.experience_entries where site_id = p_site_id and deleted_at is null),
    (select count(*) from public.blog_posts where site_id = p_site_id and deleted_at is null),
    (select count(*) from public.contact_messages where site_id = p_site_id and deleted_at is null),
    timezone('utc', now())
  on conflict (site_id) do update set
    total_projects = excluded.total_projects,
    total_technologies = excluded.total_technologies,
    total_media = excluded.total_media,
    total_testimonials = excluded.total_testimonials,
    total_experience = excluded.total_experience,
    total_blog_posts = excluded.total_blog_posts,
    total_contact_messages = excluded.total_contact_messages,
    refreshed_at = excluded.refreshed_at;
end;
$$;

revoke all on function public.pa_refresh_dashboard_stats(uuid) from public;
grant execute on function public.pa_refresh_dashboard_stats(uuid) to service_role;

insert into public.site_dashboard_stats (site_id)
select id from public.sites where slug = 'default'
on conflict (site_id) do nothing;

select public.pa_refresh_dashboard_stats(
  (select id from public.sites where slug = 'default' limit 1)
);

-- === section: 20260924120000_partial_indexes.sql ===
-- Partial indexes for soft-delete list queries.

create index if not exists projects_site_active_created_idx
  on public.projects (site_id, created_at desc) where deleted_at is null;

create index if not exists technologies_site_active_idx
  on public.technologies (site_id, sort_order) where deleted_at is null;

create index if not exists media_assets_site_active_uploaded_idx
  on public.media_assets (site_id, uploaded_at desc) where deleted_at is null;

create index if not exists testimonials_site_active_idx
  on public.testimonials (site_id, created_at desc) where deleted_at is null;

create index if not exists experience_entries_site_active_sort_idx
  on public.experience_entries (site_id, sort_order) where deleted_at is null;

-- === section: 20260924130000_media_and_sessions.sql ===
-- P1: prune user_sessions + bulk media usage_count refresh.

create or replace function public.pa_prune_user_sessions(p_keep_days int default 90)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted bigint;
begin
  delete from public.user_sessions
  where is_current = false
    and created_at < timezone('utc', now()) - make_interval(days => p_keep_days);
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

create or replace function public.pa_refresh_media_usage_counts(
  p_site_id uuid,
  p_counts jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.media_assets m
  set usage_count = coalesce((p_counts->>m.url)::int, 0),
      updated_at = timezone('utc', now())
  where m.site_id = p_site_id
    and m.deleted_at is null
    and p_counts ? m.url;
end;
$$;

revoke all on function public.pa_prune_user_sessions(int) from public;
revoke all on function public.pa_refresh_media_usage_counts(uuid, jsonb) from public;
grant execute on function public.pa_prune_user_sessions(int) to service_role;
grant execute on function public.pa_refresh_media_usage_counts(uuid, jsonb) to service_role;

-- === section: 20260925120000_trim_integration_providers.sql ===
-- Remove integrations outside the supported provider set.
-- Supported: emailjs, cloudinary, github, google_search_console

delete from public.integrations
where provider not in (
  'emailjs',
  'cloudinary',
  'github',
  'google_search_console'
);

-- === section: 20260925140000_storage_upload_mime_types.sql ===
-- Allow documents and fonts in the media bucket (contact replies, custom fonts).

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
  'font/woff',
  'font/woff2',
  'application/font-woff',
  'application/font-woff2',
  'application/octet-stream'
]
where id = 'media';

-- === section: 20260925160000_drop_integrations_table.sql ===
-- Remove third-party integrations storage (Settings → Integrations removed from app).

drop policy if exists "Admins manage integrations" on public.integrations;

drop trigger if exists integrations_set_updated_at on public.integrations;

drop table if exists public.integrations;

drop type if exists public.integration_provider;

-- === section: 20260928220000_blog_posts_seo_meta.sql ===
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

-- === section: 20260929120000_blog_post_engagement.sql ===
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

-- === section: 20260929210000_drop_admin_schema_diagram.sql ===
-- Remove ER diagram schema helper (feature removed from admin UI)

drop function if exists public.pa_admin_public_table_columns();

-- === section: 20260930120000_drop_content_agent_learning.sql ===
-- Content agent removed: drop learning/feedback table (idempotent)
drop table if exists public.agent_suggestion_feedback cascade;

-- === section: 20260931120000_remote_history_align.sql ===
-- Placeholder: this version exists on the linked remote database but was not in the repo.
-- No schema changes here (remote already applied the original migration).

-- === section: 20261001120000_login_activity_retention.sql ===
-- Retention for login_activity (Settings → Security recent login feed).

create or replace function public.pa_prune_login_activity(p_keep_days int default 90)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted bigint;
begin
  delete from public.login_activity
  where created_at < timezone('utc', now()) - make_interval(days => p_keep_days);
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

comment on function public.pa_prune_login_activity(int) is
  'Deletes login_activity rows older than p_keep_days. Used by app cron and optional pg_cron.';

create or replace function public.pa_prune_login_activity_user_cap(p_max_per_user int default 100)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted bigint;
begin
  delete from public.login_activity la
  using (
    select id
    from (
      select
        id,
        row_number() over (
          partition by user_id
          order by created_at desc
        ) as rn
      from public.login_activity
    ) ranked
    where ranked.rn > p_max_per_user
  ) excess
  where la.id = excess.id;
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

comment on function public.pa_prune_login_activity_user_cap(int) is
  'Keeps at most p_max_per_user login_activity rows per user (newest first).';

revoke all on function public.pa_prune_login_activity(int) from public;
revoke all on function public.pa_prune_login_activity_user_cap(int) from public;
grant execute on function public.pa_prune_login_activity(int) to service_role;
grant execute on function public.pa_prune_login_activity_user_cap(int) to service_role;

-- Schedule daily cleanup when pg_cron is available.
do $schedule$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'prune-login-activity';

    perform cron.schedule(
      'prune-login-activity',
      '15 3 * * *',
      $$select public.pa_prune_login_activity(90); select public.pa_prune_login_activity_user_cap(100);$$
    );
  end if;
end;
$schedule$;

-- === section: 20261002120000_site_runtime_config.sql ===
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

-- === section: 20261003120000_access_elevation_requests.sql ===
-- Temporary CMS access requests (3h elevation on admin approve; role unchanged)

create table if not exists public.access_elevation_requests (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  contact_email   text not null,
  message         text not null,
  status          text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at      timestamptz not null default timezone('utc', now()),
  reviewed_by     uuid references public.profiles (id) on delete set null,
  reviewed_at     timestamptz,
  rejection_note  text,
  elevated_until  timestamptz
);

create unique index if not exists access_elevation_requests_one_pending_per_user_idx
  on public.access_elevation_requests (user_id)
  where status = 'pending';

create index if not exists access_elevation_requests_status_created_idx
  on public.access_elevation_requests (status, created_at desc);

create index if not exists access_elevation_requests_user_active_idx
  on public.access_elevation_requests (user_id, elevated_until desc)
  where status = 'approved' and elevated_until is not null;

alter table public.access_elevation_requests enable row level security;

-- === section: 20261004120000_access_elevation_role_duration.sql ===
-- Temporary profile role change on approve (viewer → editor until elevated_until)

comment on table public.access_elevation_requests is
  'Staff access requests; on approve sets profiles.role to editor until elevated_until, then lazy revert.';

alter table public.access_elevation_requests
  add column if not exists role_before_elevation text,
  add column if not exists duration_hours integer,
  add column if not exists role_restored_at timestamptz;

-- === section: 20261005120000_public_api_hardening.sql ===
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

-- === section: 20261006120000_remote_history_align.sql ===
-- Placeholder: this version exists on the linked remote database but was not in the repo.
-- No schema changes here (remote already applied the original migration).

-- === section: 20261007120000_normalized_tags_and_technologies.sql ===
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

-- === section: 20261009120000_project_tool_links.sql ===
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

-- === section: 20261010120000_project_category_keys.sql ===
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

-- === section: 20261010130000_search_trigram_indexes.sql ===
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

