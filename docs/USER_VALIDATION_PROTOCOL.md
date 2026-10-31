# PageCast — Real-World User Validation Protocol (PROTOCOL)
## Empirical Field Testing & Reproducible Evaluation Framework

**Document Version:** `1.0.0`  
**Target:** Kiroween 2026 Evaluation Committee & Field Researchers  
**Status:** **Approved Protocol for Field Validation**  
**Category:** Resurrection Category (BBC Ceefax for Low-Bandwidth & Disaster Scenarios)

---

> [!IMPORTANT]
> **Ethical Integrity Notice:** This document formalizes a repeatable, empirical field-testing protocol. It explicitly distinguishes between automated lab benchmarks and human field evaluation procedures. No fake human participants or fabricated survey data have been recorded. Independent judges and testers are encouraged to run these exact protocols.

---

## 1. Objectives & Testing Hypotheses

The PageCast platform is engineered for low-connectivity, crisis, and rural environments. This validation protocol evaluates four empirical hypotheses:

1. **H1 (Bandwidth Resilience):** On simulated or real 2G (GPRS/EDGE) connections, a PageCast bulletin loads in **< 1.5 seconds**, compared to > 45 seconds or complete timeout for the equivalent source web article.
2. **H2 (Offline Independence):** Once saved locally, 100% of bulletin content, including subpage navigation and Devanagari text rendering, functions with zero network connectivity.
3. **H3 (Optical Air-Gap Synchronization):** Multi-frame animated QR bursts can transfer a complete 4 KiB bulletin across an air gap from a laptop screen or printed poster to a mobile device camera with **> 95% first-pass decode reliability**.
4. **H4 (Cognitive & Evidence Trust):** Readers can verify the factual basis of any bulletin point within 3 clicks or via keyboard (`E`), establishing transparency over automated AI summarization.

---

## 2. Participant Persona Matrix

| Persona ID | Profile | Environment Constraints | Primary Task |
|---|---|---|---|
| **P-1: Rural Health Worker** | Community clinic nurse in Bihar/Odisha | 2G EDGE connection (150 Kbps), metered prepaid data, budget Android phone (Redmi 9A) | Ingest vaccination clinic alert (P601) in Hindi, save offline, view under Data Saver mode. |
| **P-2: Campus Student** | University undergrad in hostelled campus | Intermittent Wi-Fi drops, high peak congestion, laptop & smartphone | Access exam timetable (P501), dial page numbers via numeric keys, print A4 poster for noticeboard. |
| **P-3: Emergency Dispatcher** | Civil defense volunteer during coastal cyclone | Cell towers down, power grid offline, using handheld radio & phone camera | Scan animated QR burst or printed poster from relief shelter wall, read emergency routes offline. |
| **P-4: Accessible User** | Screen reader user (NVDA / TalkBack) | Desktop or mobile with assistive technology | Toggle Accessible Text Mode (`T`), navigate 4 Fastext links, listen to audio synthesizer (`M`). |

---

## 3. Test Environment & Hardware Emulation Setup

### 3.1 Network Profiles (Controlled Emulation)
Network throttling must be applied using Chrome DevTools Network tab or Linux `iproute2`/`tc netem`:

| Profile Name | Downlink Speed | Uplink Speed | Round-Trip Latency (RTT) | Packet Loss |
|---|---|---|---|---|
| **2G GPRS (Severe)** | 50 Kbps | 20 Kbps | 500 ms | 2.0% |
| **2G EDGE (Rural)** | 250 Kbps | 100 Kbps | 300 ms | 1.0% |
| **3G UMTS (Fringe)** | 1.0 Mbps | 384 Kbps | 150 ms | 0.5% |
| **Total Blackout** | 0 Kbps | 0 Kbps | Infinite | 100% |

### 3.2 Physical Hardware Test Matrix
- **Mobile Device A (Budget Android):** Android 10+, Chrome Mobile / Firefox, 720p display.
- **Mobile Device B (iOS Safari):** iOS 16+, Mobile Safari, Retina display.
- **Display Terminal (Broadcaster):** 1080p monitor displaying multi-frame QR burst at 3 FPS.
- **Paper Printout (Community Poster):** Standard A4 80gsm paper printed on monochrome laser printer.

---

## 4. Standardized Field Test Scenarios

