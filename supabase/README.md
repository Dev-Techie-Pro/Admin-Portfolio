# Supabase Database Setup

PostgreSQL schema for the **Portfolio Admin Dashboard** — CMS content, site settings, runtime configuration, auth profiles, media storage, blog engagement, access elevation, activity logs, and SQL export metadata.

For Next.js setup, environment variables, API routes, and deployment, see the root [README.md](../README.md).

## Migrations

All schema changes live in `supabase/migrations/` (**53** timestamped SQL files). Apply them in **filename order**.

### Quick start

```bash
npm install -g supabase   # optional CLI
cd Portfolio-Admin-main
supabase login
supabase link --project-ref YOUR_PROJECT_REF
npm run db:status       # list applied migrations
npm run db:push         # push pending migrations
```

Or run each file in order via **Supabase Dashboard → SQL Editor**.

Test the app connection:

```bash
npm run dev
# open http://localhost:3000/api/health/supabase
```

Content is managed through the dashboard UI — demo seed migrations are no-ops; only default site rows are seeded.

### Public portfolio access (RLS vs admin APIs)

| Data | Recommended access |
|------|---------------------|
| Published blog, projects, testimonials, experience | Supabase **anon** `SELECT` where RLS allows published rows, or **`GET /api/public/content/{resource}`** |
| Contact form | **`POST /api/public/contact`** on the admin host (after migration `20261005120000_public_api_hardening.sql`; do not insert `contact_messages` with anon) |
| Blog likes/comments | **`/api/public/blog/[slug]/*`** with CORS (`PORTFOLIO_PUBLIC_ORIGINS`) |
| Analytics keys | **`GET /api/public/config`** |
| Sitemap / RSS | **`GET /api/public/sitemap`**, **`GET /api/public/rss`** |

Staff CMS traffic always uses authenticated sessions and server-side service role in API routes — not the anon key from the browser for writes.

### Environment variables (Next.js)

Host-only secrets (not stored in the database):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

SMTP, retention windows, and similar **runtime** settings live in `site_runtime_config` and are edited under **Settings → System → Environment** in the admin UI.

---

## Migration index (chronological)

| Migration | Purpose |
|-----------|---------|
| `20260906120000_initial_schema.sql` | Core tables, enums, RLS, `media` storage bucket, `handle_new_user` trigger |
| `20260906120001_seed_defaults.sql` | Default site, site settings, categories |
| `20260906120002_site_settings_extras.sql` | `appearance_settings` JSON, contact columns, profile fields |
| `20260907120000_tools.sql` | `tool_categories`, `tool_items` |
| `20260908120000_login_activity.sql` | `login_activity` event log |
| `20260908140000_media_assets_url_hash.sql` | Media URL deduplication hash |
| `20260908150000_media_assets_source.sql` | Media source tracking column |
| `20260910120000_recent_activities.sql` | `recent_activities` audit log |
| `20260910120001_seed_recent_activities.sql` | **No-op** (demo activity seed removed) |
| `20260910130000_clear_recent_activities.sql` | **No-op** (paired with removed demo seed) |
| `20260910140000_recent_activities_retention.sql` | Activity retention helpers |
| `20260912120000_integrations_dynamic.sql` | Legacy `integrations` table (later removed) |
| `20260914120000_categories_builtin_subset.sql` | Built-in category flags |
| `20260915120000_integration_provider_openai.sql` | Integration provider enum value |
| `20260915130000_integration_provider_deepseek.sql` | Integration provider enum value |
| `20260915140000_integration_provider_puter.sql` | Integration provider enum value |
| `20260915150000_site_settings_agent.sql` | Site settings agent fields (later dropped) |
| `20260915160000_drop_site_settings_agent.sql` | Drop agent fields from site settings |
| `20260915170000_drop_tool_categories.sql` | Temporary drop (restored next) |
| `20260915180000_restore_tool_categories.sql` | Restore tool categories |
| `20260916120000_blog_categories.sql` | `blog_categories` |
| `20260916140000_blog_categories_css_class.sql` | Blog category CSS class column |
| `20260916160000_drop_tool_css_class.sql` | Tool schema cleanup |
| `20260916170000_technologies_category_id.sql` | Technologies → category FK |
| `20260916180000_tool_categories_legacy_id_backfill.sql` | Tool category `legacy_id` backfill |
| `20260916210000_seed_portfolio_projects.sql` | **No-op** (demo project seed removed) |
| `20260917180000_contact_message_replies.sql` | `contact_message_replies` |
| `20260918120000_media_folder_contact.sql` | Contact folder enum for media |
| `20260918130000_user_notifications.sql` | `user_notifications` inbox |
| `20260918220000_drop_categories_css_class.sql` | Category schema cleanup |
| `20260921120000_admin_system_helpers.sql` | Admin RPC helpers |
| `20260921130000_admin_storage_stats.sql` | Storage stats RPC (superseded later) |
| `20260921140000_admin_sql_backup_helpers.sql` | FK edges + table catalog RPCs |
| `20260921150000_drop_metrics_add_table_stats.sql` | `pa_admin_public_table_stats` RPC |
| `20260922120000_drop_user_preferences_appearance_settings.sql` | Drop per-user theme tables; theme in `site_settings` |
| `20260923120000_batch_cms_writes.sql` | Batch CMS write helpers |
| `20260923130000_list_query_indexes.sql` | List query indexes |
| `20260923140000_dashboard_stats_cache.sql` | Dashboard stats caching |
| `20260924120000_partial_indexes.sql` | Partial indexes for soft-deleted rows |
| `20260924130000_media_and_sessions.sql` | `user_sessions` + media-related updates |
| `20260925120000_trim_integration_providers.sql` | Trim integration providers before table drop |
| `20260925140000_storage_upload_mime_types.sql` | Expand `media` bucket MIME types (docs, fonts, zip) |
| `20260925160000_drop_integrations_table.sql` | Drop `integrations` table and enum |
| `20260928220000_blog_posts_seo_meta.sql` | `meta_title`, `meta_description` on blog posts |
| `20260929120000_blog_post_engagement.sql` | `blog_post_comments`, `blog_post_likes`, engagement flags on posts |
| `20260929210000_drop_admin_schema_diagram.sql` | Remove admin schema diagram artifact |
| `20260930120000_drop_content_agent_learning.sql` | Drop `agent_suggestion_feedback` (content agent removed) |
| `20260931120000_remote_history_align.sql` | **No-op** placeholder for remote migration history alignment |
| `20261001120000_login_activity_retention.sql` | `pa_prune_login_activity*` RPCs |
| `20261002120000_site_runtime_config.sql` | `site_runtime_config` (settings + secrets JSON, admin RLS) |
| `20261003120000_access_elevation_requests.sql` | `access_elevation_requests` table + indexes |
| `20261004120000_access_elevation_role_duration.sql` | Elevation duration columns; approve sets `profiles.role` until `elevated_until` |
| `20261005120000_public_api_hardening.sql` | `api_rate_limits` + `pa_rate_limit_allow`; drop anon `contact_messages` insert; `content_revisions`, `staff_invites` |

