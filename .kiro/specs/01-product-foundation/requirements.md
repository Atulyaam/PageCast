# PageCast Specification: 01 Product Foundation — Requirements

**Document:** Product Foundation Requirements Specification  
**Spec ID:** `SPEC-01-REQ`  
**Traceability Source:** `docs/REQUIREMENTS_TRACEABILITY.md` & `01_pagecast_project_spec_kiroween_2026.md`  
**Status:** Approved  

---

## 1. Overview & Syntax Guide

Requirements in this document follow the **EARS** (Easy Approach to Requirements Syntax) framework:
- **Ubiquitous:** The system SHALL `<behavior>`
- **Event-driven:** WHEN `<trigger>`, the system SHALL `<behavior>`
- **State-driven:** WHILE `<state>`, the system SHALL `<behavior>`
- **Unwanted behavior:** IF `<condition/failure>`, THEN the system SHALL `<behavior>`
- **Optional feature:** WHERE `<feature is enabled>`, the system SHALL `<behavior>`

---

## 2. Functional Requirements (FR)

### 2.1 Reader & Teletext Renderer
- **FR-001 (Ubiquitous):** The system SHALL render each Teletext page as a strict 40-column by 24/25-row logical grid of character cells.
- **FR-002 (Ubiquitous):** The system SHALL reserve Row 0 for standard broadcast header information (Page number, service identifier, live date/time) and the footer row for navigation aids.
- **FR-003 (Event-driven):** WHEN a user dials a 3-digit page number (100–899), the system SHALL navigate to and render the requested page.
- **FR-004 (Event-driven):** WHEN a user triggers previous/next navigation or arrow keys, the system SHALL transition sequentially through available pages in catalogue order.
- **FR-005 (Event-driven):** WHEN keyboard events are detected, the system SHALL support number keys `0`–`9`, `F1`–`F4` (or `1`–`4`) for Fastext, and `Escape` for Page 100 without trapping keyboard focus.
- **FR-006 (Ubiquitous):** The system SHALL render language, publication timestamp, source attribution, and canonical link metadata for every displayed page.
- **FR-007 (State-driven):** WHILE offline or on metered networks, the system SHALL present an active connection status indicator reflecting network and local cache state.
- **FR-008 (State-driven):** WHILE reading a cached or offline page, the system SHALL display a clear offline/cached badge rather than presenting stale data as live.
- **FR-009 (Ubiquitous):** The system SHALL render content using only the 8 documented standard Teletext broadcast colors (Black, White, Red, Green, Yellow, Blue, Magenta, Cyan).
- **FR-010 (Ubiquitous):** The system SHALL preserve Unicode grapheme clusters without severing Hindi/Devanagari combining marks or conjuncts across cell boundaries.
- **FR-011 (Ubiquitous):** The system SHALL provide an accessible screen-reader transcript (`sr-only`) containing the complete semantic linear representation of the page.
- **FR-012 (State-driven):** WHILE viewport dimensions scale from 360px mobile viewports to desktop 4K monitors, the system SHALL maintain the 40×24 aspect ratio and legibility.

### 2.2 Article Ingestion
- **FR-020 (Event-driven):** WHEN a publisher inputs a URL for article ingestion, the system SHALL validate the URL protocol and reject non-HTTP/HTTPS schemes.
- **FR-021 (Event-driven):** WHEN URL ingestion fails or is unavailable, the system SHALL provide a raw article text pasting fallback.
- **FR-022 (Event-driven):** WHEN an article is fetched, the system SHALL extract the title, main text body, site name, author, and publication timestamp without hallucinating missing fields.
- **FR-023 (Ubiquitous):** The system SHALL preserve canonical source URLs and provide visible attribution.
- **FR-024 (Unwanted behavior):** IF a target URL exceeds 2 MB, takes longer than 10 seconds, or initiates more than 3 redirects, THEN the system SHALL abort the request with a descriptive error.
- **FR-025 (Unwanted behavior):** IF a target URL resolves to loopback (`127.0.0.1`), private RFC 1918 subnets, link-local, or cloud metadata endpoints (`169.254.169.254`), THEN the system SHALL immediately reject the request.
- **FR-026 (Ubiquitous):** The article extractor SHALL NOT execute client JavaScript or load remote sub-resources from fetched pages.
- **FR-027 (Event-driven):** WHEN article extraction completes, the system SHALL display the raw extracted text to the publisher for review prior to AI composition.
- **FR-028 (Optional feature):** WHERE extraction heuristics fail, the publisher SHALL be able to manually refine extracted text before triggering AI layout.

