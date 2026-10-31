# PageCast — System Architecture

**Phase:** 1 — Discovery & Requirement Analysis  
**Date:** 30 October 2026  
**Source:** `01_pagecast_project_spec_kiroween_2026.md` §§7–16

---

## 1. Architectural Principles

The PageCast architecture is governed by seven principles from the specification:

1. **Domain logic first** — Grid renderer, PagePack schema, byte counter and validators must work without React, Next.js, Supabase or the AI SDK.
2. **Server-only secrets** — AI provider keys and Supabase service-role key never enter client code or `NEXT_PUBLIC_` variables.
3. **Human-in-the-loop publishing** — AI composes; publisher reviews; server validates; then and only then is the page public.
4. **Offline reading is local-first** — Saved PagePacks are read from IndexedDB. Network is not required for their display.
5. **Source provenance is mandatory** — Every generated page must retain a source record; no orphaned AI-generated content.
6. **Progressive enhancement** — Link QR works online; multi-frame QR is a P1 enhancement for offline transfer.
7. **No microservices** — One Next.js deployment and one Supabase project are sufficient for the hackathon.

---

## 2. High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Client (Browser / PWA)"]
        ReaderUI["Teletext Reader UI"]
        PublisherUI["Publisher Studio"]
        OfflineDB["Dexie / IndexedDB"]
        SW["Service Worker (App Shell Cache)"]
        QRModule["QR Generate / Scan"]
    end

    subgraph NextJS["Next.js Application (Vercel)"]
        AppRouter["App Router (RSC + Client Components)"]
        RouteHandlers["API Route Handlers /api/v1"]
        ServerActions["Server Actions"]

        subgraph DomainLayer["Domain Layer (Pure TypeScript)"]
            PagePackSchema["PagePack Schema (Zod)"]
            LayoutEngine["40x25 Layout Engine"]
            ByteBudget["Byte Budget Validator (TextEncoder)"]
            Graphemes["Grapheme Segmenter (Intl.Segmenter)"]
            Validation["Page Validation (validateGrid)"]
        end

        subgraph ServerLayer["Server Layer"]
            URLSafety["URL Safety (SSRF Protection)"]
            Extractor["Readability + jsdom Extractor"]
            AIComposer["AI Bulletin Composer (Vercel AI SDK)"]
            AuthMiddleware["Supabase Auth Middleware"]
            DBClient["Supabase DB Client"]
        end
    end

    subgraph External["External Services"]
        Supabase["Supabase (Postgres + Auth + RLS)"]
        Gemini["Google Gemini (AI Provider)"]
        ArticleSrc["Public Article Sources"]
    end

    %% Reader flow
    ReaderUI --> AppRouter
    AppRouter --> RouteHandlers
    RouteHandlers --> DBClient
    DBClient --> Supabase
    ReaderUI --> OfflineDB
    ReaderUI --> SW
    ReaderUI --> QRModule

    %% Publisher flow
    PublisherUI --> AuthMiddleware
    AuthMiddleware --> Supabase
    PublisherUI --> RouteHandlers
    RouteHandlers --> URLSafety
    URLSafety --> ArticleSrc
    URLSafety --> Extractor
    Extractor --> AIComposer
    AIComposer --> Gemini
    AIComposer --> DomainLayer
    DomainLayer --> DBClient
    DBClient --> Supabase

    %% Offline
    QRModule --> OfflineDB
    SW -.->|"App shell cache"| Client
