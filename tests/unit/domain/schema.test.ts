import { describe, it, expect } from "vitest";
import {
  PagePackV1Schema,
  TeletextPageSchema,
  TeletextSpanSchema,
} from "@/domain/page-pack/schema";

describe("PagePackV1 & Teletext Zod Schemas", () => {
  const create25Rows = () =>
    Array.from({ length: 25 }, (_, i) => ({
      spans: [{ text: `Row ${i + 1} content` }],
    }));

  const validPage = {
    pageNumber: 101,
    title: "World News",
    rows: create25Rows(),
    fastext: { red: 102, green: 200, yellow: 300, cyan: 100 },
    language: "en" as const,
  };

  const validPack = {
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    version: 1 as const,
    slug: "world-news-briefing",
    title: "World News Briefing",
    magazine: 1,
    primaryPageNumber: 101,
    createdAt: new Date().toISOString(),
    metadata: {
      originalUrl: "https://example.com/news/world",
      sourceName: "Global Wire",
      author: "Jane Doe",
      language: "en" as const,
      aiAssisted: true,
      promptVersion: "v1.0.0",
      modelId: "gemini-2.5-flash",
      publisherId: "pub_12345",
      evidenceReferences: [{ pointId: "p1", sourceSentenceId: "s1" }],
    },
    pages: [validPage],
  };

  it("validates a well-formed PagePackV1 payload", () => {
    const result = PagePackV1Schema.safeParse(validPack);
    expect(result.success).toBe(true);
  });

  it("rejects a page that has 24 rows (must have strictly 25 rows)", () => {
    const pageWith24Rows = {
      ...validPage,
      rows: Array.from({ length: 24 }, (_, i) => ({
        spans: [{ text: `Row ${i + 1}` }],
      })),
    };

    const result = TeletextPageSchema.safeParse(pageWith24Rows);
    expect(result.success).toBe(false);
  });

  it("rejects a page that has 26 rows (must have strictly 25 rows)", () => {
    const pageWith26Rows = {
      ...validPage,
      rows: Array.from({ length: 26 }, (_, i) => ({
        spans: [{ text: `Row ${i + 1}` }],
      })),
    };

    const result = TeletextPageSchema.safeParse(pageWith26Rows);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid page number (e.g. 99 or 900)", () => {
    const pageLow = { ...validPage, pageNumber: 99 };
    const pageHigh = { ...validPage, pageNumber: 900 };

    expect(TeletextPageSchema.safeParse(pageLow).success).toBe(false);
    expect(TeletextPageSchema.safeParse(pageHigh).success).toBe(false);
  });

  it("rejects unsupported color names outside the 8 standard colors", () => {
    const invalidSpan = { text: "Hello", color: "orange" };
    expect(TeletextSpanSchema.safeParse(invalidSpan).success).toBe(false);

    const validSpan = { text: "Hello", color: "yellow" };
    expect(TeletextSpanSchema.safeParse(validSpan).success).toBe(true);
  });

  it("rejects an invalid slug containing spaces or uppercase characters", () => {
    const invalidSlugPack = { ...validPack, slug: "World News 101" };
    expect(PagePackV1Schema.safeParse(invalidSlugPack).success).toBe(false);
  });

  it("rejects a schema version other than 1", () => {
    const futurePack = { ...validPack, version: 2 };
    expect(PagePackV1Schema.safeParse(futurePack).success).toBe(false);
  });
});