### 2.3 AI Bulletin Composition
- **FR-030 (Event-driven):** WHEN extracted text is submitted to the AI composer, the system SHALL generate a structured Teletext bulletin conforming to a versioned Zod schema.
- **FR-031 (Ubiquitous):** The generated bulletin SHALL contain a concise headline, summary, and bulleted key points tailored for 40-character line wrapping.
- **FR-032 (Ubiquitous):** Every generated bullet point SHALL reference verified source sentence IDs from the extracted article.
- **FR-033 (Unwanted behavior):** IF the AI model introduces unsupported names, dates, facts, or quotes absent from source text, THEN the system SHALL flag the output for publisher correction.
- **FR-034 (Event-driven):** WHEN an AI draft is created, the system SHALL require explicit human publisher review and approval before publishing.
- **FR-035 (Ubiquitous):** The system SHALL support both English and Hindi Teletext generation.
- **FR-036 (State-driven):** WHILE displaying Hindi translated pages, the system SHALL visibly label the bulletin as an AI-assisted translation.
- **FR-037 (Unwanted behavior):** IF the external AI provider is unreachable or returns an error, THEN the system SHALL trigger a deterministic algorithmic extractive fallback.
- **FR-038 (Ubiquitous):** The AI model and provider SHALL be configurable via environment variables without requiring code changes to the layout engine.
- **FR-039 (Ubiquitous):** The AI prompt template SHALL treat article content as untrusted data encapsulated within boundary tokens to prevent prompt injection.
- **FR-040 (Ubiquitous):** The system SHALL record AI generation metadata (provider, model ID, prompt version, timestamp) with each generated draft.

### 2.4 Page Layout & PagePack Budget
- **FR-050 (Event-driven):** WHEN a bulletin is approved, the layout engine SHALL wrap and map text into 40-character rows conforming to the 40×24 Teletext canvas.
- **FR-051 (Ubiquitous):** The system SHALL calculate the exact serialized PagePack size in UTF-8 bytes using `TextEncoder`.
- **FR-052 (Unwanted behavior):** IF the serialized PagePack size exceeds 5,120 bytes (or maximum hard limit 10,240 bytes), THEN the system SHALL disable publication and alert the publisher.
- **FR-053 (State-driven):** WHILE in the publisher editor, the system SHALL display a live byte-meter showing bytes used and remaining.
- **FR-054 (Optional feature):** WHERE content exceeds the byte budget, the system SHALL offer an automated single-pass compacting optimization.
- **FR-055 (Ubiquitous):** Every published PagePack SHALL include a documented renderer version identifier.
- **FR-056 (Ubiquitous):** Exported PagePacks SHALL retain full source attribution and language metadata.

### 2.5 Publishing Workflow
- **FR-060 (Event-driven):** WHEN a user attempts to publish a page, the system SHALL verify active publisher authentication.
- **FR-061 (Event-driven):** WHEN a publisher edits content, the system SHALL support saving private draft revisions.
- **FR-062 (Event-driven):** WHEN editing in the publisher dashboard, the user SHALL have granular line-by-line editing control over headlines, text, and colors.
- **FR-063 (Event-driven):** WHEN assigning a page number, the system SHALL enforce selection within the valid range (100–899) and reject existing duplicates.
- **FR-064 (State-driven):** WHILE editing, the publisher SHALL be able to preview the page using the exact production CRT rendering engine.
- **FR-065 (Event-driven):** WHEN publishing, the server SHALL validate authentication, schema compliance, 40×24 geometry, byte budget, and human review confirmation.
- **FR-066 (Event-driven):** WHEN requested by an authenticated publisher, the system SHALL unpublish or archive a page from public indexing.
- **FR-067 (Event-driven):** WHEN a page is modified, the system SHALL increment the page revision index and retain historical audit metadata.

### 2.6 Offline Reading & PWA
- **FR-070 (Ubiquitous):** The system SHALL install as a Progressive Web App (PWA) with a valid web manifest, icons, and service worker.
- **FR-071 (Event-driven):** WHEN a reader chooses to save a page, the system SHALL persist the PagePack and metadata into local IndexedDB storage.
- **FR-072 (State-driven):** WHILE offline, the system SHALL render saved pages from IndexedDB with zero network requests.
- **FR-073 (State-driven):** WHILE viewing the catalogue or reader, the system SHALL highlight saved pages with a visual offline badge.
- **FR-074 (Event-driven):** WHEN a reader deletes a saved page, the system SHALL purge the record from local storage and update the UI.
- **FR-075 (Ubiquitous):** The service worker SHALL cache only the static application shell and safe assets, never caching private authentication tokens or draft pages.
- **FR-076 (Unwanted behavior):** IF a user navigates to an unsaved page while offline, THEN the system SHALL present an informative offline empty state.
- **FR-077 (Ubiquitous):** Stored client-side PagePack records SHALL be versioned to enable clean schema migrations.