### Thematic groups

- **Core + seeds** — `20260906120000`–`20260906120002`
- **Tools & blog taxonomy** — `20260907120000`, `20260916120000`–`20260916180000`
- **Media** — URL hash, source, contact folder, MIME expansion (`20260908140000`–`20260908150000`, `20260918120000`, `20260925140000`)
- **Activity & retention** — `recent_activities` + retention; login activity + prune RPCs (`20260910120000`–`20260910140000`, `20261001120000`)
- **Contact & notifications** — `20260917180000`, `20260918130000`
- **Admin SQL export** — `20260921120000`–`20260921150000`
- **Performance** — batch writes, indexes, dashboard stats cache (`20260923120000`–`20260923140000`, `20260924120000`)
- **Integrations (removed)** — `20260912120000` through provider tweaks; dropped in `20260925160000`
- **Blog SEO & engagement** — `20260928220000`, `20260929120000`
- **Runtime & access** — `site_runtime_config`, `access_elevation_requests` (`20261002120000`–`20261004120000`)
- **Public API hardening** — rate limits, contact RLS, blog revisions, staff invites (`20261005120000`)

Required for access elevation (referenced in app error messages):

- `supabase/migrations/20261003120000_access_elevation_requests.sql`
- `supabase/migrations/20261004120000_access_elevation_role_duration.sql`

Run `npm run db:push` if either is missing.

Required for public contact forms and rate limiting:

- `supabase/migrations/20261005120000_public_api_hardening.sql`

Run `npm run test:ci` (includes `scripts/test-public-api-hardening.mjs`) or check **Settings → System** ops readiness (`GET /api/health/supabase?detailed=1`) for `contactMessagesAnonInsertBlocked`.

---

## Schema overview

### Core

| Table / view | Feature |
|--------------|---------|
| `sites` | Root tenant (`slug = 'default'`) |
| `profiles` | Staff users — extends `auth.users` with role and profile fields |
| `site_settings` | Site-wide config (General tab). `appearance_settings` JSON for theme/UI; `contact_message_columns` JSON for inbox columns |
| `site_runtime_config` | Per-site `settings` + `secrets` JSON (SMTP, retention, performance). Admin-only RLS |
| `notification_preferences` | Settings → Notifications (per user) |
| `security_settings` | Settings → Security (2FA flags, per user) |
| `two_factor_backup_codes` | Hashed MFA backup codes |
| `login_activity` | Login / logout / failed attempts (Settings → Security) |
| `user_sessions` | Session rows on login/logout (companion to `login_activity`) |
| `backup_snapshots` | SQL export audit metadata (System tab; files not stored on disk) |
| `user_notifications` | In-app notification inbox |
| `access_elevation_requests` | Temporary CMS access requests; approval sets `profiles.role` to `editor` until `elevated_until` |
| `content_revisions` | Blog post (and future entity) JSON snapshots; staff API + blog workspace restore |
| `staff_invites` | Admin-created invite tokens; consumed on first staff login |
| `api_rate_limits` | Rate-limit buckets for `pa_rate_limit_allow` (service role only; no direct client access) |
| `dashboard_stats` | **View** — aggregated counts for dashboard home (with cache helpers in later migrations) |

