# PageCast — Requirements Traceability Matrix

**Phase:** 1 — Discovery & Requirement Analysis  
**Date:** 30 October 2026  
**Source:** `01_pagecast_project_spec_kiroween_2026.md`  
**Total Requirements:** 116

> [!NOTE]
> Status key: `PENDING` = not yet implemented | `IN PROGRESS` = under active development | `DONE` = verified complete

---

## Functional Requirements (FR)

### FR — Reader and Teletext Renderer

| Req ID | Description | Priority | Source Section | Dependencies | Acceptance Criteria | Test Strategy | Sprint | Status |
|---|---|---|---|---|---|---|---|---|
| FR-001 | Render a page as a 40-column by 25-row logical grid | Must | §5.1 | TR-001, TR-002 | Validator rejects layouts with missing/extra rows/cells | Unit + property test validateGrid() | S1 | PENDING |
| FR-002 | Reserve header row (row 1) and footer/status row (row 25) | Must | §5.1 | FR-001 | Header: PageCast ID + page number + title; footer: nav/source hint | Unit test layout structure | S1 | PENDING |
| FR-003 | Direct page-number navigation | Must | §5.1 | FR-001, FR-050 | Valid page number opens matching page; unknown page shows not-found | E2E: browse page 101 | S1 | PENDING |
| FR-004 | Previous/next page navigation | Must | §5.1 | FR-003 | Navigation follows catalogue order without unexpected wrapping | E2E: arrow navigation | S1 | PENDING |
| FR-005 | Keyboard navigation | Should | §5.1 | FR-003 | Arrow keys and shortcuts work without trapping focus | Playwright + axe | S1 | PENDING |
| FR-006 | Show language, source and last-updated metadata | Must | §5.1 | FR-050, FR-022 | Metadata visible; original source link accessible | Unit test metadata rendering | S1 | PENDING |
| FR-007 | Online/offline indicator | Must | §5.1 | FR-070, FR-075 | Indicator reflects actual network state and saved-page availability | E2E: airplane-mode toggle | S4 | PENDING |
| FR-008 | Stale/offline badge for cached pages | Should | §5.1 | FR-071, FR-073 | Cached revision not presented as live update | Integration test cache state | S4 | PENDING |
| FR-009 | Fixed, documented colour palette | Must | §5.1, §13.1, §15.1 | TR-002 | Palette and colour tokens documented; covered by visual snapshots | Snapshot tests | S1 | PENDING |
| FR-010 | Preserve Unicode grapheme clusters | Must | §5.1, §13.3 | TR-003 | Hindi combining marks and conjuncts not split between logical cells | Property test with fast-check | S1 | PENDING |
| FR-011 | Text-only accessible alternative | Must | §5.1 | FR-001 | Screen reader can access title, sections, bullet points and source links | axe-core + manual NVDA/VoiceOver | S1 | PENDING |
| FR-012 | Scale to small screens | Must | §5.1, §15.3 | TR-002 | Tested at 360px, 390px, 768px and desktop widths | Playwright responsive tests | S1 | PENDING |

### FR — Article Ingestion

| Req ID | Description | Priority | Source Section | Dependencies | Acceptance Criteria | Test Strategy | Sprint | Status |
|---|---|---|---|---|---|---|---|---|
| FR-020 | Publisher submits URL for ingestion | Must | §5.2 | SEC-001, SEC-002 | Accept only http/https URLs | Unit: URL scheme validation | S2 | PENDING |
| FR-021 | Paste article text as fallback | Must | §5.2 | FR-020 | Text validated and proceeds through composition pipeline | Integration: paste-text route | S2 | PENDING |
| FR-022 | Extract title, text, site name, author, published time | Must | §5.2 | TR-004 | Missing metadata recorded as unavailable, not fabricated | Unit: Readability output schema | S2 | PENDING |
| FR-023 | Retain canonical source URL | Must | §5.2 | FR-022 | Reader can open original source in new tab | E2E: source link check | S2 | PENDING |
| FR-024 | Enforce response size, timeout and redirect limits | Must | §5.2, §10 | SEC-001 | Oversized/slow/redirecting targets rejected with clear message | Security tests: limit enforcement | S2 | PENDING |
| FR-025 | Block private, loopback, link-local and reserved IP destinations | Must | §5.2, §11.1 | SEC-001, SEC-002 | Security tests demonstrate blocked private address attempts | Security test suite | S2 | PENDING |
| FR-026 | Extractor shall not execute JavaScript from fetched pages | Must | §5.2, §11.2 | TR-004 | HTML parsing runs with script execution and remote loading disabled | Unit: jsdom config test | S2 | PENDING |
| FR-027 | User sees extracted text before AI composition | Must | §5.2 | FR-022 | User can reject or correct extracted content | E2E: extraction preview screen | S2 | PENDING |
| FR-028 | Supported-source fallback / paste-text route | Must | §5.2 | FR-021 | Failed extraction does not block creating a page from pasted text | Integration: fallback flow | S2 | PENDING |

