# PageCast — Technical Decisions

**Phase:** 1 — Discovery & Requirement Analysis  
**Date:** 30 October 2026  
**Source:** `01_pagecast_project_spec_kiroween_2026.md` §§7, 8, 13, 14

---

## Overview

This document records the technology decisions for PageCast, their rationale, alternatives considered, trade-offs, and any recommended changes from the specification's proposals. All decisions originate from the specification unless marked **[RECOMMENDATION]**.

---

## TD-001 — Framework: Next.js 16.x (Active LTS)

| | |
|---|---|
| **Decision** | Use Next.js 16.x (latest patched Active LTS release) with the App Router |
| **Why required** | Provides App Router for React Server Components, route handlers for API endpoints, server actions for form processing, and a single deployable full-stack application — eliminating the need for a separate backend |
| **Responsibility** | Application framework, routing, server-side rendering, API routes, deployment unit |
| **Alternatives considered** | Remix (less mature ecosystem for RSC), plain Express + Vite (requires separate backend, more setup), SvelteKit (smaller ecosystem for this specific stack), Create React App (no SSR) |
| **Solo developer impact** | Medium-positive: Next.js provides a complete solution in one framework; App Router has a learning curve but the spec assumes familiarity |
| **Licensing** | MIT — no concerns |
| **Version concern** | Confirm exact 16.x patch version on bootstrap day; do not upgrade during final submission week |
| **Spec alignment** | ✅ Direct from spec §7.1 |

---

## TD-002 — Language: TypeScript Strict Mode

| | |
|---|---|
| **Decision** | TypeScript with `strict: true` in `tsconfig.json`; no `any` without documented reason |
| **Why required** | Shared typed `PagePackV1` schema, API contracts and renderer types are the safety net for the grid invariants and byte-budget correctness |
| **Responsibility** | Type safety across all layers; enables Zod schema inference |
| **Alternatives considered** | Plain JavaScript (inadequate for a typed domain model), JSDoc + JavaScript (verbose, weaker tooling) |
| **Solo developer impact** | Positive: catches bugs early; slight overhead on initial setup |
| **Licensing** | Apache 2.0 — no concerns |
| **Spec alignment** | ✅ Direct from spec §7.1 |

---

## TD-003 — Styling: Tailwind CSS 4.x

| | |
|---|---|
| **Decision** | Tailwind CSS 4.x with `@tailwindcss/postcss` |
| **Why required** | Fast utility-first styling, design tokens for Teletext palette, responsive layout without custom CSS bloat |
| **Responsibility** | All visual styling; responsive breakpoints; palette tokens |
| **Alternatives considered** | CSS Modules (more verbose, no token system), styled-components (runtime overhead), plain CSS (tedious for a component-heavy app) |
| **Solo developer impact** | Positive: fast iteration; Tailwind 4 has some breaking changes from v3 — verify PostCSS config |
| **Licensing** | MIT — no concerns |
| **Version concern** | Tailwind 4 uses a new CSS-based config approach (`@import "tailwindcss"`); verify PostCSS plugin compatibility with Next.js 16 |
| **Spec alignment** | ✅ Direct from spec §7.1 |

---

## TD-004 — Components: shadcn/ui + Radix Primitives

| | |
|---|---|
| **Decision** | Use shadcn/ui for publisher admin forms, dialogs, tabs and menus. Custom-build the Teletext reader grid. |
| **Why required** | shadcn/ui provides accessible, composable Radix-based components for complex admin UI (dialogs, command palette, tabs) without a runtime library dependency |
| **Responsibility** | Publisher studio admin UI; not the Teletext renderer |
| **Alternatives considered** | Full custom components (time-intensive), MUI (too heavy/opinionated), Mantine (another learning curve) |
| **Solo developer impact** | Mixed: shadcn/ui copies code into the project (no runtime dep); but CLI code-gen adds setup time. **Use selectively.** |
| **Licensing** | MIT — no concerns |
| **Spec alignment** | ✅ Direct from spec §7.1 |
| **[RECOMMENDATION]** | Only install shadcn components as needed — do not run `npx shadcn@latest init` and add all components at once. Start with what Sprint 3 needs. |

---

## TD-005 — Database: Supabase Postgres

