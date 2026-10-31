---
inclusion: fileMatch
pattern: src/**/*.{css,tsx}
---

# PageCast — UI/UX Steering Guide

## 1. Visual Identity & Aesthetic Philosophy

PageCast blends authentic 1980s broadcast Teletext with modern, accessible web usability. The terminal looks and feels like a vintage CRT television running Ceefax, while providing intuitive mouse, touch, and keyboard controls.

---

## 2. Design Tokens & Color Palette

All styling utilizes the CSS design tokens defined in `src/styles/globals.css`:

### 2.1 The 8 Broadcast Colors
- `--color-teletext-black`: `#000000` (Canvas background)
- `--color-teletext-white`: `#ffffff` (Primary text & numerals)
- `--color-teletext-red`: `#ff0000` (Alerts, Fastext button 1)
- `--color-teletext-green`: `#00ff00` (Success, Fastext button 2)
- `--color-teletext-yellow`: `#ffff00` (Headlines, accents, Fastext button 3)
- `--color-teletext-blue`: `#0000ff` (Decorative borders, dark backgrounds)
- `--color-teletext-magenta`: `#ff00ff` (Topic labels, highlights)
- `--color-teletext-cyan`: `#00ffff` (Metadata, timestamps, Fastext button 4)

### 2.2 Typography Tokens
- **Teletext Monospace:** `'VT323', 'Space Mono', 'Courier New', monospace`
  - Fixed-pitch character cells ensuring exact 40×24 alignment.
  - Line-height: `1.1` to `1.2` with zero letter-spacing distortion.
- **Modern UI Sans:** `'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  - Used strictly for outer publisher controls, navigation headers, and metadata forms outside the CRT terminal canvas.

---

## 3. The 40×24 Teletext Grid Layout

```text
Row 0:  [P100  PAGECAST  SAT 31 OCT  10:04:12] (Broadcast Header)
Row 1:  [========================================] (Divider / Topic Banner)
Row 2:  [PAGECAST HEADLINE IN TELETEXT YELLOW    ]
Row 3:  [                                        ]
Row 4-21: [Body text wrapped to 40 columns       ]
          [and optional Teletext mosaic ASCII art ]
Row 22: [                                        ]
Row 23: [RED: News  GRN: Weather  YEL: Sport  CYN: Index] (Fastext Bar)
```

- **Exact Grid Cell Aspect Ratio:** Character cells are taller than they are wide (approx. 1:1.6 to 1:2 aspect ratio).
- **Responsive Scaling:** The CRT canvas maintains its 40×24 aspect ratio across viewport sizes using CSS `aspect-ratio: 4/3` or `clamp()`, scaling text size dynamically via `rem` or container query units (`cqw`).

---

## 4. CRT Visual Effects & Polish

- **Scanlines:** Subtle horizontal scanlines applied via CSS repeating linear gradients (`rgba(0,0,0,0.25)`).
- **Phosphor Glow:** Text shadow (`text-shadow: 0 0 2px currentColor`) simulating CRT cathode emission.
- **CRT Curvature & Vignette:** Radial gradient shading around screen edges to simulate glass bulb curve.
- **Accessibility Toggle:** The CRT effect (scanlines, flicker, curvature) must be toggleable by the user, and automatically disabled when `prefers-reduced-motion` is detected.

---

## 5. Interaction & Navigation Models

### 5.1 Reader Experience
- **Page Dialing:** 3-digit entry (e.g. typing `1`, `0`, `2` switches to Page 102). A visual page dialing prompt shows `P1__` -> `P10_` -> `P102`.
- **Fastext Buttons:** Four prominent colored buttons at the bottom of the screen (Red, Green, Yellow, Cyan) with clear keyboard shortcuts (`1`, `2`, `3`, `4` or `F1`–`F4`).
- **Sub-Page Carousel:** If a story spans sub-pages (e.g. `102/01`, `102/02`), provide automatic 15-second cycling or instant manual `Left`/`Right` arrow keys.
- **Page Index (100):** Pressing `Escape` or the Cyan shortcut returns directly to the Main Index (Page 100).

### 5.2 Publisher Studio Experience
- **Input Area:** Clean URL input with paste detection or direct raw article markdown/text input.
- **Conversion Workflow:** 
  1. Fetching & extraction progress.
  2. Gemini AI summarization and page division.
  3. Interactive 40×24 side-by-side grid editor.
  4. Byte budget progress bar (e.g. `3,420 / 5,120 bytes (66%)`).
- **Publish Action:** Generates shareable slug and offline-ready Page Pack JSON.