### FR — AI Bulletin Composition

| Req ID | Description | Priority | Source Section | Dependencies | Acceptance Criteria | Test Strategy | Sprint | Status |
|---|---|---|---|---|---|---|---|---|
| FR-030 | Generate structured bulletin from extracted text | Must | §5.3, §12 | FR-022, TR-005 | Output conforms to versioned Zod schema | Unit: Zod validation of AI output | S2 | PENDING |
| FR-031 | Bulletin contains title, summary and key points | Must | §5.3 | FR-030 | Required fields present and pass length/layout validation | Unit: required field checks | S2 | PENDING |
| FR-032 | Each key point includes source evidence references | Must | §5.3, §12.4 | FR-030, FR-022 | Every sourceSentenceId maps to sentence in extracted source set | Unit: sentence ID validation | S2 | PENDING |
| FR-033 | AI shall not add unsupported names/dates/stats/quotes | Must | §5.3, §12.3 | FR-032 | Unsupported references fail validation or flagged for review | Property test: grounding check | S2 | PENDING |
| FR-034 | Publisher reviews and approves AI output before publication | Must | §5.3, §8.1 | FR-062, FR-065 | Publish API rejects AI drafts without recorded human approval | Integration: publish gate test | S3 | PENDING |
| FR-035 | Support English and Hindi output | Must | §5.3, §5.1 | TR-003, FR-010 | Both locales pass language, layout and byte-budget tests | Unit + integration: bilingual tests | S2 | PENDING |
| FR-036 | Hindi translations labelled as AI-assisted | Must | §5.3 | FR-035 | Reader can identify generated translation and open source | E2E: Hindi page label check | S2 | PENDING |
| FR-037 | Deterministic fallback when AI provider unavailable | Must | §5.3, §12.5 | FR-021 | Extractive/manual composition can still produce a page | Integration: AI-unavailable scenario | S2 | PENDING |
| FR-038 | AI model/provider configurable by environment variable | Must | §5.3, §17 | NFR-006 | Provider/model changes do not require renderer/domain changes | Unit: env-var config test | S2 | PENDING |
| FR-039 | AI prompt treats article content as untrusted data | Must | §5.3, §11.2, §12.3 | SEC-003 | Prompt injection in source text cannot cause tool execution or change system instructions | Security test: prompt injection | S2 | PENDING |
| FR-040 | Composition process stores model/provider and generation metadata | Should | §5.3 | FR-030 | Draft records include provider, model ID, prompt version and generated timestamp | Integration: metadata persistence | S2 | PENDING |

### FR — Page Layout and PagePack Budget

| Req ID | Description | Priority | Source Section | Dependencies | Acceptance Criteria | Test Strategy | Sprint | Status |
|---|---|---|---|---|---|---|---|---|
| FR-050 | Convert approved bulletin into 40×25 logical grid | Must | §5.4, §13 | FR-001, TR-001 | Every published page passes validateGrid() | Unit + property tests | S1 | PENDING |
| FR-051 | Calculate serialized PagePack size in UTF-8 bytes | Must | §5.4 | TR-001 | Uses TextEncoder against canonical compact JSON serialization | Unit: byte counter test | S1 | PENDING |
| FR-052 | PagePack shall not exceed 10,240 bytes | Must | §5.4, §2.3 | FR-051 | Publish action disabled/rejected when over limit | Integration: over-budget rejection | S3 | PENDING |
| FR-053 | UI shows exact bytes used and remaining | Must | §5.4 | FR-051 | Example: "7,842 / 10,240 bytes" displayed live | E2E: byte meter visible | S3 | PENDING |
| FR-054 | Controlled compacting pass when content too large | Should | §5.4 | FR-052, FR-037 | Content shortened using new draft version; no silent truncation | Integration: compact flow | S3 | PENDING |
| FR-055 | Renderer shall have a version identifier | Must | §5.4, §9.1 | TR-001 | Stored page can be rendered with documented renderer version | Unit: renderer version test | S1 | PENDING |
| FR-056 | PagePack includes source and language metadata | Must | §5.4, §9.1 | FR-022, FR-035 | Required metadata survives export/import | Integration: export/import round-trip | S4 | PENDING |

### FR — Publishing Workflow