### 2.7 QR Sharing & Import
- **FR-080 (Event-driven):** WHEN a public page is viewed, the system SHALL offer a QR code encoding the canonical page URL.
- **FR-081 (Event-driven):** WHEN requested, the system SHALL export the PagePack as a standalone downloadable `.json` file.
- **FR-082 (Optional feature):** WHERE high-density animated QR codes are enabled, the system SHALL support multi-frame chunked QR transfer of sub-5KB PagePacks.
- **FR-083 (Unwanted behavior):** IF a multi-frame QR import is missing chunks or has a mismatched SHA-256 digest, THEN the system SHALL reject the bundle.
- **FR-084 (Unwanted behavior):** IF an imported PagePack contains an invalid schema, unknown version, or exceeds 5,120 bytes, THEN the system SHALL reject the import.
- **FR-085 (Ubiquitous):** Imported PagePacks SHALL be rendered strictly as passive text data without executing script tags or external links.

---

## 3. Non-Functional & Quality Requirements

- **NFR-001 (Performance):** The system SHALL render any saved PagePack in under 200 ms on mid-range client devices.
- **NFR-002 (Performance):** The public reader SHALL achieve Largest Contentful Paint (LCP) ≤ 2.5s over simulated mobile 4G profiles.
- **NFR-003 (Payload):** Initial client JavaScript bundle for the reader route SHALL NOT exceed 200 KiB gzipped.
- **NFR-004 (Payload):** Published PagePacks SHALL NOT exceed 5,120 bytes uncompressed UTF-8 JSON.
- **NFR-005 (Reliability):** Saved page viewing SHALL operate with 100% functionality without internet, API, or database availability.
- **NFR-006 (Security):** The application SHALL NOT leak server credentials or AI API keys into client bundles.
- **NFR-007 (Security):** The article fetcher SHALL resist all SSRF vectors, DNS rebinding, and private IP targeting.
- **NFR-008 (Security):** All external article text and imported PagePacks SHALL be parsed and treated as untrusted data.
- **NFR-009 (Security):** Database access SHALL be secured using PostgreSQL Row Level Security (RLS) policies.
- **NFR-010 (Privacy):** The public reader SHALL require zero user registration, tracking cookies, or personal data collection.
- **NFR-011 (Accessibility):** The UI SHALL conform to WCAG 2.1 AA standards, supporting full keyboard navigation, high contrast, and screen readers.
- **NFR-012 (Compatibility):** The application SHALL be verified across modern Chrome, Edge, Android Chrome, and iOS Safari.
- **NFR-013 (Maintainability):** Domain logic in `src/domain/` SHALL have zero dependencies on React, Next.js, or browser DOM.
- **NFR-014 (Observability):** Server logs SHALL record structured error diagnostics without storing raw user credentials or full copyrighted articles.
- **NFR-015 (Availability):** A static demo bulletin dataset SHALL be bundled to ensure uninterrupted demonstration during hackathon judging.
- **NFR-016 (Localization):** The system SHALL support full English and Hindi character rendering without grid distortion.
- **NFR-017 (Determinism):** Given identical PagePack input and renderer version, the layout engine SHALL produce an identical 40×24 cell grid.
- **NFR-018 (Legal):** Published bulletins SHALL provide canonical source links and concise summaries rather than reprinting entire copyrighted texts.

---

## 4. UI/UX, Technical, Security & Testing Requirements Traceability

- **UXR-001 to UXR-016:** Screen layouts, CRT simulation toggles, 40×24 CRT grid, 3-digit page dialer, Fastext 4-key bar, byte budget meter, and bilingual preview.
- **TR-001 to TR-028:** Technology stack baseline (Next.js 16, React 19, TypeScript 5.8, Tailwind CSS 4, Vitest, fast-check, Supabase, Gemini 2.5 Flash).
- **SEC-001 to SEC-013:** IP blocking, timeout enforcement, HTML sanitation, CSP headers, rate-limiting, and env verification.
- **PERF-001 to PERF-010:** Sub-5KB pack budget, <200ms render latency, <200KB bundle size.
- **TEST-001 to TEST-012:** Unit, property-based (fast-check ≥100 runs), integration, accessibility, and build verification.

