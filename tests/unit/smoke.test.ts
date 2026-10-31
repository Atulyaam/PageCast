import { describe, it, expect } from "vitest";

describe("UTF-8 Encoding & Byte Budget Smoke Tests", () => {
  it("measures ASCII byte length equivalently to string length", () => {
    const asciiText = "PAGECAST TELETEXT SYSTEM 2026";
    const encoder = new TextEncoder();
    const encoded = encoder.encode(asciiText);

    expect(asciiText.length).toBe(29);
    expect(encoded.byteLength).toBe(29);
  });

  it("correctly detects multi-byte Devanagari UTF-8 expansion vs string.length", () => {
    // "पेजकास्ट" is Hindi for PageCast
    const hindiText = "पेजकास्ट";
    const encoder = new TextEncoder();
    const encoded = encoder.encode(hindiText);

    // UTF-16 code units (string.length) vs UTF-8 byte length
    expect(hindiText.length).toBe(8);
    // Devanagari codepoints occupy 3 bytes each in UTF-8
    expect(encoded.byteLength).toBe(24);
    expect(encoded.byteLength).toBeGreaterThan(hindiText.length);
  });

  it("enforces that 40 ASCII characters strictly fit within 40 bytes", () => {
    const teletextHeaderLine = "P100  PAGECAST  SAT 31 OCT  10:04:12    ";
    expect(teletextHeaderLine.length).toBe(40);

    const encoder = new TextEncoder();
    expect(encoder.encode(teletextHeaderLine).byteLength).toBe(40);
  });

  it("enforces the canonical 10 KiB (10,240 bytes) upper budget bound", () => {
    const MAX_PACK_BYTES = 10240;
    const samplePack = {
      id: "test-pack-001",
      version: 1,
      title: "PageCast Sample News",
      pages: [
        {
          pageNumber: 100,
          title: "Index",
          rows: Array.from({ length: 25 }, (_, i) => ({
            spans: [{ text: `Row ${i + 1} content`.padEnd(40, " ") }],
          })),
          fastext: { red: 101, green: 200, yellow: 300, cyan: 400 },
        },
      ],
    };

    const serialized = JSON.stringify(samplePack);
    const byteLength = new TextEncoder().encode(serialized).byteLength;

    expect(samplePack.pages[0].rows.length).toBe(25);
    expect(byteLength).toBeLessThan(MAX_PACK_BYTES);
  });
});
