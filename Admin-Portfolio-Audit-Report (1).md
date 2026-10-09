# Audit Report: Dev-Techie-Pro/Admin-Portfolio

**Repository:** https://github.com/Dev-Techie-Pro/Admin-Portfolio
**Package:** `admin-dashboard-nextjs` v1.1.0 (Next.js 14.2.35, React 18.3, TypeScript 5.8, Supabase)
**Report date:** 2026-10-09
**Status:** Partial audit. No project files were changed. Patches await your approval.

---

## 1. Coverage and limitations

This is **not a full audit**. I could only partly review the repository.

**Files read in full**

- `middleware.ts`
- `next.config.mjs`
- `package.json`
- `tsconfig.json`
- `vercel.json`
- `README.md`
- The root file listing

**Why nothing else was reachable**

- GitHub's directory pages block automated access.
- I can only fetch file URLs that appear in a page I have already loaded. Nothing under `app/`, `lib/`, `client/`, `supabase/` or `.github/workflows/` was linked from the root.
- The sandbox had no network, so I could not clone the repo or run `typecheck`, `lint`, `build` or `test:ci`.

**Not reviewed**

- API guards (`lib/auth/guard.ts`) and every API route
- Repository layer, RLS policies, migrations
- Public API, media upload, SQL export
- Client modules and `bodyHtml` templates
- CI workflow and the test scripts

**Labels used below**

| Label | Meaning |
|---|---|
| **Verified** | I read the code or config myself |
| **Documented** | Claimed in the README only |
| **To check** | A risk I cannot confirm without the source |

---

## 2. Findings

### Medium severity

#### M1. MFA check fails open (Verified: `middleware.ts`)

The AAL lookup is wrapped in `try { … } catch { needsMfa = false }`. If `getAuthenticatorAssuranceLevel()` throws (Supabase error, timeout, rate limit), a user who enrolled TOTP but holds only a password-level session is treated as not needing MFA.

- **Impact:** A stolen password plus a way to induce errors could bypass the second factor. Exploitability depends on whether the API guards re-check AAL, which I could not see.
- **Fix:** Fail closed. On error, treat the user as needing MFA, or return 503 for non-auth routes. Log the error either way.

#### M2. Auth-error branch lets requests through (Verified: `middleware.ts`)

When `getUser()` returns a refresh-token error, the code calls `signOut()` and returns `supabaseResponse`. That is a plain `next()`, with no redirect to `/login` and no 401 for API routes.

- **Impact:** The unauthenticated user receives the page shell. API routes are protected only by in-route guards I could not verify. The middleware stops acting as a second layer.
- **Fix:** After `signOut()`, fall through to the normal `!user` handling, or return the redirect or 401 immediately.

#### M3. CSP allows `'unsafe-inline'` and `'unsafe-eval'` (Verified: `next.config.mjs`)

The CSP is otherwise well scoped, but these two `script-src` entries mean it will not stop injected scripts. The app builds large HTML strings and injects them into the DOM, and public visitors submit blog comments that admins moderate. That is a classic stored-XSS path into a privileged session.

- **Impact:** One missed escape in a `bodyHtml` template or client renderer could take over an admin account. Whether such an escape exists is **To check**.
- **Fix:**
  - Move to nonce-based scripts via middleware and drop `unsafe-eval`.
  - Add `base-uri 'self'`, `object-src 'none'`, `form-action 'self'` and `frame-ancestors 'none'`.
  - Narrow `img-src https:`, which allows image-beacon exfiltration.
  - Audit every `innerHTML` and template-string sink for comment, contact-message and post content.

#### M4. Quality gates are disabled (Verified)

- `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`.
- `tsconfig.json` has `"strict": false` and excludes `client`, so `npm run typecheck` never checks the entire browser app. It also has a stray `// @ts-nocheck` on line 1 of a JSON file.
- `middleware.ts` has untyped parameters (`isPublicPath(pathname)`, `middleware(request)`) that strict mode would reject.
- **Impact:** Type errors ship silently, and the core security file is not type-checked.
- **Fix:** Enable `strict` incrementally, include `client` (or point `typecheck` at `tsconfig.audit.json` if it already covers it), and make CI the hard gate.

#### M5. `npm run lint` probably does not work (Verified)

`package.json` has no `eslint` or `eslint-config-next`, and the root listing has no ESLint config. `next lint` will prompt interactively or fail. The README's "lint" check is not backed by the repo, and nothing like `jsx-a11y` exists as a safety net.

- **Fix:** Add ESLint and the Next config, and wire it into CI.

#### M6. Scheduled posts publish up to 24 hours late (Verified: `vercel.json`)

`/api/cron/publish-scheduled` runs once daily at `0 4 * * *`. A post scheduled for 09:00 goes live at 04:00 the next day.

- **Fix:** Run the cron more often (needs a paid Vercel plan), or make public content queries treat `status = 'published' AND published_at <= now()` as live and let the cron do only bookkeeping.

---

### Potential concerns (To check, highest priority first)

