# PageCast — Risk Register

**Phase:** 1 — Discovery & Requirement Analysis  
**Date:** 30 October 2026  
**Format:** Risk ID | Description | Probability | Impact | Severity | Mitigation | Contingency

> **Severity** = Probability × Impact (H=High, M=Medium, L=Low)

---

## Technical Risks

| Risk ID | Risk Description | Probability | Impact | Severity | Mitigation | Contingency |
|---|---|---|---|---|---|---|
| RISK-T01 | Hindi Devanagari grapheme rendering breaks within 40-column fixed grid (combining chars, matras, conjuncts mishandled) | High | High | **CRITICAL** | Implement `Intl.Segmenter` grapheme segmentation in Sprint 1; create Hindi property tests before AI work begins | Restrict Hindi output to known-safe character ranges; document unsupported conjuncts; keep English as primary demo language |
| RISK-T02 | Serwist is incompatible with Next.js 16.x; service worker does not install correctly | Medium | High | **HIGH** | Verify Serwist compatibility at the start of Sprint 4 with a minimal proof-of-concept | Switch to official Next.js manual service worker approach immediately if Serwist fails; have the manual approach partly scaffolded already |
| RISK-T03 | 10 KiB PagePack does not fit in a single QR code (QR v40 max ≈ 2,953 bytes binary) | Certainty | Medium | **HIGH** | Design multi-frame QR from the start as P1; implement JSON file export/import as P0 fallback | Demo with JSON export/import only; describe multi-frame QR as architecture feature; animated QR shown in video if P1 is not stable |
| RISK-T04 | jsdom configured with `runScripts: "dangerously"` accidentally enables script execution from untrusted article HTML | Low | Critical | **HIGH** | Explicitly configure jsdom with scripts disabled; write a security test verifying no script execution | If accidentally enabled, rotate any potentially leaked credentials; audit what scripts ran |
| RISK-T05 | Next.js 16 App Router breaking change during sprint (unexpected minor release) | Low | Medium | **MEDIUM** | Pin exact version in lockfile; frozen-lockfile CI; no upgrades in final submission week | Revert to pinned version; document version constraint in README |
| RISK-T06 | `Intl.Segmenter` not available in Node.js version used for CI/Vercel builds | Low | High | **MEDIUM** | Verify Node.js version (≥ 16 for Intl.Segmenter); specify `engines` in package.json | Use `grapheme-splitter` npm package as Node.js-side fallback |
| RISK-T07 | Supabase RLS policies have gaps; unauthorized access to drafts or publisher data | Low | High | **MEDIUM** | Test RLS with direct Supabase client calls (not just the UI); verify every table policy | Temporarily disable public publishing until RLS is verified; use server-side service-role for all mutations |
| RISK-T08 | Dexie IndexedDB schema migration fails on user's existing data after a schema change | Low | Medium | **MEDIUM** | Version Dexie schema from day one; write migration test in Sprint 4 | Clear IndexedDB on version mismatch with user warning; provide JSON export before clearing |
| RISK-T09 | Canonical JSON serialization is non-deterministic (object key ordering varies between JS engines) | Low | High | **MEDIUM** | Use a deterministic JSON serializer or sort keys explicitly; property-test determinism (P4) | Fix serialization order before any byte-budget measurement; add regression test |
| RISK-T10 | Multi-frame QR camera scanning unreliable (frame drops, blur, scan order) | High | Medium | **HIGH** | Implement frame-index tracking, rescan mechanism and digest verification; test on physical devices | Mark multi-frame QR as P1 stretch; JSON import is always the P0 fallback; document in demo |

---

## Security Risks

