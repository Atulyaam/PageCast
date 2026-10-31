# PageCast — Production Smoke Test Plan (TASK-S5-15)

**Status:** Approved for Verification  
**Version:** 1.0.0  
**Date:** 2026-10-31  
**Category:** CI & Production Deployment Readiness (Sprint 5)  
**Requirements Addressed:** NFR-006, TR-026  

---

## 1. Overview & Test Execution Protocol

This smoke test plan defines the 15 end-to-end verification steps required to validate a live PageCast production deployment. Tests must be executed against staging or production environments prior to final release sign-off.

---

## 2. 15-Point Production Smoke Test Checklist

| Step # | Verification Item | Test Action | Expected Result | Pass/Fail |
|---|---|---|---|---|
| **01** | **Root Index Load** | Navigate to `/` or `/pages/100` | Renders P100 Main Index in under 1 second; CRT green/yellow typography visible with zero horizontal scrollbars. | [ ] |
| **02** | **Direct Page Delivery** | Fetch `/api/v1/pages/101` | Returns HTTP 200 with JSON PagePack payload; `Cache-Control: public, max-age=60` header present. | [ ] |
| **03** | **Numeric Buffer Dialing** | In Terminal, press key sequence `2` → `0` → `0` | Header displays dialing buffer `P2--` → `P20-` → `P200`; terminal instantly switches to Page 200. | [ ] |
| **04** | **Fastext Color Navigation** | In Terminal on P100, click **RED** or press `R` | Terminal hops directly to Page 101; URL shallow sync updates to `/pages/101`. | [ ] |
| **05** | **Subpage Carousel** | Navigate to multi-page bulletin; press `→` or click next subpage tab | Header updates to `01/02` → `02/02`; second subpage renders with accurate row content. | [ ] |
| **06** | **Hindi Devanagari Typography** | Navigate to Page 102 or Page 401 | Renders Hindi Devanagari glyphs; matras and conjuncts fit within logical cells with zero row clipping. | [ ] |
| **07** | **Audio Carrier Chirp & TTS** | Press `M` or click Audio Controls on P101 | Web Audio API emits authentic 1200 Hz carrier frequency chirp; speech synthesis reads headline aloud. | [ ] |
| **08** | **Accessible Text Mode** | Press `T` or click "Accessible View" | View switches from CRT raster to semantic plain text article; contrast modes (Light/Dark/Standard) function. | [ ] |
| **09** | **PWA Manifest & Service Worker** | Inspect Network tab for `/manifest.webmanifest` and `/sw.js` | Manifest returns `application/manifest+json`; service worker activates and pre-caches `/pages/100`. | [ ] |
| **10** | **Offline Vault Persistence** | Click "Save Bulletin" on P101, toggle DevTools Offline mode, reload | Page 101 loads immediately from IndexedDB with "CACHED / OFFLINE" status indicator in header. | [ ] |
| **11** | **Optical QR & Air-Gap Burst** | Open Export Dialog on P101 -> Select "Air-Gap Burst" | Generates high-contrast animated multi-frame QR codes cycling at user-selected frame rate (3–10 FPS). | [ ] |
| **12** | **Publisher Studio Review Gate** | Create draft in `/publisher`; attempt publishing without checking review | "Confirm & Publish" button remains disabled until human review timestamp and all checks are confirmed. | [ ] |
| **13** | **Security Headers & CSP** | Run `curl -I https://your-domain.com/` | `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and CSP headers present. | [ ] |
| **14** | **API Rate Limiter Throttling** | Send 35 rapid requests to `/api/v1/sources/extract` | Requests 1–30 succeed; request 31 returns `HTTP 429 Too Many Requests` with `Retry-After` header. | [ ] |
| **15** | **Error Boundary & Not Found** | Navigate to non-existent route `/pages/999` | Displays Teletext P404 CRT screen ("SIGNAL LOST") with Fastext recovery links; zero stack traces leaked. | [ ] |

---

## 3. Physical Device Testing Guidelines

*Note regarding physical optical transfer and mobile cameras:*
- Automated unit/integration tests (`tests/unit/qr/multi-frame-codec.test.ts`, `tests/unit/components/qr-scanner.test.ts`) verify cryptographic reassembly algorithms and state machines.
- **Physical air-gap optical transfers** (pointing a physical smartphone camera at a laptop screen displaying animated QR bursts) must be executed manually using two physical devices according to the protocol above before declaring complete physical verification.
