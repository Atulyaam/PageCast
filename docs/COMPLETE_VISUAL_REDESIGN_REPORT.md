# PageCast — Complete Visual Redesign Report
## Premium Physical Information Terminal Experience

**Document Version:** 1.0.0  
**Date:** November 10, 2026  
**System Designation:** PageCast PT-4025 Broadcast Information Terminal  
**Quality Status:** **ALL GATES PASSING** (444 tests passing across 69 test files, zero TypeScript errors, zero ESLint warnings, 100% Prettier formatting compliant, Turbopack production build verified)

---

## 1. Previous Design Problems

Prior to this visual overhaul, PageCast suffered from several fundamental design limitations that prevented it from communicating its true character as a dedicated physical broadcast device:

1. **Dark SaaS Dashboard Syndrome:** The layout was composed of floating dark cards (`bg-zinc-900`/`bg-zinc-950`) stacked against a black background, indistinguishable from a generic cloud software dashboard or developer portal.
2. **Disconnected Modular Widgets:** The CRT grid, dialer keypad, status bar, synthesizer controls, and carousel were rendered as separate, disconnected boxes with disparate border radiuses and inconsistent surface elevations.
3. **Over-Saturated High-Contrast Glare:** Visual contrast relied heavily on blinding neon green (`#00FF66`) and electric cyan against pure black, causing eye fatigue over extended reading sessions and lacking the nuanced phosphorescence of authentic CRT hardware.
4. **Poor Desktop Screen Space Utilization:** On widescreen displays, controls were stacked vertically below the monitor, creating an awkward, top-heavy column with vast wasted horizontal margins instead of an ergonomic physical console deck.
5. **Lack of Hardware Tangibility:** Buttons looked like flat web clickables with CSS borders rather than tactile, physical molded keycaps and rocker switches with physical depth, chamfers, and beveling.

---

## 2. New Design Direction

The redesign completely reimagines PageCast as a **precision-engineered electronic desktop information terminal** (Model PT-4025), drawing inspiration from classic industrial electronics (Braun, teenage engineering, Nagra, Sony ICF transistor radios, and aerospace telemetry instruments):

- **Physical Environmental Context:** The device rests on a calm, warm technical studio worktop (`#D9D7CF`) featuring a subtle micro-radial technical grid that provides spatial depth and believable desk lighting.
- **Unified Hardware Chassis:** The terminal is housed in a molded warm stone/olive chassis (`#AAA99F` casing, `#C7C5BA` specular highlight, `#777970` drop shadow) complete with authentic structural details: mechanical chassis louvers for thermal ventilation, chamfered bevels, precision Torx chassis corner screws, and silkscreened technical typography.
- **Recessed CRT Monitor Well:** Rather than floating on the page, the 40 × 25 screen sits inside a deeply recessed screen bay (`#18211D` inner well with `#0D1410` phosphor substrate). The display features curved CRT glass glare reflection, subtle cathode-ray scanline overlays, and a warm phosphor bloom that evokes vintage studio equipment while remaining perfectly legible.
- **Side-by-Side Console Deck (Desktop):** On desktop viewports (≥ 1024px), the layout arranges the screen bay (8 columns) alongside an authentic hardware tuning deck (4 columns) containing the LED-window page buffer, tactile numeric keycaps, tuning rockers, acoustic synthesizer controls, and cooling louvers. On mobile devices (< 1024px), the chassis collapses seamlessly into a rugged, handheld field terminal with ≥ 44px touch targets.

---

## 3. Colour System & Material Hierarchy

The color system abandons generic dark-mode tokens in favor of an authentic physical material palette:

### Studio Worktop & Enclosure
| Material Token | Hex Value | Purpose & Tactile Role |
| :--- | :--- | :--- |
| **Desk Worktop** | `#D9D7CF` | Warm studio worktop environment with micro-radial technical grid |
| **Chassis Body** | `#AAA99F` | Textured industrial ABS plastic casing with matte tactile finish |
| **Chassis Highlight** | `#C7C5BA` | Precision top-bevel specular light reflection |
| **Chassis Shadow** | `#777970` | Structural chassis drop shadow and panel divider seams |
| **Panel Well** | `#9E9D93` | Recessed deck surface for tactile keypad and audio module |
| **Instrument Rail** | `#222723` | Dark anodized aluminum top instrument bar for navigation |