> **Removed:** standalone per-user `user_preferences` / `appearance_settings` tables (`20260922120000`). Theme data is in `site_settings.appearance_settings`.

### CMS content

| Table | Admin page |
|-------|------------|
| `categories` | `/categories` |
| `projects`, `project_tags`, `project_gallery_images` | `/projects` |
| `project_tags` (tag names per project) | `/tags` — there is no separate `tags` table |
| `technologies` | `/technologies` |
| `tool_categories`, `tool_items` | `/tool-categories`, `/tools` |
| `blog_categories` | `/blog-categories` |
| `blog_posts`, `blog_post_tags` | `/blog-post` |
| `blog_post_comments`, `blog_post_likes` | `/blog-engagement` and blog workspace |
| `media_assets` | `/media-library` |
| `testimonials` | `/testimonials` |
| `experience_entries` | `/experience` |
| `contact_messages`, `contact_message_replies` | `/contact-messages` |
| `recent_activities` | `/recent-activities` |

### Blog posts — engagement & SEO columns

On `blog_posts`:

- `meta_title`, `meta_description` (SEO)
- `comments_enabled`, `likes_enabled`, `comments_auto_approve`

`blog_post_comments` uses status enum: `pending`, `approved`, `spam`, `rejected`. Soft delete via `deleted_at`.

---

## Auth & roles

Uses **Supabase Auth** (`auth.users`). Passwords are not stored in `public` tables.

| Role | Access |
|------|--------|
| `super_admin` | Full access, user management, all admin features |
| `admin` | Site settings, SQL exports, user management, all CMS |
| `editor` | CMS content CRUD |
| `viewer` | Read-only CMS; may request temporary elevation |

Promote your first admin after signup:

```sql
update public.profiles
set role = 'super_admin'
where email = 'your@email.com';
```

New users receive rows in `profiles`, `notification_preferences`, and `security_settings` via `handle_new_user` on `auth.users`.

**Temporary elevation:** admins approve requests in the app; the service role updates `profiles.role` and `access_elevation_requests.elevated_until`. The `access_elevation_requests` table has RLS enabled; app routes use the service role for admin workflows.

---

## Storage

Public **`media`** bucket (10 MB per object).

Allowed MIME types (after `20260925140000`) include JPEG/PNG/WebP/GIF/SVG, PDF, plain text, Word documents, zip archives, and WOFF/WOFF2 fonts.

Upload path convention:

```
media/{site_id}/{folder}/{filename}
```

Store the public URL in `media_assets.url` and the bucket object path in `media_assets.storage_path`.

---

## RLS summary

| Data | Public read | Staff write | Admin only |
|------|-------------|-------------|------------|
| Projects, tech, experience, testimonials, media | Yes | Yes | — |
| Blog posts | Published only | Yes (all statuses) | — |
| Blog comments / likes | Approved comments & like rows on published posts with flags enabled | Via API (staff) | — |
| Contact messages | — (use `/api/public/contact`) | Manage | — |
| Site settings | Yes | — | Write |
| `site_runtime_config` | — | — | Yes |
| Backups metadata | — | — | Yes |
| Profile, notifications, security | Own row | Own row | Admins manage users |
| Login activity | Own rows | — | Admins insert/update |
| `access_elevation_requests` | — | App/service role | Approve/reject via admin API |

---

## Admin & maintenance RPCs

| Function | Purpose |
|----------|---------|
| `pa_prune_login_activity(days)` | Delete `login_activity` older than retention window |
| `pa_prune_login_activity_user_cap(n)` | Keep newest *n* `login_activity` rows per user |
| `pa_prune_user_sessions(days)` | Delete ended `user_sessions` older than retention |
| `pa_admin_public_tables()` | List public tables for SQL export UI |
| `pa_admin_public_table_stats()` | Row counts and on-disk size per table |
| `pa_admin_foreign_key_edges()` | FK graph for ordered SQL dumps |

Activity retention for `recent_activities` is handled in app code and `/api/cron/purge-activities` (see root README).

---

## Migration from browser storage

`legacy_id` columns on CMS tables map old IndexedDB numeric IDs during import.

Suggested import order:

1. Categories  
2. Media assets (upload files to storage first)  
3. Projects (+ `project_tags`, gallery)  
4. Technologies, experience, testimonials, blog posts, blog categories  
5. Tool categories and items  
6. Contact messages  
7. Site settings (general + appearance JSON)

---

## Local Supabase (optional)

```bash
supabase start
supabase db reset   # applies all migrations + seed
```

Supabase Studio: `http://localhost:54323`

---

## npm database scripts

| Command | Description |
|---------|-------------|
| `npm run db:push` | Push local migrations to linked project |
| `npm run db:status` | List applied migrations |
| `npm run db:types` | Generate TypeScript types → `lib/supabase/database.types.ts` |
