# PageCast — Sprint 0 Task S0-06 Completion Report
## Environment and Secret Isolation

**Project:** PageCast — AI-Powered Low-Bandwidth Teletext Platform  
**Phase:** Sprint 0 (Product Design, UI/UX & Technical Foundation)  
**Task Completed:** `TASK-S0-06`: Environment and Secret Isolation  
**Date:** 31 October 2026  
**Status:** PASSED (Verified Clean)  

---

## 1. Summary of Changes

`TASK-S0-06` established rigorous, automated environment variable security, ensuring privileged secrets are strictly isolated from client-facing code and version control.

### Key Deliverables Completed:
1. **Hardened `.gitignore`:** Configured strict exclusion of `.env`, `.env.*`, `.env.local`, `.env.*.local`, `.vitest`, and coverage artifacts while preserving `.env.example`.
2. **Environment Template Alignment:** Confirmed all 13 specified environment variables are documented with non-sensitive placeholder values in `.env.example`.
3. **Automated Safety Validator:** Implemented `scripts/check-env-safety.mjs` verifying:
   - Required variable presence.
   - Zero `NEXT_PUBLIC_` prefixes on privileged server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`).
   - Absence of real credentials/JWTs in `.env.example`.
   - Git tracking safety via `git check-ignore` and `git ls-files`.
   - Complete absence of server secret references in `src/components/` and client routes.
4. **Package Script Integration:** Added `"env:check": "node scripts/check-env-safety.mjs"` to `package.json`.

---

## 2. Environment Variables Specification

### Public Configuration (Safe for Client Bundles)

| Variable | Example Value | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Canonical application base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase API URL (publicly reachable) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-supabase-anon-key` | Public client key (subject to Supabase RLS) |

### Server-Only Secrets (NEVER Exposed to Client)

| Variable | Example Placeholder | Scope | Security Boundary |
|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | `your-supabase-service-role-key` | Server / API only | Bypasses RLS for administrative operations |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `your-google-ai-api-key` | Server / API only | Authenticates Vercel AI SDK to Google Gemini |

### Operational & Safety Limits

| Variable | Value | Purpose |
|---|---|---|
| `PAGECAST_AI_PROVIDER` | `google` | Provider abstraction identifier |
| `PAGECAST_AI_MODEL` | `gemini-1.5-flash` | Selected LLM for structured bulletin generation |
| `PAGECAST_PROMPT_VERSION` | `1` | Prompt iteration version tracking |
| `PAGECAST_MAX_PACK_BYTES` | `10240` | Strict 10 KiB payload ceiling |
| `PAGECAST_MAX_SOURCE_BYTES` | `2097152` | 2 MiB inbound HTML fetch ceiling |
| `PAGECAST_FETCH_TIMEOUT_MS` | `8000` | 8-second fetch abort timeout (SSRF defense) |
| `PAGECAST_MAX_REDIRECTS` | `3` | Maximum allowed HTTP redirects during ingestion |
| `PAGECAST_ALLOWED_SOURCE_HOSTS` | `""` | Optional hostname allowlist |

---

## 3. Files Created and Modified

| File | Action | Description |
|---|---|---|
| `.gitignore` | Modified | Hardened `.env.*` and `.vitest` ignore rules |
| `scripts/check-env-safety.mjs` | Created | Automated security script scanning envs, git tracking, and client code |
| `package.json` | Modified | Added `env:check` script |
| `docs/TASK_S0_06_COMPLETION_REPORT.md` | Created | Task S0-06 completion report |

---

## 4. Verification Commands & Results

| Check | Command | Result | Exit Code |
|---|---|---|---|
| Environment Safety | `pnpm env:check` | All 8 automated safety rules passed | `0` |
| TypeScript Typecheck | `pnpm typecheck` | `$ tsc --noEmit` — 0 errors | `0` |
| ESLint Flat Config | `pnpm lint` | `$ eslint .` — 0 errors, 0 warnings | `0` |
| Prettier Style Check | `pnpm format:check` | `All matched files use Prettier code style!` | `0` |
| Production Build | `pnpm build` | All static routes compiled successfully | `0` |

---

## 5. Security Decision Log

- **DECISION:** Build does not require actual production secrets to succeed (`pnpm build` generates static shells using non-sensitive defaults).
- **DECISION:** In Sprint 3, Supabase SSR client must explicitly throw an exception if `SUPABASE_SERVICE_ROLE_KEY` is referenced in a module marked `"use client"`.

