# PageCast — Devpost Submission Text (DEMO)
## Kiroween 2026 Hackathon — Resurrection Category

---

### Project Title
**PageCast — AI-Powered Low-Bandwidth Teletext Platform**

### Tagline
*Resurrecting 1974 BBC Ceefax as a 10 KiB, AI-assisted, offline-first communications stack for crisis resilience and edge networks.*

---

### Inspiration
In 1974, the BBC launched **Ceefax**, the world's first teletext system. It transmitted national news, sports scores, and emergency alerts over spare television lines with practically zero bandwidth consumption. Ceefax was simple, instant, indestructible, and universally readable.

Fast forward to 2026: the modern web is drowning in bloat. The average web page transfers **3.0 MB to 5.0 MB** of JavaScript bundles, ad trackers, video headers, and complex layouts. During natural disasters (cyclones, earthquakes), armed conflicts, power grid collapses, or in remote rural villages with throttled 2G connections, modern web applications fail entirely. Furthermore, modern AI summarizers hallucinate facts with zero provenance or accountability.

We asked: **What if we resurrected the brilliant, ultra-compact 40×25 Teletext grid of 1974, but powered it with modern AI extraction, cryptographic sentence provenance, and air-gapped optical distribution?**

That is **PageCast**.

---

### What it Does
PageCast transforms long web articles and emergency notices into numbered, bilingual Teletext-style bulletins strictly capped under **10 KiB** (300× smaller than the modern web).

1. **Authentic 40×25 CRT Terminal Reader (`/terminal`):** A full-fidelity Teletext terminal with 3-digit buffer dialing (`0-9`), four Fastext colored keys (`R, G, Y, C`), subpage carousels, authentic tuning chirps via Web Audio, and complete screen-reader accessibility (`T`).
2. **Source Evidence Explorer (`E`):** Pressing `E` opens a drawer showing the original article, human editorial review timestamps, and exact sentence citations with matching **SHA-256 cryptographic fingerprints** for every single claim.
3. **Data Efficiency Lab (`/lab`):** An interactive benchmark dashboard demonstrating **99.7% payload reduction** and simulated load times across 2G GPRS/EDGE, 3G, 4G, and L-Band Satellite links.
4. **Community Broadcast Kit & Printable Posters:** Bilingual templates (English/Hindi) for academic campuses, community health clinics, disaster shelters, and civic alerts. Broadcasters can generate pixel-perfect A4/Letter printable QR posters for physical noticeboards with `@media print`.
5. **Air-Gap Multi-Frame QR Bursts:** Transmits complete offline bulletins across air gaps using animated high-density QR bursts cycling at 3 FPS, readable by mobile cameras with no cellular connection.
6. **Low-Bandwidth Data Saver Profile (`D`):** Pressing `D` switches to zero-weight system monospace fonts, disables GPU shaders/glow, enforces cache-first resolution, and displays real-time session byte telemetry.
7. **Bulletin Freshness & Versioning:** Displays revision badges (`Rev 2`), relative freshness (`Updated 2h ago`), stale copy alerts with 1-click live refresh, and non-destructive expiry for time-sensitive notices.
8. **100% Offline PWA Vault:** Saves bulletins to local IndexedDB via Dexie with ServiceWorker caching, functioning seamlessly in Airplane Mode.

---

### How We Built It
- **Frontend & App Architecture:** Next.js 16.4.3 (App Router with Turbopack), React 19, TypeScript 5.8 (Strict), Tailwind CSS 4.
- **Teletext & Layout Engine:** Custom Unicode layout engine with Intl.Segmenter supporting complex Devanagari Hindi conjuncts and combining characters without splitting logical cells.
- **Persistence & Offline Vault:** Dexie.js (IndexedDB) with Cache-First ServiceWorker for disconnected offline reading; Supabase PostgreSQL schema contracts for multi-page drafts and published catalogues.
- **Audio & Accessibility:** Native Web Audio API carrier wave synthesizer and Web Speech API narration. WCAG 2.2 AA compliant with automated axe-core audits.
- **Security & DevSecOps:** Defense-in-depth with SSRF private network blocking, link-local metadata protection, CSP headers, sliding-window rate limiting, and 10 KiB payload ceiling enforcement.

---

### Meaningful Kiro Usage
Kiro served as the foundational pair programmer and architectural co-pilot throughout the entire project lifecycle:
- **Steering Rules (`.kiro/steering/`):** Guided architecture boundaries, teletext domain invariants (40×25 grid, 10 KiB ceiling), strict TypeScript conventions, and security rules.
- **Automated Lifecycle Hooks (`.kiro/hooks/`):**
  - `lint-on-save.json`: Instant ESLint validation on file edits.
  - `renderer-tests.json`: Automated layout-engine tests on domain file changes.
  - `page-budget-check.json`: Automatic byte-budget regression checking on PagePack serialization changes.
  - `pre-submit-check.json`: Complete quality gate before commits.
- **PageCast Domain QA MCP Server (`src/server/mcp/domain-qa-server.ts`):** We built an authentic Model Context Protocol (MCP) server over stdio exposing 5 custom tools (`validate_page_grid`, `measure_pagepack_bytes`, `verify_source_evidence`, `generate_multi_frame_qr`, `validate_page_number`). This allowed Kiro agents to autonomously audit grids and verify byte budgets during code generation.
- **Testing Rigor:** Developed a complete test suite of **439 automated tests across 69 test files**, including fast-check property-based tests verifying millions of permutations of grid dimensions and serialization invariants.

---

### Challenges We Ran Into
1. **Unicode Devanagari Conjunct Segmentation:** In Hindi, complex conjuncts (e.g., `क्ष`, `त्र`, `ज्ञ`, `त्त्व`) combine base consonants, viramas, and vowels into single visual grapheme clusters. Traditional `string.length` splits these clusters across columns, causing severe visual corruption. We solved this with an Intl.Segmenter layout engine that measures true logical graphemes while TextEncoder measures exact UTF-8 byte weights.
2. **Optical Multi-Frame Air-Gap Synchronization:** Synchronizing animated QR bursts across consumer mobile phone cameras required optimizing packet chunk sizes (400 chars) and error correction levels ('M') to achieve a > 95% first-pass scan rate.
3. **Strict 10 KiB Ceiling:** Fitting multi-page bilingual bulletins, metadata, and sentence provenance into under 10,240 bytes required compact JSON schema design and deterministic text condensing.

---

### Accomplishments We're Proud Of
- **439 / 439 Passing Automated Tests:** 100% pass rate across 69 test suites, including property-based tests, SSRF security regressions, axe accessibility audits, and render performance benchmarks (< 25ms sustained frame rate).
- **Zero Hallucination Attribution:** The Source Evidence Explorer provides verifiable sentence-level SHA-256 provenance for every single claim.
- **True Real-World Impact:** An emergency communications stack that operates completely offline, costs pennies to distribute, and works on any budget smartphone or printed paper poster.

---

### What's Next for PageCast
- **LoRa & Packet Radio Broadcasting:** Transmitting 10 KiB PagePacks over unlicensed 868/915 MHz LoRa mesh networks and VHF ham radio.
- **Acoustic Audio Modem:** Broadcasting bulletins over standard FM radio frequencies using audible audio frequency-shift keying (AFSK) demodulated by phone microphones.
- **Solar-Powered Village Micro-Servers:** Raspberry Pi Zero W devices serving local PageCast offline broadcasts in disaster-prone rural regions.