```

---

## 3. Component Responsibilities

### 3.1 Domain Layer (`src/domain/`) — Pure TypeScript

> [!IMPORTANT]
> This layer must import **zero** React, Next.js, Supabase or AI SDK modules. All its logic must be unit and property testable in plain Node.js.

| Component | File Path | Responsibility |
|---|---|---|
| PagePack Schema | `domain/page-pack/schema.ts` | TypeScript types and Zod schema for `PagePackV1`; schema versioning |
| Layout Engine | `domain/layout-engine/layout.ts` | Convert structured bulletin into 40×25 logical grid; word-boundary wrapping |
| Grapheme Segmenter | `domain/layout-engine/graphemes.ts` | `segmentGraphemes()` using `Intl.Segmenter`; Hindi grapheme-safe cell placement |
| Byte Budget | `domain/byte-budget/measure.ts` | `measurePagePack()` — canonical JSON serialization + `TextEncoder` byte count |
| Page Validator | `domain/validation/validate-grid.ts` | `validateGrid()` — 25 rows × 40 columns assertion; reject malformed layouts |
| Source Provenance | `domain/source-provenance/` | Source record types, attribution label construction |
| Page Number | `domain/validation/page-number.ts` | Validate 100–899 range; uniqueness rules |

### 3.2 Server Layer (`src/server/`) — Next.js Server Only

| Component | File Path | Responsibility |
|---|---|---|
| URL Safety | `server/security/url-safety.ts` | SSRF protection: scheme check, DNS resolution, IP block list, redirect chasing, timeout, size limit |
| Article Extractor | `server/ingestion/extractor.ts` | Mozilla Readability + jsdom (scripts disabled); sentence ID generation |
| AI Composer | `server/ai/composer.ts` | Vercel AI SDK wrapper; structured generation with Zod; source sentence ID validation |
| AI Fallback | `server/ai/extractive-fallback.ts` | Deterministic extractive summarizer when AI provider unavailable |
| Auth Middleware | `server/auth/middleware.ts` | Supabase SSR cookie-based session verification; role checks |
| Database Client | `server/database/client.ts` | Supabase Postgres client; typed queries; RLS-aware |

### 3.3 API Routes (`src/app/api/v1/`) — Next.js Route Handlers

| Route | Method | Auth | Responsibility |
|---|---|---|---|
| `/api/v1/sources/extract` | POST | Publisher | Safe URL fetch → Readability extraction → source record |
| `/api/v1/sources/from-text` | POST | Publisher | Pasted text → source record |
| `/api/v1/bulletins/compose` | POST | Publisher | Source record → AI structured draft |
| `/api/v1/pages` | POST | Publisher | Save draft PagePack |
| `/api/v1/pages/:id` | PATCH | Publisher/owner | Edit draft |
| `/api/v1/pages/:id/validate` | POST | Publisher | Grid + provenance + byte budget validation |
| `/api/v1/pages/:id/publish` | POST | Publisher/admin | Publish approved valid page |
| `/api/v1/pages/:pageNumber` | GET | Public | Fetch published page |
| `/api/v1/pages/:pageNumber/pack` | GET | Public | Download canonical PagePack JSON |
| `/api/v1/catalog` | GET | Public | List published pages |
| `/api/v1/import/validate` | POST | Public | Validate imported PagePack (no publish permission) |

### 3.4 Application Components (`src/components/`)

| Component Group | Responsibility |
|---|---|
| `components/teletext/` | Teletext grid renderer (React), row/cell components, palette application |
| `components/reader/` | Page navigation, catalogue list, saved-pages list, offline indicator |
| `components/publisher/` | Dashboard, draft editor, source review, AI generation panel, byte meter |
| `components/qr/` | QR image display, camera scanner, multi-frame progress tracker |
| `components/ui/` | shadcn/ui + Radix primitives: dialogs, forms, tabs, menus |

### 3.5 Offline Layer (`src/offline/`)

| Component | Responsibility |
|---|---|
| `offline/db.ts` | Dexie database schema: `savedPages`, `catalogSnapshot`, `imports` |
| `offline/saved-pages.ts` | Save, retrieve, remove, list operations on IndexedDB |
| `offline/pack-import.ts` | PagePack JSON import, SHA-256 verification, schema validation |

---

## 4. Data Flow

### 4.1 Publishing Flow

```mermaid
sequenceDiagram
    participant P as Publisher Browser
    participant API as Next.js API
    participant Safety as URL Safety
    participant Extract as Readability
    participant AI as Gemini (AI SDK)
    participant Domain as Domain Layer
    participant DB as Supabase Postgres

    P->>API: POST /api/v1/sources/extract {url}
    API->>Safety: Validate URL (scheme, DNS, IP, redirects)
    Safety->>Extract: Fetch + parse HTML (no scripts)
    Extract->>API: {title, text, sentences, metadata}
    API-->>P: Extraction preview

    P->>API: POST /api/v1/bulletins/compose {sourceId, language}
    API->>AI: Structured generation with Zod schema
    AI-->>API: BulletinDraft {title, summary, sections, warnings}
    API->>Domain: validateSentenceIds(), measurePagePack()
    Domain-->>API: validation result + byte count
    API-->>P: Draft + byte count

    P->>P: Review + edit draft
    P->>API: POST /api/v1/pages {draft + reviewedAt}
    API->>Domain: validateGrid(), measurePagePack()
    Domain-->>API: grid valid, 8,200 bytes
    API->>DB: INSERT page_revisions (reviewedAt set)
    DB-->>API: pageId
    API-->>P: Draft saved

    P->>API: POST /api/v1/pages/:id/publish
    API->>DB: Check auth + reviewedAt + budget
    DB-->>API: All checks pass
    API->>DB: UPDATE pages SET status='published'
    DB-->>API: OK
    API-->>P: Page published at /pages/101
