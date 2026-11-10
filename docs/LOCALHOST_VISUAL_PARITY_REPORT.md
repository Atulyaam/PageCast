# PAGECAST — LOCALHOST VISUAL PARITY, STALE SERVER & HYDRATION REPAIR REPORT

**Project:** PageCast  
**Hardware Specification:** System PT-4025 (Personal Information Terminal)  
**Date:** November 10, 2026  
**Status:** **RESOLVED & VERIFIED ON LOCALHOST:3000**  
**Verified Development Server:** Node PID `31936` on `http://localhost:3000`  
**Automated Quality Baseline:** 446 tests passing across 69 test files (100% green)  
**Quality Gate Exit Codes:** Env: `0`, Format: `0`, Lint: `0`, Typecheck: `0`, Tests: `0`, Build: `0`

---

## 1. Executive Summary & Root Cause Diagnosis

### 1.1 Root Cause of the Old UI Appearing on Localhost
The browser display of the old flat black layout on `http://localhost:3000` was caused by a combination of three distinct issues:

1. **Stale Background Next.js Process:**
   A Next.js development server process (PID `33616`, spawned from `npm run dev` PID `26980`) had been continuously running since `8:07:45 PM`—prior to the PT-4025 visual reconstruction commits (`d81ac3d` and `9130c2f`). The process held stale in-memory module graphs and client bundle chunks in its `.next/dev` cache.

2. **Turbopack HMR Blocked by Content Security Policy (`eval()` Error):**
   Next.js 16.4.3 Turbopack development mode relies on `eval()` and `new Function()` for source map evaluation, runtime debugging callstack reconstruction, and Fast Refresh / Hot Module Replacement (HMR).
   The CSP header generated in `next.config.ts` was:
   ```http
   Content-Security-Policy: ... script-src 'self' 'unsafe-inline'; ...
   ```
   Because `'unsafe-eval'` was absent, the browser CSP engine blocked Turbopack with:
   ```
   eval() is not supported in this environment. If this page was served with a `Content-Security-Policy` header, make sure that `unsafe-eval` is included. React requires eval() in development mode for various debugging features...
   ```
   Because Turbopack's runtime threw this security error on client startup, HMR client injection crashed, preventing the client runtime from receiving or applying updated chunks.

3. **React Hydration Mismatch:**
   Because the server-side renderer read updated files from disk (generating `max-w-6xl` container and the new `DeviceBrandPlate` markup with silkscreen elements), but the client browser was executing stale chunks from before the edit (with `max-w-5xl` and older classes):
   - Server: `<main className="flex w-full max-w-6xl flex-1 ...">`
   - Client: `<main className="flex w-full max-w-5xl flex-1 ...">`
   Additionally, `PageCastDevice.tsx` and `useOnlineStatus.ts` had non-deterministic `useState` initializers querying `window` and `navigator.onLine` during initial render, which differed between Node SSR and browser client environments. When React encountered this mismatch along with the CSP evaluation crash, client-side hydration aborted and failed to mount the updated interactive hardware deck.

---

## 2. Server & Process Diagnosis

### 2.1 Process Audit on Windows (Port 3000)
A forensic process query using Windows CIM/PowerShell identified the stale processes:

| Process ID | Creation Time | Executable Path & Command Line | Resolution |
| :--- | :--- | :--- | :--- |
| **`26980`** | `8:07:38 PM` | `node.exe .../npm-cli.js run dev` | **Terminated** (stale parent) |
| **`5872`** | `8:07:40 PM` | `node.exe .../next dev` | **Terminated** (stale runner) |
| **`33616`** | `8:07:45 PM` | `node.exe .../start-server.js` (Listening on port 3000) | **Terminated** (stale server) |
| **`24540`** | `8:08:20 PM` | `node.exe .../pool_entry-[turbopack-node]` | **Terminated** (stale worker pool) |
| **`21416` / `10512`** | `11:12:36 AM` | `@notionhq/notion-mcp-server` | **Untouched** (unrelated tool) |