| # | Concern | Why it matters | What to inspect |
|---|---|---|---|
| P1 | **Admin-MFA "ok" cookie** (`readAdminMfaOkCookie` / `setAdminMfaOkCookie`) | If it is not HMAC-signed and bound to user, session and role, it can be forged to bypass `REQUIRE_MFA_ADMINS`. It also stays valid after MFA unenroll or a role change. | `lib/auth/admin-mfa-cookie.ts` |
| P2 | **Open redirect via `redirect` param** | Middleware stores `pathname` as `?redirect=`. A request to `//evil.com` yields a pathname starting with `//`, which becomes a protocol-relative URL if the login page navigates to it unvalidated. | Login page and API redirect handling |
| P3 | **Role guards on write routes** | The README says `guardEditor()` applies "where enforced", and collection routes use whole-collection `PUT`. A missed guard or a viewer-reachable PUT could overwrite or wipe a table. Whole-collection PUT is also last-write-wins across concurrent editors. | Every `app/api/**/route.ts`; `lib/cms/repository.tsx` |
| P4 | **`PUBLIC_API_PREFIXES` uses `startsWith`** | A broad prefix would also expose sibling routes sharing it. The extension-based bypass in `isPublicPath` (`.js`, `.map`, …) applies to any path, including future API routes. | `lib/auth/constants.ts` |
| P5 | **Preview-token secret reuse** | The README says `PREVIEW_TOKEN_SECRET` falls back to `CRON_SECRET`. Anyone holding the cron bearer token could forge draft-preview tokens. | Preview-token code in `lib/` |
| P6 | **Secrets in `site_runtime_config`** | SMTP password and Turnstile secret live in a DB row, and the admin UI has an environment viewer and `.env` importer. | `/api/admin/environment*`, migrations (masking, RLS, logs) |
| P7 | **Public API abuse controls** | Likes are keyed on a client-supplied `visitorKey`. In-memory rate limiting does nothing across serverless instances. | `lib/api/public-cors.ts`, public routes |
| P8 | **Public health endpoint** | The README says it returns `connected: true` plus site stats without auth. | `/api/health/supabase` |
| P9 | **SQL export on serverless** | A whole-DB dump over HTTP risks timeouts and memory limits, and exposes all PII if the guard is wrong. | `lib/admin/*`, route guard level |
| P10 | **Session-deadline cookie** | `isDashboardSessionExpired(user, deadlineCookie)` uses a client-held cookie. Confirm it can only shorten a session, or is signed. | `lib/auth/session-lifetime.ts` |
| P11 | **Redirects lookup on every request** | `getRuntimeRedirects()` runs before the public-path check, so it executes for `/js/*`, `/images/*` and public API calls. If it queries the DB uncached, that adds latency and load to every asset. | `lib/config/redirects.ts` |

---

### Performance and optimization

- **Partial static caching (Verified).**
  - `/js/chunks/*` is `immutable` for a year. This is safe only if esbuild emits content-hashed chunk names (`client/build-client.mjs`, **To check**); otherwise users get stale chunks after a deploy.
  - `/js/core/*`, `/js/modules/*` and `/js/utils/*` have no cache rule.
  - `main.js` is cached for 1 hour with `must-revalidate`.
- **Large HTML strings per page (Documented).** The sidebar is duplicated across many `bodyHtml*.tsx` files and kept in sync by a script. This bloats server output and invites drift.
- **Fonts and charts (Documented).** Three font families plus customization fonts, and ApexCharts. I could not confirm lazy loading.
- **Dependency oddities (Verified).** `motion` is declared but usage is unchecked. `@types/react` and `@types/react-dom` are `^19` while React is `18.3`.
- **`reactStrictMode: false` (Verified).** This hides double-invoke bugs, probably because `LegacyBoot` re-boots modules on navigation.
- **Dependency risk (To check).** I could not run `npm audit`. Next.js 14.x is an older major, so check it against current advisories.

### Reliability, accessibility, UX

- **Accessibility (To check).** The HTML-string architecture bypasses JSX lint checks, and with no ESLint nothing catches missing labels, roles or focus handling. Client-side route swapping via `LegacyBoot` typically lacks focus management and route announcements. I could not test either.
- **Tests (Verified, limited).** `test:ci` chains six custom Node scripts (guard, prefetch sync, deployment env, preview token, guard smoke, public API hardening). There is no unit or E2E framework in the dependencies. I could not see CI or run them.

### Documentation inaccuracies (Verified)

- The README links `docs/DEPLOYMENT_CHECKLIST.md`, but the root listing has no `docs/` folder.
- The README says `scripts/` is not referenced in `package.json`, but `test:ci`, `verify:deployment` and `db:baseline` all call scripts in it. Deleting that folder would break `test:ci`.

---

## 3. What is working well

- **Security headers:** HSTS with preload (production), `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, Permissions-Policy.
- **Scoped CSP:** `connect-src` is limited to Supabase and Turnstile (apart from the script weaknesses in M3).
- **Layered session handling in middleware:**
  - 24-hour absolute session lifetime
  - AAL2 enforcement
  - Admin-MFA policy
  - JSON 401/403 for API routes instead of HTML redirects
- **Auth query-param stripping:** sensitive parameters are removed from auth pages with a 303.
- **Redirect construction:** redirects clone the URL and set the path only, so the configured redirect map cannot send users to another origin.
- **Cron safety:** cron routes are documented to return 503 in production if `CRON_SECRET` is unset.
- **Public-API hardening (documented):** direct anon inserts disabled, CORS allowlist, honeypot, Turnstile.
- **Hygiene:** exact Next.js pin, committed lockfile, deployment-env verifier, migration discipline.

---

## 4. Suggested fix order

1. Fail MFA closed and fix the auth-error fall-through (M1, M2).
2. Verify P1 and P2, then P3 and P4. These are the highest-risk unknowns.
3. Tighten the CSP and audit HTML sinks (M3).
4. Add ESLint, enable strict typing and make CI the gate (M4, M5).
5. Fix scheduled publishing and cache rules (M6, performance).

---

## 5. Next steps (approval required)

No files have been changed.

1. **To complete the audit:** upload a ZIP of the repo, paste the files for P1–P11, or provide a sandbox with network access. I can then verify or retire P1–P11 and review the API routes, RLS and client modules.
2. **For patches:** tell me which findings to fix. From what I have already read, I can safely patch M1, M2, the header changes in M3, M5, and the cron or query approach in M6. The rest need the source first.
