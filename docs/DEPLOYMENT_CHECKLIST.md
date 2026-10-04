# Production deployment checklist

Use this before pointing a live portfolio at this admin deployment.

## Host environment (`.env` / Vercel)

- [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL` — public URL of **this admin** app
- [ ] `PORTFOLIO_PUBLIC_ORIGINS` — comma-separated origins allowed to call `/api/public/*` (your portfolio site)
- [ ] `CRON_SECRET` — **required in production**; Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` to `/api/cron/*`
- [ ] `PREVIEW_TOKEN_SECRET` — recommended for signed draft preview (`GET /api/public/preview`); can reuse `CRON_SECRET` if you accept shared secret scope
- [ ] Optional: `NEXT_PUBLIC_PORTFOLIO_URL` if you only have one portfolio origin
- [ ] Local check: `npm run verify:deployment` (host env only; DB state → **Settings → System → Deployment** or `GET /api/health/supabase?detailed=1`)

## Supabase

- [ ] Apply all migrations in `supabase/migrations/` (including `20261005120000_public_api_hardening.sql`)
- [ ] **Authentication → Providers → Email**: disable public sign-ups (invite-only staff)
- [ ] Promote first `super_admin` via SQL (see root README)

## Verify after deploy

- [ ] `GET /api/health/supabase` returns `{ ok: true, connected: true }`
- [ ] Signed in: `GET /api/health/supabase?detailed=1` includes `ops` with `migrationPublicApiHardening: true`
- [ ] Portfolio contact form uses `POST /api/public/contact` (not direct `contact_messages` insert)
- [ ] Configure Turnstile keys under **Settings → System → Environment** if using captcha
- [ ] Staff: **Settings → System → Deployment** shows green checks for migration, cron, CORS, Turnstile
- [ ] Optional: set `REDIRECTS_JSON` for legacy paths (e.g. old settings URLs)

## Cron (see `vercel.json`)

- `/api/cron/purge-activities` — daily activity retention
- `/api/cron/prune-sessions` — session/login history prune
- `/api/cron/publish-scheduled` — publish blog posts when `published_at` is due
