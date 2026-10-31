import { describe, it, expect } from "vitest";
import {
  validateExtractedSource,
  validateBulletinDraft,
  validateSentenceProvenance,
} from "@/domain/source-provenance/schema";
import type { ExtractedSource, BulletinDraft } from "@/domain/source-provenance/types";

describe("Source Provenance & BulletinDraft Domain Contracts", () => {
  const validSource: ExtractedSource = {
    id: "src-101",
    url: "https://example.com/news/tech-breakthrough",
    title: "Low-Bandwidth Teletext Resurrected for Web",
    siteName: "Tech Times",
    byline: "Ada Lovelace",
    publishedTime: "2026-10-31T08:00:00Z",
    fetchedAt: "2026-10-31T08:05:00Z",
    content:
      "A new open-source platform brings retro 40x25 Teletext back to life. It runs completely offline with a 10 KiB ceiling.",
    sentences: [
      {
        id: "s1",
        index: 0,
        text: "A new open-source platform brings retro 40x25 Teletext back to life.",
        hash: "hash-s1",
      },
      {
        id: "s2",
        index: 1,
        text: "It runs completely offline with a 10 KiB ceiling.",
        hash: "hash-s2",
      },
    ],
    language: "en",
  };

  const validDraft: BulletinDraft = {
    sourceId: "src-101",
    pageNumber: 201,
    title: "TELETEXT RESURRECTED",
    topic: "TECH NEWS",
    headline: "LOW-BANDWIDTH REVOLUTION",
    summary: "Engineers resurrect 40x25 Teletext for resilient low-bandwidth emergency comms.",
    sections: [
      {
        heading: "CORE CAPABILITIES",
        points: [
          {
            text: "Runs 100% offline with zero external fonts.",
            sourceSentenceIds: ["s1"],
          },
          {
            text: "Total edition payload is strictly capped at 10 KiB.",
            sourceSentenceIds: ["s2"],
          },
        ],
      },
    ],
    language: "en",
    metadata: {
      provider: "google",
      model: "gemini-2.5-flash",
      promptVersion: "1.0.0",
      generatedAt: "2026-10-31T08:10:00Z",
      humanReviewed: true,
    },
  };

  it("successfully validates a well-formed ExtractedSource", () => {
    const validated = validateExtractedSource(validSource);
    expect(validated.id).toBe("src-101");
    expect(validated.sentences.length).toBe(2);
  });

  it("rejects an ExtractedSource with an empty sentence array", () => {
    const invalid = { ...validSource, sentences: [] };
    expect(() => validateExtractedSource(invalid)).toThrow();
  });

  it("successfully validates a canonical BulletinDraft", () => {
    const validated = validateBulletinDraft(validDraft);
    expect(validated.pageNumber).toBe(201);
    expect(validated.language).toBe("en");
    expect(validated.sections[0].points.length).toBe(2);
  });

  it("rejects a BulletinDraft with invalid page number out of bounds", () => {
    const under = { ...validDraft, pageNumber: 99 };
    const over = { ...validDraft, pageNumber: 900 };

    expect(() => validateBulletinDraft(under)).toThrow(/Page number must be >= 100/);
    expect(() => validateBulletinDraft(over)).toThrow(/Page number must be <= 899/);
  });

  it("rejects a BulletinDraft when title exceeds 40 characters", () => {
    const longTitle = {
      ...validDraft,
      title: "THIS TITLE IS WAY TOO LONG TO FIT ONTO A TELETEXT HEADER LINE",
    };
    expect(() => validateBulletinDraft(longTitle)).toThrow(/Title must fit within 40 characters/);
  });

  it("confirms valid sentence provenance when all referenced IDs exist", () => {
    const provenance = validateSentenceProvenance(validDraft, validSource);
    expect(provenance.valid).toBe(true);
    expect(provenance.unmappedIds).toEqual([]);
  });

  it("flags unmapped sentence IDs when a key point references a hallucinated sentence", () => {
    const hallucinatedDraft: BulletinDraft = {
      ...validDraft,
      sections: [
        {
          heading: "FABRICATED FACTS",
          points: [
            {
              text: "PageCast was invented on Mars in 1842.",
              sourceSentenceIds: ["s999_fabricated"],
            },
          ],
        },
      ],
    };

    const provenance = validateSentenceProvenance(hallucinatedDraft, validSource);
    expect(provenance.valid).toBe(false);
    expect(provenance.unmappedIds).toContain("s999_fabricated");
  });
});