### 2.2 Clean Server Launch
1. Terminated PIDs `33616`, `24540`, `5872`, `17800`, `26980` using `Stop-Process -Force`.
2. Confirmed port 3000 was completely free with zero listening sockets.
3. Removed stale `.next` cache directory: `Remove-Item -Recurse -Force ".next"`.
4. Spawned clean development server from repository root: `pnpm dev`.
5. Verified new active listener:
   - **PID:** `31936`
   - **Command Line:** `node.exe ...\next\dist\server\lib\start-server.js`
   - **Port:** `3000` (`::1:3000` and `0.0.0.0:3000`)
   - **Status:** `LISTEN / ESTABLISHED`

---

## 3. Exact Fixes Applied

### 3.1 Content Security Policy Fix (`next.config.ts`)
To allow Next.js 16.4.3 / Turbopack development HMR without weakening production security:
- Created `buildCspHeader(isDev: boolean)`.
- In development (`process.env.NODE_ENV === "development"`), `script-src` includes `'unsafe-eval'`:
  `script-src 'self' 'unsafe-inline' 'unsafe-eval';`
- In production (`process.env.NODE_ENV !== "development"`), `script-src` strictly omits `'unsafe-eval'`:
  `script-src 'self' 'unsafe-inline';`
- All other strict directives (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, etc.) remain 100% enforced in all modes.
- Exported `productionCspHeader` and added automated unit tests in `tests/unit/security/security-headers.test.ts` to guarantee `'unsafe-eval'` never enters production builds.

```typescript
// next.config.ts
export function buildCspHeader(isDev: boolean = false): string {
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval';"
    : "script-src 'self' 'unsafe-inline';";

  return `
  default-src 'self';
  ${scriptSrc}
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com;
  media-src 'self' blob:;
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`
    .replace(/\s{2,}/g, " ")
    .trim();
}
```

### 3.2 Hydration Fixes (`PageCastDevice.tsx` & `useOnlineStatus.ts`)
1. **TTS & Speech Capability External Store:**
   Replaced non-deterministic `useState(() => typeof window === "undefined" ? false : getBulletinSpeechReader().isSupported)` with React 19's `useSyncExternalStore`:
   ```typescript
   function subscribeTts(callback: () => void) {
     if (typeof window === "undefined") return () => {};
     return getBulletinSpeechReader().subscribe(callback);
   }
   function getTtsSupportedSnapshot(): boolean {
     return getBulletinSpeechReader().isSupported;
   }
   function getServerTtsSupportedSnapshot(): boolean {
     return false;
   }
   // In component:
   const ttsSupported = useSyncExternalStore(subscribeTts, getTtsSupportedSnapshot, getServerTtsSupportedSnapshot);
   const isSpeaking = useSyncExternalStore(subscribeTts, getTtsSpeakingSnapshot, getServerTtsSpeakingSnapshot);
   ```
   This guarantees identical server and client initial render trees (`ttsSupported = false` initially), eliminating hydration mismatch warnings while seamlessly updating post-hydration.

2. **Online Status External Store (`src/hooks/useOnlineStatus.ts`):**
   Replaced `useState` querying `navigator.onLine` with `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`, ensuring deterministic server rendering and automatic synchronization with browser online/offline events.

3. **Container Consistency Across Routes (`/terminal` and `/pages/[pageNumber]`):**
   Aligned container widths from `max-w-5xl` to `max-w-6xl` in `src/app/terminal/page.tsx` and `src/app/pages/[pageNumber]/page.tsx`, matching `src/app/page.tsx` and preventing layout shifts or container discrepancies during navigation.

---

## 4. Live Browser Inspection & Visual Parity Verification

Direct headless Chrome inspection via Chrome DevTools Protocol (`CDP`) on `http://localhost:3000` confirmed zero console errors, correct DOM mounting, and active styling:

```json
{
  "mainClasses": "flex w-full max-w-6xl flex-1 flex-col items-center justify-center",
  "brandPlateExists": true,
  "bodyBg": "rgb(214, 212, 202)",
  "title": "PageCast — Low-Bandwidth Teletext Platform",
  "consoleErrorsCount": 0
}
```

### Route-by-Route Verification Matrix on Localhost:3000

