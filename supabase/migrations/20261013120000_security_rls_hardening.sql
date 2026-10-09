-- Security hardening (audit C1, H2 RLS, H4 confirm, L2, M9)

-- C1: Prevent self-service escalation of privileged profile fields
revoke update on public.profiles from authenticated, anon;

grant update (
  full_name,
  username,
  phone,
  date_of_birth,
  bio,
  location,
  website_url,
  avatar_url,
  cover_image_url,
  social_links
) on public.profiles to authenticated;

create or replace function public.pa_profiles_block_privileged_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.is_active is distinct from old.is_active
     or new.deleted_at is distinct from old.deleted_at
     or new.site_id is distinct from old.site_id
     or new.email is distinct from old.email
     or new.id is distinct from old.id
     or new.email_verified_at is distinct from old.email_verified_at
     or new.last_login_at is distinct from old.last_login_at
     or new.version is distinct from old.version
  then
    raise exception 'cannot modify privileged profile fields';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_block_privileged_update on public.profiles;
create trigger profiles_block_privileged_update
  before update on public.profiles
  for each row execute function public.pa_profiles_block_privileged_update();

-- H2 RLS: backup codes are server-managed only
drop policy if exists "Users manage own 2fa backup codes" on public.two_factor_backup_codes;

revoke all on public.two_factor_backup_codes from authenticated, anon;
grant select, insert, update, delete on public.two_factor_backup_codes to service_role;

-- security_settings: server-managed (API uses service role)
drop policy if exists "Users manage own security settings" on public.security_settings;
revoke all on public.security_settings from authenticated, anon;
grant select, insert, update, delete on public.security_settings to service_role;

-- site_runtime_config: service role only (admins use API with service role)
drop policy if exists "Admins manage site runtime config" on public.site_runtime_config;
revoke all on public.site_runtime_config from authenticated, anon;
grant select, insert, update, delete on public.site_runtime_config to service_role;

-- H4: ensure anon cannot insert contact messages (idempotent)
drop policy if exists "Anyone can submit contact messages" on public.contact_messages;

-- L2: public site settings without admin_email exposure
drop policy if exists "Public read site settings" on public.site_settings;

create or replace view public.site_settings_public
with (security_invoker = true)
as
select
  site_id,
  site_title,
  site_tagline,
  site_url,
  site_description,
  contact_message_columns,
  maintenance_mode,
  language,
  timezone,
  created_at,
  updated_at
from public.site_settings;

grant select on public.site_settings_public to anon, authenticated;

create policy "Public read site settings safe view"
  on public.site_settings for select
  using (public.is_authenticated_staff());

-- M9: atomic legacy_id per site for contact messages
create or replace function public.pa_next_contact_legacy_id(p_site_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_site_id::text, 0));
  select coalesce(max(legacy_id), 0) + 1
    into v_next
    from public.contact_messages
   where site_id = p_site_id;
  return v_next;
end;
$$;

revoke all on function public.pa_next_contact_legacy_id(uuid) from public;
grant execute on function public.pa_next_contact_legacy_id(uuid) to service_role;

-- H2: atomic backup code consumption
create or replace function public.pa_consume_backup_code(p_user_id uuid, p_code_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update public.two_factor_backup_codes
     set used_at = timezone('utc', now())
   where user_id = p_user_id
     and code_hash = p_code_hash
     and used_at is null
  returning id into v_id;
  return v_id is not null;
end;
$$;

revoke all on function public.pa_consume_backup_code(uuid, text) from public;
grant execute on function public.pa_consume_backup_code(uuid, text) to service_role;
