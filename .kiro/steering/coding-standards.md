---
inclusion: always
---

# PageCast — Coding Standards & Engineering Guide

## 1. TypeScript & Language Standards

### 1.1 Strict Mode & Immutability
- All code must run under strict TypeScript (`"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`).
- **Zero `any`:** Never use `any`. Use `unknown` with type guards or runtime validation (e.g. Zod).
- **Pure Functions:** Domain logic in `src/domain/` must consist of pure, deterministic functions without side effects.
- **Immutability:** Use `readonly` arrays, `Readonly<T>`, and immutable transformations (spread, `map`, `filter`, `reduce`) rather than in-place mutation.

### 1.2 Data Validation & Schemas
- Every external input (API payloads, query parameters, AI generation output, database rows) must be parsed through a **Zod schema** (`z.infer<typeof Schema>`).
- If data fails validation, handle the error gracefully with clear domain error types, never leaking raw stack traces to clients.

---

## 2. React 19 & Next.js 16 Conventions

### 2.1 Component Architecture
- **Server Components by Default:** Place all pages, layouts, and data-fetching views in Server Components.
- **Client Components (`"use client"`):** Isolate client components to the smallest possible interactive subtrees (e.g., `<TeletextRemoteControl />`, `<CrtScreen />`, `<EditorGrid />`).
- **No Heavy Client Libraries:** Do not introduce large UI component suites. Keep client bundles minimal.
- **Dangerous HTML:** `dangerouslySetInnerHTML` is forbidden unless strictly sanitized and verified for SVG icons or CRT effects.

### 2.2 Error Handling & Boundaries
- Use `error.tsx` and `not-found.tsx` at route boundaries.
- API route handlers must return structured JSON error envelopes:
```typescript
interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

---

## 3. Teletext Formatting & Typography Rules

### 3.1 40×24 Character Grid
- Every line of Teletext content must be padded or truncated to at most 40 characters.
- Multi-byte Unicode characters (e.g., Devanagari Hindi) require UTF-8 aware string slicing to avoid mid-character truncation and layout misalignment.
- Row 0 is the broadcast header line:
  `P[Page]  PAGECAST  [Day] [DD] [Mon]  [HH:MM:SS]` (e.g., `P100  PAGECAST  SAT 31 OCT  10:04:12`).
- Row 23 is the Fastext navigation prompt line:
  `RED: [Label]  GRN: [Label]  YEL: [Label]  CYN: [Label]`.

### 3.2 Palette & Color Tokens
- Only use the 8 standard Teletext colors defined in CSS design tokens:
  - Background: Black (`#000000`)
  - Foreground: White (`#ffffff`), Red (`#ff0000`), Green (`#00ff00`), Yellow (`#ffff00`), Blue (`#0000ff`), Magenta (`#ff00ff`), Cyan (`#00ffff`).
- Never use arbitrary hex colors or modern muted gradients in the Teletext rendering grid.

---

## 4. Accessibility & Inclusive Design (WCAG 2.1 AA)

- **High Contrast:** Classic Teletext colors against black provide contrast ratios exceeding 7:1 for white, yellow, cyan, and green.
- **Screen Reader Navigation:** Every Teletext page grid must be accompanied by an accessible, visually hidden screen-reader transcript (`sr-only` class) presenting the page content in readable linear paragraphs.
- **Keyboard Operability:** 
  - Numbers `0`–`9` dial pages.
  - Arrow keys `Up` / `Down` cycle pages (or sub-pages).
  - Keys `1`, `2`, `3`, `4` (or F1–F4) map to Fastext colors (Red, Green, Yellow, Cyan).
  - Focus rings must be clearly visible and styled in yellow or cyan against dark backgrounds.
- **Reduced Motion:** Honor `prefers-reduced-motion` media queries by disabling CRT flicker and scanline animations.

