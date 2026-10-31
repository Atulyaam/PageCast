import { describe, it, expect } from "vitest";
import { convertDraftToPagePack, convertDraftToTeletextPages } from "@/server/conversion/bulletin-to-pagepack";
import { composeBulletin } from "@/server/ai/composer";
import { MockAiProvider } from "@/server/ai/mock-adapter";
import { extractFromPastedText } from "@/server/ingestion/extractor";
import { validateGrid } from "@/domain/validation/validate-grid";
import { encodePagePack, decodePagePack } from "@/domain/page-pack/codec";
import { PAGECAST_MAX_PACK_BYTES } from "@/domain/byte-budget/measure";
import type { BulletinDraft } from "@/domain/source-provenance/types";

describe("Edge Conversion Pipeline Integration Suite", () => {
  const sampleArticleText = `
    Global Satellite Network Achieves Ultra Low-Bandwidth Milestone.
    Researchers have demonstrated real-time telemetry over retro teletext protocol.
    The entire daily news bulletin consumes less than 8 kilobytes of data.
    Remote disaster response teams in mountainous regions successfully received weather forecasts.
    The transmission required zero high-speed broadband connections.
  `;

  it("converts extracted text into a validated 40x25 Teletext PagePack within 10 KiB", async () => {
    // 1. Ingest pasted text
    const source = extractFromPastedText(sampleArticleText, {
      title: "Satellite Teletext Breakthrough",
      language: "en",
    });

    // 2. Compose structured bulletin
    const draft = await composeBulletin(source, {
      provider: new MockAiProvider(),
      targetPageNumber: 201,
      language: "en",
    });

    // 3. Convert draft to PagePack
    const result = convertDraftToPagePack(draft, source);

    expect(result.pack.version).toBe(1);
    expect(result.withinBudget).toBe(true);
    expect(result.payloadBytes).toBeLessThanOrEqual(PAGECAST_MAX_PACK_BYTES);
    expect(result.pack.pages.length).toBe(1);

    const primaryPage = result.pack.pages[0];
    expect(primaryPage.pageNumber).toBe(201);
    expect(primaryPage.rows.length).toBe(25);

    // Grid invariant
    const gridCheck = validateGrid(primaryPage);
    expect(gridCheck.valid).toBe(true);

    // Row 1 Header Check
    expect(primaryPage.rows[0].spans[0].text).toContain("P201");
    expect(primaryPage.rows[0].spans[1].text).toContain("PAGECAST");

    // Row 25 Navigation Check
    const navRow = primaryPage.rows[24];
    expect(navRow.spans.length).toBe(4); // 4 Fastext colors
  });

  it("preserves Devanagari Hindi text accurately through the pipeline", async () => {
    const hindiArticle = `
      नई दिल्ली मौसम अलर्ट।
      राजधानी में आज भारी वर्षा की संभावना है।
      तापमान में 5 डिग्री सेल्सियस की गिरावट दर्ज की गई है।
      नागरिकों को सतर्क रहने की सलाह दी जाती है।
    `;

    const source = extractFromPastedText(hindiArticle, {
      title: "मौसम बुलेटिन दिल्ली",
      language: "hi",
    });

    const draft = await composeBulletin(source, {
      forceExtractiveFallback: true,
      targetPageNumber: 102,
      language: "hi",
    });

    const result = convertDraftToPagePack(draft, source);
    const page = result.pack.pages[0];

    expect(page.language).toBe("hi");
    expect(page.pageNumber).toBe(102);

    const gridCheck = validateGrid(page);
    expect(gridCheck.valid).toBe(true);

    // Verify Hindi text exists in content rows
    const contentText = page.rows.map((r) => r.spans.map((s) => s.text).join("")).join("\n");
    expect(contentText).toContain("मौसम");
  });

  it("succeeds in lossless JSON encode / decode roundtrip", async () => {
    const source = extractFromPastedText("Quick teletext test notice.", {
      title: "Roundtrip Test",
    });
    const draft = await composeBulletin(source, {
      forceExtractiveFallback: true,
      targetPageNumber: 300,
    });

    const { pack } = convertDraftToPagePack(draft, source);
    const serialized = encodePagePack(pack);
    const deserialized = decodePagePack(serialized);

    expect(deserialized.version).toBe(pack.version);
    expect(deserialized.edition).toBe(pack.edition);
    expect(deserialized.pages[0].pageNumber).toBe(300);
    expect(deserialized.pages[0].rows.length).toBe(25);
  });

  it("rejects an invalid draft with out-of-bounds page numbers", () => {
    const invalidDraft: BulletinDraft = {
      sourceId: "src-1",
      pageNumber: 999, // Out of bounds (> 899)
      title: "OVERSIZED PAGE",
      summary: "Invalid page number",
      sections: [{ heading: "TEST", points: [{ text: "Point", sourceSentenceIds: [] }] }],
      language: "en",
      metadata: {
        provider: "mock",
        model: "mock",
        promptVersion: "1.0",
        generatedAt: new Date().toISOString(),
      },
    };

    expect(() => convertDraftToTeletextPages(invalidDraft)).toThrow();
  });
});
