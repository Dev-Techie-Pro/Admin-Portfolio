# Portfolio Admin Dashboard

**Package:** `admin-dashboard-nextjs` · **Version:** 1.1.0

A full-stack **Portfolio Admin Dashboard** for managing portfolio website content, site settings, media, staff users, and activity. The app combines **Next.js 14 (App Router)** for routing, authentication, and API endpoints with a **TypeScript ES module** client (`client/` → compiled to `public/js/`) for the interactive dashboard UI. All CMS data is persisted in **Supabase** (PostgreSQL, Auth, and Storage).

The same deployment also exposes **CORS-enabled public APIs** under `/api/public/blog/*` so a separate portfolio frontend can load likes, comments, and engagement for published posts while editors moderate comments inside the admin blog workspace.

---


## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Project](#running-the-project)
- [Pages & Routes](#pages--routes)
- [API Endpoints](#api-endpoints)
- [Authentication & Roles](#authentication--roles)
- [Development Workflow](#development-workflow)
- [Maintenance Scripts](#maintenance-scripts)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Features

- **Dashboard** — overview stats, ApexCharts charts, and quick-add wizards for common content types
- **CMS modules** — projects, project tags, categories, blog categories, technologies, tools, tool categories, blog posts (rich editor workspace, SEO meta fields), experience, testimonials, and media library
- **Blog engagement** — two admin surfaces: per-post tab in `/blog-post` (flags + moderation) and the **Comments & Likes** module at `/blog-engagement` (bulk comment moderation, like management, stats). Public portfolio sites use CORS-enabled `/api/public/blog/*`; list summaries use `/api/blog-posts/engagement`
- **Contact messages** — inbox with threaded replies (SMTP), configurable column visibility, and status workflow
- **User management** — staff user CRUD, role assignment, and credential reset emails (`/users`)
- **Access elevation** — viewers request temporary CMS access (Settings → Security); admins approve or reject at `/access-requests`. Approval sets `profiles.role` to `editor` until `elevated_until` (default **3 hours**, max **72 hours**), then lazy revert. Email + in-app notifications; elevation banner in the shell (`GET /api/auth/access-elevation`)
- **Recent activities** — audit trail of user actions with retention policies and cron purge
- **Notifications** — in-app notification inbox with per-user preference controls
- **Settings** — general site config, profile, security (MFA + backup codes + role request), notifications, and system admin tools (SQL export, **runtime config** in `site_runtime_config` — SMTP, retention, performance)
- **Appearance / customization** — global theme and UI panel (stored in `site_settings.appearance_settings`)
- **System admin** — SQL database export with table stats, environment config viewer, backup snapshot audit log
- **Authentication** — Supabase Auth with login, MFA (TOTP), forgot/reset password, 24-hour session lifetime, and login activity
- **Role-based access** — `super_admin`, `admin`, `editor`, and `viewer` roles enforced on API routes (`guardStaff`, `guardAdmin`, `guardEditor`)
- **Media storage** — Supabase Storage uploads via `/api/media/upload`, library sync, usage tracking, and orphan reconciliation
- **Responsive UI** — dark-theme dashboard optimized for desktop, tablet, and mobile

---

## Technology Stack

| Layer          | Technology                                                               | Version           |
| -------------- | ------------------------------------------------------------------------ | ----------------- |
| Framework      | [Next.js](https://nextjs.org/) (App Router)                              | 14.2.35           |
| UI runtime     | [React](https://react.dev/)                                              | 18.3.x            |
| Client modules | TypeScript ES modules (`client/` → `public/js/` via esbuild)             | ES2020            |
| Client bundler | [esbuild](https://esbuild.github.io/) (code-split chunks under `/js/chunks/`) | ^0.28.x      |
| Styling        | Custom CSS (`app/globals.css` → `tokens`, `base`, `layout`, `components`, `responsive`) | —      |
| Icons          | [Remix Icon](https://remixicon.com/) (`remixicon` npm package + glyph registry for picker) | 4.6.0 |
| Fonts          | Outfit, Inter, JetBrains Mono + customization panel fonts (Google Fonts) | —                 |
| Backend / DB   | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)            | —                 |
| Supabase SDK   | `@supabase/supabase-js`, `@supabase/ssr`                                 | ^2.115.0, ^0.12.6 |
| Charts         | [ApexCharts](https://apexcharts.com/)                                    | ^3.49.0           |
| Email          | [Nodemailer](https://nodemailer.com/) (SMTP)                             | ^10.0.10          |
| Language       | [TypeScript](https://www.typescriptlang.org/) (`app/`, `lib/`, `client/`, `components/`) | 5.8.x |

---

## Architecture Overview

The project uses a **hybrid architecture**:

```
Browser
  │
  ├─ Next.js App Router (app/)
  │     ├─ Server-rendered HTML shell per page (bodyHtml.ts / bodyHtml.tsx)
  │     ├─ LegacyBoot (components/LegacyBoot.tsx) loads client JS on route change
  │     └─ middleware.ts — Supabase session, MFA, and session lifetime guard
  │
  ├─ Client module system (client/ → public/js/)
  │     ├─ main.ts — boot, router, dynamic import of page modules
  │     ├─ modules/* — feature modules (Projects, Blog, Settings, …)
  │     ├─ boot-prefetch.ts — early API prefetch per route
  │     ├─ prefetch-config.ts — storage keys per page (mirrored in lib/cms/prefetch-config.ts)
  │     ├─ StorageService + PersistentCache — fetch/save via REST API + /api/bootstrap
  │     └─ EventBus — lightweight cross-module events in the shell
  │
  └─ Next.js API routes (app/api/)
        ├─ lib/auth/guard.ts — staff / admin / editor role checks
        ├─ lib/cms/repository.tsx — Supabase data access
        ├─ lib/cms/blog-engagement.ts — likes, comments, public + staff engagement
        ├─ lib/api/public-cors.ts — CORS for companion portfolio origins
        ├─ lib/admin/* — SQL export, env config
        └─ lib/email/* — SMTP replies, credentials, role requests
              └─ PostgreSQL (supabase/migrations/)
```

**Request flow (typical CMS page):**

1. User navigates to e.g. `/projects`.
2. `app/projects/page.tsx` renders `LegacyBody` with pre-built HTML from `app/projects/bodyHtml.tsx`.
3. `LegacyBoot` loads `/js/main.js` and calls `window.__paBootPortfolioApp()`.
4. `main.ts` resolves the current page via `client/core/router.ts` and dynamically imports `ProjectsModule` from `/js/chunks/`.
5. The module reads/writes data through `StorageService`, which calls `/api/projects` (or uses prefetched data from `/api/bootstrap`).
6. The API route validates the Supabase session and staff role, then reads/writes via `lib/cms/repository.tsx`.

**HTML-in-TS/TSX pattern:** Page markup lives in `app/**/bodyHtml.ts` or `bodyHtml.tsx` (large exported strings). Shared shell pieces include `app/sidebarHtml.tsx`, `app/bodyHtmlParts.tsx`, `app/quickAddPanelHtml.tsx`, and overlay panels (`customPanelHtml.tsx`, `mediaPickerPanelHtml.tsx`, `iconPickerPanelHtml.tsx`, `addUserPanelHtml.tsx`). This preserves the original static HTML dashboard while integrating with Next.js routing.

**Build note:** Server TypeScript is checked by Next.js; `next.config.mjs` may ignore type/lint errors during builds while the codebase is tightened incrementally. Always run `npm run build:client` after editing `client/`.

---

## Project Structure

```
Portfolio-Admin-main/
│
├── app/                          # Next.js App Router (TypeScript)
│   ├── layout.tsx                # Root layout, global CSS, boot scripts
│   ├── globals.css               # remixicon + app/styles/*.css
│   ├── styles/                   # tokens, base, layout, components, responsive
│   ├── page.tsx                  # Dashboard home (/)
│   ├── bodyHtml.ts               # Composed dashboard shell HTML
│   ├── sidebarHtml.tsx           # Sidebar navigation markup
│   ├── *PanelHtml.tsx            # Shared overlay panels
│   ├── api/                      # REST API routes (CMS, auth, admin, health, cron)
│   ├── auth/callback/            # Supabase OAuth / magic-link callback
│   ├── login/                    # Auth pages
│   ├── forget-password/
│   ├── reset-password/
│   ├── projects/                 # CMS pages (page.tsx + bodyHtml.tsx each)
│   ├── tags/
│   ├── blog-categories/
│   ├── categories/
│   ├── technologies/
│   ├── tool-categories/
│   ├── tools/
│   ├── media-library/
│   ├── testimonials/
│   ├── blog-post/
│   ├── blog-engagement/          # Comments & Likes moderation
│   ├── experience/
│   ├── contact-messages/
│   ├── access-requests/          # Admin: approve temporary CMS access
│   ├── users/
│   ├── recent-activities/
│   └── settings/                 # /settings → redirect; /settings/[tab]
│
├── components/
│   ├── LegacyBody.tsx            # SSR HTML + client boot wrapper
│   ├── LegacyHtml.tsx            # Injects bodyHtml into the DOM
│   └── LegacyBoot.tsx            # Loads main.js; re-boots on navigation
│
├── client/                       # Browser app source (TypeScript)
│   ├── build-client.mjs          # esbuild: main bundle + per-module chunks
│   ├── main.ts                   # Application entry
│   ├── boot-prefetch.ts
│   ├── prefetch-config.ts
│   ├── core/                     # router, StorageService, Module, AuthService, …
│   ├── modules/                  # Feature modules + shell (sidebar, toast, notifications)
│   ├── utils/                    # DOM, RTE, media upload, appearance, charts, …
│   └── theme/
│
├── lib/
│   ├── auth/                     # guards, profile, MFA, users, session lifetime
│   ├── cms/                      # repository, bootstrap, batch writes, media sync, blog-engagement, dashboard-stats
│   ├── admin/                    # SQL export, env config
│   ├── email/                    # SMTP send helpers
│   ├── settings/                 # Settings tab metadata (SSR)
│   ├── api/                      # JSON helpers, public CORS, withStaffGet caching
│   ├── theme/                    # category color tokens
│   └── supabase/                 # client, server, admin, middleware, database.types.ts
│
├── public/
│   ├── js/
│   │   ├── main.js               # Entry (imports lazy chunks)
│   │   ├── chunks/               # Code-split page modules (generated)
│   │   ├── boot-prefetch.js
│   │   ├── prefetch-config.js
│   │   └── core/, modules/, utils/ # Standalone compiled utilities
│   └── images/                   # Favicons, manifest
│
├── supabase/
│   ├── migrations/               # PostgreSQL schema migrations (52 files)
│   └── README.md                 # Detailed database documentation
│
├── scripts/                      # Optional dev utilities (not runtime)
│
├── middleware.ts                 # Auth redirect, MFA, session expiry, API 401
├── next.config.mjs
├── tsconfig.json                 # Path alias: @/* → project root
├── .env.example
├── package.json
└── LICENSE
```

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** (or compatible package manager)
- A **Supabase** project with migrations applied (see [Database Setup](#database-setup))
- **Supabase CLI** (optional, for `npm run db:*` commands): `npm install -g supabase`
- **SMTP credentials** (optional, for contact replies, credential emails, and role-request notifications)

---

## Setup & Installation

### 1. Clone and install

```bash
git clone <your-repo-url>
cd Portfolio-Admin-main
npm install
```

### 2. Configure environment

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

See [Environment Variables](#environment-variables) below.

### 3. Apply database migrations

If using the Supabase CLI with a linked project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
npm run db:push
```

Alternatively, run the SQL files in `supabase/migrations/` in order via the Supabase Dashboard SQL Editor. Full schema documentation is in [supabase/README.md](supabase/README.md).

### 4. Promote your first admin user

After signing up through the login page, promote your account in the Supabase SQL Editor:

```sql
update public.profiles
set role = 'super_admin'
where email = 'your@email.com';
```

### 5. Verify the connection

```bash
npm run dev
```

Open [http://localhost:3000/api/health/supabase](http://localhost:3000/api/health/supabase) — a successful response includes `"connected": true` and site stats.

---

## Environment Variables

### Deployment (host env only)

Set these in `.env.local` or your hosting provider (Vercel, etc.). They are **not** edited from the admin UI.

| Variable                        | Required    | Description                                                     |
| ------------------------------- | ----------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes         | Supabase project URL (`https://<ref>.supabase.co`)              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes         | Supabase anonymous (public) key                                 |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes         | Service role key (server-side only; never expose to the client) |
| `NEXT_PUBLIC_SITE_URL`          | Recommended | Public admin URL (e.g. `http://localhost:3000` in dev)          |
| `PORTFOLIO_PUBLIC_ORIGINS`      | Recommended | Comma-separated origins allowed to call `/api/public/*` (no trailing slashes) |
| `NEXT_PUBLIC_PORTFOLIO_URL`     | Optional    | Fallback single origin for public CORS if `PORTFOLIO_PUBLIC_ORIGINS` is unset |
| `CRON_SECRET`                   | **Required in production** | Bearer token for `/api/cron/*` (purge activities, prune sessions, publish scheduled posts). Cron routes return `503` if unset when `NODE_ENV=production`. |

### Runtime settings (database)

SMTP, session/login retention, CMS performance toggles, and email branding are stored in **`site_runtime_config`** and edited under **Settings → System → Environment**. They are **not** read from host environment variables at runtime (only built-in code defaults apply when a key is unset in the database). **Import from env file** uploads a local `.env` file from your machine and merges recognized runtime keys into the database.

Notable runtime keys (Integrations / public surface): `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (Cloudflare Turnstile on `/api/public/contact` and blog comments), `CONTACT_AUTO_REPLY_*` (optional ack email), `REDIRECTS_JSON` (301/302 map applied in middleware), `REQUIRE_MFA_ADMINS=true` (block admin roles until MFA is enrolled), `WEBHOOK_PUBLISH_URL` (HTTPS POST on blog publish). Portfolio reads `turnstileSiteKey` from **`GET /api/public/config`**.

**Publish webhook payload** (`WEBHOOK_PUBLISH_URL`): JSON body `{ "event": "blog.published", "timestamp": "<ISO>", "post": { "id", "legacyId", "title", "slug", "status" } }` — one request per post, no automatic retries.

**Draft preview:** set `PREVIEW_TOKEN_SECRET` (or `CRON_SECRET`) in host env; editors use **Copy preview API URL** in the blog workspace. Portfolio fetches `GET /api/public/preview?token=…` (CORS) for draft content.

> **Security:** Never commit `.env` or `.env.local`. These paths are listed in `.gitignore`.

**Auth signup:** Disable public self-registration in the Supabase Dashboard (**Authentication → Providers → Email → “Enable sign ups”**) so only invited staff receive accounts. Promote the first `super_admin` via SQL (see [Setup](#setup--installation)); additional staff can be invited from **Users → Invite by email** (`POST /api/admin/invites`).

**Contact forms:** After migration `20261005120000_public_api_hardening.sql`, portfolio sites must submit messages via **`POST /api/public/contact`** (CORS). Direct `contact_messages` inserts with the anon key are no longer allowed.

---

## Database Setup

The PostgreSQL schema covers:

- **Core** — `sites`, `profiles`, `site_settings`, `site_runtime_config` (runtime SMTP/retention/performance JSON), `notification_preferences`, `security_settings`, `two_factor_backup_codes`, `login_activity`, `user_sessions`, `backup_snapshots`, `user_notifications`, `access_elevation_requests`
- **CMS** — `categories`, `projects`, `project_tags`, `project_gallery_images`, `technologies`, `tool_categories`, `tool_items`, `blog_categories`, `blog_posts` (incl. `meta_title`, `meta_description`, engagement flags), `blog_post_tags`, `blog_post_comments`, `blog_post_likes`, `media_assets`, `testimonials`, `experience_entries`, `contact_messages`, `contact_message_replies`
- **Activity** — `recent_activities`
- **Views** — `dashboard_stats` (with caching helpers in later migrations)
- **Storage** — public `media` bucket (10 MB object limit; MIME types include images, PDF, Office docs, zip, and web fonts — see migration `20260925140000_storage_upload_mime_types.sql`)

Theme and UI customization live in `site_settings.appearance_settings` (JSON). Contact inbox column visibility is in `site_settings.contact_message_columns`. **Removed features:** `integrations` table (`20260925160000_drop_integrations_table.sql`), content-agent learning table `agent_suggestion_feedback` (`20260930120000_drop_content_agent_learning.sql`).

Migrations are in `supabase/migrations/` (**52 files**) and should be applied in filename order. For tables, RLS policies, roles, and RPCs, see [supabase/README.md](supabase/README.md).

**npm database scripts:**

| Command             | Description                                                   |
| ------------------- | ------------------------------------------------------------- |
| `npm run db:push`   | Push local migrations to linked Supabase project              |
| `npm run db:status` | List applied migrations                                       |
| `npm run db:types`  | Generate TypeScript types to `lib/supabase/database.types.ts` |

---

## Running the Project

| Command                | Description                                                                 |
| ---------------------- | --------------------------------------------------------------------------- |
| `npm run dev`          | Compile client TS, then start dev server at [http://localhost:3000](http://localhost:3000) |
| `npm run dev:clean`    | Clear `.next` cache and start dev server (does not rebuild `public/js/`)    |
| `npm run build:client` | Compile `client/` TypeScript to `public/js/` (esbuild + chunks)            |
| `npm run build`        | Compile client TS, then create production Next.js build                     |
| `npm run start`        | Serve production build                                                      |
| `npm run lint`         | Run Next.js ESLint                                                          |
| `npm run lint:css`     | Run Stylelint on `app/**/*.css`                                             |
| `npm run typecheck`    | TypeScript check (`tsc --noEmit`)                                           |
| `npm run test:ci`      | API guard + prefetch config sync smoke tests                                |

**Development:**

```bash
npm run dev
```

Sign in at [http://localhost:3000/login](http://localhost:3000/login). Unauthenticated requests to protected routes redirect to login; API routes return `401 Unauthorized`. Sessions use a **24-hour absolute lifetime** from sign-in (see `lib/auth/session-lifetime.ts`).

**Production:**

```bash
npm run build
npm run start
```

---

## Pages & Routes

| Path                      | Module key          | Description                             |
| ------------------------- | ------------------- | --------------------------------------- |
| `/`                       | `dashboard`         | Main dashboard with stats and quick-add |
| `/projects`               | `projects`          | Portfolio project CRUD                  |
| `/tags`                   | `tags`              | Project tag management                  |
| `/blog-categories`        | `blog-categories`   | Blog category CRUD                      |
| `/categories`             | `categories`        | Content categories                      |
| `/technologies`           | `technologies`      | Tech stack entries                      |
| `/tool-categories`        | `tool-categories`   | Tool grouping categories                |
| `/tools`                  | `tools`             | Tools / stack items                     |
| `/media-library`          | `media`             | Media asset management                  |
| `/testimonials`           | `testimonials`      | Client testimonials                     |
| `/blog-post`              | `blogposts`         | Blog post list + workspace (engagement tab when editing) |
| `/blog-post/view/:id`     | —                   | Redirects to `/blog-post?open=:id` (`next.config.mjs`) |
| `/blog-engagement`        | `blog-engagement`   | Comments & Likes — bulk moderation (editor+) |
| `/experience`             | `experience`        | Work experience entries                 |
| `/contact-messages`       | `contact-messages`  | Inbound contact form messages           |
| `/access-requests`        | `access-requests`   | Approve/reject temporary CMS access (admin) |
| `/users`                  | `users`             | Staff user management (admin)           |
| `/recent-activities`      | `recent-activities` | Activity audit log                      |
| `/settings`               | `settings`          | Redirects to default settings tab       |
| `/settings/general`       | `settings`          | General site settings                   |
| `/settings/profile`       | `settings`          | User profile                            |
| `/settings/security`      | `settings`          | Security, MFA, backup codes, role request |
| `/settings/notifications` | `settings`          | Notification preferences                |
| `/settings/system`        | `settings`          | SQL export, env config, system tools    |
| `/login`                  | `login`             | Sign in (public)                        |
| `/forget-password`        | `forgot-password`   | Password reset request (public)         |
| `/reset-password`         | `reset-password`    | Password reset form (public)            |

Route-to-module mapping is defined in `client/core/router.ts` (compiled to `public/js/core/router.js`). **Settings tabs** are `general`, `profile`, `security`, `notifications`, and `system` (admin-only; see `app/sidebarHtml.tsx`). Each CMS page module extends the base `Module` class in `client/core/Module.ts`.

---

## API Endpoints

Staff CMS routes require an authenticated user with role `super_admin`, `admin`, or `editor` (read) and `guardEditor()` for writes where enforced. Admin-only routes require `super_admin` or `admin`. Public routes are listed in `lib/auth/constants.ts` (`AUTH_ROUTES`, `PUBLIC_API_PREFIXES`).

### CMS

| Endpoint                      | Methods                | Purpose                            |
| ----------------------------- | ---------------------- | ---------------------------------- |
| `/api/projects`               | GET, PUT               | Projects                           |
| `/api/tags`                   | GET, PUT               | Project tags                       |
| `/api/categories`             | GET, PUT               | Categories                         |
| `/api/blog-categories`        | GET, PUT               | Blog categories                    |
| `/api/technologies`           | GET, PUT               | Technologies                       |
| `/api/tool-categories`        | GET, PUT               | Tool categories                    |
| `/api/tools`                  | GET, PUT               | Tools                              |
| `/api/media`                  | GET, PUT, POST, DELETE | Media assets (metadata / library)  |
| `/api/media/item`             | PATCH, DELETE          | Update or delete one media item by legacy id (no full-library PUT) |
| `/api/media/upload`           | POST                   | Upload file to Supabase Storage    |
| `/api/media/sync`             | POST                   | Reconcile media usage counts       |
| `/api/testimonials`           | GET, PUT               | Testimonials                       |
| `/api/blog-posts`             | GET, PUT               | Blog posts                         |
| `/api/blog-posts/[id]`        | GET                    | Single blog post                   |
| `/api/blog-posts/engagement`  | GET                    | Like/comment counts by legacy post id (`?ids=`) |
| `/api/blog-posts/[id]/engagement` | GET, PATCH, DELETE | Per-post engagement in blog workspace |
| `/api/blog-engagement/stats`  | GET                    | Dashboard stats for Comments & Likes module |
| `/api/blog-engagement/comments` | GET, PATCH           | Paginated comments; bulk status or soft-delete (`ids`, optional `delete: true`) |
| `/api/blog-engagement/posts`  | GET                    | Posts with engagement summaries (paginated) |
| `/api/blog-engagement/posts/[id]/likes` | DELETE       | Clear likes for a post (legacy id) |
| `/api/experience`             | GET, PUT               | Experience entries                 |
| `/api/contact-messages`       | GET, PUT, DELETE       | Contact messages                   |
| `/api/contact-messages/reply` | POST, PUT, DELETE      | Send, edit, or delete SMTP replies |
| `/api/recent-activities`      | GET, DELETE            | Activity log                       |
| `/api/bootstrap`              | GET                    | Prefetch bundle for current page   |

### Settings & profile

| Endpoint                           | Methods                  | Purpose                         |
| ---------------------------------- | ------------------------ | ------------------------------- |
| `/api/settings`                    | GET, PUT                 | Site settings (General tab)     |
| `/api/appearance`                  | GET, PUT                 | Theme / UI customization        |
| `/api/appearance/public`           | GET                      | Public theme (unauthenticated)  |
| `/api/profile`                     | GET, PUT                 | User profile                    |
| `/api/preferences/contact-columns` | GET, PUT                 | Contact table column visibility |
| `/api/notification-preferences`    | GET, PUT                 | Notification preferences        |
| `/api/notifications`               | GET, POST, PATCH, DELETE | In-app notifications            |

### Auth & security

| Endpoint                            | Methods | Purpose                         |
| ----------------------------------- | ------- | ------------------------------- |
| `/api/auth/login`                   | POST    | Email/password sign-in          |
| `/api/auth/logout`                  | POST    | Sign out                        |
| `/api/auth/logout-all`              | POST    | Revoke all sessions             |
| `/api/auth/session`                 | GET     | Current session + expiry meta   |
| `/api/auth/forgot-password`         | POST    | Send reset email                |
| `/api/auth/reset-password`          | POST    | Set new password                |
| `/api/auth/change-password`         | POST    | Change password (authenticated) |
| `/api/auth/delete-account`          | POST    | Delete own account              |
| `/api/auth/login-activity`          | GET     | Login history                   |
| `/api/auth/security-settings`       | GET     | Security flags                  |
| `/api/auth/role-request`            | POST    | Submit access elevation request (viewers) |
| `/api/auth/access-elevation`        | GET     | Current user elevation status (`elevatedUntil`, capabilities) |
| `/api/auth/mfa/enroll`              | POST    | Start MFA enrollment            |
| `/api/auth/mfa/verify-enroll`       | POST    | Confirm MFA enrollment          |
| `/api/auth/mfa/verify-login`        | POST    | Complete MFA login step         |
| `/api/auth/mfa/unenroll`            | POST    | Disable MFA                     |
| `/api/auth/backup-codes/regenerate` | POST    | Regenerate backup codes         |

### Users & admin

| Endpoint                            | Methods           | Purpose                            |
| ----------------------------------- | ----------------- | ---------------------------------- |
| `/api/users`                        | GET, POST         | List / create staff users          |
| `/api/users/[id]`                   | PATCH, DELETE     | Update / deactivate user           |
| `/api/users/[id]/reset-credentials` | POST              | Reset password + email credentials |
| `/api/admin/database-backup`        | GET, POST, DELETE | SQL export + snapshot audit        |
| `/api/admin/environment`            | GET, PUT          | Runtime env config (admin)         |
| `/api/admin/environment/import-env` | POST              | Upload `.env` file; merge recognized keys into `site_runtime_config` |
| `/api/admin/access-requests`        | GET               | List elevation requests (admin)    |
| `/api/admin/access-requests/[id]`   | PATCH             | Approve or reject a request (admin) |
| `/api/cron/purge-activities`        | GET               | Scheduled activity cleanup         |
| `/api/cron/prune-sessions`          | GET               | Prune old `user_sessions` and `login_activity` rows |
| `/api/cron/publish-scheduled`       | GET               | Publish blog posts when `published_at` is due |
| `/api/health/supabase`              | GET               | Public connectivity probe; add `?detailed=1` when signed in for stats |
| `/api/search`                       | GET               | Staff global CMS search (`?q=`)    |
| `/api/admin/invites`                | GET, POST         | List / send staff email invites (admin) |
| `/api/content-revisions`            | GET               | List revisions (`entityType`, `legacyId` or `entityId`) |
| `/api/content-revisions/[id]/restore` | POST            | Restore a blog revision snapshot |

### Public portfolio (CORS)

These routes are unauthenticated. They require a permitted `Origin` (see `PORTFOLIO_PUBLIC_ORIGINS` / `lib/api/public-cors.ts`). In development, `localhost` origins are allowed automatically.

| Endpoint                                   | Methods | Purpose                                      |
| ------------------------------------------ | ------- | -------------------------------------------- |
| `/api/public/blog/[slug]/engagement`       | GET     | Published post engagement (`?visitorKey=`)   |
| `/api/public/blog/[slug]/likes`            | POST    | Toggle like for a visitor key                |
| `/api/public/blog/[slug]/comments`         | POST    | Submit a comment (may be pending moderation) |
| `/api/public/contact`                      | POST    | Submit contact form (honeypot, rate limit, optional Turnstile) |
| `/api/public/config`                       | GET     | Public analytics integration metadata       |
| `/api/public/content/[resource]`           | GET     | Read-only lists: `projects`, `blog`, `testimonials`, `experience` |
| `/api/public/sitemap`                      | GET     | XML sitemap for portfolio URLs |
| `/api/public/rss`                          | GET     | RSS feed of published blog posts |
| `/api/public/preview`                      | GET     | Draft blog preview (`?token=` from staff **Copy preview API URL**) |
| `/api/blog-posts/[id]/preview-token`       | POST    | Issue signed preview token (editor) |

Client-side storage keys map to these routes in `client/core/StorageService.ts` (`REMOTE_ROUTES`). Per-route prefetch keys are in `client/prefetch-config.ts` (keep in sync with `lib/cms/prefetch-config.ts`).

**Blog engagement APIs:** use `/api/blog-posts/engagement` for lightweight counts on the blog list; `/api/blog-posts/[id]/engagement` inside the post workspace; `/api/blog-engagement/*` for the dedicated Comments & Likes module.

---

## Authentication & Roles

- **Middleware** (`middleware.ts`) validates Supabase sessions on every request, enforces MFA when required, and signs users out when the dashboard session deadline passes. Unauthenticated users are redirected to `/login`; authenticated users on auth pages are redirected to `/`.
- **API guards** (`lib/auth/guard.ts` → `lib/auth/request-cache.tsx`): `guardAuthenticated()`, `guardStaff()`, `guardAdmin()`, and `guardEditor()` enforce access on route handlers.
- **Capabilities** (`lib/auth/capabilities.ts`, mirrored in `client/core/access.ts`) derive UI and effective write access: `canManageContent`, `canAccessBlogEngagement`, viewer read-only CMS (`client/core/cms-access.ts`), and temporary elevation merging into `isEditor` / `canManageContent` when `elevated_until` is active.
- **Session lifetime** — 24 hours from sign-in (`SESSION_LIFETIME_SECONDS` in `lib/auth/constants.ts`), tracked via `pa_sess_deadline` cookie and `last_sign_in_at`.
- **MFA** — TOTP enrollment and verification via `/api/auth/mfa/*`; backup codes in `two_factor_backup_codes`.
- **Roles** (stored in `profiles.role`):

| Role          | Access                                                             |
| ------------- | ------------------------------------------------------------------ |
| `super_admin` | Full access, user management, all admin features                   |
| `admin`       | Site settings, SQL exports, user management, all CMS                |
| `editor`      | CMS content CRUD (writes blocked for `viewer`)                     |
| `viewer`      | Read-only dashboard; may submit access elevation requests           |

**Access elevation vs permanent role change:** `POST /api/auth/role-request` creates an `access_elevation_requests` row. Admin approval (`PATCH /api/admin/access-requests/[id]`) temporarily sets `profiles.role` to `editor` until `elevated_until`, then reverts (see `lib/auth/elevation.ts`). Permanent role changes are done on `/users` by admins only.

New users receive default rows in `profiles`, `notification_preferences`, and `security_settings` via database triggers. Passwords are managed by Supabase Auth — not stored in application tables.

OAuth / email-link flows complete at `/auth/callback`.

---

## Development Workflow

### Adding or changing UI on a page

1. Edit the HTML string in the relevant `app/<page>/bodyHtml.tsx` (or shared files like `app/sidebarHtml.tsx`, `app/bodyHtmlParts.tsx`).
2. Edit behavior in the matching module under `client/modules/<feature>/`, then run `npm run build:client`.
3. If the change affects persisted data, update the API route in `app/api/<resource>/route.ts` and repository functions in `lib/cms/repository.tsx`.
4. Run `npm run dev` and test the page; `LegacyBoot` re-initializes modules on each navigation.

### Adding a new CMS entity (high level)

1. Add PostgreSQL tables/migrations in `supabase/migrations/`.
2. Add repository functions in `lib/cms/repository.tsx`.
3. Create `app/api/<entity>/route.ts` with `guardStaff()` / `guardEditor()` as appropriate.
4. Add a storage key mapping in `client/core/StorageService.ts` and prefetch entries in `client/prefetch-config.ts` and `lib/cms/prefetch-config.ts`.
5. Create `client/modules/<entity>/` module, register dynamic import in `client/main.ts`, and add the route in `client/core/router.ts`, then `npm run build:client`.
6. Add `app/<entity>/page.tsx` + `bodyHtml.tsx` and navigation links in `app/sidebarHtml.tsx`.

### Path aliases

`tsconfig.json` maps `@/*` to the project root (e.g. `@/lib/auth/guard`).

### Code conventions

- **Server code** lives in `app/`, `lib/`, `components/`, and `middleware.ts` (TypeScript / TSX).
- **Client source** lives in `client/` as TypeScript ES modules; `npm run build:client` compiles them to `public/js/` for the browser.
- **React** is used minimally — only for layout, HTML injection, and the legacy boot hook.
- Match existing patterns: extend `Module` for features, use `StorageService` for persistence, use `guardStaff()` / `guardEditor()` on API routes.

---

## Maintenance Scripts

The `scripts/` folder contains **optional Node.js utilities** for syncing sidebar HTML across many `bodyHtml*.tsx` files. These are **not** part of the runtime build and are not referenced in `package.json`.

| Script                         | Purpose                                              |
| ------------------------------ | ---------------------------------------------------- |
| `scripts/get-sidebar-html.mjs` | Extract sidebar inner HTML for generators            |
| `scripts/sync-sidebar-bodies.mjs` | Patch `bodyHtml*.tsx` files with updated sidebar  |
| `scripts/sidebar-html-entry.mjs` | Entry helper for sidebar tooling                  |
| `scripts/build-client.mjs`     | Legacy/alternate client build entry (use `client/build-client.mjs` via npm) |

Example:

```bash
node scripts/sync-sidebar-bodies.mjs
```

Deleting `scripts/` does not affect `npm run dev`, `build`, or `start`.

---

## Deployment

See [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) for a full production checklist.

This is a standard Next.js 14 application. Deploy to any Node-compatible host (e.g. Vercel, Railway, Docker):

1. Set all [environment variables](#environment-variables) in the hosting provider.
2. Ensure Supabase migrations are applied to your production project (`npm run db:push`).
3. Set `NEXT_PUBLIC_SITE_URL` to your production admin URL.
4. Set `PORTFOLIO_PUBLIC_ORIGINS` (or `NEXT_PUBLIC_PORTFOLIO_URL`) so your live portfolio site can call `/api/public/blog/*`.
5. Configure runtime retention and SMTP under **Settings → System → Environment** (stored in `site_runtime_config`).
6. Configure `CRON_SECRET` and schedule (see `vercel.json`):
   - `/api/cron/purge-activities` for activity retention
   - `/api/cron/prune-sessions` for old session and login-activity rows
   - `/api/cron/publish-scheduled` for due blog `published_at` dates
7. Build and start:

```bash
npm run build
npm run start
```

Configure Supabase Auth redirect URLs to include your production domain and `/auth/callback`.

---

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch:

```bash
git checkout -b feature/your-feature-name
```

3. Make changes and verify locally:

```bash
npm run dev
npm run build
```

4. Commit with a clear message:

```bash
git commit -m "feat: describe your change"
```

5. Push and open a Pull Request.

For database changes, add a new timestamped migration in `supabase/migrations/` rather than editing applied migrations.

---

## License

This project is licensed under the [MIT License](LICENSE).

Copyright (c) 2026 Engineer Sohaib Ishaque

---

## Author

**Sohaib Ishaque**

Full Stack Developer · Software Engineer · UI/UX Designer