| | |
|---|---|
| **Decision** | Supabase Postgres with migrations and Row Level Security |
| **Why required** | Managed relational database with built-in auth, RLS, public/anonymous read paths and REST+Realtime APIs |
| **Responsibility** | All persistent storage: pages, drafts, revisions, sources, audit log |
| **Alternatives considered** | PlanetScale (MySQL; Supabase has better Next.js integration), Neon Postgres (good but no built-in auth), SQLite/Turso (no managed auth, RLS complexity), local-only (no multi-device sharing) |
| **Solo developer impact** | Positive: managed service removes server ops; free tier is sufficient for hackathon |
| **Licensing** | Apache 2.0 (Supabase OSS) — SaaS terms apply for hosted service |
| **Version concern** | Use `@supabase/ssr` (not deprecated `@supabase/auth-helpers-nextjs`); check current docs at project setup |
| **Spec alignment** | ✅ Direct from spec §7.2 |

---

## TD-006 — Authentication: Supabase Auth + `@supabase/ssr`

| | |
|---|---|
| **Decision** | Supabase Auth with cookie-based sessions via `@supabase/ssr` |
| **Why required** | Publisher authentication must be server-side verified. Cookie-based sessions integrate cleanly with Next.js App Router middleware and RSC patterns |
| **Responsibility** | Publisher sign-in, session management, server-side role verification |
| **Alternatives considered** | NextAuth.js (additional library; Supabase Auth is already included), Auth0 (external vendor dependency for hackathon) |
| **Solo developer impact** | Positive: integrated with Supabase; docs are well-maintained |
| **Licensing** | Apache 2.0 — no concerns |
| **Spec alignment** | ✅ Direct from spec §7.2 |

---

## TD-007 — Validation: Zod

| | |
|---|---|
| **Decision** | Zod for all schema validation: API inputs, PagePack schema, AI output, import validation |
| **Why required** | Type-safe runtime validation at every boundary; TypeScript type inference from schemas; structured error messages |
| **Responsibility** | PagePackV1 schema, API request/response validation, AI output validation, import validation |
| **Alternatives considered** | Yup (less TypeScript-native), io-ts (verbose), valibot (newer, smaller but less ecosystem support) |
| **Solo developer impact** | Positive: minimal overhead; Zod is well-documented |
| **Licensing** | MIT — no concerns |
| **Spec alignment** | ✅ Direct from spec §7.2 |

---

## TD-008 — AI Integration: Vercel AI SDK + Google Gemini

| | |
|---|---|
| **Decision** | Vercel AI SDK (`ai` + `@ai-sdk/google`) for provider-agnostic structured generation |
| **Why required** | Provider abstraction allows model switching via environment variables; structured output with Zod schema prevents free-form JSON parsing; handles streaming and retry patterns |
| **Responsibility** | AI bulletin composition endpoint; structured draft generation |
| **Alternatives considered** | Direct Google AI SDK (no provider abstraction), LangChain (heavy for this use case), Anthropic SDK (not the initial provider) |
| **Solo developer impact** | Positive: well-documented; provider swap without code changes |
| **Licensing** | Apache 2.0 — no concerns |
| **Risk** | AI quota exhaustion during demo; mitigated by extractive fallback and pre-seeded pages |
| **Spec alignment** | ✅ Direct from spec §7.3 |

---

## TD-009 — Article Extraction: Mozilla Readability + jsdom

| | |
|---|---|
| **Decision** | `@mozilla/readability` with `jsdom` for server-side article extraction, with scripts and remote resources explicitly disabled |
| **Why required** | Readability is battle-tested for article extraction from HTML; jsdom provides the DOM API for Readability without a browser; disabling script execution prevents code execution from untrusted HTML |
| **Responsibility** | Extract title, body text, author, publication date from public article HTML |
| **Alternatives considered** | Cheerio (no Readability-level boilerplate removal), Puppeteer (too heavy, full browser, security risk), `@extractus/article-parser` (less tested) |
| **Solo developer impact** | Low overhead; jsdom is well-understood |
| **Security consideration** | jsdom must be configured with `{ runScripts: "outside-only", resources: "usable" }` at minimum — or `"dangerously"` patterns must be explicitly avoided. Use `{ runScripts: "dangerously" }` — NO; use no-scripts mode. |
| **[RECOMMENDATION]** | Use `new JSDOM(html, { runScripts: "dangerously" })` must be explicitly avoided; use `{ runScripts: "outside-only" }` or simply omit runScripts. Verify Readability DOM compatibility with this config. |
| **Licensing** | Apache 2.0 (Readability), MIT (jsdom) — no concerns |
| **Spec alignment** | ✅ Direct from spec §7.3 |