| Req ID | Description | Priority | Source Section | Dependencies | Acceptance Criteria | Test Strategy | Sprint | Status |
|---|---|---|---|---|---|---|---|---|
| FR-060 | Publisher authenticates before creating/publishing public pages | Must | §5.5, §9.3 | SEC-004, TR-006 | Unauthenticated requests cannot publish | Integration: auth gate test | S3 | PENDING |
| FR-061 | Publisher can save a draft | Must | §5.5 | FR-060 | Draft is private and editable | Integration: draft save test | S3 | PENDING |
| FR-062 | Publisher can edit generated title, summary and bullet points | Must | §5.5 | FR-061, FR-034 | Changes validated and reflected in preview | E2E: editor flow | S3 | PENDING |
| FR-063 | Publisher chooses page number from available range (100–899) | Must | §5.5, §9.2 | FR-060 | Duplicate published numbers are prevented | Unit: page number uniqueness | S3 | PENDING |
| FR-064 | Publisher can preview page before publication | Must | §5.5 | FR-050, FR-051 | Preview uses production renderer and byte counter | E2E: preview check | S3 | PENDING |
| FR-065 | Publisher can publish only valid, reviewed pages | Must | §5.5, §8.1 | FR-034, FR-052, FR-060 | Server validates auth, schema, grid, budget, source and approval state | Integration: publish gate | S3 | PENDING |
| FR-066 | Publisher can unpublish or archive a page | Should | §5.5 | FR-065 | Archived pages disappear from public catalogue but retain audit metadata | Integration: archive test | S3 | PENDING |
| FR-067 | Each update creates a new page revision | Should | §5.5 | FR-061 | Previous revision identifiable and comparable | Integration: revision test | S3 | PENDING |

### FR — Offline Reading and PWA

| Req ID | Description | Priority | Source Section | Dependencies | Acceptance Criteria | Test Strategy | Sprint | Status |
|---|---|---|---|---|---|---|---|---|
| FR-070 | Reader can install PageCast as a PWA | Must | §5.6, §14 | TR-007 | Valid manifest, icons, start URL and service worker | Manual PWA install test | S4 | VERIFIED |
| FR-071 | Reader can explicitly save a published PagePack locally | Must | §5.6 | TR-008 | Page metadata and content persist in IndexedDB | Integration: IndexedDB save | S4 | VERIFIED |
| FR-072 | Reader can open a saved page while offline | Must | §5.6 | FR-071 | No network request required for saved page's content | E2E: airplane-mode test | S4 | VERIFIED |
| FR-073 | Application shows which pages are saved | Must | §5.6 | FR-071 | Saved state remains after reload/restart | Integration: state persistence | S4 | VERIFIED |
| FR-074 | Reader can remove a saved page | Must | §5.6 | FR-071 | Local record deleted and UI updates | Integration: delete test | S4 | VERIFIED |
| FR-075 | Service worker caches only app shell and safe static resources | Must | §5.6, §14.2 | SEC-005 | No auth/session responses or publisher drafts in shared cache | Security test: cache inspection | S4 | VERIFIED |
| FR-076 | Reader informed when page unavailable offline | Must | §5.6 | FR-007 | Clear empty/offline state; no false success message | E2E: offline missing page test | S4 | VERIFIED |
| FR-077 | Saved page data shall be versioned | Should | §5.6 | FR-071 | App can migrate or invalidate old local records safely | Unit: schema migration test | S4 | VERIFIED |

### FR — QR Sharing and Import

| Req ID | Description | Priority | Source Section | Dependencies | Acceptance Criteria | Test Strategy | Sprint | Status |
|---|---|---|---|---|---|---|---|---|
| FR-080 | Generate QR code for a public page URL | Must | §5.7, §14.3 | TR-009 | Scanning opens the public page when internet is available | Manual QR scan test | S4 | VERIFIED |
| FR-081 | Export PagePack as downloadable JSON file | Must | §5.7 | FR-056 | Exported file can be imported and validated | Integration: export/import test | S4 | VERIFIED |
| FR-082 | Multi-frame QR export/import (P1) | Should | §5.7, §14.3 | FR-081, TR-009 | Sequence frames contain bundle ID, index, total count, chunk data and integrity metadata | Integration: multi-frame QR test | S4 | VERIFIED |
| FR-083 | Importer rejects incomplete or altered bundles | Should | §5.7 | FR-082 | Final SHA-256 digest must match before saving | Unit: digest validation | S4 | VERIFIED |
| FR-084 | Importer rejects untrusted or unsupported PagePack versions | Should | §5.7 | FR-082, TR-001 | No page stored until schema, digest and size checks pass | Unit: import validation | S4 | VERIFIED |
| FR-085 | QR import shall not automatically execute links or scripts | Must | §5.7 | SEC-006 | Imported content rendered as text using safe renderer | Security test: QR import safety | S4 | VERIFIED |