### Scenario 1: Cold Start Under Rural 2G EDGE
1. Configure browser network throttling to **2G EDGE (250 Kbps / 300ms RTT)**.
2. Clear browser cache and service workers (`Application -> Clear storage`).
3. Navigate to `http://localhost:3000/pages/101`.
4. Measure and record:
   - **Time to First Byte (TTFB)**
   - **First Contentful Paint (FCP)** (Target: < 1,500 ms)
   - **Total Transferred Payload** (Target: < 10 KiB)
5. Repeat the exact test with the original Reuters article URL (`http://localhost:3000/api/v1/sources/extract`).
6. Compare data volume and load time.

### Scenario 2: Optical Air-Gap QR Transfer
1. On desktop terminal, open **Publisher Studio** -> select any bulletin -> click **QR / Poster**.
2. Select **Air-Gap QR Burst** tab. Observe animated QR frames cycling at 3 FPS.
3. On Mobile Device A, open `http://localhost:3000/terminal` and tap **SCAN QR**.
4. Hold mobile camera 25–40 cm from the computer screen.
5. Record:
   - Time to assemble all frames (target: < 4 seconds for 4 frames).
   - Verify SHA-256 integrity match.
   - Verify automatic redirection to the assembled Teletext bulletin.

### Scenario 3: Physical Printed Poster Noticeboard Test
1. In Publisher Studio, select an emergency bulletin (e.g. Cyclone Alert P101).
2. Click **Print Poster** -> print to standard monochrome A4 paper.
3. Affix printed poster to a wall under typical indoor lighting (300–500 lux).
4. Stand at distances of **0.5 m, 1.0 m, and 1.5 m**.
5. Aim standard smartphone camera at the printed QR code.
6. Verify successful decode at each distance and time to first scan.

### Scenario 4: Offline Reading in Airplane Mode
1. Open `http://localhost:3000/terminal?page=401`.
2. Tap **☆ SAVE OFFLINE** (observing carrier chirp and button changing to **★ SAVED OFFLINE**).
3. Toggle device to **Airplane Mode** (disconnect Wi-Fi, cellular data, and Bluetooth).
4. Close the browser tab and browser process completely.
5. Relaunch browser and navigate to `http://localhost:3000/saved`.
6. Tap saved page P401.
7. Verify:
   - Page loads instantly (< 50 ms) from IndexedDB.
   - Header displays `CACHED / OFFLINE` and `★ LOCAL COPY`.
   - Subpages 1 and 2 rotate properly without network requests.

### Scenario 5: Cryptographic Source Evidence Inspection
1. While reading bulletin P101, press **`E`** key (or tap **EVIDENCE [E]**).
2. In the opened **Source Evidence Explorer Drawer**:
   - Verify source publisher name and article URL are visible.
   - Verify human review approval badge (`✓ EDITORIALLY REVIEWED`).
   - Click each bullet point claim and verify that the corresponding sentence in the original text is highlighted.
   - Verify SHA-256 sentence hash matches.

---

## 5. Field Testing Evaluation Scorecard Template

Judges and evaluators can record experimental trials using this standardized format:

```markdown
### Field Test Trial Log

- **Evaluator Name / ID:** _______________________
- **Date & Location:** ___________________________
- **Device & OS:** _______________________________
- **Network Condition Tested:** [ ] 2G EDGE  [ ] 3G  [ ] Offline Airplane Mode

| Metric | Target Threshold | Measured Result | Pass / Fail |
|---|---|---|---|
| FCP under 2G EDGE | < 1,500 ms | _______ ms | [ ] PASS  [ ] FAIL |
| Total HTTP Transfer | < 10,240 B | _______ B  | [ ] PASS  [ ] FAIL |
| Air-Gap Burst Transfer Time | < 5.0 s | _______ s  | [ ] PASS  [ ] FAIL |
| Offline Cache Hit Time | < 100 ms | _______ ms | [ ] PASS  [ ] FAIL |
| Devanagari Hindi Text Integrity | 100% (No split conjuncts)| _______ %  | [ ] PASS  [ ] FAIL |
| Evidence Hash Match | 100% SHA-256 match | _______ %  | [ ] PASS  [ ] FAIL |
| System Usability Scale (SUS) Score | > 80 / 100 | _______ / 100 | [ ] PASS  [ ] FAIL |

**Qualitative Observations:**
_______________________________________________________________________________
_______________________________________________________________________________
```

