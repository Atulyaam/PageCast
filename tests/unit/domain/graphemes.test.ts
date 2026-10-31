import { describe, it, expect } from "vitest";
import {
  segmentGraphemes,
  getGraphemeCount,
  sliceByGraphemes,
  padToColumns,
  getClusterDisplayWidth,
  getDisplayWidth,
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

  it("calculates terminal display width accurately distinguishing grapheme count from cell width", () => {
    // Standard ASCII: 1 grapheme = 1 cell
    expect(getDisplayWidth("PAGECAST")).toBe(8);

    // Hindi Devanagari: conjuncts are 1 monospace cell wide
    // "नमस्ते": 3 clusters ('न', 'म', 'स्ते'), display width is 3 cells
    expect(getDisplayWidth("नमस्ते", "hi")).toBe(3);
    // "पेजकास्ट": 4 clusters ('पे', 'ज', 'का', 'स्ट'), display width is 4 cells
    expect(getDisplayWidth("पेजकास्ट", "hi")).toBe(4);
    // "नई दिल्ली": 5 clusters ('न', 'ई', ' ', 'दि', 'ल्ली'), display width is 5 cells
    expect(getDisplayWidth("नई दिल्ली", "hi")).toBe(5);

    // Emojis: 1 cluster but 2 terminal character cells wide
    expect(getClusterDisplayWidth("📺")).toBe(2);
    // "📺 PAGECAST" is 10 graphemes, but occupies 11 terminal display cells (2 for 📺 + 1 space + 8 chars)
    expect(getDisplayWidth("📺 PAGECAST")).toBe(11);
  });

  it("verifies column alignment for Hindi Teletext rows", () => {
    const hindiHeadline = "मौसम बुलेटिन - नई दिल्ली";
    const padded = padToColumns(hindiHeadline, 40, " ", "hi");

    // Must have exactly 40 grapheme clusters
    expect(getGraphemeCount(padded, "hi")).toBe(40);
    // Starts with the headline intact
    expect(padded.startsWith(hindiHeadline)).toBe(true);
    // No severed conjuncts or trailing isolated viramas
    const clusters = segmentGraphemes(padded, "hi");
    expect(clusters.length).toBe(40);
  });
});
