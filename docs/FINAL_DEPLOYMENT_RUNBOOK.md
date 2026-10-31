# PageCast — Final Production Deployment Runbook
## Kiroween 2026 Hackathon (Resurrection Category)

**Target Release:** PageCast v1.0.0  
**Stack:** Next.js 16.4.3 (Turbopack, App Router) • Node.js 24 • TypeScript 5.8 • Supabase PostgreSQL • Vercel / Docker  
**Date:** 31 October 2026  

---

## 1. Required Services & Infrastructure

| Service | Purpose | Account / Provisioning | Minimum Tier |
|---|---|---|---|
| **Vercel / Node.js Host** | App Router, SSR, API routes, static asset delivery | Vercel or VPS (Docker / PM2) | Hobby / Starter (Node 20+) |
| **Supabase PostgreSQL** | Published pages, revisions, sources, sentence hashes | Supabase project dashboard | Free Tier |
| **Google Gemini API** | AI article condensing & bullet extraction | Google AI Studio | Free / Pay-as-you-go |
| **Domain & DNS** | Canonical domain routing and SSL termination | Cloudflare / Namecheap | Standard DNS |

---

## 2. Environment Variables & Secret Configuration

Create production environment variables in host provider (e.g., Vercel Project Settings → Environment Variables):

```ini
# Canonical Application URL
NEXT_PUBLIC_APP_URL="https://pagecast.app"

# Supabase Persistence
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# AI Condensing Engine
GOOGLE_GENERATIVE_AI_API_KEY="AIzaSy..."
PAGECAST_AI_PROVIDER="google"
PAGECAST_AI_MODEL="gemini-2.5-flash"
PAGECAST_PROMPT_VERSION="v1"

# Domain Operational Limits & Invariants
PAGECAST_MAX_PACK_BYTES="10240"
PAGECAST_MAX_SOURCE_BYTES="2097152"
PAGECAST_FETCH_TIMEOUT_MS="8000"
PAGECAST_MAX_REDIRECTS="3"
PAGECAST_ALLOWED_SOURCE_HOSTS=""
```

> **Security Rule:** Never prefix server-only keys (`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`) with `NEXT_PUBLIC_`. Run `node scripts/check-env-safety.mjs` before deploying to ensure zero secret leakage.

---

## 3. Database Migration Protocol

Execute PostgreSQL migrations in the Supabase SQL Editor in strict sequential order:

1. `supabase/migrations/20261031_001_initial_schema.sql` (Creates `sources`, `source_sentences`, `pages`, `page_revisions`, `page_sources`).
2. `supabase/migrations/20261031_002_enable_rls.sql` (Enables Row-Level Security on all tables).
3. `supabase/migrations/20261031_003_seed_pages.sql` (Seeds initial P100, P101, P102 broadcast catalogue).

---

## 4. Build & Production Start Commands

```bash
# 1. Install locked dependencies
pnpm install --frozen-lockfile

# 2. Run automated pre-deployment quality gate
pnpm quality:check

# 3. Compile optimized production build
pnpm build

# 4. Start production server
pnpm start -p 3000
```

---

## 5. HTTPS, Domain Setup & Security Headers

Next.js is configured with strict defense-in-depth HTTP security headers in `next.config.ts`:
- **Content-Security-Policy (CSP):** `frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline';`
- **Strict-Transport-Security (HSTS):** `max-age=63072000; includeSubDomains; preload`
- **X-Content-Type-Options:** `nosniff`
- **X-Frame-Options:** `DENY`
- **Permissions-Policy:** `camera=(self), microphone=(), geolocation=()`

---

## 6. Health Checks & Verification

After deployment, verify system health using:

```bash
# 1. Root route
curl -s -o /dev/null -w "%{http_code}\n" https://pagecast.app/
# Expected: 200

# 2. Web App Manifest
curl -s -o /dev/null -w "%{http_code}\n" https://pagecast.app/manifest.webmanifest
# Expected: 200

# 3. Seed Page API
curl -s https://pagecast.app/api/v1/pages/100 | grep '"pageNumber":100'
# Expected: Valid JSON with page 100

# 4. Ingestion loopback blocking (SSRF Protection)
curl -X POST https://pagecast.app/api/v1/sources/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"http://127.0.0.1:8080"}'
# Expected: 403 Forbidden ("Access to loopback/metadata host is strictly forbidden")
```

---

## 7. Rollback Protocol

If a production defect is detected post-deployment:
1. **Instant Rollback in Vercel:** Go to Deployments → find previous commit → click "Promote to Production".
2. **Docker / Self-Hosted Rollback:**
   ```bash
   git checkout <PREVIOUS_STABLE_COMMIT>
   pnpm install --frozen-lockfile
   pnpm build
   pm2 restart pagecast
   ```
3. Database changes are strictly backward-compatible; no database rollback is required for app rollback.