---

## TD-010 — Offline Storage: Dexie.js (IndexedDB)

| | |
|---|---|
| **Decision** | Dexie.js as a typed wrapper over the browser's IndexedDB API |
| **Why required** | IndexedDB provides persistent offline storage; Dexie adds TypeScript types, versioned schema migrations and a cleaner Promise-based API |
| **Responsibility** | Persistent local storage of saved PagePacks, catalogue snapshots and import state |
| **Alternatives considered** | Raw IndexedDB (verbose API, error-prone), localStorage (5 MB limit, synchronous, no binary), OPFS (newer, less universal) |
| **Solo developer impact** | Positive: Dexie significantly reduces IndexedDB boilerplate |
| **Licensing** | Apache 2.0 — no concerns |
| **Spec alignment** | ✅ Direct from spec §7.4 |

---

## TD-011 — Service Worker: Serwist or Manual Next.js Approach

| | |
|---|---|
| **Decision** | **Attempt Serwist (`@serwist/next`) first; fall back to the official Next.js manual service-worker approach if integration is unstable** |
| **Why required** | PWA app-shell caching requires a service worker; Serwist provides a Next.js-compatible Workbox integration with route strategy configuration |
| **Responsibility** | App shell precaching, static asset caching, cache strategies per resource type |
| **Alternatives considered** | `next-pwa` (deprecated, not actively maintained for Next.js 13+), Workbox directly (more configuration), manual Service Worker (most control, most code) |
| **Solo developer impact** | Mixed: Serwist saves configuration time IF it works; debugging a broken Serwist + Next.js integration can cost a full day |
| **Licensing** | MIT — no concerns |
| **[RECOMMENDATION]** | Create a small proof-of-concept service worker integration at the START of Sprint 4, before building Dexie save/load. If Serwist fails with `next build`, switch to manual immediately. Do not delay this verification. |
| **Spec alignment** | ✅ Direct from spec §7.4 (with explicit fallback warning) |

---

## TD-012 — QR: `qrcode` + `@zxing/browser`

| | |
|---|---|
| **Decision** | `qrcode` library for generation; `@zxing/browser` for camera-based scanning |
| **Why required** | Standard, maintained libraries for each direction of QR transfer |
| **Responsibility** | Generate public-link QR (P0); camera QR scanning for multi-frame import (P1) |
| **Alternatives considered** | `qr-code-styling` (more visual options but heavier), native `BarcodeDetector` API (inconsistent support), `html5-qrcode` (heavier) |
| **Capacity concern** | A 10 KiB PagePack will NOT fit in one QR code (QR v40 max binary: ~2,953 bytes). Multi-frame QR is required for offline transfer. P0 uses public-link URL QR + JSON file export/import. |
| **Solo developer impact** | Low for P0; medium for multi-frame P1 implementation |
| **Licensing** | MIT (`qrcode`), Apache 2.0 (`@zxing/browser`) — no concerns |
| **Spec alignment** | ✅ Direct from spec §7.4 |

---

## TD-013 — Testing: Vitest + fast-check + Playwright + axe-core

| | |
|---|---|
| **Decision** | Vitest for unit/integration, fast-check for property-based testing, Playwright for E2E, axe-core for accessibility |
| **Why required** | Vitest integrates natively with Vite-based toolchains; fast-check is the premier property-based testing library for TypeScript; Playwright supports offline testing via service worker interception; axe-core automates WCAG checks |
| **Responsibility** | Comprehensive test coverage across all layers and test types |
| **Alternatives considered** | Jest (Vitest is preferred for Vite/Next.js projects; faster), Cypress (Playwright preferred for offline/SW testing), only unit tests (insufficient for a 10-feature product) |
| **Solo developer impact** | Medium: three test frameworks have different APIs; but each handles a distinct concern |
| **Spec alignment** | ✅ Direct from spec §7.5 |

---

## TD-014 — Hosting: Vercel + Supabase

