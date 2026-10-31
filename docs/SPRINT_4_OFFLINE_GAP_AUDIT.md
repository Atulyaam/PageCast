# PageCast Sprint 4 Gap Audit: Offline PWA, Saved Pages and Sharing

**Kiroween 2026 — Resurrection Category**  
**Role:** Principal Software Architect, PWA Engineer, Offline-First Application Engineer, Security Engineer, QA Automation Architect  
**Repository Root:** `c:\Users\Atul2\OneDrive\Desktop\KiroHackethon\pagecast`  
**Date:** October 31, 2026  
**Status:** **AUDIT COMPLETED**

---

## 1. Executive Context & Baseline

The PageCast codebase previously completed foundational reader and publisher sprints:
- Core Teletext domain engine (40×25 grid, Unicode grapheme segmentation, 10,240-byte ceiling).
- Article ingestion and Gemini AI conversion pipeline with extractive fallback.
- Publisher Studio, interactive 40×25 grid editor, and Supabase persistence architecture.
- Reader Terminal UI, 8-magazine directory, subpage carousel (15s rotation), keyboard dialing (0–9), Web Audio synthesizer, and speech narration.
- Current Quality Gate: **259 tests across 41 test files passing (100%)**, zero ESLint/TypeScript errors, Turbopack production build passing.

The original PageCast product specification (`01_pagecast_project_spec_kiroween_2026.md`) defines the official Sprint 4 scope as: **Offline PWA, saved pages and sharing**.

---

## 2. Requirement Acceptance & Gap Matrix

| Requirement | Meaning | Current Codebase Status | Gap Analysis |
| :--- | :--- | :--- | :--- |
| **FR-070** | Installable PWA | **MISSING** | `public/` directory does not exist. No web app manifest, icons, start URL, or standalone display metadata. Next.js App Router metadata manifest required. |
| **FR-071** | Save published PagePack locally | **MISSING** | No IndexedDB/Dexie.js integration. The reader only falls back to hardcoded seed pages (P100, P101, P102), which does NOT constitute user-saved offline persistence. |
| **FR-072** | Reopen saved page offline | **MISSING** | No mechanism to retrieve user-saved PagePacks from IndexedDB when offline. |
| **FR-073** | Persistent saved-page status | **MISSING** | No UI indicator showing whether the active bulletin is saved locally. No persistent state across browser reloads. |
| **FR-074** | Remove saved page | **MISSING** | No local deletion action or confirmation UI. |
| **FR-075** | Cache safe app shell resources only | **MISSING** | No Service Worker (`sw.js`). Must implement cache-first for static shell assets while strictly excluding auth, publisher drafts, and server secrets. |
| **FR-076** | Correct unavailable-offline state | **PARTIALLY IMPLEMENTED** | `TerminalNotFound` renders missing pages in CRT style, but does not distinguish between missing network vs unsaved offline page. Needs explicit offline detection. |
| **FR-077** | Versioned local saved-page data | **MISSING** | Needs versioned Dexie schema with migration support. |
| **FR-080** | Public-link QR generation | **IMPLEMENTED & TESTED** | `generateBulletinQrCode` and `getBulletinShareUrl` exist in `src/server/export/qr-distribution.ts` and `ExportDialog.tsx`. Tested in `tests/unit/export/qr-distribution.test.ts`. |
| **FR-081** | PagePack JSON export/import | **PARTIALLY IMPLEMENTED** | Server-side export (`exportPagePackToJson`), validation (`importPagePackFromJson`), and API (`/api/v1/pages/[pageNumber]/pack`) exist. Client-side file import UI is missing. |
| **FR-082** | Multi-frame QR transfer (P1) | **MISSING** | Sequence chunking, animated frame cycling, and optical transfer packet specification need implementation. |
| **FR-083** | SHA-256 bundle integrity (P1) | **MISSING** | Web Crypto SHA-256 checksum generation and validation on reassembly. |
| **FR-084** | Import schema/version/size validation | **IMPLEMENTED & TESTED** | `importPagePackFromJson` validates schema version 1, primaryPageNumber, grid geometry, and <= 10,240 bytes. |
| **FR-085** | No execution of imported links or scripts | **IMPLEMENTED & TESTED** | Domain layout and React rendering sanitize all text; no `dangerouslySetInnerHTML`, script injection, or eval. |

---

## 3. Technology Strategy & Decisions

1. **PWA Architecture (Next.js 16.4.3 Compatibility):**
   - In Next.js 16 with Turbopack, third-party PWA wrapper plugins (such as older Serwist/next-pwa releases) frequently introduce webpack-specific build breakages.
   - We will use Next.js native `src/app/manifest.ts` for type-safe Web App Manifest generation, standard web SVG/PNG icons in `public/icons/`, and a pure, zero-dependency Service Worker `public/sw.js` registered safely in browser environments.
2. **Local Persistence (Dexie.js over IndexedDB):**
   - Install `dexie` (`^4.x`).
   - Define a strictly typed database `PageCastDexieDb` with stores for `saved_pages` and `catalog_snapshot`.
   - Store complete `PagePackV1` JSON documents along with searchable indexed fields (`pageNumber`, `slug`, `title`, `savedAt`, `magazineNumber`).
3. **Dedicated Saved Pages Screen (`src/app/saved/page.tsx`):**
   - Full Teletext-styled library for browsing, opening, and removing offline bulletins.
4. **Security & Cache Isolation:**
   - The Service Worker will cache ONLY: app shell HTML, `/_next/static/`, fonts, icons, manifest, and safe public catalogue snapshot.
   - The Service Worker MUST BYPASS: `/api/v1/drafts`, `/api/v1/sources`, `/publisher/*`, or any request with Authorization or Supabase headers.
5. **Optical Sharing & Camera Scanning:**
   - Multi-frame QR packet format: `PAGECAST:v1:<bundleId>:<index>:<total>:<sha256>:<base64Chunk>`.
   - Reassembly engine with whole-pack SHA-256 verification using Web Crypto API.
   - Optical camera scanner using `@zxing/browser` or pure HTML5 file/camera video stream with fallback to file upload.

---

## 4. Acceptance Criteria for Official Sprint 4

- PWA installability validated via manifest and service worker.
- Persistent saved pages surviving browser restart without network access.
- Offline reader rendering saved PagePacks in sub-200ms.
- True offline state detection (`navigator.onLine` and `window.addEventListener('offline')`).
- File import dialog for PagePack `.json` files with strict schema and size validation.
- Multi-frame QR generator and reassembly engine with SHA-256 integrity verification.
- 100% test pass rate across all new and existing test suites.