---

## Non-Functional Requirements (NFR)

| Req ID | Area | Description | Priority | Source Section | Dependencies | Acceptance Criteria | Test Strategy | Sprint | Status |
|---|---|---|---|---|---|---|---|---|---|
| NFR-001 | Performance | Public reader renders saved PagePack in under 200 ms locally | Should | §6 | FR-001, FR-072 | Measured locally on mid-range hardware | Performance profiling | S5 | PENDING |
| NFR-002 | Performance | LCP ≤ 2.5 s on mobile 4G profile | Should | §6 | NFR-003 | Record actual Lighthouse results | Lighthouse CI | S5 | PENDING |
| NFR-003 | Bundle size | Reader JS ≤ 200 KiB gzip for initial reader route | Should | §6 | TR-001 | Measured at build time | Bundle analyzer | S5 | PENDING |
| NFR-004 | Payload | Published PagePack ≤ 10,240 UTF-8 bytes | Must | §6 | FR-052 | TextEncoder measurement | Automated budget check | S1/S3 | PENDING |
| NFR-005 | Reliability | Core saved-page reading must not depend on AI/DB/network after save | Must | §6 | FR-072 | Offline read passes without network | E2E: airplane mode | S4 | VERIFIED |
| NFR-006 | Security | Never expose AI provider secrets in browser bundles | Must | §6, §17 | SEC-004 | No secrets in client JS source maps | CI: secret scan | S0 | PENDING |
| NFR-007 | Security | URL ingestion must resist SSRF | Must | §6, §11.1 | SEC-001, SEC-002 | Security test suite passes | Security tests | S2 | PENDING |
| NFR-008 | Security | Treat all imported article text and PagePacks as untrusted | Must | §6, §11.2 | SEC-003, SEC-006 | Validation + safe rendering | Security tests | S2/S4 | PENDING |
| NFR-009 | Security | Server-side authorization and database RLS | Must | §6, §9.3 | SEC-004 | RLS tested with direct API calls | Integration: RLS tests | S3 | PENDING |
| NFR-010 | Privacy | Minimum data collection; no reader account for basic use | Must | §6 | — | No reader PII collected for browsing/saving | Privacy review | S3 | PENDING |
| NFR-011 | Accessibility | WCAG 2.2 AA on controls, navigation, forms and admin | Should | §6, §2.3 | FR-011 | No critical axe findings on main flows | axe-core + manual | S1/S5 | PENDING |
| NFR-012 | Compatibility | Test Chrome, Edge desktop, Android Chrome, iOS Safari | Should | §6, §20.5 | — | Manual test matrix completed | Manual test matrix | S5 | PENDING |
| NFR-013 | Maintainability | Domain logic independent of React components | Must | §6, §16 | TR-001 | Domain tests run without React | Unit tests pass without DOM | S1 | PENDING |
| NFR-014 | Observability | Structured server errors without storing unnecessary private content | Should | §6 | — | Errors logged with request IDs; no full article content | Code review | S5 | PENDING |
| NFR-015 | Availability | Public demo stable during judging | Must | §6, §21 | TR-010 | App reachable; fallback static demo content available | Pre-submission check | S6 | PENDING |
| NFR-016 | Localization | English and Hindi labels/content do not break grid or keyboard | Must | §6, §5.1 | FR-010, FR-035 | Both languages pass layout tests | Bilingual layout tests | S1/S2 | PENDING |
| NFR-017 | Determinism | Same PagePack + renderer version = same logical grid | Must | §6, §13.4 | FR-050, FR-055 | Property test P4 passes | fast-check determinism property | S1 | PENDING |
| NFR-018 | Legal | Attribute sources; avoid republishing full copyrighted articles | Must | §6, §11.3 | FR-023 | Source attribution visible; no full article reproduction | Manual legal review | S3/S6 | PENDING |

---

## UI/UX Requirements (UXR)

