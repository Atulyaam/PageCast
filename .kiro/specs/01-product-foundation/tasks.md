# PageCast Specification: 01 Product Foundation — Implementation Tasks

**Document:** Product Foundation Implementation Roadmap  
**Spec ID:** `SPEC-01-TASKS`  
**Traceability Source:** `docs/SPRINT_PLAN.md`  
**Status:** Approved  

---

## Sprint 0: Product Design, UI/UX and Project Foundation (Current)

- [x] **TASK-S0-01:** Git and Root Directory Sanitization
  - *Dependencies:* None | *Complexity:* Low | *Risk:* Low
  - *Criteria:* Clean working directory, `.gitignore`, MIT license, no nested root.
- [x] **TASK-S0-02:** Next.js 16 + TypeScript Bootstrap
  - *Dependencies:* TASK-S0-01 | *Complexity:* Medium | *Risk:* Medium
  - *Criteria:* Next.js 16.4.3, React 19, TypeScript strict mode, App Router bootstrap.
- [x] **TASK-S0-03:** Tailwind CSS 4 and Design Tokens
  - *Dependencies:* TASK-S0-02 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* Teletext 8-color palette tokens, VT323 typography, interactive dev preview route.
- [x] **TASK-S0-04:** ESLint and Prettier Configuration
  - *Dependencies:* TASK-S0-03 | *Complexity:* Low | *Risk:* Low
  - *Criteria:* Modern ESLint 9 flat config, Prettier 3, zero warnings on baseline.
- [x] **TASK-S0-05:** Project Directory Scaffolding
  - *Dependencies:* TASK-S0-04 | *Complexity:* Low | *Risk:* Low
  - *Criteria:* 34 architectural directories scaffolded with `.gitkeep`.
- [x] **TASK-S0-06:** Environment Configuration and Secret Management
  - *Dependencies:* TASK-S0-05 | *Complexity:* Medium | *Risk:* High
  - *Criteria:* `.env.example`, security validation script, `pnpm env:check`, git ignore enforcement.
- [x] **TASK-S0-07:** GitHub Actions CI Pipeline Setup
  - *Dependencies:* TASK-S0-06 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* `.github/workflows/ci.yml`, pnpm v11 setup, format/lint/typecheck/build pipeline.
- [x] **TASK-S0-08:** Kiro Steering Documents Creation
  - *Dependencies:* TASK-S0-07 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* 7 steering guides in `.kiro/steering/` with correct frontmatter.
- [ ] **TASK-S0-09:** Kiro Specification Foundation Creation
  - *Dependencies:* TASK-S0-08 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* EARS requirements, design spec with Mermaid, task roadmap for Sprints 1–6.
- [ ] **TASK-S0-10:** Kiro Automation Hooks Configuration
  - *Dependencies:* TASK-S0-09 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* 4 automation hooks in `.kiro/hooks/` (`version: "v1"`).
- [ ] **TASK-S0-11:** Vitest and fast-check Testing Infrastructure
  - *Dependencies:* TASK-S0-10 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* Vitest setup, fast-check property tests (1000 runs), Hindi Unicode validation.
- [ ] **TASK-S0-12:** Sprint 0 Final Verification and Quality Gate
  - *Dependencies:* TASK-S0-11 | *Complexity:* Low | *Risk:* Low
  - *Criteria:* All verification commands exit 0, clean git status, completion report.

---

## Sprint 1: Core Teletext Engine & Web Terminal (Days 3–4)

- [ ] **TASK-S1-01:** Teletext 40×24 Data Models & Zod Schemas
  - *Dependencies:* TASK-S0-11 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* `TeletextSpan`, `TeletextRow`, `TeletextPage`, `PagePack` types and Zod schemas in `src/domain/teletext/`.
- [ ] **TASK-S1-02:** Pure Layout Engine Implementation
  - *Dependencies:* TASK-S1-01 | *Complexity:* High | *Risk:* Medium
  - *Criteria:* 40-column word wrapper, header generator, row padding, Devanagari Unicode safety.