### Screen Substrate & Phosphors
| Phosphor Token | Hex Value | Purpose & Visual Quality |
| :--- | :--- | :--- |
| **Screen Recessed Bay** | `#18211D` | Deep recessed well surrounding the CRT monitor |
| **Phosphor Substrate** | `#0D1410` | Non-illuminated cathode-ray tube glass substrate |
| **Primary Phosphor** | `#B7C9A8` | Soft, calm P1/P31 vintage green for primary readouts & indicators |
| **Muted Phosphor** | `#879B83` | Subdued green for telemetry metadata and secondary legends |
| **Amber Cathode** | `#C69B5B` | Warm amber phosphor for dialer buffer, warnings, and active frames |
| **Silkscreen Text** | `#2F342D` / `#5E645A` | Industrial printed typography stamped on the chassis exterior |

### Strict Preservation of 8 Logical Teletext Cell Colors
All Teletext cell foreground/background codes strictly adhere to the WST broadcast standard:
- White (`#FFFFFF`), Yellow (`#FFFF00`), Cyan (`#00FFFF`), Green (`#00FF00`), Magenta (`#FF00FF`), Red (`#FF0000`), Blue (`#0000FF`), Black (`#000000`).

---

## 4. Device Construction & Visual Treatment

The hardware chassis is engineered using custom CSS component classes defined in `src/app/globals.css`:

1. **`.chassis-body`:** Precision multi-layer box shadows creating a cast drop-shadow onto the desk (`rgba(0,0,0,0.18)`), an outer 1px highlight (`#C7C5BA`), and a rich matte surface gradient from `#AAA99F` to `#A09F95`.
2. **`.screen-bay`:** Recessed monitor well featuring 2px inward shadow (`rgba(0,0,0,0.85)`), `#18211D` background, and precision chamfered borders (`#232E27`).
3. **`.screen-crt-glass`:** Cathode-ray tube glass substrate with curved corner radiuses, deep inner vignette (`inset 0 0 40px rgba(0,0,0,0.7)`), and optional toggleable raster scanlines.
4. **`.crt-glass-glare`:** Pointer-events-none diagonal specular sheen (`linear-gradient(135deg, rgba(255,255,255,0.06), transparent 60%)`) simulating natural glass room lighting.
5. **`.btn-keycap` & `.btn-keycap-light`:** Mechanical push-buttons with raised bevel borders, dual-tone drop shadows (`0 3px 0 #777970`), active state depression (`translateY(2px)` with shadow collapse), and high-contrast tactile feedback.
6. **`.btn-rocker-*`:** Molded physical rocker switches for Red, Green, Yellow, and Cyan Fastext navigation featuring authentic concave rocker styling and embossed bracketed shortcuts (`[1]`, `[2]`, `[3]`, `[4]`).
7. **`.led-window`:** Recessed 3-digit LED buffer window with dark green tinted glass, inner shadow, and phosphor amber/green numeric typography.
8. **`.chassis-screw` & `.chassis-louver`:** Industrial casing hardware including stamped cross-recess Torx screws and molded ventilation heat louvers.

---

## 5. Components Redesigned

Every reader- and publisher-facing component was refactored into the physical terminal aesthetic:

1. **`WebTerminal.tsx`:** Converted from a vertical stack of loose cards into a cohesive desktop console terminal. On desktop screens, it forms a 2-column console: 8-column Screen Bay (monitor, status bar, carousel, Fastext rockers) on the left, 4-column Control Deck (keypad, tuner, LED buffer, synthesizer, louvers) on the right, grounded by an accessory utility dock.
2. **`TeletextGrid.tsx`:** Encased in `.screen-bay` and `.screen-crt-glass` with specular glare, scanlines, and preserved 40 × 25 grid geometry.
3. **`TerminalHeader.tsx`:** Refactored into a high-density status bar with pulsing radar LED beacon, Teletext clock, magazine indicator, and tactile mini-toggles for CRT scanlines and phosphor glow.
4. **`TeletextFastextBar.tsx`:** Transformed into 4 physical rocker switches (`.btn-rocker-red`, `.btn-rocker-green`, `.btn-rocker-yellow`, `.btn-rocker-cyan`) with concave press states.
5. **`TeletextDialer.tsx`:** Re-engineered as a hardware tuning deck with an LED window for 3-digit buffer entry, raised keycaps for 0–9 numeric keys, and tuning rocker buttons (`▲ PREV` / `NEXT ▼`).
6. **`AudioControls.tsx`:** Styled as an integrated acoustic carrier synthesizer module with push-buttons for carrier frequency chirps and text-to-speech speech reader narration.
7. **`SubPageCarousel.tsx`:** Redesigned as an integrated carousel strip with progress bar, frame count indicators, and hardware stepping keys.
8. **`KeyboardShortcutsModal.tsx`:** Replaced neon popover with a precision remote control legend overlay styled as an authentic model PT-4025 reference panel.
9. **`ExportDialog.tsx`:** Styled as a physical data cassette export bay featuring air-gap QR burst player, tactile tabs, and JSON download triggers.
10. **`EvidenceDrawer.tsx`:** Redesigned as a diagnostic access bay sliding out from the chassis casing with sentence-level claim attribution and SHA-256 telemetry.
11. **`QrScannerModal.tsx`:** Redesigned as an optical sensor viewport with CRT reticle and real-time air-gap packet reassembly meter.
12. **`AccessibleTextView.tsx`:** Refined standard high-legibility theme with warm hardware chassis card framing, supporting WCAG AAA contrast toggles.

