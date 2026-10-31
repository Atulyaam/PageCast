# PageCast Domain QA MCP Server (ENH-04)
## Model Context Protocol (MCP) Integration for Autonomous Agents

**Protocol Version:** `2024-11-05`  
**Server Name:** `pagecast-domain-qa`  
**Transport:** Stdio (`process.stdin` / `process.stdout`)  
**Implementation:** `src/server/mcp/domain-qa-server.ts`

---

## 1. Overview & Purpose

The **PageCast Domain QA MCP Server** exposes the core mathematical and structural invariants of the PageCast Teletext platform as standard Model Context Protocol (MCP) tools.

This allows autonomous AI assistants—such as **Kiro Agents**, Claude Desktop, and Antigravity—to programmatically validate, audit, and generate Teletext artifacts with zero guesswork. Rather than trusting an LLM's intuition regarding character column widths or byte sizes, the agent queries this domain engine directly over stdio.

### Key Capabilities Exposed:
1. **40×25 CRT Grid Validation (`validate_page_grid`):** Verifies that a generated page contains exactly 25 rows and each row contains exactly 40 logical character cells (accounting for Devanagari Unicode grapheme clusters).
2. **Byte Budget Enforcement (`measure_pagepack_bytes`):** Computes canonical UTF-8 byte consumption via `TextEncoder` against the hard 10 KiB (10,240 B) ceiling.
3. **Cryptographic Source Provenance (`verify_source_evidence`):** Audits SHA-256 sentence hashes and ensures every bullet point claim links directly to extracted source sentences.
4. **Air-Gap Transfer Formatting (`generate_multi_frame_qr`):** Splits a PagePack into animated QR frames with cryptographic frame digests for air-gapped device synchronization.
5. **Teletext Magazine Directory (`validate_page_number`):** Validates 3-digit page numbers (100–899) and resolves magazine routing metadata.

---

## 2. Configuration for AI Agents

### Option A: Kiro Agents (`.kiro/settings/mcp.json` or Workspace Config)
Add the following configuration to enable PageCast Domain QA tools inside Kiro:

```json
{
  "mcpServers": {
    "pagecast-domain-qa": {
      "command": "npx",
      "args": ["tsx", "src/server/mcp/domain-qa-server.ts"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Option B: Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "pagecast": {
      "command": "npx",
      "args": ["-y", "tsx", "C:\\Users\\Atul2\\OneDrive\\Desktop\\KiroHackethon\\pagecast\\src\\server\\mcp\\domain-qa-server.ts"]
    }
  }
}
```

---

## 3. Tool Reference & Schemas

### 1. `validate_page_grid`
Verifies that a `TeletextPage` conforms to the 40×25 grid invariants:
- **Property P1:** Exactly 25 rows.
- **Property P2:** Exactly 40 logical character cells per row.

**Request:**
```json
{
  "name": "validate_page_grid",
  "arguments": {
    "page": {
      "pageNumber": 101,
      "title": "Cyclone Alert",
      "rows": [ ... 25 row objects ... ]
    }
  }
}
```

**Response:**
```json
{
  "valid": true,
  "rowCount": 25,
  "expectedRowCount": 25,
  "expectedColumnCount": 40,
  "errorCount": 0,
  "errors": []
}
```

---

### 2. `measure_pagepack_bytes`
Evaluates exact UTF-8 byte weight against the 10 KiB ceiling.

**Request:**
```json
{
  "name": "measure_pagepack_bytes",
  "arguments": {
    "pack": {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "version": 1,
      "slug": "measles-drive",
      "pages": [ ... ]
    }
  }
}
```

**Response:**
```json
{
  "bytesUsed": 2450,
  "maxBytes": 10240,
  "bytesRemaining": 7790,
  "percentageUsed": 24,
  "isWithinBudget": true,
  "isOverBudget": false,
  "formatted": "2,450 / 10,240 B (24%)"
}
```

---

### 3. `verify_source_evidence`
Validates claim-to-sentence linking and SHA-256 sentence fingerprints.

**Request:**
```json
{
  "name": "verify_source_evidence",
  "arguments": {
    "sourceSentences": [
      { "id": "s-001", "text": "Measles camp runs Nov 7.", "hash": "e3b0c44..." }
    ],
    "evidenceReferences": [
      { "pointId": "pt-1", "sourceSentenceId": "s-001", "sentenceHash": "e3b0c44..." }
    ]
  }
}
```

**Response:**
```json
{
  "totalClaims": 1,
  "verifiedClaims": 1,
  "unverifiedClaims": 0,
  "matchPercentage": 100,
  "verified": true,
  "details": [
    {
      "pointId": "pt-1",
      "sourceSentenceId": "s-001",
      "matched": true,
      "hashMatched": true
    }
  ]
}
```

---

### 4. `generate_multi_frame_qr`
Encodes a PagePack into sequential animated QR frames (`PAGECAST:v1:<bundleId>:<index>:<total>:<sha256>:<base64>`).

**Request:**
```json
{
  "name": "generate_multi_frame_qr",
  "arguments": {
    "pack": { ... },
    "maxCharsPerFrame": 350
  }
}
```

**Response:**
```json
{
  "frameCount": 4,
  "frames": [
    "PAGECAST:v1:8a2f:0:4:b49a:ey...",
    "PAGECAST:v1:8a2f:1:4:b49a:8k...",
    "PAGECAST:v1:8a2f:2:4:b49a:91...",
    "PAGECAST:v1:8a2f:3:4:b49a:mm..."
  ],
  "sampleFirstFrame": "PAGECAST:v1:8a2f:0:4:b49a:ey...",
  "protocolPrefix": "PAGECAST:v1"
}
```

---

### 5. `validate_page_number`
Validates 3-digit page number and resolves magazine allocation.

**Request:**
```json
{
  "name": "validate_page_number",
  "arguments": {
    "pageNumber": 501
  }
}
```

**Response:**
```json
{
  "valid": true,
  "pageNumber": 501,
  "magazineNumber": 5,
  "magazineName": "Education & Learning",
  "magazineDescription": "Curriculum summaries, academic schedules, libraries",
  "pageRange": [500, 599],
  "defaultColor": "magenta"
}
```

---

## 4. Verification & Testing

The MCP server is fully covered by automated unit tests in `tests/unit/mcp/domain-qa-server.test.ts`:
- Protocol handshake (`initialize`, `notifications/initialized`, `ping`)
- Tool discovery (`tools/list`)
- Execution of all 5 domain QA tools (`tools/call`)
- Robust error handling for malformed JSON and unknown methods
