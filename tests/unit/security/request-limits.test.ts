import { describe, it, expect } from "vitest";
import {
  parseJsonWithLimit,
  DEFAULT_MAX_BODY_BYTES,
  MAX_PAGEPACK_BODY_BYTES,
} from "@/server/security/request-limits";

describe("Request Body Limits & Safe Parser (TASK-S5-01 / SEC-008, TR-013)", () => {
  it("parses valid JSON within limits successfully", async () => {
    const payload = { url: "https://example.com/article", language: "en" };
    const req = new Request("https://pagecast.app/api/v1/sources/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": String(JSON.stringify(payload).length),
      },
      body: JSON.stringify(payload),
    });

    const result = await parseJsonWithLimit<{ url: string; language: string }>(req);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.url).toBe("https://example.com/article");
      expect(result.data.language).toBe("en");
    }
  });

  it("rejects request when Content-Length header exceeds maxBytes with HTTP 413", async () => {
    const req = new Request("https://pagecast.app/api/v1/pages/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": "20000", // 20 KiB exceeds 15 KiB ceiling
      },
      body: JSON.stringify({ test: "data" }),
    });

    const result = await parseJsonWithLimit(req, MAX_PAGEPACK_BODY_BYTES);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(413);
      const json = await result.response.json();
      expect(json.code).toBe("PAYLOAD_TOO_LARGE");
      expect(json.error).toContain("Content-Length 20000 bytes exceeds limit of 15360 bytes");
    }
  });

  it("rejects request stream when total bytes exceed limit even without Content-Length header", async () => {
    // Generate 50 KiB text string
    const bigString = "x".repeat(50 * 1024);
    const payload = JSON.stringify({ data: bigString });

    const req = new Request("https://pagecast.app/api/v1/bulletins/compose", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
    });

    const result = await parseJsonWithLimit(req, 10 * 1024); // 10 KiB limit
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(413);
      const json = await result.response.json();
      expect(json.code).toBe("PAYLOAD_TOO_LARGE");
    }
  });

  it("rejects empty request body with HTTP 400", async () => {
    const req = new Request("https://pagecast.app/api/v1/sources/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "",
    });

    const result = await parseJsonWithLimit(req);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
      const json = await result.response.json();
      expect(json.code).toBe("INVALID_JSON");
    }
  });

  it("rejects malformed JSON syntax with HTTP 400", async () => {
    const req = new Request("https://pagecast.app/api/v1/sources/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ unquoted_key: 123 ",
    });

    const result = await parseJsonWithLimit(req);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
      const json = await result.response.json();
      expect(json.code).toBe("INVALID_JSON");
      expect(json.error).toContain("Invalid JSON syntax");
    }
  });
});
