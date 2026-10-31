# PageCast — 3-Minute Hackathon Video Demo Script (DEMO)
## Kiroween 2026 Hackathon Presentation Walkthrough

**Category:** Resurrection Category  
**Maximum Runtime:** 180 seconds (3 minutes)  
**Presenter:** Solo Developer / Architect  
**Visual Style:** Screen capture + live phone camera picture-in-picture + authentic CRT audio

---

## Storyboard & Timecoded Beat Sheet

```
0:00 ──────────────── 0:25 ──────────────── 0:55 ──────────────── 1:25 ──────────────── 1:55 ──────────────── 2:25 ──────────────── 3:00
[The Problem/Hook]   [Terminal Reader]    [Evidence Explorer]  [Data Efficiency Lab] [Community Kit & QR]  [Offline PWA Demo]   [Kiro & Close]
```

---

### [0:00 – 0:25] ACT I: The Modern Web Bloat Crisis & The Ceefax Resurrection
**Visual:**
- Screen opens on a standard modern news website trying to load on a throttled 2G connection (spinner hangs, 4.2 MB transferring, 25 trackers loading, layout breaking).
- Cut to black with green phosphor flash: **PAGECAST P100**.

**Audio / Voiceover:**
> *"In 2026, the average news webpage transfers over 3 megabytes of bloated JavaScript, tracking pixels, and heavy ads. During cyclones, earthquakes, or rural power cuts, modern websites don't just load slowly—they fail completely.*
>
> *Fifty years ago, the BBC invented Ceefax: text news broadcast over TV signals using virtually zero bandwidth. Today, we are resurrecting Ceefax for the modern emergency era. Welcome to **PageCast**."*

---

### [0:25 – 0:55] ACT II: The Web Terminal Reader Experience
**Visual:**
- Full-screen CRT Web Terminal at `/terminal`.
- Keyboard typing `1`-`0`-`1`: yellow dialing buffer pulses `DIALING: P101__`, then instantly tunes with an authentic teletext tuning chirp.
- Show P101 (Climate Accord). Press right arrow `→` to step subpages `01/02` -> `02/02`.
- Press **`R`** (Red key) -> jumps immediately to P102 (Hindi bulletin: डिजिटल साक्षरता).
- Zoom in on Hindi text: complex conjuncts (क्ष, ज्ञ, त्त्व) perfectly rendered inside the 40×25 grid without clipping.

**Audio / Voiceover:**
> *"PageCast operates like an authentic cathode-ray tube terminal. You dial 3-digit page numbers, jump across categories using four Fastext colored keys, or step subpage carousels.*
>
> *Every bulletin is strictly capped under **10 kilobytes**—three hundred times smaller than the modern web. And crucially, our Unicode layout engine renders complex Devanagari Hindi text with 100% grapheme cluster preservation."*

---

### [0:55 – 1:25] ACT III: Transparency & The Source Evidence Explorer
**Visual:**
- While on P101, press **`E`** on the keyboard.
- The **Source Evidence Explorer Drawer** slides out smoothly from the right.
- Shows publisher verification badge (`✓ EDITORIALLY REVIEWED`).
- Click on bullet point 1: the exact matching sentence in the original Reuters article highlights in yellow with its matching **SHA-256 sentence hash**.

**Audio / Voiceover:**
> *"Modern AI summarizers hallucinate claims with zero accountability. PageCast introduces the **Source Evidence Explorer**. By pressing `E`, any reader can inspect the exact sentence citations behind every single claim, verified by cryptographic SHA-256 hashes and human editorial review timestamps. Zero hallucinations. 100% provenance."*

---

### [1:25 – 1:55] ACT IV: Data Efficiency Lab & Data Saver Profile
**Visual:**
- Navigate to `/lab`. Show interactive payload reduction dashboard.
- Select case: *State Emergency Cyclone Red Alert*. Shows 99.7% payload drop (2.8 MB down to 2.4 KB) and 90-second load time reduction under 2G.
- Return to terminal. Press **`D`** (Data Saver Mode).
- Instant transformation: web fonts switch to system monospace, CRT scanlines and glow disable, session telemetry displays: `⚡ DATA SAVER ON • Session: 2.4 KB`.

**Audio / Voiceover:**
> *"In our **Data Efficiency Lab**, we prove this mathematically: PageCast reduces payload weight by over 99%, turning a 90-second timeout into an instant 0.1-second read.*
>
> *With our **Data Saver Profile**, readers on metered 2G or low batteries can press `D` to disable all GPU shaders and web fonts, dropping bandwidth to zero by serving strictly from local cache."*

---

### [1:55 – 2:25] ACT V: Community Broadcast Kit & Air-Gap QR Transfer
**Visual:**
- Switch to `/publisher`. Open **Community Presets** tab. Show *Community Health Clinic Alert* and *Disaster Alert* presets in English and Hindi.
- Click **Print Poster**: opens A4 printable poster generator with clean high-contrast Teletext layout and scannable QR.
- Click **Air-Gap QR Burst**: show animated QR code cycling frames at 3 FPS (`PAGECAST:v1:...`).
- Picture-in-picture: aim a real mobile phone camera at the screen. The phone decodes the multi-frame optical burst and opens the complete bulletin with no internet connection.

**Audio / Voiceover:**
> *"PageCast isn't just for journalists. Our **Community Broadcast Kit** gives clinic workers, schools, and emergency responders one-click bilingual templates.*
>
> *Broadcasters can generate printable A4 posters for physical village noticeboards, or broadcast animated **Air-Gap QR bursts** that transfer complete offline bulletins directly into a phone camera when cell towers are completely down."*

---

### [2:25 – 2:50] ACT VI: 100% Offline PWA & Airplane Mode
**Visual:**
- On mobile device, tap **☆ SAVE OFFLINE** (audio chirp plays; button turns green **★ SAVED OFFLINE**).
- Toggle device into **Airplane Mode** (Wi-Fi, Cellular, Bluetooth all OFF).
- Close browser, open browser, navigate to Saved Pages (`/saved`).
- Tap P401: loads in under 20 milliseconds from local IndexedDB with `CACHED / OFFLINE` indicator. Press `M` to demonstrate local carrier audio chirp.

**Audio / Voiceover:**
> *"Every saved page lives inside an offline IndexedDB vault. Watch this: we toggle Airplane Mode on. Zero connectivity. The reader opens instantly in under 20 milliseconds, fully browsable, with complete audio synthesis and speech narration operating entirely on-device."*

---

### [2:50 – 3:00] ACT VII: Kiro Integration & Closing
**Visual:**
- Show `.kiro/` directory: steering files, pre-submit hooks, and terminal running `npx tsx src/server/mcp/domain-qa-server.ts`.
- Final screen: GitHub repo URL, Devpost badge, PageCast P100 logo.

**Audio / Voiceover:**
> *"Built autonomously with **Kiro**—from architecture steering files and pre-commit budget hooks to a custom Model Context Protocol QA server. PageCast brings resilient, low-bandwidth communication back to the modern world. Open source, zero tracking, and ready for deployment."*

