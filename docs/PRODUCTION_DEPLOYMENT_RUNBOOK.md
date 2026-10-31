# PageCast — Production Deployment Runbook (TASK-S5-14)

**Status:** Approved for Production Release  
**Version:** 1.0.0  
**Date:** 2026-10-31  
**Category:** CI & Production Deployment Readiness (Sprint 5)  
**Requirements Addressed:** NFR-005, TR-025  

---

## 1. Overview & Architectural Deployment Targets

PageCast is built on Next.js 16 (App Router) and can be deployed to multiple target topologies:

1. **Vercel (Recommended):** Serverless compute with edge routing, automatic asset CDN, and integrated header enforcement.
2. **Docker / Containerized Linux:** Standalone Next.js Node.js server for private intranet, air-gapped emergency deployments, or local field servers.
3. **Emergency Edge / Hybrid Node:** Runs completely standalone with in-memory persistence when upstream cloud databases are unreachable.

---

## 2. Environment Variables Checklist

Configure these variables in your deployment dashboard or `.env.production`:

| Variable Name | Required | Environment | Purpose / Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Client & Server | Supabase project endpoint (e.g. `https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Client & Server | Supabase anonymous public key for read operations |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | **Server Only** | Administrative key for authenticated database mutations |
| `GEMINI_API_KEY` | Optional | **Server Only** | Google Gemini API key for AI bulletin composition |
| `NODE_ENV` | Yes | Server | Must be set to `production` |

> **Critical Safety Invariant:** `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` must **never** be prefixed with `NEXT_PUBLIC_`. The CI pre-submit check (`pnpm env:check`) will automatically abort builds if server keys are exposed to client code.

---

## 3. Database Migration Runbook (Supabase PostgreSQL)

When connecting PageCast to a live Supabase project, execute the SQL migrations located in `supabase/migrations/`:

```
supabase/migrations/
├── 001_initial_schema.sql                 # Teletext pages, revisions, and audits
├── 002_rls_policies.sql                  # Row Level Security & anonymous read rules
├── 003_indexes.sql                       # B-tree indexes for fast page_number lookups
└── 004_source_provenance_and_indexes.sql # Sentence provenance, hash tracking, and full-text search
```

### Execution Steps

#### Option A: Supabase CLI (Recommended)
```bash
# Link project
pnpm dlx supabase link --project-ref your-project-id

# Push migrations
pnpm dlx supabase db push
```

#### Option B: Supabase Dashboard SQL Editor
1. Log in to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor**.
3. Sequentially paste and execute each file from `001_initial_schema.sql` through `004_source_provenance_and_indexes.sql`.
4. Verify table creation in **Table Editor**:
   - `pages`
   - `page_revisions`
   - `drafts`
   - `extracted_sources`
   - `audit_logs`

---

## 4. Production Build & Deployment Procedures

### Target 1: Vercel Deployment

1. **Connect Repository:**
   - Import `pagecast` from GitHub into Vercel.
2. **Build Settings:**
   - Framework Preset: `Next.js`
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`
3. **Environment Secrets:**
   - Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`.
4. **Deploy:**
   - Trigger deployment. Verify build logs confirm zero TypeScript errors and Turbopack asset optimization.

### Target 2: Docker Containerized Deployment

Create or use the standard production Dockerfile:

```dockerfile
FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

---

## 5. Healthcheck & Post-Deployment Verification

Execute the following curl checks against the live production URL:

```bash
# 1. Health & Directory Endpoint (Must return HTTP 200 with JSON)
curl -I https://your-domain.com/api/v1/catalogue

# 2. Main Index Page Pack (Must return HTTP 200 and Cache-Control headers)
curl -I https://your-domain.com/api/v1/pages/100

# 3. Security Headers Check (Must return Strict-Transport-Security, X-Frame-Options, CSP)
curl -I https://your-domain.com/
```

Verify the following response headers are active:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy: default-src 'self' ...`

---

## 6. Disaster Recovery & Rollback Procedures

### Scenario 1: Unstable Production Deployment
- **Vercel:** Open Deployments tab -> Select previous stable deployment -> Click **Rollback to this Deployment** (instant zero-downtime traffic swap).
- **Docker:** Re-tag and redeploy previous image tag (e.g. `docker run -d -p 3000:3000 pagecast:v0.1.0-prev`).

### Scenario 2: Remote Database Connection Failure
- PageCast features an automated **fail-open in-memory repository fallback**:
  - If Supabase is unreachable or misconfigured, PageCast continues serving seeded broadcast pages (P100, P101, P102, P200, P400, P401) without crashing or throwing HTTP 500 errors to readers.
  - Rate limiter storage fails open gracefully to preserve terminal uptime.