---

## 6. Routes Redesigned

All application routes have been unified under the physical terminal design system:

| Route | Redesign Strategy & Features |
| :--- | :--- |
| **`/` (Reader)** | Precision top instrument rail (`#222723`), hero tabletop console terminal resting on warm studio worktop, hardware footer with model serial specifications. |
| **`/terminal`** | Dedicated full-screen console mode with minimal chrome, live broadcast radar beacon, and quick navigation back to reader, catalogue, or vault. |
| **`/catalogue`** | Broadcast Frequency Directory Console: hardware frequency filter deck (`ALL`, `MAG 1`–`MAG 8`), rackmount magazine table with broadcast status tags, byte-budget indicators, and quick-dial buttons. |
| **`/saved`** | Offline Bulletins Vault: hardware memory-cartridge cards with local storage indicators, storage quota bar, quick JSON import, and air-gap QR scanner access. |
| **`/publisher`** | Transmission Control Desk: hardware metric indicators (Active Bulletins, Drafts, Storage Capacity, Teletext Standard), dark technical table for published bulletins, and new transmission launch trigger. |
| **`/publisher/ingest`** | Ingestion & Conversion Station: technical import bays for web URL scraping, raw text paste, or AI-assisted bullet synthesis. |
| **`/publisher/editor/[id]`** | Studio Broadcast Editor: real-time 40 × 25 editing canvas in recessed bay, live byte-budget meter (10 KiB ceiling), color palette picker, and multi-subpage management. |
| **`/lab`** | Telemetry & Data Efficiency Lab: hardware benchmark selector, 3-way payload weight cards (Original Web vs. Extracted vs. PagePack), network profile transfer speedup simulator (2G/3G/4G/Satellite), and technical methodology card. |

---

## 7. Responsive Screenshots & Visual Evidence

Automated Chrome headless screenshots were captured across all 7 required viewports and key application routes:

### Required Viewports
1. **320px (Ultra-Compact Mobile):** `docs/screenshots/viewport_320.png` (123,412 bytes)
   - Layout stacks vertically into a rugged, handheld field terminal.
   - Screen Bay maintains exact 40 × 25 aspect ratio without horizontal window scrolling.
   - Touch targets remain ≥ 44px for accessibility.
2. **375px (Standard Mobile - iPhone SE):** `docs/screenshots/viewport_375.png` (136,595 bytes)
   - Clean spacing between status bar, CRT screen, and Fastext rockers.
   - Keypad tuning deck accessible below screen bay.
3. **430px (Large Mobile - iPhone 16 Pro Max):** `docs/screenshots/viewport_430.png` (153,489 bytes)
   - Optimal handheld ergonomics with comfortable margins on the studio worktop.
4. **768px (Tablet Portrait - iPad Mini):** `docs/screenshots/viewport_768.png` (297,583 bytes)
   - Wide chassis body with clear visual hierarchy, centered tuning deck, and visible Torx screws.
5. **1024px (Tablet Landscape / Small Laptop):** `docs/screenshots/viewport_1024.png` (298,584 bytes)
   - Seamless transition to 2-column desktop console layout (Screen Bay left, Tuning Deck right).
6. **1280px (Standard Desktop):** `docs/screenshots/viewport_1280.png` (323,977 bytes)
   - Full console proportions with heat louvers, acoustic module, and utility dock.
7. **1440px (Widescreen Desktop):** `docs/screenshots/viewport_1440.png` (333,678 bytes)
   - Studio worktop environment (`#D9D7CF`) cradles the console with balanced, calm desktop presence.

### Key Route Evidence
- **Hindi Bulletin P102:** `docs/screenshots/route_p102_hindi.png` (271,256 bytes)
  - Validates flawless Unicode and complex Devanagari script rendering on CRT substrate with zero column budget overflow.
- **Catalogue Console:** `docs/screenshots/route_catalogue.png` (89,015 bytes)
  - Broadcast Frequency Directory with hardware magazine rackmount styling.