| Req ID | Description | Priority | Source Section | Dependencies | Acceptance Criteria | Test Strategy | Sprint | Status |
|---|---|---|---|---|---|---|---|---|
| UXR-001 | Landing / Reader Home screen — explain PageCast and show featured pages | Must | §15.2 | FR-003 | At least 3 featured pages shown on load | E2E: home screen | S1 | PENDING |
| UXR-002 | Teletext Reader screen — browse page by number | Must | §15.2 | FR-001, FR-003 | 40×25 grid visible; page number input functional | E2E: reader screen | S1 | PENDING |
| UXR-003 | Catalogue screen — browse pages by category/language | Must | §15.2 | FR-004 | Pages browsable by category/language | E2E: catalogue | S1 | PENDING |
| UXR-004 | Saved Pages screen — manage local offline collection | Must | §15.2 | FR-071, FR-074 | Saved pages listed; remove action works | E2E: saved pages | S4 | PENDING |
| UXR-005 | Publisher Sign-in screen | Must | §15.2 | FR-060 | Publisher can sign in securely | E2E: auth flow | S3 | PENDING |
| UXR-006 | Publisher Dashboard — drafts and published pages | Must | §15.2 | FR-061 | Drafts and published pages listed | E2E: dashboard | S3 | PENDING |
| UXR-007 | Source Import screen — URL/paste input and extraction preview | Must | §15.2 | FR-020, FR-027 | User sees extracted content before AI composition | E2E: import flow | S2 | PENDING |
| UXR-008 | Bulletin Composer — AI draft, edit and language selection | Must | §15.2 | FR-030, FR-062 | Editor can modify all fields; language selector functional | E2E: composer | S2 | PENDING |
| UXR-009 | Teletext Preview — actual 40×25 grid and byte budget meter | Must | §15.2 | FR-050, FR-053 | Live preview shows correct grid; byte counter updates | E2E: preview screen | S3 | PENDING |
| UXR-010 | Publish Confirmation — validate source, approval and budget | Must | §15.2 | FR-065 | All validation gates shown before publish button active | E2E: publish confirmation | S3 | PENDING |
| UXR-011 | Share / QR screen — link QR, JSON export and later animated QR | Must/Should | §15.2 | FR-080, FR-081 | QR generated; JSON download works | E2E: share screen | S4 | VERIFIED |
| UXR-012 | Offline / Error States — unavailable network/content and recovery | Must | §15.2 | FR-076 | Clear offline/error messages; no false success | E2E: offline states | S4 | VERIFIED |
| UXR-013 | Help / About screen — explain Teletext concept, limits and sources | Should | §15.2 | — | Content policy reachable; limitations explained | Manual review | S5 | PENDING |
| UXR-014 | Dark charcoal/near-black shell with high-contrast Teletext palette | Must | §15.1 | FR-009 | Palette tokens applied consistently | Visual snapshot | S1 | PENDING |
| UXR-015 | Monospace headlines and page numbers | Must | §15.1 | TR-011 | Noto Sans Mono applied to grid | Visual inspection | S1 | PENDING |
| UXR-016 | CRT texture optional (disable under reduced-motion preference) | Could | §15.1 | NFR-011 | prefers-reduced-motion respected | Manual + axe | S5 | PENDING |
| UXR-017 | Responsive layout — publisher editor stacks on mobile | Must | §15.3 | FR-012 | Publisher editor usable at 360px width | Playwright responsive | S3 | PENDING |
| UXR-018 | No excessive scanline flicker or flashing | Must | §15.1 | NFR-011 | No WCAG 2.3.1 violations | Manual check | S1 | PENDING |

---

## Technical Requirements (TR)