| | |
|---|---|
| **Decision** | Vercel for frontend/API deployment; Supabase for database and auth |
| **Why required** | Vercel has first-class Next.js support; free tier is sufficient for a hackathon demo; Supabase free tier covers the database and auth needs |
| **Responsibility** | Production hosting, CDN, serverless functions, database, auth |
| **Alternatives considered** | Railway (good but more setup), Fly.io (requires Docker), Netlify (Next.js support less optimal), self-hosting (too much ops for solo developer) |
| **Solo developer impact** | Positive: both services have excellent DX and free tiers |
| **Spec alignment** | ✅ Direct from spec §7.6 |

---

## TD-015 — Package Manager: pnpm

| | |
|---|---|
| **Decision** | pnpm with committed `pnpm-lock.yaml`; `--frozen-lockfile` in CI |
| **Why required** | Efficient disk usage; strict dependency isolation; lockfile prevents version drift between local and CI environments |
| **Alternatives considered** | npm (acceptable), yarn (slower, multiple versions), bun (immature for production CI) |
| **Solo developer impact** | Positive: faster installs |
| **Spec alignment** | ✅ Direct from spec §7.7 |

---

## TD-016 — Grapheme Segmentation: `Intl.Segmenter`

| | |
|---|---|
| **Decision** | Use the built-in `Intl.Segmenter` API with `{ granularity: "grapheme" }` for Hindi and mixed-language text segmentation |
| **Why required** | Devanagari script has combining characters (matras, conjuncts, half-forms) that must not be split between Teletext cells. JavaScript `.length` and string indexing are not grapheme-aware. |
| **Responsibility** | `segmentGraphemes()` function in `src/domain/layout-engine/graphemes.ts` |
| **Alternatives considered** | `grapheme-splitter` npm package (pre-`Intl.Segmenter`, now unnecessary), `unicode-segmentation` WASM (heavy overhead) |
| **Browser support** | `Intl.Segmenter` is supported in Chrome 87+, Edge 87+, Firefox 125+, Safari 14.1+. IE is not supported (acceptable for 2026). |
| **Solo developer impact** | Positive: no external dependency; built into modern runtimes |
| **Spec alignment** | ✅ Direct from spec §5.1 |

---

## TD-017 — Byte Budget Measurement: `TextEncoder`

| | |
|---|---|
| **Decision** | Use `new TextEncoder().encode(jsonString).byteLength` for exact UTF-8 byte counting |
| **Why required** | JavaScript `string.length` counts UTF-16 code units, not bytes. Hindi Devanagari characters are 3 bytes each in UTF-8. A page with significant Hindi content could be incorrectly budgeted using string length. |
| **Responsibility** | `measurePagePack()` in `src/domain/byte-budget/measure.ts` |
| **Canonical definition** | The 10,240-byte limit applies to the canonical compact JSON serialization (`JSON.stringify(pack)` with no extra whitespace) encoded as UTF-8. This must be clearly documented in the UI and README. |
| **Spec alignment** | ✅ Direct from spec §5.4, §9 |

---

## Recommended Changes to Specification

| Change ID | Specification Assumption | Analysis Finding | Recommendation |
|---|---|---|---|
| RC-001 | `runScripts: "dangerously"` risk not explicitly flagged | jsdom allows dangerous script execution if misconfigured | Explicitly document that jsdom must use `runScripts: "outside-only"` or omit runScripts entirely |
| RC-002 | Serwist presented as primary SW approach | Next.js 16 + Serwist compatibility is unverified | Add explicit fallback plan: validate at Sprint 4 start; use manual SW if needed |
| RC-003 | 10 KiB = one QR code implied | QR v40 max binary ≈ 2,953 bytes; 10 KiB will not fit | Explicitly state that multi-frame QR is required for 10 KiB payloads (P1); JSON file is P0 |
| RC-004 | Hindi layout described but not tested yet | No existing test fixtures to validate Devanagari rendering | Hindi grapheme property tests must be Sprint 1 work, not Sprint 2 |
| RC-005 | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` vs `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase may use `ANON_KEY` in some SDK versions | Verify exact env variable names against installed SDK version before committing `.env.example` |

---

*No application code exists. All decisions are forward-looking and will be validated during Sprint 0 project bootstrap.*

