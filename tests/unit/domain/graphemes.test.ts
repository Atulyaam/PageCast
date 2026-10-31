import { describe, it, expect } from "vitest";
import {
  segmentGraphemes,
  getGraphemeCount,
  sliceByGraphemes,
  padToColumns,
} from "@/domain/layout-engine/graphemes";

describe("Unicode-Aware Grapheme Segmentation (Intl.Segmenter)", () => {
  it("segments pure ASCII text into 1-to-1 grapheme clusters", () => {
    const text = "PAGECAST";
    const clusters = segmentGraphemes(text);

    expect(clusters.length).toBe(8);
    expect(clusters).toEqual(["P", "A", "G", "E", "C", "A", "S", "T"]);
    expect(getGraphemeCount(text)).toBe(8);
  });

  it("correctly segments Hindi Devanagari combining marks without severing clusters", () => {
    // "पेजकास्ट":
    // प + े = पे (1 cluster)
    // ज = ज (1 cluster)
    // क + ा = का (1 cluster)
    // स + ् + ट = स्ट (1 cluster in conjunct form) or स + ् and ट
    const text = "पेजकास्ट";
    const clusters = segmentGraphemes(text, "hi");

    // Clusters must sum up to the original string when rejoined
    expect(clusters.join("")).toBe(text);
    // User-perceived grapheme count is strictly less than raw UTF-16 string.length (8)
    expect(clusters.length).toBeLessThan(text.length);
    expect(getGraphemeCount(text, "hi")).toBe(clusters.length);
  });

  it('correctly handles "नमस्ते" (Namaste in Hindi)', () => {
    const text = "नमस्ते";
    const clusters = segmentGraphemes(text, "hi");

    expect(clusters.join("")).toBe(text);
    // न (1), म (2), स्ते (3)
    expect(clusters[0]).toBe("न");
    expect(clusters[1]).toBe("म");
    expect(clusters[2]).toBe("स्ते");
    expect(clusters.length).toBe(3);
  });

  it("slices by user-perceived graphemes without creating orphaned combining marks", () => {
    const text = "नमस्ते भारत"; // "Namaste Bharat"
    // Graphemes: न (1), म (2), स्ते (3), ' ' (4), भा (5), र (6), त (7)
    const slicedTo3 = sliceByGraphemes(text, 3, "hi");

    expect(slicedTo3).toBe("नमस्ते");
    expect(getGraphemeCount(slicedTo3, "hi")).toBe(3);
  });

  it("pads text to exactly 40 columns using grapheme count", () => {
    const shortText = "P100  PAGECAST";
    const padded = padToColumns(shortText, 40);

    expect(getGraphemeCount(padded)).toBe(40);
    expect(padded.startsWith("P100  PAGECAST")).toBe(true);
    expect(padded.length).toBe(40);
  });

  it("truncates text to 40 columns if grapheme count exceeds 40", () => {
    const longText = "A".repeat(50);
    const result = padToColumns(longText, 40);

    expect(getGraphemeCount(result)).toBe(40);
    expect(result.length).toBe(40);
  });

  it("preserves multi-codepoint emojis as single clusters", () => {
    const text = "📺 PAGECAST";
    const clusters = segmentGraphemes(text);

    expect(clusters[0]).toBe("📺");
    expect(clusters[1]).toBe(" ");
    expect(getGraphemeCount(text)).toBe(10);
  });
});
