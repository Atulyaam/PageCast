# PageCast — Product Enhancement Roadmap
## High-Impact Differentiation Plan for Kiroween 2026

**Author:** Principal Software Architect, Innovation Strategist & QA Automation Architect  
**Date:** 31 October 2026  
**Status:** Approved for Implementation Staging  
**Baseline Test Suite:** 394 tests passing across 61 files (100% pass rate)  
**Governing Strategy:** [`docs/PAGECAST_DIFFERENTIATION_STRATEGY.md`](file:///c:/Users/Atul2/OneDrive/Desktop/KiroHackethon/pagecast/docs/PAGECAST_DIFFERENTIATION_STRATEGY.md)  

---

## 1. Roadmap Overview & Strategic Intent

Following the completion of Sprints 0 through 5, PageCast possesses an exceptionally solid core: a 40×25 Unicode Teletext layout engine, defensive article ingestion, AI summarization with human review gates, multi-page magazine persistence, offline PWA storage, and animated QR optical distribution.

This Roadmap defines a surgical, non-destabilizing sequence of enhancements designed to maximize hackathon judging impact, technical transparency, and real-world utility without disrupting existing functionality or risking regression in the 394 passing tests.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PAGECAST ENHANCEMENT ROADMAP                           │
│                                                                             │
│  PHASE 1: TRUST & TRANSPARENCY                                              │
│  ├─ [ENH-01] Source Evidence Explorer (Interactive Provenance Drawer)       │
│  └─ [ENH-02] PageCast Data Efficiency Lab (Empirical Comparative Benchmark) │
│                                                                             │
│  PHASE 2: REAL-WORLD ADOPTION                                               │
│  ├─ [ENH-03] Community Broadcast Kit (Structured Domain Notice Templates)   │
│  └─ [ENH-04] Noticeboard Printable QR Poster Generator                      │
│                                                                             │
│  PHASE 3: DEVELOPER & AI AGENT ECOSYSTEM                                    │
│  ├─ [ENH-05] PageCast Domain QA MCP Server (Kiro Agent Tool Integration)    │
│  └─ [ENH-06] Low-Bandwidth Data Saver Profile (Extreme Low-Data Mode)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Shortlisted Enhancements — Detailed Specifications

### ENH-01: Source Evidence Explorer
*Interactive reader drawer revealing sentence-level claim attribution, human editorial certificates, and AI disclosures.*

- **Priority:** P1 (Essential for Trust & AI Transparency)
- **Complexity:** Low-Medium (1 day)
- **Dependencies:** `src/domain/source-provenance/`, `metadata.evidenceReferences` in `PagePackV1`
- **User Journey:**
  1. Reader opens any bulletin (e.g. Page 101 or 401) in `WebTerminal`.
  2. Reader presses `E` on keyboard or clicks the new "Evidence" button in the terminal header.
  3. A retro-styled slide-out drawer (`EvidenceDrawer.tsx`) opens without occluding the grid.
  4. Displays:
     - Canonical source attribution (domain, author, extraction timestamp, direct link).
     - Editorial certificate: `Verified by Human Editor: editor_admin at 2026-10-31 12:45 UTC`.
     - AI disclosure: `Summarized via Gemini 2.5 Flash • Prompt v1.2 • Grounded against 14 source sentences`.
     - Interactive sentence cross-reference: Clicking any bullet point highlights the exact underlying sentence excerpt and displays its SHA-256 content hash.
- **Acceptance Criteria:**
  - Drawer opens via keyboard shortcut `E` and Escape key dismisses it.
  - Zero hydration mismatch or grid distortion.
  - Passes WCAG 2.2 AA contrast audit and keyboard focus trapping.
  - Works offline for seed pages and saved PagePacks with cached evidence metadata.
- **Testing Strategy:**
  - Unit tests in `tests/unit/components/evidence-drawer.test.ts` verifying rendering and accessibility.
  - Integration test in `tests/integration/evidence-flow.test.ts` verifying sentence ID cross-referencing.
- **Demo Impact:** Shows judges that PageCast eliminates hallucinations by making every factual claim transparently traceable to its source.

---

### ENH-02: PageCast Data Efficiency Lab
*Interactive comparative dashboard demonstrating radical payload reduction across connection tiers.*

- **Priority:** P1 (Essential for Low-Bandwidth Proof)
- **Complexity:** Low (0.5 day)
- **Dependencies:** `src/domain/byte-budget/measure.ts`, `seed-pages.ts`
- **Location:** Dedicated route `/lab` (`src/app/lab/page.tsx`)
- **Key Capabilities:**
  - Empirical side-by-side comparison between full modern web articles and PageCast bulletins:
    - **Original Web Page:** Total HTTP payload (HTML + CSS + JS bundles + images + ads), request count, transfer size.
    - **Extracted Article Text:** Clean readable text bytes.
    - **Published PagePack:** Exact UTF-8 bytes measured via `TextEncoder`.
    - **Efficiency Metrics:** % payload reduction (typically 99.5% – 99.9%), storage density (number of bulletins stored per megabyte).
    - **Simulated Transfer Latencies:** Calculated transfer times across 2G Edge (150 kbps), 3G (1.5 Mbps), 4G (15 Mbps), and high-latency satellite (600ms RTT).
  - Explicit Disclaimer: Clearly labels calculated network times as *simulated estimates* while displaying exact measured byte sizes, maintaining absolute technical integrity.
- **Acceptance Criteria:**
  - Accessible via header navigation link `[ LAB ]`.
  - Includes interactive dropdown to switch between curated demo bulletins (e.g. World News, Cyclone Alert, Technology).
  - Strictly distinguishes measured values from estimates.
  - Never refers to summarization as "lossless compression".
- **Testing Strategy:**
  - Unit tests in `tests/unit/pages/efficiency-lab.test.ts` validating calculations, byte metrics, and zero external network calls.
- **Demo Impact:** Delivers the "killer chart" for the hackathon video and Devpost submission, empirically proving the low-bandwidth value proposition.

---

### ENH-03: Community Broadcast Kit
*Pre-structured domain templates for campus, community, civic, and emergency bulletins.*

- **Priority:** P1 (Essential for Real-World Utility & Adoption)
- **Complexity:** Medium (1 day)
- **Dependencies:** `src/domain/layout-engine/layout.ts`, `src/components/publisher/BulletinComposer.tsx`
- **Templates Included:**
  1. **Academic / Campus Notice:** Institution name, course code, venue, date/time, allowed materials, contact helpline.
  2. **Community Health & Clinic:** Clinic name, medical services, date range, eligibility, registration details.
  3. **Disaster & Weather Alert:** Hazard level (Advisory / Warning / Evacuation), impacted zones, shelter locations, emergency helplines.
  4. **Local Civic Notice:** Department name, scheduled disruption (water/electricity/roadwork), duration, alternative arrangements.
- **Workflow:**
  - In Publisher Studio, editor clicks "Use Community Template".
  - Fills out structured form fields instead of writing free-form text.
  - Engine automatically formats the text into canonical 40×25 rows with proper Teletext headers, colored section tags, and Fastext navigation.
  - Automatically verifies the 10,240-byte budget limit before submission.
- **Acceptance Criteria:**
  - Selecting a template pre-populates the composer with valid structured data.
  - Generated output strictly adheres to 40×25 grid geometry.
  - Editor can edit any field before human review confirmation.
- **Testing Strategy:**
  - Unit tests in `tests/unit/templates/community-templates.test.ts` verifying all 4 templates produce compliant grids.
- **Demo Impact:** Demonstrates that PageCast is ready for immediate deployment in schools, colleges, rural panchayats, and NGOs.

---

### ENH-04: Noticeboard Printable QR Poster Generator
*High-contrast, print-ready physical poster generator bridging noticeboards with air-gapped smartphones.*

- **Priority:** P1 (Essential for Hackathon "Resurrection" & Presentation Wow-Factor)
- **Complexity:** Low-Medium (0.5 day)
- **Dependencies:** `qrcode` library, CSS `@media print`
- **Location:** Publisher Studio Export Action (`src/components/publisher/PosterModal.tsx`)
- **Key Capabilities:**
  - Generates a print-optimized A4 / US-Letter black-and-white physical poster.
  - Visual Layout:
    - Large 48pt retro header: `PAGECAST CAMPUS BROADCAST • PAGE 201`.
    - Bold headline and bulleted key points in readable typography.
    - Large high-contrast QR code (minimum 250×250 px for reliable camera scanning from 4-6 feet away).
    - Clear offline user instructions: *"Scan with any smartphone camera to open and save this bulletin offline in PageCast. Works without internet connection once saved."*
  - Includes a "Print Poster" button that triggers native browser print dialog with print-specific CSS margins and clean typography.
- **Acceptance Criteria:**
  - Print stylesheet suppresses all UI buttons, navigation bars, and backgrounds.
  - QR code is sharp vector or high-resolution canvas.
  - Poster prints cleanly on standard black-and-white home/office printers.
- **Testing Strategy:**
  - Unit test verifying poster generation DOM structure and print CSS rules.
- **Demo Impact:** Visually spectacular in the demo video: showing a physical printed poster on a noticeboard being scanned by an offline phone.

---

### ENH-05: PageCast Domain QA MCP Server
*Local Model Context Protocol server exposing pure domain validation and testing tools to AI developer agents.*

- **Priority:** P2 (High Technical Depth & Kiro Integration Score)
- **Complexity:** Low (0.5 day)
- **Dependencies:** Pure TypeScript domain layer (`src/domain/`)
- **Location:** `src/server/mcp/` and executable script `scripts/mcp-server.ts`
- **Exposed MCP Tools:**
  1. `validate_page_grid`: Accepts 40x25 page JSON, runs `validateGrid()`, returns row/column geometry report.
  2. `measure_pagepack_bytes`: Accepts PagePack JSON, runs canonical `measurePagePack()`, returns byte count, percentage of 10 KiB ceiling, and budget compliance.
  3. `verify_source_evidence`: Validates that bullet point sentence IDs exist in extracted sentences, detecting hallucinations.
  4. `generate_multi_frame_qr`: Chunks a PagePack into animated QR frames with SHA-256 verification.
- **Acceptance Criteria:**
  - Runs over standard stdio using the official `@modelcontextprotocol/sdk` or clean JSON-RPC protocol.
  - Zero access to production secrets or external networks (pure local domain execution).
  - Can be registered in Antigravity or Kiro agent configurations.
- **Testing Strategy:**
  - Automated integration test executing MCP JSON-RPC tool requests and verifying typed responses.
- **Demo Impact:** Provides concrete, undeniable proof of advanced Kiro/Agentic development practices in the Devpost submission.

---

### ENH-06: Low-Bandwidth "Data Saver" Profile
*Unified extreme-efficiency client profile for constrained cellular and satellite links.*

- **Priority:** P2 (High Architectural Polish)
- **Complexity:** Low (0.5 day)
- **Dependencies:** `WebTerminal.tsx`, `localStorage`
- **Key Capabilities:**
  - A persistent toggle: `DATA SAVER MODE` in the terminal settings menu.
  - Enforces:
    - Zero web font downloads (switches to native monospace system fallbacks).
    - Hard-disables CRT scanline canvas and phosphor glow animations.
    - Offline-first cache lookup: reads local IndexedDB before sending any network request.
    - Live session data counter in footer: `Session: 6.4 KB (2 pages)`.
- **Acceptance Criteria:**
  - Preference persists across browser restarts.
  - Reduces page rendering CPU usage and suppresses background network traffic.
- **Testing Strategy:**
  - Component tests verifying DOM class and style changes when Data Saver is active.

---

## 3. Deferred / Explicitly Rejected Enhancements

| Proposed Enhancement | Recommendation | Technical & Strategic Rationale |
|---|---|---|
| **Verified Publisher Signatures (Ed25519)** | **DEFER to Post-Hackathon** | Implementing mathematical key signing is simple, but without a centralized PKI or pre-established Web of Trust, displaying a green "Verified" checkmark is misleading security theater. Defer until a decentralized trust registry can be designed cleanly. |
| **Automated Publishing without Human Review** | **EXPLICITLY REJECT** | Violates the core product promise of PageCast. AI must summarize; humans must approve. Fully automated pipelines risk broadcasting hallucinations under crisis conditions. |
| **Lossless Compression Claims for AI Summarization** | **EXPLICITLY REJECT** | Summarization is lossy information distillation, not compression. Calling it lossless compression destroys technical credibility with hackathon judges. |
| **User Comments / Social Interaction Feed** | **EXPLICITLY REJECT** | Introduces content moderation liability, increases payload bytes, requires reader user accounts, and undermines the focused one-way broadcast model. |

---

## 4. Implementation Phasing & Sequence

```
Day 1: Trust & Transparency
  ├─ Step 1: Implement ENH-01 (Source Evidence Explorer)
  │   └─ Tests: evidence-drawer.test.ts, evidence-flow.test.ts
  └─ Step 2: Implement ENH-02 (PageCast Data Efficiency Lab)
      └─ Tests: efficiency-lab.test.ts, /lab route check

Day 2: Community Utility & Physical Bridge
  ├─ Step 3: Implement ENH-03 (Community Broadcast Kit)
  │   └─ Tests: community-templates.test.ts
  └─ Step 4: Implement ENH-04 (Printable QR Poster Generator)
      └─ Tests: poster-modal.test.ts, print stylesheet check

Day 3: Agent Tooling & Final Polish
  ├─ Step 5: Implement ENH-05 (PageCast Domain QA MCP Server)
  │   └─ Tests: mcp-server.test.ts
  ├─ Step 6: Implement ENH-06 (Low-Bandwidth Data Saver Profile)
  │   └─ Tests: terminal-ui.test.ts
  └─ Step 7: Final Master Quality Gate & Hackathon Assets
      └─ Full pnpm quality:check run, video demo rehearsal, Devpost submission text
```

---

## 5. Definition of Done for Shortlisted Enhancements

For any enhancement to be considered **DONE**, it must satisfy all of the following:
1. **Preserve Existing Baselines:** All 394 existing automated tests across 61 test files must continue to pass 100%.
2. **Dedicated Automated Tests:** New features must carry unit and integration tests written to project standards (`react-dom/server` for components, pure Node for domain).
3. **Zero Security Regressions:** Adheres to strict request body limits, rate limits, CSP headers, and SSRF defenses.
4. **Clean Quality Gate:** `pnpm quality:check` must exit with code 0 (`env:check`, `format:check`, `lint`, `typecheck`, `test:run`, `next build`).
5. **No Production Leaks:** Zero server secrets or API keys exposed in client bundles.
6. **Documentation Updated:** Changes traced in `docs/REQUIREMENTS_TRACEABILITY.md` with git commit references.