```

### 4.2 Reader Flow (Online)

```mermaid
sequenceDiagram
    participant R as Reader Browser
    participant SW as Service Worker
    participant API as Next.js API
    participant DB as Supabase Postgres

    R->>SW: Request /pages/101
    SW->>API: Cache-miss → fetch /api/v1/pages/101
    API->>DB: SELECT published page 101
    DB-->>API: PagePackV1 JSON
    API-->>SW: PagePack response
    SW-->>R: Rendered Teletext page

    R->>R: Click "Save offline"
    R->>R: Store PagePack in Dexie/IndexedDB
```

### 4.3 Reader Flow (Offline)

```mermaid
sequenceDiagram
    participant R as Reader Browser
    participant SW as Service Worker
    participant IDB as Dexie/IndexedDB

    R->>SW: Request /pages/101
    SW->>SW: Network failed
    SW-->>R: App shell (cached static)

    R->>IDB: getSavedPage(101)
    IDB-->>R: PagePackV1 JSON (from prior save)
    R->>R: Render Teletext grid from local PagePack
```

---

## 5. Database Design

### 5.1 Schema

```mermaid
erDiagram
    profiles {
        uuid id PK
        text display_name
        text role
    }
    sources {
        uuid id PK
        text canonical_url
        text title
        text publisher
        timestamptz published_at
        timestamptz fetched_at
        text content_hash
    }
    source_sentences {
        uuid id PK
        uuid source_id FK
        int sentence_index
        text text_hash
    }
    pages {
        uuid id PK
        int page_number
        text slug
        text language
        text status
        int current_revision
    }
    page_revisions {
        uuid id PK
        uuid page_id FK
        int revision
        jsonb page_pack_json
        int payload_bytes
        text renderer_version
        uuid reviewed_by FK
        timestamptz reviewed_at
    }
    page_sources {
        uuid page_revision_id FK
        uuid source_id FK
    }
    publisher_audit_log {
        uuid id PK
        uuid actor_id FK
        text action
        uuid resource_id
        timestamptz created_at
    }

    profiles ||--o{ page_revisions : "reviews"
    profiles ||--o{ publisher_audit_log : "performs"
    sources ||--o{ source_sentences : "has"
    pages ||--o{ page_revisions : "has revisions"
    page_revisions ||--o{ page_sources : "attributes"
    sources ||--o{ page_sources : "attributed by"
```

### 5.2 Row Level Security Policies

| Table | Anonymous Readers | Authenticated Publisher | Admin |
|---|---|---|---|
| `pages` | SELECT published only | SELECT own drafts | SELECT all |
| `page_revisions` | SELECT published only | SELECT/INSERT own | SELECT/INSERT/UPDATE all |
| `sources` | SELECT public | SELECT/INSERT | All |
| `source_sentences` | SELECT | SELECT/INSERT | All |
| `profiles` | None | SELECT/UPDATE own | All |
| `publisher_audit_log` | None | None | SELECT all |

---

## 6. Frontend/Backend Boundaries

```mermaid
flowchart LR
    subgraph Browser["Browser (Client)"]
        ReactComponents["React Components"]
        DexieClient["Dexie IndexedDB Client"]
        ServiceWorker["Service Worker"]
    end

    subgraph ServerBoundary["Server Boundary (Next.js on Vercel)"]
        RSC["React Server Components"]
        RouteHandlers["Route Handlers"]
        DomainLogic["Domain Logic (Pure TS)"]
        SupabaseServer["Supabase Server Client"]
        AISDKServer["AI SDK (Server Only)"]
    end

    subgraph SecretsZone["Secret Zone (Server Only)"]
        AIKey["GOOGLE_GENERATIVE_AI_API_KEY"]
        ServiceKey["SUPABASE_SERVICE_ROLE_KEY"]
    end

    Browser <-->|"HTTP / RSC Payload"| ServerBoundary
    ServerBoundary --> SecretsZone
    SecretsZone -.->|"Never crosses"| Browser
```

**Client-safe variables** (prefixed `NEXT_PUBLIC_`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`

**Server-only secrets** (never `NEXT_PUBLIC_`):
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- All `PAGECAST_*` operational variables

---

## 7. Offline Architecture

```mermaid
flowchart TD
    User["User Action: Save Page"]
    OnlineCheck{"Online?"}
    Fetch["Fetch PagePack from /api/v1/pages/:n/pack"]
    Store["Store in Dexie savedPages"]
    ReadOffline["Read from Dexie (no network)"]
    SWCache["Service Worker: App Shell Cache"]
    ImportJSON["Import PagePack JSON file"]
    ValidateImport["Validate: schema + SHA-256 + size"]

    User --> OnlineCheck
    OnlineCheck -->|Yes| Fetch --> Store
    OnlineCheck -->|No, already saved| ReadOffline
    SWCache -->|"Serves app shell"| ReadOffline
    ImportJSON --> ValidateImport --> Store

    subgraph IndexedDB["Dexie / IndexedDB"]
        savedPages["savedPages store"]
        catalogSnapshot["catalogSnapshot store"]
        imports["imports store (optional)"]
    end

    Store --> savedPages
    ReadOffline --> savedPages
```

**Caching Strategy Summary:**

| Resource Type | Strategy |
|---|---|
| Versioned static assets (JS, CSS) | Cache-first (versioned cache name) |
| App shell (HTML, manifest) | Precache on SW install |
| Public catalogue | Network-first → cached snapshot fallback |
| Public PagePack (fetched) | Network-first; user-saved copy always available in IDB |
| Publisher/admin API | Network-only; never cached |
| Auth/session responses | Network-only; never stored in public cache |
| AI generation | Network-only |

---

## 8. External Integrations

| Service | Purpose | Integration Point | Auth Method | Failure Mode |
|---|---|---|---|---|
| Supabase Postgres | Page storage, drafts, audit log | Server-side Supabase client | Service-role key (server only) + Publishable key (client read) | Fall back to cached IndexedDB data |
| Supabase Auth | Publisher authentication | `@supabase/ssr` cookie-based | JWT via cookie | Block publish action; reader still works |
| Google Gemini (via AI SDK) | AI bulletin composition | Vercel AI SDK server-side | `GOOGLE_GENERATIVE_AI_API_KEY` (server only) | Extractive fallback; manual editing |
| Vercel | Hosting, CDN, edge | CI/CD deployment | GitHub integration | Use fallback static demo catalogue |
| GitHub | Source control, CI | GitHub Actions | Repo secrets | — |
| Article sources | Content ingestion | Server-side fetch with SSRF protection | None (public articles only) | Paste-text fallback |

---

## 9. Security Boundaries

```mermaid
flowchart TB
    subgraph Public["Public Internet"]
        Reader["Anonymous Reader"]
        Judge["Hackathon Judge"]
        Attacker["Potential Attacker"]
    end

    subgraph Edge["Vercel Edge / CDN"]
        StaticAssets["Static Assets (JS, CSS, fonts)"]
        RateLimit["Rate Limiting"]
    end

    subgraph AppServer["Next.js Application Server"]
        URLValidator["URL Validator + SSRF Guard"]
        AuthGate["Auth Middleware (Supabase SSR)"]
        InputValidator["Zod Input Validation"]
        SafeRenderer["Safe Text Renderer (no innerHTML)"]
        SecureHeaders["Secure Headers + CSP"]
    end

    subgraph DataLayer["Data Layer"]
        SupabaseRLS["Supabase Postgres (RLS Enforced)"]
    end

    subgraph SecretVault["Secret Vault (Server Env)"]
        AIKey["AI API Key"]
        ServiceKey["Service Role Key"]
    end

    Reader --> Edge --> AppServer
    Attacker -->|"SSRF attempt"| URLValidator
    URLValidator -->|"Blocked"| Attacker
    Attacker -->|"Oversized request"| InputValidator
    InputValidator -->|"Rejected"| Attacker
    AppServer --> SupabaseRLS
    AppServer --> SecretVault
    SecretVault -.->|"Never exposed to client"| Public
```

---

## 10. Recommended Architecture Changes from Specification

The specification architecture is well-designed. The following are analysis findings, not spec deviations:

| Item | Spec Decision | Analysis Note | Recommendation |
|---|---|---|---|
| Serwist vs manual SW | Prefer Serwist; fall back to manual | Serwist + Next.js 16 compatibility is unverified | **Verify first in Sprint 4; have manual SW ready as fallback** |
| `CompressionStream` | Optional | API support is wide (Chrome 80+, Firefox 113+, Safari 16.4+) but not universal | Mark as enhancement; do not depend on it for P0 |
| Multi-frame QR | P1 | Camera-based multi-frame scanning reliability is uncertain; 10 KiB > QR capacity | JSON export/import must work perfectly as P0 fallback |
| shadcn/ui | Recommended | Adds code generation complexity for a solo dev | Use only where it genuinely saves time (forms, dialogs); custom-build Teletext grid |
| Next.js 16 | Specified | Latest Next.js stable at time of analysis | Confirm exact 16.x patch release on project bootstrap day |

---

*Architecture review based on Phase 1 analysis. No application code exists yet; all decisions are forward-looking.*