- [ ] **TASK-S1-03:** Byte Budget Calculator & Pack Codec
  - *Dependencies:* TASK-S1-02 | *Complexity:* Medium | *Risk:* Medium
  - *Criteria:* Exact UTF-8 byte calculation via `TextEncoder`, 5,120-byte pack limit enforcement, pack serializer.
- [ ] **TASK-S1-04:** Web Teletext Terminal Component
  - *Dependencies:* TASK-S1-03 | *Complexity:* High | *Risk:* Low
  - *Criteria:* High-contrast 40×24 monospaced CRT canvas, phosphor glow, optional scanlines, responsive scaling.
- [ ] **TASK-S1-05:** Teletext Remote & Keyboard Dialing Handler
  - *Dependencies:* TASK-S1-04 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* 3-digit dialing (100–899), Fastext navigation (Red, Green, Yellow, Cyan), Escape to Page 100.
- [ ] **TASK-S1-06:** Teletext Demo Pack & Public Reader Route
  - *Dependencies:* TASK-S1-05 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* Public `/` and `/[magazine]/[page]` routes rendering demo news and weather packs.
- [ ] **TASK-S1-07:** Sprint 1 Property-Based Verification Suite
  - *Dependencies:* TASK-S1-06 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* 1000-run fast-check properties validating 40×24 grid dimensions and <5KB budget invariants.

---

## Sprint 2: Ingestion & AI Composition Pipeline (Days 5–6)

- [ ] **TASK-S2-01:** SSRF-Protected Article Fetcher Service
  - *Dependencies:* Sprint 1 | *Complexity:* High | *Risk:* High
  - *Criteria:* DNS verification, private IP rejection, 3 redirect cap, 10s timeout, 2MB size cap.
- [ ] **TASK-S2-02:** Content Extraction & Sanitization Pipeline
  - *Dependencies:* TASK-S2-01 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* HTML stripping, Readability heuristics, title/body extraction, metadata isolation.
- [ ] **TASK-S2-03:** Gemini 2.5 Flash Structured Prompting Service
  - *Dependencies:* TASK-S2-02 | *Complexity:* High | *Risk:* Medium
  - *Criteria:* System prompt envelope, few-shot teletext formatting, prompt injection defense, structured JSON output.
- [ ] **TASK-S2-04:** Hindi Localization & Bilingual Formatting Engine
  - *Dependencies:* TASK-S2-03 | *Complexity:* Medium | *Risk:* Medium
  - *Criteria:* Hindi translation generation, conjunct preservation, AI-assisted labeling.
- [ ] **TASK-S2-05:** Ingestion & Composition API Handlers
  - *Dependencies:* TASK-S2-04 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* Next.js route handlers `/api/ingest` and `/api/compose` with rate limiting and validation.
- [ ] **TASK-S2-06:** Deterministic Fallback Extractor
  - *Dependencies:* TASK-S2-05 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* Pure rule-based extractive summarization when external AI is offline or quota-limited.

---

## Sprint 3: Publisher Studio & Database Persistence (Days 7–8)

- [ ] **TASK-S3-01:** Supabase Schema & Row Level Security (RLS)
  - *Dependencies:* Sprint 2 | *Complexity:* High | *Risk:* High
  - *Criteria:* PostgreSQL migrations, `page_packs` table, publisher foreign keys, RLS security policies.
- [ ] **TASK-S3-02:** Publisher Authentication & Session Management
  - *Dependencies:* TASK-S3-01 | *Complexity:* Medium | *Risk:* Medium
  - *Criteria:* Supabase Auth, login/register views, protected route middleware.
- [ ] **TASK-S3-03:** Publisher Studio Article Import & Review View
  - *Dependencies:* TASK-S3-02 | *Complexity:* High | *Risk:* Low
  - *Criteria:* URL import form, extracted text preview, AI draft trigger, language toggle.
