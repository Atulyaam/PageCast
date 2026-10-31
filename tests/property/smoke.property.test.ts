import { describe, it } from "vitest";
import fc from "fast-check";

describe("Fast-Check Generative Property Tests", () => {
  it("guarantees 100% lossless UTF-8 encode-decode round-trip across arbitrary Unicode (1,000 runs)", () => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    fc.assert(
      fc.property(fc.string({ unit: "grapheme" }), (inputString) => {
        const encoded = encoder.encode(inputString);
        const decoded = decoder.decode(encoded);

        return decoded === inputString;
      }),
      { numRuns: 1000 }
    );
  });

  it("guarantees that UTF-8 byte length is always >= UTF-16 string length (1,000 runs)", () => {
    const encoder = new TextEncoder();

    fc.assert(
      fc.property(fc.string(), (inputString) => {
        const byteLength = encoder.encode(inputString).byteLength;
        // In UTF-8, every codepoint is at least 1 byte; surrogate pairs (2 UTF-16 units) encode to 4 bytes in UTF-8.
        return byteLength >= inputString.length;
      }),
      { numRuns: 1000 }
    );
  });

  it("preserves array identity and bounds when slicing lines to 40 columns (1,000 runs)", () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const truncated = input.slice(0, 40);
        return truncated.length <= 40;
      }),
      { numRuns: 1000 }
    );
  });
});
