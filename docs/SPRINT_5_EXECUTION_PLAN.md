# SPRINT 5 MASTER EXECUTION PLAN
## Quality Hardening, Accessibility, Performance & Production Deployment

**Sprint:** Sprint 5  
**Baseline Test Suite:** 312 tests passing across 52 test files  
**Target Completion:** Zero P0 defects, 100% Quality Gate, Full WCAG 2.2 AA and Production Runbook  

---

## 1. Execution Order & Task Breakdown

### Phase B — Defect Triage & Security Hardening

#### Task S5-01: P0 Defect Triage & Request Body Size Limits (SEC-008, TR-013)
- **Goal:** Implement strict body size and content-length validation before parsing JSON on all API endpoints.
- **Files:**
  - `src/server/security/request-limits.ts`
  - Integration with `/api/v1/sources/extract`, `/api/v1/sources/from-text`, `/api/v1/bulletins/compose`, `/api/v1/bulletins/convert`, `/api/v1/pages/publish`, `/api/v1/pages/validate`
  - `tests/unit/security/request-limits.test.ts`
- **Acceptance:** Oversized requests (>1 MiB or >10 KiB for PagePacks) rejected with HTTP 413 Payload Too Large before memory consumption.

#### Task S5-02: Production-Appropriate API Rate Limiting (TR-014, §10, §19-S5)
- **Goal:** Protect extraction and AI conversion endpoints from spam and financial exhaustion with sliding window rate limiting.
- **Files:**
  - `src/server/security/rate-limiter.ts`
  - Integrated into `/api/v1/sources/*` and `/api/v1/bulletins/*`
  - `tests/unit/security/rate-limiter.test.ts`
- **Acceptance:** Returns HTTP 429 Too Many Requests with `Retry-After` header when limit is exceeded. Handles trusted proxy IP resolution (`x-forwarded-for` or client IP).

#### Task S5-03: Security Headers & Content Security Policy (SEC-010, §19-S5)
- **Goal:** Implement robust HTTP security headers in `next.config.ts`.
- **Files:**
  - `next.config.ts`
  - `tests/unit/security/security-headers.test.ts`
