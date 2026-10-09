# Production deployment checklist

Use this list when deploying the Portfolio Admin dashboard and public CMS APIs. Host environment variables are **not** stored in the database unless imported via **Settings → System → Environment** (runtime config).

## 1. Supabase

- [ ] Create a production Supabase project (PostgreSQL, Auth, Storage).
- [ ] Apply migrations: `npm run db:push` (see `supabase/migrations/`).
- [ ] **Disable public sign-up** in Supabase Dashboard → Authentication (invite-only staff).
- [ ] Configure Auth redirect URLs: production admin origin + `/auth/callback`.
- [ ] Create Storage buckets/policies expected by media uploads (see baseline migration).
- [ ] Rotate `SUPABASE_SERVICE_ROLE_KEY` only on the server; never expose to the browser.

## 2. Required host environment variables

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + middleware client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin client |
| `NEXT_PUBLIC_SITE_URL` | Canonical admin URL (emails, links) |

## 3. Production secrets & integration

| Variable | Purpose |
| -------- | ------- |
| `CRON_SECRET` | Bearer token for all `/api/cron/*` routes (required in production) |
| `PREVIEW_TOKEN_SECRET` | Signed draft preview tokens (`/api/public/preview`); **do not reuse** `CRON_SECRET` |
| `SESSION_SIGNING_SECRET` | HMAC for MFA/step-up cookies (falls back to `CRON_SECRET` if unset) |
| `BACKUP_CODE_PEPPER` | Backup-code hashing (falls back to signing secret / `CRON_SECRET`) |
| `PORTFOLIO_PUBLIC_ORIGINS` | Comma-separated portfolio site origins for CORS on `/api/public/*` |
| `NEXT_PUBLIC_PORTFOLIO_URL` | Single-origin alternative to `PORTFOLIO_PUBLIC_ORIGINS` |

Optional but **strongly recommended** at scale:

| Variable | Purpose |
| -------- | ------- |
| `KV_REST_API_URL` | Upstash / Vercel KV REST URL for shared cache across instances |
| `KV_REST_API_TOKEN` | KV REST token (pair with URL above) |

## 4. Runtime config (database)

Configure in **Settings → System → Environment** (or import `.env` via super admin):

- [ ] SMTP (`SMTP_*`) for contact replies, invites, notifications
- [ ] Cloudflare Turnstile (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`) for public contact and blog comments
- [ ] `REQUIRE_MFA_ADMINS=true` if all admin roles must enroll TOTP
- [ ] Retention and rate-limit overrides as needed

Turnstile is **required in production** for public spam-sensitive endpoints when keys are unset the API rejects captcha (fail closed).

## 5. Cron jobs

[vercel.json](../vercel.json) schedules:

| Path | Schedule (UTC) | Purpose |
| ---- | ---------------- | ------- |
| `/api/cron/purge-activities` | 03:00 daily | Activity retention |
| `/api/cron/prune-sessions` | 03:30 daily | Session / login-activity prune |
| `/api/cron/publish-scheduled` | 04:00 daily | Publish due blog posts |

Each request must send: `Authorization: Bearer <CRON_SECRET>`.

On non-Vercel hosts, configure equivalent schedulers.

## 6. Build & deploy

```bash
npm ci
npm run build   # runs build:client (copies ApexCharts vendor) + next build
npm run start
```

- [ ] Set `CLIENT_BUILD_MINIFY=1` on the build host if you want minified client bundles.
- [ ] Run `npm run verify:deployment` locally or in CI with production-like env.
- [ ] For strict checks: `VERIFY_DEPLOYMENT_STRICT=1 NODE_ENV=production npm run verify:deployment`

## 7. Post-deploy verification

- [ ] Sign in as staff; complete MFA if required.
- [ ] **System → Deployment** (ops readiness): migrations, CORS origins, cron secret, Turnstile, KV.
- [ ] `GET /api/health/supabase` (basic); `?detailed=1` as staff for stats.
- [ ] Portfolio site can call `/api/public/config` and `/api/public/content/*` from an allowed origin.
- [ ] Dashboard charts load (`/js/vendor/apexcharts.min.js` present after build).

## 8. Security notes

- Service role bypasses RLS — all privileged data access must go through guarded API routes.
- Super-admin env changes require MFA step-up (`guardAal2`) in addition to role checks.
- Keep admin URL non-public where possible; rely on auth, MFA, and rate limits for `/api/auth/login`.

See [.env.example](../.env.example) for variable names and comments.
