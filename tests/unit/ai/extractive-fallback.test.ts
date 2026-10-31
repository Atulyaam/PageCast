import { describe, it, expect } from "vitest";
import { generateExtractiveBulletin } from "@/server/ai/extractive-fallback";
import { validateSentenceProvenance } from "@/domain/source-provenance/schema";
import type { ExtractedSource } from "@/domain/source-provenance/types";

describe("Deterministic Extractive Fallback Summarizer", () => {
  const sampleArticle: ExtractedSource = {
    id: "src-rescue-99",
    url: "https://disaster.gov/bulletin/cyclone",
    title: "Cyclone Alert for Coastal Regions",
    siteName: "Disaster Management Bureau",
    fetchedAt: "2026-10-31T14:00:00Z",
    content:
      "A severe cyclonic storm is approaching the eastern coastline. Coastal evacuation centers have opened in all districts. Emergency food and medical supplies are fully stocked. Fishermen are strictly advised not to venture into the open sea.",
    sentences: [
      {
        id: "s1",
        index: 0,
        text: "A severe cyclonic storm is approaching the eastern coastline.",
        hash: "h1",
      },
      {
        id: "s2",
        index: 1,
        text: "Coastal evacuation centers have opened in all districts.",
        hash: "h2",
      },
      {
        id: "s3",
        index: 2,
        text: "Emergency food and medical supplies are fully stocked.",
        hash: "h3",
      },
      {
        id: "s4",
        index: 3,
        text: "Fishermen are strictly advised not to venture into the open sea.",
        hash: "h4",
      },
    ],
    language: "en",
  };

  it("generates a valid, schema-compliant BulletinDraft without external API calls", () => {
    const draft = generateExtractiveBulletin(sampleArticle, { targetPageNumber: 105 });

    expect(draft.sourceId).toBe("src-rescue-99");
    expect(draft.pageNumber).toBe(105);
    expect(draft.metadata.provider).toBe("extractive-fallback");
    expect(draft.sections.length).toBeGreaterThanOrEqual(1);
    expect(draft.sections[0].points.length).toBeGreaterThanOrEqual(1);
  });

  it("is 100% deterministic: produces identical output across calls", () => {
    const run1 = generateExtractiveBulletin(sampleArticle, { targetPageNumber: 200 });
    const run2 = generateExtractiveBulletin(sampleArticle, { targetPageNumber: 200 });

    expect(run1.title).toBe(run2.title);
    expect(run1.summary).toBe(run2.summary);
    expect(run1.sections).toEqual(run2.sections);
  });

  it("strictly preserves source sentence IDs with zero hallucination", () => {
    const draft = generateExtractiveBulletin(sampleArticle);
    const provenance = validateSentenceProvenance(draft, sampleArticle);

    expect(provenance.valid).toBe(true);
    expect(provenance.unmappedIds).toEqual([]);
  });

  it("handles Hindi Devanagari source content accurately", () => {
    const hindiArticle: ExtractedSource = {
      id: "src-hi-1",
      url: "https://samachar.in/weather",
      title: "मौसम विभाग की चेतावनी",
      fetchedAt: "2026-10-31T14:30:00Z",
      content:
        "नई दिल्ली में मूसलाधार बारिश का अलर्ट जारी किया गया है। निचले इलाकों में जलभराव की समस्या हो सकती है। नागरिकों को सावधानी बरतने की सलाह दी गई है।",
      sentences: [
        {
          id: "s1",
          index: 0,
          text: "नई दिल्ली में मूसलाधार बारिश का अलर्ट जारी किया गया है।",
          hash: "h-hi-1",
        },
        {
          id: "s2",
          index: 1,
          text: "निचले इलाकों में जलभराव की समस्या हो सकती है।",
          hash: "h-hi-2",
        },
        {
          id: "s3",
          index: 2,
          text: "नागरिकों को सावधानी बरतने की सलाह दी गई है।",
          hash: "h-hi-3",
        },
      ],
      language: "hi",
    };

    const draft = generateExtractiveBulletin(hindiArticle, { language: "hi" });

    expect(draft.language).toBe("hi");
    expect(draft.title).toContain("मौसम विभाग");
    expect(draft.sections[0].heading).toBe("मुख्य बिंदु");
    expect(draft.sections[0].points.length).toBeGreaterThanOrEqual(1);
  });

  it("handles empty or sparse source content without crashing", () => {
    const emptySource: ExtractedSource = {
      id: "src-empty",
      url: "https://example.com/empty",
      title: "Minimal Notice",
      fetchedAt: "2026-10-31T14:40:00Z",
      content: "",
      sentences: [],
      language: "en",
    };

    const draft = generateExtractiveBulletin(emptySource);
    expect(draft.title).toBe("MINIMAL NOTICE");
    expect(draft.sections[0].points.length).toBe(1);
  });
});
