---
inclusion: fileMatch
pattern: tests/**
---

# PageCast — Testing Strategy & Quality Standards

## 1. Test Architecture & Frameworks

PageCast maintains high confidence in core domain correctness, encoding integrity, and security boundaries through automated multi-layer testing:

- **Unit Testing:** [Vitest](https://vitest.dev/) for fast, in-memory execution of domain functions.
- **Property-Based Testing:** [fast-check](https://fast-check.dev/) for generative verification across thousands of randomized inputs, edge cases, and Unicode strings.
- **Security Testing:** Deterministic validation scripts (`scripts/check-env-safety.mjs`) ensuring zero secret leaks.

---

## 2. Testing Pyramid & Test Types

### 2.1 Domain Unit Tests (`tests/unit/`)
- Test deterministic pure functions:
  - Text wrapping to 40 columns without breaking words.
  - Page header generation with clock formatting.
  - Teletext row padding and color span merging.
  - Page pack serialization and deserialization round-trips.
  - Devanagari (Hindi) and multi-byte UTF-8 character length checks (`TextEncoder` vs `string.length`).

### 2.2 Property-Based Tests (`tests/property/`)
- Uses `fast-check` with a minimum of **100 runs per test** (and up to 1,000 runs for critical invariants):
  - **Grid Invariant:** For any arbitrary input string, the layout engine never produces a row exceeding 40 character cells, and never produces a page exceeding 24 rows.
  - **Budget Invariant:** For any generated PagePack adhering to domain generation constraints, `TextEncoder().encode(packJson).length` never exceeds 5,120 bytes.
  - **Round-Trip Invariant:** `deserialize(serialize(pagePack))` is deeply equivalent to the original `pagePack`.
  - **Unicode Stability:** No surrogate pairs or multi-byte glyphs are severed mid-byte during line truncations.

### 2.3 Integration & API Tests (`tests/integration/`)
- Mocked tests for:
  - Article fetcher SSRF defense (blocking `127.0.0.1`, `169.254.169.254`, `localhost`, etc.).
  - AI composer envelope generation and fallback logic when external APIs fail.

---

## 3. Coverage & Quality Thresholds

| Component | Target Coverage | Rationale |
| :--- | :--- | :--- |
| **Domain Logic (`src/domain/`)** | **≥ 85%** | Core layout, pack codec, and budget calculations must be flawless. |
| **Security Checks (`scripts/`)** | **100%** | Zero tolerance for secret leakage or unverified environment configurations. |
| **Components (`src/components/`)** | **≥ 70%** | Critical terminal controls, keyboard handlers, and accessibility attributes. |

---

## 4. Execution Commands

```bash
# Run Vitest in watch mode
pnpm test

# Run Vitest once for all unit & property tests
pnpm test:run

# Run full project quality verification suite
pnpm quality:check
```