| Route Tested | Viewport | Verified Background (`bodyBg`) | Console Errors | Visual Result |
| :--- | :--- | :--- | :--- | :--- |
| **Home (`/`)** | 1440×900 | `rgb(214, 212, 202)` (`#d6d4ca`) | **0** | **PASS**: Full PT-4025 chassis, CRT well, amber buffer, mechanical keypad |
| **Terminal (`/terminal`)** | 1440×900 | `rgb(214, 212, 202)` (`#d6d4ca`) | **0** | **PASS**: Standalone terminal in matching hardware enclosure |
| **Catalogue (`/catalogue`)** | 1440×900 | `rgb(214, 212, 202)` (`#d6d4ca`) | **0** | **PASS**: Directory console with matching industrial header |
| **Saved Pages (`/saved`)** | 1440×900 | `rgb(214, 212, 202)` (`#d6d4ca`) | **0** | **PASS**: Offline vault console in cohesive hardware aesthetic |
| **Publisher (`/publisher/ingest`)**| 1440×900 | `rgb(214, 212, 202)` (`#d6d4ca`) | **0** | **PASS**: Studio ingestion deck on warm workbench background |
| **Efficiency Lab (`/lab`)** | 1440×900 | `rgb(214, 212, 202)` (`#d6d4ca`) | **0** | **PASS**: Compression benchmarks and telemetry deck |
| **Home (`/`)** | 375×812 | `rgb(214, 212, 202)` (`#d6d4ca`) | **0** | **PASS**: Mobile stacked layout, 44px+ touch keycaps, zero overflow |
| **Terminal (`/terminal`)** | 375×812 | `rgb(214, 212, 202)` (`#d6d4ca`) | **0** | **PASS**: Clean mobile terminal presentation without clipping |

### Updated Screenshot References in `docs/screenshots/`
All screenshots have been refreshed directly from the verified localhost server:
- Desktop Home: `docs/screenshots/final_home_1440.png`
- Dedicated Terminal: `docs/screenshots/final_terminal_1440.png`
- Publisher Studio: `docs/screenshots/final_publisher_1440.png`
- Saved Pages Vault: `docs/screenshots/final_saved_1440.png`
- Efficiency Lab: `docs/screenshots/final_lab_1440.png`
- Directory Catalogue: `docs/screenshots/final_catalogue_1440.png`
- Mobile Home: `docs/screenshots/final_home_375.png`

---

## 5. Quality Gate Results

The full verification gate was executed via `pnpm quality:check`:

```powershell
pnpm quality:check
```

| Check Suite | Tool / Command | Result | Exit Code |
| :--- | :--- | :--- | :--- |
| **Environment Safety** | `node scripts/check-env-safety.mjs` | All required env vars present; no secrets leaked | `0` |
| **Code Formatting** | `prettier --check .` | All matched files use Prettier code style | `0` |
| **Linting** | `eslint .` | 0 errors, 0 warnings (no hooks or cascading render violations) | `0` |
| **Type Checking** | `tsc --noEmit` | Clean TypeScript compilation | `0` |
| **Automated Tests** | `vitest run` | 446 / 446 tests passing across 69 test files | `0` |
| **Production Build** | `next build` | All 24 routes built successfully | `0` |

---

## 6. How to Verify on Your Browser

1. The development server is currently running on `http://localhost:3000` (PID `31936`).
2. Open Chrome (or Chrome Incognito / DevTools with "Disable cache" checked).
3. Navigate to:
   ```
   http://localhost:3000/
   ```
4. You will see the beige/graphite industrial PT-4025 personal information broadcast terminal with:
   - Warm titanium chassis body (`#a6a49a`) and chamfered highlight edge on a warm desk background (`#d6d4ca`).
   - Deep anti-glare CRT monitor well (`#101713`) with subtle scanlines and phosphor glow.
   - Mechanical 3×4 numeric keycap matrix with physical 3.5px extrusion shadows.
   - Illuminated warm amber buffer readout window (`#d1a15d`).
   - Four color Fastext rocker buttons (Red, Green, Yellow, Cyan).
   - Zero console errors in Chrome DevTools.
