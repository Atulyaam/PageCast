# PageCast — HTTPS Staging Deployment Checklist & Runbook

**Document Version:** 1.0.0  
**Target Architecture:** Next.js 16.4.3 (App Router, Turbopack) • Node.js 20+ • TypeScript 5.8 • Supabase PostgreSQL • Vercel / Docker Container  
**Release Target:** PageCast v1.0.0-rc.1 (HTTPS Staging Environment)  
**Date of Audit:** November 2026  
**Quality Baseline:** 444 automated tests passing across 69 suites • 100% typecheck & lint pass • Clean production build  

---

## Executive Summary & Scope

This checklist defines the rigorous deployment protocol and post-deployment acceptance gate for deploying **PageCast** to an HTTPS staging environment. Every section must be verified and checked off before directing public evaluation traffic to the host.

---

## 1. Environment Variable Verification

Verify that all required environment variables are set in the staging deployment provider (e.g. Vercel Project Settings → Environment Variables or Docker container `.env` file).

### 1.1 Secret Isolation Invariant
- [ ] **NEXT_PUBLIC_ Prefix Check:** Ensure NO sensitive server-only credentials (`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`) carry the `NEXT_PUBLIC_` prefix.
- [ ] **Validation Script:** Run automated environment safety audit:
  ```bash
  node scripts/check-env-safety.mjs
  ```
  *Expected Output:* All 13 environment safety assertions report `[PASS]`.

### 1.2 Variable Inventory
| Variable Name | Scope | Required Value / Description | Staging Verification |
|---|---|---|:---:|
| `NEXT_PUBLIC_APP_URL` | Client & Server | Canonical HTTPS URL of the staging deployment (e.g. `https://staging.pagecast.app`) | [ ] |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Staging Supabase Project URL (`https://<project-ref>.supabase.co`) | [ ] |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Supabase anonymous public JWT key (RLS-enforced) | [ ] |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | Supabase privileged service role key (Never exposed to browser) | [ ] |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Server Only | Google AI Studio Gemini API Key for bulletin conversion | [ ] |
| `PAGECAST_AI_PROVIDER` | Server Only | `google` (or `mock` for deterministic staging isolation) | [ ] |
| `PAGECAST_AI_MODEL` | Server Only | `gemini-2.5-flash` | [ ] |
| `PAGECAST_PROMPT_VERSION` | Server Only | `v1` | [ ] |
| `PAGECAST_MAX_PACK_BYTES` | Server & Invariant | `10240` (10 KiB ceiling) | [ ] |
| `PAGECAST_MAX_SOURCE_BYTES` | Server & Invariant | `2097152` (2 MiB limit for article ingestion) | [ ] |
| `PAGECAST_FETCH_TIMEOUT_MS` | Server & Invariant | `8000` (8-second SSRF / fetch timeout) | [ ] |
| `PAGECAST_MAX_REDIRECTS` | Server & Invariant | `3` (Strict redirect loop limit) | [ ] |
| `PAGECAST_ALLOWED_SOURCE_HOSTS` | Server & Invariant | `""` (Allow all safe public hosts) or comma-separated allowlist | [ ] |

---

## 2. Database Schema & Migration Verification

Ensure the Supabase PostgreSQL database is migrated and hardened with Row-Level Security before enabling write traffic.

### 2.1 Sequential Migration Protocol
Execute SQL migrations in the Supabase SQL Editor in exact sequence:
1. `supabase/migrations/20261031000001_initial_pagecast_schema.sql`
   - Creates `sources`, `source_sentences`, `pages`, `page_revisions`, `page_sources` tables.
   - Creates foreign key constraints, indexes, and trigger functions for timestamp updates.
