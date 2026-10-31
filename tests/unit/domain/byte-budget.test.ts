import { describe, it, expect } from "vitest";
import {
  measureUtf8Bytes,
  evaluateByteBudget,
  ByteBudgetExceededError,
  PAGECAST_MAX_PACK_BYTES,
} from "@/domain/byte-budget/measure";
import {
  serializePagePack,
  deserializePagePack,
  measurePagePack,
  assertPagePackBudget,
} from "@/domain/page-pack/codec";
import type { PagePackV1 } from "@/domain/page-pack/types";

describe("Byte Budget Calculator & PagePack Codec", () => {
  const create25Rows = () =>
    Array.from({ length: 25 }, (_, i) => ({
      spans: [{ text: `Row ${i + 1} content`.padEnd(40, " ") }],
    }));

  const samplePack: PagePackV1 = {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    version: 1,
    slug: "tech-digest-101",
    title: "Technology Digest",
    magazine: 1,
    primaryPageNumber: 101,
    createdAt: "2026-10-31T12:00:00.000Z",
    metadata: {
      originalUrl: "https://example.com/tech",
      sourceName: "Tech Gazette",
      author: "A. Turing",
      language: "en",
      aiAssisted: true,
      publisherId: "pub_999",
    },
    pages: [
      {
        pageNumber: 101,
        title: "Tech Digest",
        rows: create25Rows(),
        fastext: { red: 102, green: 200, yellow: 300, cyan: 100 },
      },
    ],
  };

  it("measures UTF-8 bytes for ASCII characters (1 byte per char)", () => {
    const text = "PAGECAST 2026";
    expect(text.length).toBe(13);
    expect(measureUtf8Bytes(text)).toBe(13);
  });

  it("measures UTF-8 bytes for Devanagari Hindi characters (3 bytes per char)", () => {
    const hindiWord = "पेजकास्ट"; // 8 code units, 24 bytes
    expect(hindiWord.length).toBe(8);
    expect(measureUtf8Bytes(hindiWord)).toBe(24);
  });

  it("evaluates budget for a standard PagePack under 10 KiB", () => {
    const serialized = serializePagePack(samplePack);
    const budget = evaluateByteBudget(serialized);

    expect(budget.maxBytes).toBe(PAGECAST_MAX_PACK_BYTES);
    expect(budget.bytesUsed).toBeLessThan(PAGECAST_MAX_PACK_BYTES);
    expect(budget.bytesRemaining).toBe(PAGECAST_MAX_PACK_BYTES - budget.bytesUsed);
    expect(budget.isOverBudget).toBe(false);
  });

  it("losslessly round-trips PagePack serialization and deserialization", () => {
    const serialized = serializePagePack(samplePack);
    const deserialized = deserializePagePack(serialized);

    expect(deserialized).toEqual(samplePack);
  });

  it("throws ByteBudgetExceededError when pack exceeds 10,240 bytes", () => {
    // Construct an oversized pack by adding dozens of pages
    const oversizedPages = Array.from({ length: 15 }, (_, i) => ({
      pageNumber: 101 + i,
      title: `Page ${i + 1} with extensive verbose descriptions`,
      rows: create25Rows(),
      fastext: { red: 102, green: 200, yellow: 300, cyan: 100 },
    }));

    const oversizedPack: PagePackV1 = {
      ...samplePack,
      pages: oversizedPages,
    };

    const budget = measurePagePack(oversizedPack);
    expect(budget.isOverBudget).toBe(true);
    expect(budget.bytesUsed).toBeGreaterThan(10240);

    expect(() => assertPagePackBudget(oversizedPack)).toThrow(ByteBudgetExceededError);
  });

  it("passes assertPagePackBudget when pack is within 10,240 bytes", () => {
    expect(() => assertPagePackBudget(samplePack)).not.toThrow();
  });
});