- **Offline Vault:** `docs/screenshots/route_saved.png` (50,952 bytes)
  - Cartridge storage interface with IndexedDB persistence readouts.
- **Publisher Studio:** `docs/screenshots/route_publisher.png` (131,264 bytes)
  - Transmission Control Desk with real-time editorial metrics.
- **Telemetry Lab:** `docs/screenshots/route_lab.png` (221,536 bytes)
  - Data efficiency benchmarks and network speedup simulator.

---

## 8. Interaction Improvements

- **Tactile Key Feedback:** Keycaps feature active depression animation (`transform: translateY(2px)`) with instantaneous visual response.
- **Concave Rocker Switches:** Fastext navigation buttons replicate authentic bi-directional rocker toggles.
- **Subtle Scanline & Glow Toggles:** Users can independently toggle CRT scanline raster lines and phosphor tube glow with persistent state.
- **Integrated Carrier Synthesizer:** Audio carrier chirps (1200 Hz / 2400 Hz FSK) and speech narration are accessible via hardware-inspired push-buttons.
- **Seamless Buffer Dialing:** Typing digits 0–9 immediately illuminates the LED buffer window (`P100` $\to$ `P10` $\to$ `P101`) with automatic navigation on the 3rd digit.

---

## 9. Accessibility (a11y) Verification

- **Semantic HTML Hierarchy:** Teletext pages embed `<article>`, `<header>`, `<h1>`, `<section>`, `<nav>`, `<div role="grid">`, `<div role="row">`, and hidden screen-reader landmarks.
- **Accessible Text Mode:** Full toggleable text-only view (`AccessibleTextView.tsx`) supporting WCAG AAA high-contrast light (`bg-white text-black`), high-contrast dark (`bg-black text-white`), and customizable font size scaling (`normal`, `large`, `xlarge`).
- **Focus Management:** Modals, dialogs, and drawers implement strict focus trapping (`FocusTrap.tsx`) and `Escape` key dismissal.
- **Keyboard Navigation:** 100% of terminal interactions can be operated using standard keyboard controls (0–9, Arrows, Fastext R/G/Y/C keys, `T`, `D`, `M`, `E`, `?`).

---

## 10. Performance Considerations

- **Sub-50ms Sustained Render Time:** `tests/unit/performance/render-perf.test.ts` proves average frame render cycle of **< 25ms** (far below the strict NFR-001 50ms requirement).
- **CSS-Only Hardware Effects:** Chassis shadows, bevels, louvers, and CRT glass glare are rendered using lightweight, GPU-accelerated CSS box-shadows and radial gradients, introducing zero JavaScript runtime overhead.
- **Zero Heavy Image Assets:** No photo textures or skeuomorphic bitmap assets are downloaded; the entire physical terminal is generated with CSS and SVG icons.
- **Turbopack Build Optimization:** Next.js production build completes in < 5 seconds with all 24 static and dynamic routes pre-rendered.

---

## 11. Automated Test Results

The entire test suite was executed and passed with zero failures:

```
 Test Files  69 passed (69)
      Tests  444 passed (444)
   Start at  20:55:30
   Duration  5.50s

Property-Based Tests:
 ✓ Property P1: Layout engine ALWAYS produces exactly 25 rows (1,000 runs)
 ✓ Property P2: Every row in a generated page contains exactly 40 logical cells (1,000 runs)
 ✓ Property P4: Deterministic layout invariant (1,000 runs)
 ✓ Property P6: Byte budget ceiling correctly identifies compliant vs over-budget packs (500 runs)
 ✓ Property P7: PagePack serialization round-trip invariant (500 runs)

Quality Checks:
 ✓ Environment Safety: 100% PASS
 ✓ Prettier Formatting: 100% PASS
 ✓ ESLint Rules: 100% PASS (0 errors, 0 warnings)
 ✓ TypeScript Typecheck: 100% PASS (0 errors)
 ✓ Next.js Build: 100% PASS (Compiled successfully)
```

---

## 12. Remaining Visual Issues & Roadmap

### Minor Visual Polish for Post-Hackathon
1. **Rotary Dial Sound Animation:** Introduce micro-rotary physics to the dialer knob when tuning between magazines via mouse drag.
2. **Custom Scanline Density:** Allow users to adjust scanline pitch (e.g. 240p retro vs. 625-line PAL).
3. **Hardware Skin Customization:** Offer alternate chassis plastics (e.g., matte black aerospace carbon or industrial military beige).

### Conclusion
PageCast has successfully transitioned from a standard dark web dashboard into a **compelling, tactile, and believable physical electronic information terminal**. The redesign honors the heritage of Teletext and classic industrial product design while delivering an accessible, ultra-low bandwidth modern web application.