| Req ID | Description | Priority | Source Section | Dependencies | Acceptance Criteria | Test Strategy | Sprint | Status |
|---|---|---|---|---|---|---|---|---|
| TR-001 | PagePackV1 TypeScript type and Zod schema | Must | §9.1, §7.1 | — | Schema compiles; Zod validates/rejects test fixtures | Unit tests | S1 | PENDING |
| TR-002 | Teletext grid component — pure React renderer | Must | §7.1, §13 | TR-001 | Renders 40×25 grid from PagePack | Visual + unit | S1 | PENDING |
| TR-003 | `segmentGraphemes()` using Intl.Segmenter | Must | §5.1, §13.3 | — | Hindi conjuncts not split; property tests pass | Unit + property | S1 | PENDING |
| TR-004 | Mozilla Readability + jsdom integration (scripts disabled) | Must | §7.3, §11.2 | SEC-001 | Extracts article content without executing scripts | Unit: extraction test | S2 | PENDING |
| TR-005 | Vercel AI SDK with configurable provider/model | Must | §7.3, §17 | NFR-006 | AI integration swappable via env vars | Integration test | S2 | PENDING |
| TR-006 | Supabase Auth + `@supabase/ssr` cookie-based auth | Must | §7.2, §9.3 | — | Server-side session verification | Integration: auth | S3 | PENDING |
| TR-007 | Web App Manifest + Service Worker (Serwist or manual) | Must | §7.4, §14 | — | PWA installable; app shell cached | Manual PWA test | S4 | VERIFIED |
| TR-008 | Dexie.js over IndexedDB for typed PagePack persistence | Must | §7.4, §14.1 | TR-001 | Pages saved and retrieved offline | Integration: Dexie tests | S4 | VERIFIED |
| TR-009 | `qrcode` for QR generation; `@zxing/browser` for scanning | Must/Should | §7.4 | FR-080 | QR generated and scannable | Manual QR test | S4 | VERIFIED |
| TR-010 | Vercel deployment + GitHub Actions CI | Must | §7.6, §21 | — | CI runs lint/typecheck/test/build; deployment live | CI green | S5 | PENDING |
| TR-011 | Noto Sans Mono / Noto Sans Devanagari fonts | Must | §7.1 | FR-010 | Both font families loaded; grid renders correctly | Visual + unit | S1 | PENDING |
| TR-012 | `TextEncoder` byte measurement for PagePack | Must | §5.4, §9.1 | TR-001 | Byte count matches spec definition exactly | Unit: byte counter | S1 | PENDING |
| TR-013 | Zod validation on all API route inputs | Must | §10 | TR-001 | Invalid requests rejected with typed error codes | Integration: API validation | S3 | PENDING |
| TR-014 | Rate limiting on extraction and AI generation endpoints | Must | §10, §19-S5 | TR-013 | Repeated rapid calls are rejected | Integration: rate limit | S5 | PENDING |
| TR-015 | Web Crypto SHA-256 for PagePack import integrity | Should | §7.4, §14.3 | FR-083 | Digest matches before saving imported pack | Unit: hash verification | S4 | VERIFIED |
| TR-016 | Domain layer (`src/domain/`) free of React/Next.js/Supabase imports | Must | §16, §8.1 | TR-001 | Domain tests run in Node without any framework | Unit tests in pure Node | S1 | PENDING |
| TR-017 | TypeScript strict mode + ESLint + Prettier | Must | §7.5, §16 | — | tsc --noEmit passes; lint clean | CI checks | S0 | PENDING |
| TR-018 | pnpm with committed lockfile; frozen-lockfile CI installs | Must | §7.7 | — | CI installs from lockfile without updates | CI verification | S0 | PENDING |
| TR-019 | Next.js App Router with versioned API routes under `/api/v1` | Must | §7.1, §10 | — | All routes follow contract; versioned | Integration | S3 | PENDING |
| TR-020 | `CompressionStream` for optional QR payload compression | Could | §7.4 | FR-082 | Compressed output smaller than uncompressed | Unit: compression | S4 | PENDING |

---

## Security and Privacy Requirements (SEC)

| Req ID | Description | Priority | Source Section | Dependencies | Acceptance Criteria | Test Strategy | Sprint | Status |
|---|---|---|---|---|---|---|---|---|
| SEC-001 | Block private/loopback/link-local/reserved IPs in URL fetcher | Must | §11.1, §5.2 | FR-025 | All private address classes blocked; tested | Security test suite | S2 | PENDING |
| SEC-002 | Resolve DNS and re-check on every redirect (max 3) | Must | §11.1 | SEC-001 | DNS rebinding and redirect-to-private attacks blocked | Security tests | S2 | PENDING |
| SEC-003 | Treat article HTML/text as untrusted; prevent prompt injection | Must | §11.2, §12.3 | FR-039 | Injected instructions in source text ignored by model | Security tests | S2 | PENDING |
| SEC-004 | Server-only secrets: AI keys + Supabase service-role key | Must | §11, §17, §9.3 | NFR-006 | No secrets in client bundles or NEXT_PUBLIC_ vars | CI: secret scan | S0 | PENDING |
| SEC-005 | Service worker does not cache auth/session/draft responses | Must | §14.2, §5.6 | FR-075 | Cache inspection shows only public static resources | Security test: SW cache | S4 | VERIFIED |
| SEC-006 | QR import content rendered as safe text, not executed | Must | §5.7, §11.2 | FR-085 | No script execution from imported content | Security test: QR import | S4 | VERIFIED |
| SEC-007 | Supabase Row Level Security enabled and tested | Must | §9.3, §7.2 | NFR-009 | RLS blocks unauthorized access via direct API calls | Integration: RLS tests | S3 | PENDING |
| SEC-008 | Request body size limits on all API endpoints | Must | §10 | TR-013 | Oversized requests rejected before processing | Unit: request size | S3 | PENDING |
| SEC-009 | No full article text stored long-term in database | Should | §9.2, §11.3 | NFR-010 | Source sentences stored as hashes/short excerpts only | Database schema review | S3 | PENDING |
| SEC-010 | Secure headers and CSP where compatible | Should | §19-S5 | — | CSP header present; no unsafe-eval or unsafe-inline | Security audit | S5 | PENDING |
| SEC-011 | Takedown/contact process and content policy page | Should | §11.3, §21 | — | Content policy reachable before public launch | Manual review | S5 | PENDING |
| SEC-012 | Article fetch: accept only HTML/plain-text content types | Must | §11.1 | FR-024 | Non-HTML responses rejected | Security test: content type | S2 | PENDING |
| SEC-013 | Do not forward cookies/auth headers to fetched article URLs | Must | §11.1 | FR-025 | Outbound fetch carries no internal auth | Code review | S2 | PENDING |

