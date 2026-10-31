import { describe, it, expect } from "vitest";
import { POST as extractHandler } from "@/app/api/v1/sources/extract/route";
import { POST as fromTextHandler } from "@/app/api/v1/sources/from-text/route";
import { POST as composeHandler } from "@/app/api/v1/bulletins/compose/route";
import { POST as convertHandler } from "@/app/api/v1/bulletins/convert/route";

function createMockRequest(body: unknown): Request {
  return new Request("https://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Next.js App Router API Routes Integration", () => {
  describe("POST /api/v1/sources/from-text", () => {
    it("successfully creates an ExtractedSource from valid pasted text", async () => {
      const req = createMockRequest({
        text: "Breaking news dispatch. Relief teams have arrived on scene. Road access is cleared.",
        title: "Relief Update",
        language: "en",
      });

      const response = await fromTextHandler(req);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.source.title).toBe("Relief Update");
      expect(json.source.sentences.length).toBe(3);
    });

    it("returns 400 when text is too short", async () => {
      const req = createMockRequest({ text: "Hi" });
      const response = await fromTextHandler(req);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/v1/sources/extract", () => {
    it("blocks private loopback URLs with 403 Forbidden", async () => {
      const req = createMockRequest({ url: "http://127.0.0.1/admin" });
      const response = await extractHandler(req);

      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("loopback/metadata host");
    });

    it("returns 400 for malformed URL", async () => {
      const req = createMockRequest({ url: "not-a-valid-url" });
      const response = await extractHandler(req);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.success).toBe(false);
    });
  });

  describe("POST /api/v1/bulletins/compose", () => {
    it("composes a valid BulletinDraft using deterministic extractive fallback", async () => {
      const source = {
        id: "src-api-1",
        url: "https://example.com/teletext",
        title: "Teletext Engine Certified",
        fetchedAt: new Date().toISOString(),
        content: "Teletext standard is live. Everything fits in 10 KiB.",
        sentences: [
          { id: "s1", index: 0, text: "Teletext standard is live.", hash: "h1" },
          { id: "s2", index: 1, text: "Everything fits in 10 KiB.", hash: "h2" },
        ],
        language: "en" as const,
      };

      const req = createMockRequest({
        source,
        language: "en",
        targetPageNumber: 201,
        forceExtractiveFallback: true,
      });

      const response = await composeHandler(req);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.draft.pageNumber).toBe(201);
      expect(json.draft.sections[0].points.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("POST /api/v1/bulletins/convert", () => {
    it("converts a valid BulletinDraft into a budget-checked PagePackV1", async () => {
      const draft = {
        sourceId: "src-api-1",
        pageNumber: 205,
        title: "API CONVERTED",
        topic: "TECH",
        headline: "CONVERSION SUCCESSFUL",
        summary: "Pipeline converts draft to 40x25 grid in 10 KiB.",
        sections: [
          {
            heading: "DETAILS",
            points: [{ text: "Grid passed 25 rows check.", sourceSentenceIds: ["s1"] }],
          },
        ],
        language: "en" as const,
        metadata: {
          provider: "mock",
          model: "mock-model",
          promptVersion: "1.0",
          generatedAt: new Date().toISOString(),
        },
      };

      const req = createMockRequest({ draft });
      const response = await convertHandler(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.pack.pages[0].pageNumber).toBe(205);
      expect(json.withinBudget).toBe(true);
      expect(json.payloadBytes).toBeLessThanOrEqual(10240);
    });

    it("rejects invalid draft parameters with 400", async () => {
      const req = createMockRequest({ draft: { invalid: true } });
      const response = await convertHandler(req);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe("VALIDATION_ERROR");
    });
  });
});
