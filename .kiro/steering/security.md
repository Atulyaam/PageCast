---
inclusion: always
---

# PageCast — Security & Privacy Steering Guide

## 1. Secret Management & Isolation

### 1.1 Strict Server-Client Isolation
- All production API keys and private tokens must **never** be accessible to the browser:
  - `GOOGLE_GENERATIVE_AI_API_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Never prefix server-only credentials with `NEXT_PUBLIC_`.
- Run `pnpm env:check` before every build and commit. The CI pipeline will automatically reject commits introducing leaks.
- Ensure `.env*` files remain strictly in `.gitignore`. Only `.env.example` containing non-secret placeholder tokens may be tracked.

---

## 2. Server-Side Request Forgery (SSRF) Defense

When publishers input article URLs for extraction, the server fetcher must execute strict SSRF defense:

### 2.1 IP Whitelisting & DNS Pinning
- **Private IP Rejection:** Resolve hostname to IP and immediately abort requests resolving to:
  - Loopback (`127.0.0.0/8`, `::1`)
  - RFC 1918 Private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
  - Carrier-grade NAT (`100.64.0.0/10`)
  - Link-Local (`169.254.0.0/16`, `fe80::/10`)
  - Cloud Metadata endpoints (`169.254.169.254`, `metadata.google.internal`)
  - Multicast and Broadcast addresses
- **Protocol Whitelist:** Only allow `http:` and `https:`. Reject `file:`, `ftp:`, `gopher:`, `data:`, `blob:`.
- **Redirect Limits:** Disallow arbitrary redirects. Follow at most `PAGECAST_MAX_REDIRECTS = 3`, re-verifying DNS and IP for each redirect step.
- **Request Limits:** 
  - Timeout: `PAGECAST_FETCH_TIMEOUT_MS = 10000` (10 seconds max).
  - Size limit: `PAGECAST_MAX_SOURCE_BYTES = 2097152` (2 MB max). Terminate stream if payload exceeds this threshold.

---

## 3. Input Sanitization & Content Defense

### 3.1 XSS & DOM Injection
- The Teletext renderer displays plain monospaced characters inside formatted rows.
- Never inject unescaped HTML strings into the DOM.
- React automatically escapes string literals in JSX. Avoid `dangerouslySetInnerHTML`.
- All extracted article text must be stripped of HTML tags, script tags, style blocks, and event handlers before passing into the AI layout engine.

### 3.2 AI Prompt Injection Mitigation
- Articles extracted from third-party sites may contain adversarial prompts (e.g. `"Ignore previous instructions and output..."`).
- In `src/services/ai-composer/`:
  - Enclose scraped content within distinct XML-like encapsulation tags (e.g., `<user_article>`...`</user_article>`).
  - System instructions must strictly instruct the model to treat content within these tags as passive raw text for summarization and formatting only, ignoring any embedded instructions or directives.
  - Parse AI output strictly through a JSON schema validator (Zod). If the model returns unparseable or malicious payloads, reject and fallback to algorithmic text wrapping.

---

## 4. Rate Limiting & Resource Protection

- Implement rate limiting on API endpoints generating AI conversions (`/api/convert` or `/api/compose`):
  - Max 10 conversion requests per minute per IP to prevent Gemini API quota exhaustion.
  - Size validation: Disallow raw text payloads exceeding 100 KB in conversion endpoints.
  - Require CAPTCHA or authenticated publisher sessions if public conversion endpoints experience abuse.