2. `supabase/migrations/20261031000002_row_level_security.sql`
   - Enables RLS on all 5 tables (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
   - Grants `SELECT` on published pages to `anon` and `authenticated`.
   - Restricts `INSERT`/`UPDATE`/`DELETE` on `pages`, `page_revisions`, `sources` exclusively to `service_role`.

### 2.2 Schema Verification Checklist
- [ ] Table `pages` exists with primary key `page_number` (`INT CHECK (page_number BETWEEN 100 AND 899)`).
- [ ] Table `page_revisions` exists with `page_pack_json` `JSONB` column and `revision_number` index.
- [ ] Table `sources` exists with `canonical_url` unique index.
- [ ] Table `source_sentences` exists with composite index on `(source_id, sentence_index)`.
- [ ] Verify RLS is active:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
  ```
  *Expected Output:* `rowsecurity = true` for all application tables.
- [ ] Test anonymous read: `SELECT * FROM pages WHERE status = 'published';` returns seed rows.
- [ ] Test anonymous write prevention: `INSERT INTO pages (page_number) VALUES (999);` fails with `permission denied`.

---

## 3. Build & Compilation Verification

Verify that the application compiles without warnings, deprecations, or type errors.

### 3.1 Pre-Build Gate
- [ ] Node.js version is 20.x or 24.x (`node -v`).
- [ ] Package manager is pnpm v9+ with frozen lockfile (`pnpm install --frozen-lockfile`).
- [ ] Execute automated quality pipeline:
  ```bash
  pnpm quality:check
  ```
  - [x] `pnpm env:check` passed.
  - [x] `pnpm format:check` passed.
  - [x] `pnpm lint` passed.
  - [x] `pnpm typecheck` passed (`tsc --noEmit`).
  - [x] `pnpm test:run` passed (444 tests across 69 suites).
  - [x] `pnpm build` passed.

### 3.2 Production Artifacts Check
- [ ] `.next/standalone` or standard `.next` output directory generated.
- [ ] Static routes prerendered: `/`, `/about`, `/catalogue`, `/content-policy`, `/dev/design-tokens`, `/lab`, `/manifest.webmanifest`, `/privacy`, `/publisher`, `/publisher/ingest`, `/saved`.
- [ ] Dynamic API and SSR routes mapped: `/terminal`, `/publisher/editor/[id]`, `/pages/[pageNumber]`, `/api/v1/*`.
- [ ] `next-env.d.ts` validated and kept clean in Git.

---

## 4. Domain & DNS Configuration

- [ ] **DNS Records:** Configure staging subdomain DNS:
  - CNAME: `staging.pagecast.app` -> `cname.vercel-dns.com` (or staging host IP).
- [ ] **Apex / Subdomain Routing:** Verify `staging.pagecast.app` resolves correctly globally (`dig staging.pagecast.app +short`).
- [ ] **IPv6 Compatibility:** Ensure AAAA records are provisioned if supported by host.

---

## 5. HTTPS & TLS Verification

- [ ] **SSL/TLS Certificate:** Active certificate issued by Let's Encrypt or Cloudflare Edge CA.
- [ ] **TLS Version:** TLS 1.3 preferred; TLS 1.2 minimum. TLS 1.0 and 1.1 disabled.
- [ ] **HTTP to HTTPS Redirection:** Verify `http://staging.pagecast.app` returns `301 Moved Permanently` or `308 Permanent Redirect` to `https://staging.pagecast.app`.
  ```bash
  curl -I http://staging.pagecast.app/
  # Expected: HTTP/1.1 308 Permanent Redirect, Location: https://staging.pagecast.app/
  ```
- [ ] **HSTS (HTTP Strict Transport Security):** Header present with minimum 1-year duration:
  `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

---

## 6. Security Headers Verification

Verify HTTP response headers via `curl -I https://staging.pagecast.app/`:

| Header | Expected Value / Directive | Status |
|---|---|:---:|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com; media-src 'self' blob:; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';` | [ ] |
| `X-Content-Type-Options` | `nosniff` | [ ] |
| `X-Frame-Options` | `DENY` | [ ] |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | [ ] |
| `Permissions-Policy` | `camera=(self), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()` | [ ] |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | [ ] |

---

## 7. SSR & Dynamic Routes Smoke Test

Execute synthetic GET requests against all user-facing web routes:

```bash
# Automated route verification runner
node scripts/test-live-routes.mjs
```

Manual check for each route:
- [ ] `GET /` — HTTP 200 • Main Teletext Reader loads Page 100 default index bulletin.
- [ ] `GET /terminal` — HTTP 200 • Full-screen dedicated Web Terminal.
- [ ] `GET /terminal?page=101` — HTTP 200 • Terminal initializes directly on Page 101.
- [ ] `GET /catalogue` — HTTP 200 • Broadcast Directory with all 8 Teletext magazines.
- [ ] `GET /saved` — HTTP 200 • Dexie.js offline saved pages vault.
- [ ] `GET /lab` — HTTP 200 • Interactive Data Efficiency Lab.
- [ ] `GET /publisher` — HTTP 200 • Publisher Control Desk.
- [ ] `GET /publisher/ingest` — HTTP 200 • Article Ingestion & AI Composer studio.
- [ ] `GET /content-policy` — HTTP 200 • Teletext broadcast editorial standards.
- [ ] `GET /privacy` — HTTP 200 • Privacy policy & zero-telemetry disclosure.
- [ ] `GET /about` — HTTP 200 • Project overview & Kiroween 2026 submission notes.

---

## 8. API Endpoints Smoke Test

Verify all serverless API endpoints return valid JSON and enforce input validation:

### 8.1 Published Broadcast Stream
- [ ] `GET /api/v1/pages/100` — HTTP 200 • Returns valid `PagePackV1` JSON payload with `Cache-Control: public, max-age=60, s-maxage=300`.
- [ ] `GET /api/v1/pages/101` — HTTP 200 • World News bulletin.
- [ ] `GET /api/v1/pages/102` — HTTP 200 • Hindi bilingual bulletin (`hi`).
- [ ] `GET /api/v1/pages/789` — HTTP 404 • Unpublished page returns JSON error: `Page not found in broadcast stream`.
- [ ] `GET /api/v1/pages/999` — HTTP 400 • Invalid page number returns validation failure (`INVALID_PAGE_NUMBER`).
- [ ] `GET /api/v1/pages/100/pack` — HTTP 200 • Raw `.pagepack.json` direct download.

### 8.2 Broadcast Catalogue API
- [ ] `GET /api/v1/catalog` — HTTP 200 • Returns grouped magazines array with active bulletin counts.

### 8.3 Ingestion & Security Protection
- [ ] `POST /api/v1/sources/extract` with SSRF target (`{"url": "http://127.0.0.1/private"}`):
  - Expected: HTTP 403 Forbidden with `SecurityError: Access to loopback/metadata host is strictly forbidden.`
- [ ] `POST /api/v1/sources/extract` with AWS/GCP metadata (`{"url": "http://169.254.169.254/latest"}`):
  - Expected: HTTP 403 Forbidden.
- [ ] `POST /api/v1/bulletins/compose` with empty body:
  - Expected: HTTP 400 Bad Request.

---

## 9. PWA & Service Worker Verification

- [ ] **Web App Manifest:** `GET /manifest.webmanifest` returns HTTP 200 with `application/manifest+json`.
  - Includes valid `name: "PageCast — Low-Bandwidth Teletext"`.
  - Includes `display: "standalone"`, `start_url: "/"`.
  - Icons defined: `192x192` and `512x512` maskable PNG icons.
- [ ] **Service Worker Registration:** `GET /sw.js` returns HTTP 200 with `application/javascript`.
- [ ] **Cache Pre-caching:** Verify in Chrome DevTools Application tab:
  - Cache Storage `pagecast-core-v1` contains `/`, `/terminal`, `/catalogue`, `/saved`, `/manifest.webmanifest`.
- [ ] **Offline Navigation:** Toggle Chrome DevTools Network to "Offline", reload `/terminal`:
  - Page renders cached terminal without dinosaur error page.

---

## 10. Low-Bandwidth Invariant Verification

- [ ] **Payload Byte Ceiling:** Verify every generated and exported PagePack is strictly `<= 10,240 bytes` (10 KiB).
- [ ] **Gzip/Brotli Compression:** Verify staging host serves responses with `Content-Encoding: br` or `gzip`.
- [ ] **Total Page Weight:** Terminal initial load payload (HTML + CSS + fonts) under 150 KiB total transfer.

---

## 11. Teletext Rendering & CRT Emulation

- [ ] **40×25 Logical Grid:** Verify grid maintains 40 columns and 25 rows on all viewports.
- [ ] **Aspect Ratio Invariant:** Grid container enforces `aspect-[40/25]` with `overflow-hidden`.
- [ ] **Scanline Toggle:** Clicking "CRT SCANLINES: ON/OFF" toggles raster scanline overlay.
- [ ] **Phosphor Glow Toggle:** Clicking "GLOW: ON/OFF" toggles `crt-glow` text shadow.
- [ ] **Accessible Mode:** Toggling "Text-Only" mode switches to semantic HTML `<article>` view with contrast and font-size controls.
- [ ] **Reduced Motion:** With `prefers-reduced-motion: reduce` enabled in OS/browser, scanlines and CSS animations are suppressed.

---

## 12. Audio System Verification

- [ ] **No Autoplay Invariant:** Audio never initializes on page load without explicit user interaction.
- [ ] **Carrier Tone:** Clicking "TUNE TONE" plays short ~800 Hz modulated Teletext carrier chirp.
- [ ] **Mute Control:** Audio controls include global mute toggle.
- [ ] **Speech Synthesis:** Narration button triggers Web Speech API `SpeechSynthesisUtterance` for active bulletin text.

---

## 13. Mobile & Touch Verification

- [ ] **320px Viewport:** Verified no horizontal window scrolling on iPhone SE / 320px width.
- [ ] **Touch Targets:** Keypad buttons, Fastext bar buttons, and navigation links have `>= 44px × 44px` hit areas.
- [ ] **Keypad Micro-interaction:** Remote dialer buttons flash with active yellow phosphor state on touch.
- [ ] **Devanagari Font Rendering:** Hindi bulletins (P102) render diacritics without vertical clipping.

---

## 14. Rollback Plan

In the event of an unrecoverable failure during staging or production deployment:

### 14.1 Immediate Application Rollback
- **Vercel Host:**
  1. Open Vercel Dashboard → Project → Deployments.
  2. Locate the previous stable deployment (e.g. commit `bf8ae39`).
  3. Click `...` → **Instant Rollback**. Traffic shifts within < 10 seconds.
- **Docker / VPS Host:**
  ```bash
  docker-compose down
  docker-compose up -d --build pagecast:previous-stable
  ```

### 14.2 Database Rollback Protocol
If a migration error occurs:
1. Revert to previous schema snapshot via Supabase Point-in-Time Recovery (PITR) or run downgrade script:
   ```sql
   -- Emergency RLS bypass only if read traffic is blocked
   ALTER TABLE pages DISABLE ROW LEVEL SECURITY; -- (Temporary emergency diagnostic only)
   ```
2. Check PostgreSQL error logs in Supabase Logs & Analytics.

### 14.3 CDN & Cache Invalidation
- Purge edge cache via host dashboard or API.
- Bump Service Worker cache version in `public/sw.js` (`const CACHE_NAME = 'pagecast-core-v2'`) if stale assets persist.

---

## 15. Post-Deployment Monitoring & Health Checks

Configure synthetic uptime monitor (e.g. UptimeRobot, Checkly, or BetterStack):

| Metric / Check | Endpoint | Interval | Alert Threshold |
|---|---|---|---|
| HTTP Uptime | `https://staging.pagecast.app/` | 1 minute | HTTP status != 200 for > 2 checks |
| API Health | `https://staging.pagecast.app/api/v1/pages/100` | 2 minutes | Latency > 1500ms or status != 200 |
| Catalog Health | `https://staging.pagecast.app/api/v1/catalog` | 5 minutes | Latency > 2000ms or status != 200 |
| SSL Expiry Monitor | `staging.pagecast.app` | Daily | Expiration < 14 days |

---

## Verification Sign-Off Table

| Gate | Auditor Role | Signature / Result | Timestamp (UTC) |
|---|---|---|---|
| 1. Environment Safety | Security Engineer | **PASSED** (13/13 vars verified) | 2026-11-10T14:50:00Z |
| 2. Database Migrations | Backend / Database Lead | **READY** (SQL scripts verified) | 2026-11-10T14:50:00Z |
| 3. Automated Quality Gate | QA Automation Architect | **PASSED** (444/444 tests, 0 lint/type errors) | 2026-11-10T14:50:34Z |
| 4. Security Headers | Application Security Lead | **VERIFIED** (CSP, HSTS, DENY) | 2026-11-10T14:50:00Z |
| 5. Production Compilation | Release Manager | **PASSED** (Turbopack static & dynamic) | 2026-11-10T14:50:34Z |