| Risk ID | Risk Description | Probability | Impact | Severity | Mitigation | Contingency |
|---|---|---|---|---|---|---|
| RISK-S01 | SSRF: Attacker submits a URL pointing to cloud metadata endpoint (169.254.169.254) or internal service | Medium | Critical | **CRITICAL** | Implement DNS resolution + IP block list for all private/loopback/link-local/reserved ranges; re-check on every redirect; max 3 redirects; 8-second timeout | Restrict URL ingestion to known-good allowlist only if full SSRF protection cannot be completed |
| RISK-S02 | API key or service-role secret accidentally committed to GitHub or included in client bundle | Low | Critical | **HIGH** | Enforce `.env` in `.gitignore`; CI secret scan; never use `NEXT_PUBLIC_` for secrets; code review | Immediately rotate any accidentally exposed secret; force-push removal from git history; rotate Supabase/Google keys |
| RISK-S03 | Prompt injection: article content contains instructions that override system prompt and cause AI misbehavior | Medium | High | **HIGH** | Clearly delimit source content in AI prompt ("DATA:" section); instruct model to ignore embedded instructions; validate output with Zod + sentence ID verification; require human review | Human review step catches any obviously injected content; fall back to extractive summarizer |
| RISK-S04 | XSS: imported PagePack or article HTML rendered via `dangerouslySetInnerHTML` | Low | Critical | **HIGH** | Never render untrusted HTML directly; use text-only rendering for all article and PagePack content; sanitize if any HTML preview is ever added | Remove any HTML rendering immediately; audit all React components for `dangerouslySetInnerHTML` usage |
| RISK-S05 | Service worker caches authenticated publisher responses, leaking draft content to other users/devices | Low | High | **MEDIUM** | Use network-only strategy for all `/api/v1/` routes except public read; add `Vary: Cookie` headers; test cache contents after auth | Clear service worker caches; update cache strategy configuration |
| RISK-S06 | Malicious QR code imports a crafted PagePack that exploits the import validator | Low | High | **MEDIUM** | Validate schema + size + SHA-256 before any storage; treat all imported content as untrusted; render as safe text only | Reject import; log validation error; display safe error message |
| RISK-S07 | Copyright infringement: full articles republished via PagePack | Medium | Medium | **MEDIUM** | AI prompt instructs paraphrase only; short quotes with attribution; no full article storage; add content policy page | Remove infringing content immediately; add DMCA/takedown contact to SECURITY.md |

---

## Performance Risks

| Risk ID | Risk Description | Probability | Impact | Severity | Mitigation | Contingency |
|---|---|---|---|---|---|---|
| RISK-P01 | Reader client JS bundle exceeds 200 KiB gzip target | Medium | Medium | **MEDIUM** | Lazy-load QR and publisher studio code; measure bundle size with each build; use dynamic imports | Optimize critical path; accept a larger initial bundle if needed for the demo; document actual measurement |
| RISK-P02 | AI composition API call times out during live demo | Medium | High | **HIGH** | Pre-seed at least 5 demo pages; show extractive fallback path in demo; have AI response cached/mocked for demo scenario | Use pre-seeded pages for demo; show AI composition on a known-good article with fast response |
| RISK-P03 | Supabase free tier request rate limit exceeded during judging | Low | High | **MEDIUM** | Pre-seed pages; enable a static catalogue fallback; contact Supabase support for hackathon if needed | Serve catalogue from a static JSON file in the repo as ultimate fallback |
| RISK-P04 | Hindi UTF-8 characters cause PagePack byte count to be underestimated (using string length instead of TextEncoder) | Medium | High | **HIGH** | Always use `TextEncoder().encode().byteLength`; property test with Hindi content near the 10,240 boundary | Fix measurement immediately; re-validate all existing pages |

---

## Schedule Risks (Solo Developer)

