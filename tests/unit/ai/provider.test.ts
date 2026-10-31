import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MockAiProvider } from "@/server/ai/mock-adapter";
import { GeminiAiProvider } from "@/server/ai/gemini-adapter";
import { AiProviderError } from "@/server/ai/provider";
import type { ExtractedSource } from "@/domain/source-provenance/types";

describe("AI Provider Interface & Adapters Suite", () => {
  const sampleSource: ExtractedSource = {
    id: "src-100",
    url: "https://example.com/teletext",
    title: "Teletext Engine Certified",
    siteName: "Broadband News",
    fetchedAt: "2026-10-31T12:00:00Z",
    content:
      "A new teletext standard has been certified. The platform operates within 10 KiB. All major broadcast stations have endorsed it.",
    sentences: [
      {
        id: "s1",
        index: 0,
        text: "A new teletext standard has been certified.",
        hash: "hash-1",
      },
      {
        id: "s2",
        index: 1,
        text: "The platform operates within 10 KiB.",
        hash: "hash-2",
      },
      {
        id: "s3",
        index: 2,
        text: "All major broadcast stations have endorsed it.",
        hash: "hash-3",
      },
    ],
    language: "en",
  };

  describe("MockAiProvider", () => {
    it("generates a canonical BulletinDraft with exact source sentence IDs", async () => {
      const provider = new MockAiProvider();
      const draft = await provider.generateBulletin({
        source: sampleSource,
        language: "en",
        targetPageNumber: 101,
        systemPrompt: "System instruction",
        userPrompt: "User prompt",
      });

      expect(draft.sourceId).toBe("src-100");
      expect(draft.pageNumber).toBe(101);
      expect(draft.language).toBe("en");
      expect(draft.sections.length).toBeGreaterThanOrEqual(1);

      // Verify sentence IDs are mapped from the actual source
      const firstPoint = draft.sections[0].points[0];
      expect(firstPoint.sourceSentenceIds).toEqual(["s1"]);
    });

    it("simulates timeout error when configured", async () => {
      const provider = new MockAiProvider({ simulateTimeout: true });
      await expect(
        provider.generateBulletin({
          source: sampleSource,
          language: "en",
          systemPrompt: "",
          userPrompt: "",
        })
      ).rejects.toThrow(/timed out/);
    });

    it("simulates quota exceeded (429) error when configured", async () => {
      const provider = new MockAiProvider({ simulateQuotaExceeded: true });
      await expect(
        provider.generateBulletin({
          source: sampleSource,
          language: "en",
          systemPrompt: "",
          userPrompt: "",
        })
      ).rejects.toThrow(/quota limit exceeded/);
    });

    it("simulates invalid schema generation failure", async () => {
      const provider = new MockAiProvider({ simulateInvalidSchema: true });
      await expect(
        provider.generateBulletin({
          source: sampleSource,
          language: "en",
          systemPrompt: "",
          userPrompt: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("GeminiAiProvider", () => {
    it("fails with MISSING_CREDENTIAL when no API key is provided", async () => {
      const provider = new GeminiAiProvider({ apiKey: "" });
      await expect(
        provider.generateBulletin({
          source: sampleSource,
          language: "en",
          systemPrompt: "",
          userPrompt: "",
        })
      ).rejects.toThrow(AiProviderError);
    });

    it("handles mock successful response from Gemini API", async () => {
      const mockCandidate = {
        title: "TELETEXT CERTIFIED",
        topic: "NEWS",
        headline: "TELETEXT STANDARD PASSED",
        summary: "New broadcast standard operates in 10 KiB payload.",
        sections: [
          {
            heading: "HIGHLIGHTS",
            points: [
              {
                text: "Platform runs inside 10 KiB.",
                sourceSentenceIds: ["s2"],
              },
            ],
          },
        ],
      };

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockCandidate) }],
              },
            },
          ],
        }),
      });

      try {
        const provider = new GeminiAiProvider({ apiKey: "fake-test-key-12345" });
        const draft = await provider.generateBulletin({
          source: sampleSource,
          language: "en",
          targetPageNumber: 101,
          systemPrompt: "System",
          userPrompt: "User",
        });

        expect(draft.title).toBe("TELETEXT CERTIFIED");
        expect(draft.pageNumber).toBe(101);
        expect(draft.sections[0].points[0].sourceSentenceIds).toEqual(["s2"]);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it("handles 429 quota error from Gemini API", async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => "Resource has been exhausted (e.g. check quota).",
      });

      try {
        const provider = new GeminiAiProvider({ apiKey: "fake-key" });
        await expect(
          provider.generateBulletin({
            source: sampleSource,
            language: "en",
            systemPrompt: "",
            userPrompt: "",
          })
        ).rejects.toThrow(/rate limit or quota exceeded/);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
