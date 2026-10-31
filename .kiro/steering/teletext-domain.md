---
inclusion: fileMatch
pattern: src/domain/**
---

# PageCast — Teletext Domain Engine Steering Guide

## 1. Teletext Domain Concepts & Invariants

The `src/domain/` directory contains pure, deterministic engines powering PageCast. It has zero dependencies on React, Next.js, or browser APIs.

### 1.1 The 40×24 Teletext Character Grid
- Every Teletext page is composed of exactly **24 rows**.
- Every row contains at most **40 character cells**.
- Total character capacity per page: `24 * 40 = 960 character cells`.
- Row 0 is the **Header Row** (reserved for page number, magazine name, date, time).
- Row 23 is the **Navigation Row** (Fastext prompts: Red, Green, Yellow, Cyan links).
- Rows 1–22 contain **Content Rows** (headlines, dividers, body text, sub-headings, ASCII mosaic art).

### 1.2 Magazine & Page Indexing Structure
- Page numbers are 3-digit integers ranging from `100` to `899`.
- The first digit (`1`–`8`) represents the **Magazine** (e.g., `1xx` = General News, `2xx` = Business, `3xx` = Sport, `4xx` = Weather/Transit).
- Numbers `000`–`099` and `900`–`999` are invalid broadcast page numbers.
- **Page 100** is universally reserved as the **Main Index / Home Page**.
- Multi-page articles use **Sub-Page Notation** (e.g. `Page 102, Sub-page 01/03`, `02/03`, `03/03`).

### 1.3 The 8 Broadcast Colors
- `BLACK` (`#000000`) — Canvas background
- `WHITE` (`#ffffff`) — Primary body text
- `RED` (`#ff0000`) — Urgent alerts & Fastext Button 1
- `GREEN` (`#00ff00`) — Status/success & Fastext Button 2
- `YELLOW` (`#ffff00`) — Headlines, highlights & Fastext Button 3
- `BLUE` (`#0000ff`) — Structural dividers & dark contrast
- `MAGENTA` (`#ff00ff`) — Section titles & decorative graphics
- `CYAN` (`#00ffff`) — Timestamps, metadata & Fastext Button 4

---

## 2. Page Pack Structure & Serialization

A **Page Pack** is a lightweight, self-contained JSON data structure representing an entire multi-page teletext bulletin:

```typescript
export interface TeletextSpan {
  text: string;
  color?: 'white' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan';
  doubleHeight?: boolean;
}

export interface TeletextRow {
  spans: readonly TeletextSpan[];
}

export interface TeletextPage {
  pageNumber: number; // 100 - 899
  subPageNumber?: number; // 1 - 99
  subPageCount?: number;
  title: string;
  rows: readonly TeletextRow[]; // Length <= 24
  fastext: {
    red: number;
    green: number;
    yellow: number;
    cyan: number;
  };
}

export interface PagePack {
  id: string;
  version: 1;
  title: string;
  createdAt: string;
  pages: readonly TeletextPage[];
}
```

---

## 3. Sub-5KB Byte Budget Enforcement

### 3.1 The 5,120-Byte Hard Limit
- In PageCast, an entire Page Pack (including index, 2–4 story pages, and metadata) must weigh **less than or equal to 5,120 bytes (5 KB) uncompressed UTF-8 JSON**.
- When compressed with gzip or brotli over HTTP or service worker caches, this typically delivers under **1.8 KB over the wire**.

### 3.2 UTF-8 Multi-Byte Character Budgeting
- In JavaScript, `string.length` counts UTF-16 code units, not UTF-8 bytes.
- ASCII characters (English text, punctuation) = 1 byte each.
- Extended Latin, accented characters = 2 bytes each.
- Devanagari (Hindi) and CJK characters = 3 bytes each.
- Emojis = 4 bytes each.
- **Rule:** The byte budget calculator MUST measure serialized UTF-8 bytes using `new TextEncoder().encode(serialized).length`, rejecting any pack whose serialized byte length exceeds 5,120 bytes.

