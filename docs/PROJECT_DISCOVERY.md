# PageCast — Project Discovery Report

**Phase:** 1 — Discovery & Requirement Analysis  
**Date:** 30 October 2026  
**Analyst:** AI Architect (Phase 1 Analysis)  
**Source of Truth:** `01_pagecast_project_spec_kiroween_2026.md` (1,707 lines, 81,976 bytes)

---

## 1. Project Overview

**PageCast** is an AI-powered, low-bandwidth, offline-first information publishing and reading platform being built for the **Kiroween 2026 hackathon** (category: **Resurrection**).

### Core Concept

PageCast revives the Teletext information format for modern constraints. The end-to-end workflow is:

```
Supported Article / Pasted Text
        ↓
URL Safety + HTML Extraction (Mozilla Readability)
        ↓
AI-Assisted Bulletin Composition (Vercel AI SDK + Gemini)
        ↓
Human Review + Edit (Publisher Studio)
        ↓
40×25 Deterministic Teletext Layout Engine
        ↓
10 KiB PagePack Byte-Budget Validation
        ↓
Publish → Supabase Postgres
        ↓
Reader UI (PWA) + Offline Save (Dexie/IndexedDB) + QR Sharing
```

### Competition Context

- **Event:** Kiroween 2026
- **Category:** Resurrection
- **Deadline:** 4 December 2026, 2:00 PM PT / 5 December 2026, 3:30 AM IST
- **Team:** Solo developer
- **Kiro credit deadline:** 1 December 2026, 12:00 PM PT

---

## 2. Repository Assessment

### Current State

| Item | Status |
|---|---|
| Git repository initialized | ❌ Not initialized |
| Package.json | ❌ Does not exist |
| Next.js application | ❌ Not created |
| `.kiro/` directory | ❌ Does not exist |
| `docs/` directory | ✅ Created during Phase 1 analysis |
| Source files | ❌ None exist |
| Test infrastructure | ❌ Not set up |
| CI/CD configuration | ❌ Not set up |
| Environment files | ❌ None exist |
| Node modules | ❌ Not installed |
| Supabase project | ❌ Not created |
| Vercel deployment | ❌ Not configured |

### Existing Files

| File | Size | Purpose |
|---|---|---|
| `01_pagecast_project_spec_kiroween_2026.md` | 81,976 bytes / 1,707 lines | Complete project specification — primary source of truth |

> [!IMPORTANT]
> The repository is a **greenfield project**. Zero application code, configuration, or infrastructure exists. Every component described in the specification must be built from scratch. This is the expected starting state for Sprint 0.

---

## 3. Current Technical Stack

**None installed.** The specification defines the intended stack:

| Layer | Intended Technology | Version |
|---|---|---|
| Framework | Next.js | 16.x Active LTS (16.4 recommended) |
| Language | TypeScript | Strict mode |
| UI | React | Version compatible with selected Next.js 16 |
| Styling | Tailwind CSS | 4.x |
| Components | shadcn/ui + Radix primitives | Current stable |
| Icons | Lucide | Current stable |
| Fonts | Noto Sans Mono / Noto Sans Devanagari | — |
| Database | Supabase Postgres | Current |
| Auth | Supabase Auth + `@supabase/ssr` | Current |
| AI | Vercel AI SDK + Google Gemini | Current stable |
| Article Extraction | Mozilla Readability + jsdom | Current stable |
| Offline storage | Dexie.js (IndexedDB) | Current stable |
| PWA / Service Worker | Serwist or Next.js manual SW | Verify compatibility |
| QR generation | `qrcode` | Current stable |
| QR scanning | `@zxing/browser` | Current stable |
| Validation | Zod | Current stable |
| Unit/integration tests | Vitest | Current stable |
| Property-based tests | fast-check | Current stable |
| E2E tests | Playwright | Current stable |
| Accessibility tests | axe-core | Current stable |
| Lint/format | ESLint + Prettier | Current stable |
| Package manager | pnpm | Current stable |
| Hosting | Vercel | — |
| CI/CD | GitHub Actions | — |

---

## 4. Existing Functionality

**None.** No application code exists. The following must be built entirely:

- Teletext renderer (40×25 grid engine)
- PagePack schema and validation
- Article URL ingestion with SSRF protection
- AI bulletin composer
- Publisher studio (auth, drafts, editing, publish)
- Offline PWA (service worker + IndexedDB)
- QR sharing (link QR + JSON export/import + optional multi-frame QR)
- Supabase database schema and RLS policies
- All API routes
- CI/CD pipeline
- Kiro specs, steering files and hooks

---

## 5. Missing Functionality (Everything)

All features defined in the specification are absent. Priority breakdown:

### P0 — Required (Must build first)
- Teletext page viewer (40×25 grid)
- Page catalogue
- Article URL ingestion
- Paste-text fallback
- AI bulletin composition
- Source attribution
- Human review + editing
- 10 KiB PagePack validation
- English and Hindi support
- Offline saved pages (IndexedDB)
- Installable PWA
- Online share QR (link)
- Publisher authentication

### P1 — Important (After P0 stable)
- Multi-frame offline QR transfer
- Search
- Page update/stale indicators
- Content categories
- Page archive/unpublish
- Page revision comparison
- Service worker stale badges
- Saved PagePack versioning

### P2 — Stretch
- Reader accounts
- Admin analytics
- Additional Indian languages
- RSS feed ingestion
- Publisher API
- PageCast MCP server

---

## 6. Important Findings

### Finding 1: No Existing Infrastructure
The project starts completely from scratch. Sprint 0 must establish the repo, Next.js app, TypeScript config, CI and Kiro structure before any feature work can begin.

### Finding 2: Spec is Exceptionally Detailed
The 1,707-line specification covers architecture, data models, API contracts, security requirements, testing strategy, sprint plans and submission checklists. This is a comprehensive build guide, not just a feature list.

### Finding 3: Tight Timeline for Solo Developer
35 days from 30 October to 4 December 2026. Six sprints of varying lengths cover foundation, renderer, AI pipeline, publisher, offline/PWA, quality and submission. This is achievable but leaves no slack for major technical pivots.

### Finding 4: Hindi/Teletext Layout is the Highest Technical Risk
Grapheme-aware segmentation (`Intl.Segmenter`) for Devanagari within a fixed 40-column monospace grid is a non-trivial engineering challenge that must be validated early.

### Finding 5: SSRF Protection is Security-Critical
The URL ingestion feature requires server-side DNS resolution, IP block-listing, redirect chasing and response-size enforcement. Implementing this incorrectly creates a serious security vulnerability.

### Finding 6: 10 KiB Budget Precision
The spec precisely defines 10,240 bytes of canonical compact JSON encoded as UTF-8. The byte counter must use `TextEncoder`, not JavaScript string `.length`. This distinction is critical.

### Finding 7: AI Provider Dependency Risk
The core publishing workflow depends on Google Gemini via the Vercel AI SDK. A deterministic extractive fallback must be built so the demo works if the provider is unavailable.

### Finding 8: Serwist Compatibility Unknown
The spec explicitly warns about validating Serwist compatibility with Next.js 16. The fallback is the official Next.js manual service-worker approach. This must be verified during Sprint 4.

### Finding 9: QR Multi-frame Transfer is P1
A 10 KiB PagePack will not fit in one QR code (QR v40 max capacity ~2,953 bytes binary). Multi-frame animated QR with frame-index, bundle-ID and SHA-256 integrity is P1. P0 relies on public-link QR + JSON file export/import.

### Finding 10: No `.kiro` Directory Exists
The entire Kiro configuration (specs, steering, hooks) must be created from scratch. This is required for Kiro usage scoring in the hackathon.

---

## 7. Known Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| URL ingestion cannot support paywalled or JS-heavy sites | Some articles will fail | Paste-text fallback + curated demo URLs |
| AI summaries are not guaranteed factually accurate | Legal/quality risk | Human review gate; source link always visible |
| Offline requires prior save/import | Cannot cold-start offline | Clear UX messaging; JSON import path |
| Hindi grapheme rendering depends on browser/OS font support | Display inconsistency | Test on target devices; document supported glyph ranges |
| 35-day solo developer timeline | Feature compression risk | Strict P0/P1/P2 discipline; P2 never starts before P0 complete |
| QR multi-frame reliability varies by camera/app | Demo risk | JSON export/import as reliable fallback |
| Next.js 16 + Serwist compatibility unverified | PWA feature risk | Use official manual SW approach if Serwist fails |

---

*Document created during Phase 1 discovery. No application code was modified or created.*