---

## Performance Requirements (PERF)

| Req ID | Description | Priority | Source Section | Acceptance Criteria | Test Strategy | Sprint | Status |
|---|---|---|---|---|---|---|---|
| PERF-001 | PagePack render time < 200 ms (local, mid-range device) | Should | §6/NFR-001 | Measured and recorded locally | Performance profiling | S5 | PENDING |
| PERF-002 | LCP ≤ 2.5 s on simulated mobile 4G | Should | §6/NFR-002 | Lighthouse score recorded | Lighthouse CI | S5 | PENDING |
| PERF-003 | Initial reader route JS ≤ 200 KiB gzip | Should | §6/NFR-003 | Bundle analyzer report | Build analysis | S5 | PENDING |
| PERF-004 | Article fetch timeout: 8 seconds max | Must | §10, §17 | Requests over 8 s aborted | Unit: timeout test | S2 | PENDING |
| PERF-005 | Article fetch max response: 2 MiB | Must | §10, §17 | Oversized responses rejected | Unit: size limit test | S2 | PENDING |
| PERF-006 | Published PagePack ≤ 10,240 UTF-8 bytes | Must | §5.4/NFR-004 | TextEncoder measurement passes | Automated + unit | S1/S3 | PENDING |

---

## Testing Requirements (TEST)

| Req ID | Description | Priority | Source Section | Dependencies | Acceptance Criteria | Sprint | Status |
|---|---|---|---|---|---|---|---|
| TEST-001 | Vitest unit tests for all domain logic | Must | §7.5, §20.1 | TR-016 | All domain tests pass in CI | S1 | PENDING |
| TEST-002 | fast-check property tests for grid invariants P1–P8 | Must | §7.5, §13.4 | TR-003 | P1–P8 properties pass with 10,000 generated cases | S1 | PENDING |
| TEST-003 | Playwright E2E tests for E2E-01 through E2E-06 | Must | §7.5, §20.4 | — | All defined E2E scenarios pass | S5 | PENDING |
| TEST-004 | axe-core accessibility tests on main flows | Must | §7.5, §2.3 | NFR-011 | No critical automated findings | S5 | PENDING |
| TEST-005 | Security test suite: URL validation, SSRF, XSS regression | Must | §7.5, §20.3 | SEC-001..SEC-013 | All security tests pass | S2/S5 | PENDING |
| TEST-006 | Manual test matrix (Chrome, Edge, Android, iOS) | Should | §20.5 | — | Matrix completed before submission | S5 | PENDING |
| TEST-007 | Lighthouse/performance measurement with recorded results | Should | §7.5, §6 | PERF-001..003 | Actual numbers recorded (not assumed) | S5 | PENDING |
| TEST-008 | CI runs lint, typecheck, unit/property tests and build | Must | §7.5, §7.6 | TR-017 | CI green on all branches | S0 | PENDING |
| TEST-009 | PagePack byte-budget regression suite | Must | §13.4/P6 | FR-052 | Over-budget pack always rejected | S1/S3 | PENDING |
| TEST-010 | Hindi grapheme split property test | Must | §13.4/P3 | TR-003 | No grapheme cluster split in any generated layout | S1 | PENDING |
| TEST-011 | Deterministic rendering property test | Must | §13.4/P4 | FR-017, FR-055 | Same input + renderer version = same grid output | S1 | PENDING |
| TEST-012 | Integration tests for full pipeline: URL→draft→publish→read | Must | §20.3 | All FR | Pipeline tests pass end-to-end | S3/S5 | PENDING |
| TEST-013 | Offline read after save — Playwright with service-worker intercept | Must | §20.4/E2E-04 | FR-072 | Saved page readable after network disable | S4 | VERIFIED |
| TEST-014 | Import integrity test — SHA-256 mismatch rejection | Should | §20.4/E2E-06 | FR-083 | Altered pack rejected on import | S4 | VERIFIED |

---

## Kiro Development Requirements (KIRO)

