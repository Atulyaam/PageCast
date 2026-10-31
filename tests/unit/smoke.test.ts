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

  it("enforces the sub-5KB (5,120 bytes) upper budget bound", () => {
    const MAX_PACK_BYTES = 5120;
    const samplePack = {
      id: "test-pack-001",
      version: 1,
      title: "PageCast Sample News",
      pages: [
        {
          pageNumber: 100,
          title: "Index",
          rows: [{ spans: [{ text: "P100  PAGECAST  INDEX" }] }],
          fastext: { red: 101, green: 200, yellow: 300, cyan: 400 },
        },
      ],
    };

    const serialized = JSON.stringify(samplePack);
    const byteLength = new TextEncoder().encode(serialized).byteLength;

    expect(byteLength).toBeLessThan(MAX_PACK_BYTES);
    expect(byteLength).toBeLessThan(300); // Extremely compact JSON
  });
});