- [ ] **TASK-S3-04:** Interactive 40×24 Teletext Grid Editor
  - *Dependencies:* TASK-S3-03 | *Complexity:* High | *Risk:* Medium
  - *Criteria:* Live grid editor, color picker, double-height toggle, live byte budget progress meter.
- [ ] **TASK-S3-05:** Publishing Workflow & Approval Enforcement
  - *Dependencies:* TASK-S3-04 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* Human approval gate, page number collision check (100–899), draft vs published state.

---

## Sprint 4: Offline-First PWA & QR Sharing Engine (Days 9–10)

- [ ] **TASK-S4-01:** Progressive Web App Configuration & Service Worker
  - *Dependencies:* Sprint 3 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* Web manifest, application icons, app shell caching, network-first fallback.
- [ ] **TASK-S4-02:** Client-Side IndexedDB Storage Adapter
  - *Dependencies:* TASK-S4-01 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* Save, list, view, and delete PagePacks in IndexedDB with schema versioning.
- [ ] **TASK-S4-03:** Offline Reader Navigation & Empty States
  - *Dependencies:* TASK-S4-02 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* Offline status badge, saved pages drawer, missing-page offline guidance.
- [ ] **TASK-S4-04:** QR Code Generation & Page Export
  - *Dependencies:* TASK-S4-03 | *Complexity:* Low | *Risk:* Low
  - *Criteria:* Canvas QR generation for canonical URL, standalone `.json` PagePack download.
- [ ] **TASK-S4-05:** Animated Chunked Multi-Frame QR Transmission (Stretch)
  - *Dependencies:* TASK-S4-04 | *Complexity:* High | *Risk:* High
  - *Criteria:* Chunked fountain code transmission, webcam frame scanner, SHA-256 digest validation.

---

## Sprint 5: Accessibility, Performance & Edge Hardening (Days 11–12)

- [ ] **TASK-S5-01:** WCAG 2.1 AA Accessibility Audit & Screen-Reader Transcript
  - *Dependencies:* Sprint 4 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* Semantic `sr-only` mirror of all 40×24 rows, zero axe-core critical violations, focus management.
- [ ] **TASK-S5-02:** Client Bundle Optimization & Tree-Shaking
  - *Dependencies:* TASK-S5-01 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* Reader route client JS bundle ≤ 200 KiB gzipped, dynamic import of publisher studio.
- [ ] **TASK-S5-03:** Response Caching & Edge Headers
  - *Dependencies:* TASK-S5-02 | *Complexity:* Low | *Risk:* Low
  - *Criteria:* Immutable caching headers for static PagePacks, stale-while-revalidate for index.
- [ ] **TASK-S5-04:** Cross-Browser & Mobile Device Verification
  - *Dependencies:* TASK-S5-03 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* Verified on Android Chrome, desktop Chrome, iOS Safari, desktop Edge.

---

## Sprint 6: Polish, Hackathon Submission & Demo Readiness (Days 13–14)

- [ ] **TASK-S6-01:** Bundled Offline Showcase Bulletins
  - *Dependencies:* Sprint 5 | *Complexity:* Low | *Risk:* Low
  - *Criteria:* 10 pre-composed bilingual news, weather, sport, and emergency bulletins.
- [ ] **TASK-S6-02:** Hackathon Demo Video & Interactive Walkthrough
  - *Dependencies:* TASK-S6-01 | *Complexity:* Medium | *Risk:* Low
  - *Criteria:* Recorded 3-minute video showing article ingestion, AI conversion, CRT browsing, and offline reading.
- [ ] **TASK-S6-03:** Final Security, Code Quality & License Audit
  - *Dependencies:* TASK-S6-02 | *Complexity:* Low | *Risk:* Low
  - *Criteria:* Clean `quality:check`, clean git history, verified MIT license.