| Risk ID | Risk Description | Probability | Impact | Severity | Mitigation | Contingency |
|---|---|---|---|---|---|---|
| RISK-SCH01 | Hindi layout + grapheme segmentation takes longer than the Sprint 1 allocation (1–6 November) | High | High | **HIGH** | Start grapheme segmentation on the first day of Sprint 1; treat it as the critical path before everything else | Defer Hindi support to a P1 "enhanced renderer"; ship English-only P0; include Hindi layout as a P1 demo feature |
| RISK-SCH02 | Supabase schema + RLS setup in Sprint 3 (13–18 November) takes the full sprint, leaving no time for publisher UI | Medium | High | **HIGH** | Create migrations and RLS in the first two days of Sprint 3; use Supabase table editor for initial setup | Use a simplified single-table draft model for MVP; add RLS as a post-draft security hardening step |
| RISK-SCH03 | PWA + Service Worker issues delay Sprint 4 (19–24 November) | Medium | High | **HIGH** | Verify Serwist at Sprint 4 start; JSON import/export is P0 and is independent of the service worker | Deliver offline via IndexedDB only (no service worker app-shell caching) if SW integration fails; document limitation |
| RISK-SCH04 | Sprint 5 quality hardening reveals P0 defects that require two or more days to fix | Medium | High | **HIGH** | Build automated tests per sprint; do not accumulate testing debt; fix defects immediately | Deprioritize P1 features to protect P0 delivery; accept some known limitations in the submission |
| RISK-SCH05 | Demo video production takes longer than expected (Sprint 6) | Medium | Medium | **MEDIUM** | Write a clear video script (provided in spec §23); record in segments; leave 2 days buffer | Use Loom or OBS for quick recording; prioritize live product over polished production quality |
| RISK-SCH06 | Kiro credit request form missed (deadline: 1 December 2026, 12:00 PM PT) | Low | Medium | **MEDIUM** | Set a calendar reminder for 30 November; submit the form as soon as the GitHub repo is created | Credits are not required for submission; proceed without them |

---

## External / Third-Party Risks

| Risk ID | Risk Description | Probability | Impact | Severity | Mitigation | Contingency |
|---|---|---|---|---|---|---|
| RISK-EXT01 | Google Gemini API quota exhausted during development or demo | Medium | High | **HIGH** | Implement extractive fallback summarizer; pre-seed demo pages; monitor quota usage | Use extractive fallback for all demo pages; show AI generation workflow in video with a known-good example |
| RISK-EXT02 | Mozilla Readability fails to extract content from demo article URLs | Medium | Medium | **MEDIUM** | Test 10+ article URLs before Sprint 2 ends; prepare paste-text demo as primary fallback; use known-good sources | Use paste-text as primary demo input; document URL extraction as "supported public HTML articles" |
| RISK-EXT03 | Vercel deployment fails or is slow during judging period | Low | High | **MEDIUM** | Deploy early in Sprint 5; test from a clean browser profile; enable Vercel deployment previews | Prepare a localhost fallback with recorded demo; note in Devpost that deployment was tested |
| RISK-EXT04 | Target article website blocks the PageCast server-side fetch (anti-bot, Cloudflare) | High | Medium | **HIGH** | Use paste-text as demo primary path; test ingestion on known non-protected sources (Wikipedia, plain news sites) | Demo paste-text as the primary publishing path; show URL ingestion only with known-good sources |

---

## Summary: Top Critical Risks

| Priority | Risk ID | Description | Action Owner |
|---|---|---|---|
| 🔴 1 | RISK-T01 | Hindi grapheme rendering in 40-column grid | Sprint 1 — implement + property-test immediately |
| 🔴 2 | RISK-S01 | SSRF via URL ingestion | Sprint 2 — full SSRF protection before any URL fetch |
| 🔴 3 | RISK-SCH01 | Hindi layout scope exceeds Sprint 1 | Decision: define English-only P0 acceptability before Sprint 1 |
| 🟠 4 | RISK-T02 | Serwist incompatibility with Next.js 16 | Sprint 4 — verify on day 1; manual SW ready |
| 🟠 5 | RISK-EXT01 | Gemini quota exhaustion | Sprint 2 — build extractive fallback concurrently |
| 🟠 6 | RISK-SCH04 | P0 defects discovered in Sprint 5 | Test continuously; never skip sprint tests |
| 🟠 7 | RISK-T03 | 10 KiB QR capacity problem | Design multi-frame from start; JSON is P0 |

---

*Risk register created during Phase 1 analysis. Risks will be reviewed at the start of each sprint.*