| Req ID | Description | Priority | Source Section | Acceptance Criteria | Sprint | Status |
|---|---|---|---|---|---|---|
| KIRO-001 | Create `.kiro/specs/01-product-foundation/` spec | Must | §18.1 | Personas, goals, scope, acceptance criteria | S0 | PENDING |
| KIRO-002 | Create `.kiro/specs/02-teletext-renderer/` spec | Must | §18.1 | 40×25 model, palette, Unicode layout, renderer, PBT | S1 | PENDING |
| KIRO-003 | Create `.kiro/specs/03-source-ingestion-ai/` spec | Must | §18.1 | URL safety, extraction, AI schema and fallback | S2 | PENDING |
| KIRO-004 | Create `.kiro/specs/04-publisher-workflow/` spec | Must | §18.1 | Auth, drafts, review, budget validation, publishing | S3 | PENDING |
| KIRO-005 | Create `.kiro/specs/05-offline-pwa/` spec | Must | §18.1 | Manifest, service worker, Dexie, save/remove | S4 | PENDING |
| KIRO-006 | Create `.kiro/specs/06-qr-sharing/` spec | Must | §18.1 | Public link QR, PagePack export/import, multi-frame QR | S4 | PENDING |
| KIRO-007 | Create `.kiro/steering/product.md` | Must | §18.2 | Product promise, goals, 10 KiB budget, human review | S0 | PENDING |
| KIRO-008 | Create `.kiro/steering/architecture.md` | Must | §18.2 | Next.js boundaries, domain/server/client, DB/API, offline | S0 | PENDING |
| KIRO-009 | Create `.kiro/steering/coding-standards.md` | Must | §18.2 | TypeScript strict, no any, small functions, Zod, a11y | S0 | PENDING |
| KIRO-010 | Create `.kiro/steering/security.md` | Must | §18.2 | SSRF, no client secrets, prompt injection, safe rendering, RLS | S0 | PENDING |
| KIRO-011 | Create `.kiro/steering/teletext-domain.md` | Must | §18.2 | 40×25 rules, grapheme behavior, palette, PagePack versioning | S0 | PENDING |
| KIRO-012 | Create `.kiro/steering/testing.md` | Must | §18.2 | Required tests per feature, PBT invariants, E2E scenarios | S0 | PENDING |
| KIRO-013 | Create `lint-on-save` hook | Must | §18.3 | ESLint runs on TypeScript/TSX file save | S0 | PENDING |
| KIRO-014 | Create `renderer-tests` hook | Must | §18.3 | Layout-engine tests run on domain/layout-engine changes | S1 | PENDING |
| KIRO-015 | Create `page-budget` hook | Must | §18.3 | Budget regression tests run on PagePack serialization changes | S1 | PENDING |
| KIRO-016 | Create `pre-submit-check` hook | Must | §18.3 | Lint + typecheck + unit/PBT + build + selected E2E before release | S5 | PENDING |
| KIRO-017 | Maintain `docs/kiro-usage-log.md` throughout development | Must | §18.5 | Log entries for every Kiro tool use with actual results | S0–S6 | PENDING |
| KIRO-018 | Optional: PageCast MCP server (after core app works) | Could | §18.4 | validate_page_grid, measure_pagepack_bytes, etc. | S5+ | PENDING |

---

## Kiroween Submission Requirements (SUB)

| Req ID | Description | Priority | Source Section | Acceptance Criteria | Sprint | Status |
|---|---|---|---|---|---|---|
| SUB-001 | Public GitHub repository with open-source LICENSE | Must | §7.6, §26 | Repository public and licensed before deadline | S6 | PENDING |
| SUB-002 | `.kiro/` directory committed and not in .gitignore | Must | §19-S6, §26 | Kiro files present in public repo | S6 | PENDING |
| SUB-003 | Demo YouTube video under 3 minutes, public | Must | §23, §26 | Video public; follows demo script; under 3 min | S6 | PENDING |
| SUB-004 | Live public deployment stable during judging | Must | §21, §26 | App accessible; demo content available | S6 | PENDING |
| SUB-005 | Complete Devpost submission with all fields | Must | §24 | Category: Resurrection; all fields complete | S6 | PENDING |
| SUB-006 | Kiro usage write-up reflects actual development use | Must | §18.5, §24 | Specific examples from kiro-usage-log.md | S6 | PENDING |
| SUB-007 | At least 5 seeded demo pages in reader | Must | §19-S1, §26 | 5+ pages browsable in public app | S1 | PENDING |
| SUB-008 | Request Kiro credit grant before 1 Dec 2026 PT deadline | Must | §22 | Form submitted with correct Kiro User ID | by 1 Dec | PENDING |
| SUB-009 | README with setup, architecture, limitations and demo credentials | Must | §19-S6 | README complete; setup works from clean clone | S6 | PENDING |
| SUB-010 | SECURITY.md present | Should | §16 | Security contact and takedown process described | S5 | PENDING |

---

*Total requirements identified: 116 (FR: 38, NFR: 18, UXR: 18, TR: 20, SEC: 13, PERF: 6, TEST: 14, KIRO: 18, SUB: 10)*

