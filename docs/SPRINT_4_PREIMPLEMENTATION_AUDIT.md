# PageCast — Sprint 4 Pre-Implementation Foundation Audit
## Reader Experience, Navigation & Audio Synthesizer

**Project:** PageCast — AI-Powered Low-Bandwidth Teletext Information Platform  
**Hackathon:** Kiroween 2026 (Resurrection Category)  
**Date:** 2026-10-31  
**Status:** COMPLETED  
**Baseline Test Count:** 208 passed across 32 test files  

---

## 1. Executive Summary & Existing Assets

Sprint 1, Sprint 2, and Sprint 3 established a robust, deterministic core for PageCast:
1. **Sprint 1 (Core Teletext Engine & Web Terminal):**
   - 40×25 CRT canvas and cell layout engine.
   - Devanagari Hindi Unicode grapheme cluster preservation (`Intl.Segmenter`).
   - 10,240-byte UTF-8 ceiling measurement and enforcement.
   - Initial static `WebTerminal` and `TeletextDialer`.
2. **Sprint 2 (AI Ingestion & Edge Conversion Pipeline):**
   - SSRF-safe URL fetching with private IP blocking and redirect depth control.
   - Article readability extraction and sentence segmentation.
   - Grounded bulletin composition with source sentence provenance.
   - Extractive fallback summarizer.
3. **Sprint 3 (Publisher Studio & Supabase Persistence):**
   - Decoupled `IPersistenceRepository` supporting Supabase and in-memory CI simulation.
   - Version-controlled SQL migrations (9 tables, checks, RLS policies).
   - Draft lifecycle REST endpoints (`/api/v1/drafts`, `/api/v1/sources`).
   - Interactive 40×25 page editor with live `ByteBudgetMeter` and `GridValidationBanner`.
   - Multi-page carousel bulletin publishing with mandatory human review gate (`reviewedAt`).
   - Canonical JSON export/import and high-contrast optical QR code generation.

---

## 2. Environment & Database Verification

### Docker & Supabase CLI Status
- **Docker Daemon:** Inactive / not installed (`failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`).
- **Supabase CLI:** Available via `npx supabase`, but local container health check fails due to missing Docker daemon.
- **Remote Database Linking:** No remote Supabase project is linked (`linked_project: null`).

### Persistence Reality Check
- **Production Migrations:** Stored under `supabase/migrations/` (`20261031000001_initial_pagecast_schema.sql` and `20261031000002_row_level_security.sql`).
- **Test Invariant:** Since no live Postgres container is running, the application and test suites run against `MemoryPersistenceRepository`.
- **Integrity Guarantee:** In-memory repository simulates exact Postgres constraints (100–899 page numbers, 10,240-byte limits, unique active page numbers, and creator-only draft privacy). No remote verification will be claimed.

---

## 3. Reader Experience Gap Analysis

While the basic CRT canvas was created in Sprint 1, the user-facing **Reader Experience** has several critical architectural gaps that Sprint 4 must resolve:

1. **Published Bulletin Retrieval (Data-Access Layer):**
   - `WebTerminal` currently imports static `getSeedPage(n)` from `src/data/seed-pages.ts`.
   - Missing public API route `GET /api/v1/pages/[pageNumber]` to query `IPersistenceRepository` and return live published PagePacks.
   - Missing reader-side caching and fallback when a published page is not found.
   - Unpublished drafts must never be returned to anonymous reader endpoints.

2. **Multi-Page Carousel & Subpage Navigation:**
   - Multi-page bulletins published in Sprint 3 (`101/1`, `101/2`, `101/3`) have no reader-side subpage stepping controls.
   - Reader needs subpage indicator, subpage rotation timer, and manual next/previous subpage controls.

3. **Authentic Keyboard Navigation:**
   - Dialing page numbers requires standard Teletext keypad buffering (e.g. typing 3 digits "2-0-1" navigates to P201).
   - Needs arrow key support (Up/Down for next/prev page, Left/Right for subpages).
   - Needs Fastext color keys (`R`, `G`, `Y`, `C`).
   - Needs `Home` for P100 (Main Index) and `?` for keyboard shortcuts modal.
   - Must avoid capturing input when user is typing in a form or input element.

4. **Public Catalogue & Discovery:**
   - `src/app/catalogue/page.tsx` is static with 3 magazines.
   - Missing `GET /api/v1/catalog` endpoint connecting to `repository.getCatalog()` and `repository.getMagazines()`.
   - Catalogue should dynamically group all 8 magazines with live published bulletin counts and metadata.

5. **Audio Synthesizer & Speech Reader:**
   - Missing isolated Web Audio synthesizer for Teletext carrier tuning and navigation audio feedback.
   - Missing Web Speech API reader for reading active bulletin title, key points, and source provenance.
   - Audio must strictly require explicit user gesture before playback, with persistent mute/volume toggles.

6. **Accessibility & Screen-Reader Alternative (FR-011):**
   - 40×25 visual CRT grid needs a clean, semantic text-only alternative (`role="article"` with structured headings, bullet points, and source links) toggleable by keyboard or button.

---

## 4. Quality Baseline Verification

Executing `pnpm quality:check` confirms the initial Sprint 4 baseline:
- `env:check`: 100% PASS (Zero credential leaks, secret isolation verified).
- `format:check`: 100% PASS (Prettier compliant).
- `lint`: 100% PASS (0 errors, 0 warnings).
- `typecheck`: 100% PASS (`tsc --noEmit` clean).
- `test:run`: **32 test files, 208 tests passing**.
- `build`: Next.js 16.4.3 production build passes with 15 routes compiled.

---

## 5. Sprint 4 Plan Approval

The foundation audit is complete. We are now ready to establish `docs/SPRINT_4_EXECUTION_PLAN.md` breaking the reader experience into 10 sequential, test-driven implementation tasks.