- **Acceptance:** Strict headers applied: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(self), microphone=()`. Allows Next.js, local fonts, and Supabase connections without console errors.

#### Task S5-04: Security Regression Test Suite & Report (SEC-001..013)
- **Goal:** Run comprehensive security regression testing covering SSRF, XSS, dangerous HTML injection, prompt injection, and QR safety.
- **Files:**
  - `tests/security/ssrf-regression.test.ts`
  - `tests/security/xss-sanitization.test.ts`
  - `docs/SECURITY_REGRESSION_REPORT.md`
- **Acceptance:** 100% security tests pass. All private IP addresses and loopbacks blocked.

---

### Phase C — Reliability & Observability

#### Task S5-05: Error Boundaries & Teletext Failure States
- **Goal:** Prevent application crashes with branded Teletext CRT error screens and not-found fallbacks.
- **Files:**
  - `src/app/error.tsx`
  - `src/app/global-error.tsx`
  - `src/app/not-found.tsx`
  - `src/components/teletext/TerminalCrashBoundary.tsx`
  - `tests/unit/components/error-boundary.test.ts`
- **Acceptance:** Uncaught errors render a retro CRT error screen with recovery actions ("RETRY TUNING", "RETURN TO P100"). Zero leaked stack traces in production.

#### Task S5-06: Structured Server Logging (NFR-014)
- **Goal:** Implement standardized JSON logging with request correlation IDs and automatic PII/credential scrubbing.
- **Files:**
  - `src/server/logging/logger.ts`
  - `tests/unit/logging/logger.test.ts`
- **Acceptance:** Emits structured JSON logs `{ timestamp, level, correlationId, route, durationMs, message }`. Redacts API keys, passwords, and private full-text articles.

---

### Phase D — Accessibility & Design Quality

#### Task S5-07: Automated Accessibility Audit (NFR-011, WCAG 2.2 AA)
- **Goal:** Implement automated accessibility checks using `axe-core`, add modal focus trapping, and verify color contrast.
- **Files:**
  - `src/components/teletext/FocusTrap.tsx`
  - Modals updated: `ImportDialog.tsx`, `QrScannerModal.tsx`, `ExportDialog.tsx`, `KeyboardShortcutsModal.tsx`
  - `tests/unit/accessibility/axe-audit.test.ts`
  - `docs/ACCESSIBILITY_AUDIT_REPORT.md`
- **Acceptance:** Zero critical/serious axe-core violations on main user flows. Modals trap focus and restore focus on dismiss.

#### Task S5-08: Responsive Design & Visual Polish (UXR-017, UXR-016)
- **Goal:** Ensure all screens render cleanly on mobile viewports (down to 360px), respect `prefers-reduced-motion`, and preserve Hindi typography.
- **Files:**
  - `src/components/publisher/BulletinComposer.tsx`
  - `src/components/publisher/TeletextEditor.tsx`
  - `src/components/teletext/TeletextGrid.tsx`
  - `tests/unit/components/responsive-layout.test.ts`
- **Acceptance:** No horizontal overflow at 360px width. Scanlines and glow disabled under reduced-motion.

---

### Phase E — Performance Engineering

#### Task S5-09: Performance Audit, Bundle Optimization & Code Splitting (PERF-001..003)
- **Goal:** Optimize reader route bundle size, measure payload budgets, and lazy-load heavy non-critical dependencies.
- **Files:**
  - `src/components/teletext/WebTerminal.tsx` (dynamic imports for QR scanner and export dialog)
  - `docs/PERFORMANCE_AUDIT_REPORT.md`
- **Acceptance:** Initial reader JS route payload within budget. Documented baseline measurements.

---

### Phase F — Product Documentation & Demo Readiness

#### Task S5-10: Public Legal & About Pages (SEC-011, UXR-013)
- **Goal:** Build public pages explaining Teletext concept, AI editorial process, privacy, and content takedown policy.
- **Files:**
  - `src/app/about/page.tsx`
  - `src/app/privacy/page.tsx`
  - `src/app/content-policy/page.tsx`
- **Acceptance:** All 3 pages reachable, mobile-responsive, and compliant with Teletext design tokens.

#### Task S5-11: Curated Multilingual Demo Catalogue (SUB-007)
- **Goal:** Build a polished, pre-seeded demo catalogue with 5 high-quality bulletins (3 English, 2 Hindi) with genuine source attribution.
- **Files:**
  - `src/data/seed-pages.ts`
  - `tests/unit/data/demo-catalogue.test.ts`
- **Acceptance:** All 5 demo pages strictly conform to 40×25 grid, ≤ 10,240 bytes, and have valid source provenance.

#### Task S5-12: README & Clean-Clone Verification (SUB-009)
- **Goal:** Write comprehensive README with architecture diagrams, features, local setup, security notes, and demo credentials.
- **Files:**
  - `README.md`
  - License verification
- **Acceptance:** README complete and accurate.

---

### Phase G — CI & Production Deployment Readiness

#### Task S5-13: GitHub Actions CI Verification (TEST-008)
- **Goal:** Harden `.github/workflows/ci.yml` with security and accessibility checks.
- **Files:**
  - `.github/workflows/ci.yml`
- **Acceptance:** CI runs frozen install, env safety, format check, lint, typecheck, all tests, and build.

#### Task S5-14: Production Deployment Runbook (TR-010)
- **Goal:** Document production deployment steps for Vercel and Supabase.
- **Files:**
  - `docs/PRODUCTION_DEPLOYMENT_RUNBOOK.md`
- **Acceptance:** Step-by-step verified runbook with environment variable checklist and rollback procedures.

#### Task S5-15: Production Smoke Test Specification
- **Goal:** Document smoke test suite for verified deployments.
- **Files:**
  - `docs/PRODUCTION_SMOKE_TEST_PLAN.md`
- **Acceptance:** Covers all critical user journeys.

---

### Phase H — Final Sprint 5 Quality Gate

#### Task S5-16: Final Quality Gate & Sprint 5 Completion Report
- **Goal:** Execute `pnpm quality:check`, compile test statistics, and generate `docs/SPRINT_5_COMPLETION_REPORT.md`.
- **Files:**
  - `docs/SPRINT_5_COMPLETION_REPORT.md`
  - `docs/REQUIREMENTS_TRACEABILITY.md`
- **Acceptance:** 100% passing tests, 0 lint errors, Turbopack build succeeds.

