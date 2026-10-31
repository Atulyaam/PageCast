import { describe, it, expect } from "vitest";
import { wrapTextToColumns, layoutBulletinPage, createRow } from "@/domain/layout-engine/layout";
import { formatHeaderRow, formatNavigationRow } from "@/domain/layout-engine/header";
import { getGraphemeCount } from "@/domain/layout-engine/graphemes";

describe("40x25 Teletext Layout Engine", () => {
  const fixedTimestamp = new Date("2026-10-31T12:00:00Z");

  it("wraps English text at word boundaries within 40 columns", () => {
    const text =
      "The quick brown fox jumps over the lazy dog and runs across the wide open grassy plains of the countryside.";
    const lines = wrapTextToColumns(text, 40);

    for (const line of lines) {
      expect(getGraphemeCount(line)).toBeLessThanOrEqual(40);
    }

    // Words should not be severed mid-word if they fit on the line
    expect(lines[0]).toBe("The quick brown fox jumps over the lazy");
    expect(lines[1].startsWith("dog")).toBe(true);
  });

  it("safely wraps Hindi Devanagari text within 40 columns without severing clusters", () => {
    const hindiText =
      "पेजकास्ट एक कम-बैंडविड्थ टेलीटेक्स्ट सूचना मंच है जो कीरोवीन 2026 हैकाथॉन के लिए बनाया गया है। यह लेखों को स्वचालित रूप से संक्षिप्त करता है।";
    const lines = wrapTextToColumns(hindiText, 40, "hi");

    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(getGraphemeCount(line, "hi")).toBeLessThanOrEqual(40);
    }
  });

  it("chunks words longer than 40 characters safely by graphemes", () => {
    const longWord = "SupercalifragilisticexpialidociousAntigravityEngine2026";
    expect(longWord.length).toBeGreaterThan(40);

    const lines = wrapTextToColumns(longWord, 40);
    expect(lines.length).toBe(2);
    expect(getGraphemeCount(lines[0])).toBe(40);
    expect(getGraphemeCount(lines[1])).toBe(longWord.length - 40);
  });

  it("formats Header Row (Row 1) to exactly 40 character cells", () => {
    const row = formatHeaderRow(100, "PAGECAST", fixedTimestamp);
    const totalChars = row.spans.reduce((sum, s) => sum + s.text.length, 0);

    expect(totalChars).toBe(40);
    expect(row.spans[0].text.startsWith("P100")).toBe(true);
  });

  it("formats Navigation Row (Row 25) to exactly 40 character cells", () => {
    const row = formatNavigationRow({
      red: 101,
      green: 200,
      yellow: 300,
      cyan: 100,
    });
    const totalChars = row.spans.reduce((sum, s) => sum + s.text.length, 0);

    expect(totalChars).toBe(40);
    expect(row.spans.length).toBe(4);
  });

  it("layouts a complete page having strictly 25 rows, each with exactly 40 cells", () => {
    const page = layoutBulletinPage({
      pageNumber: 101,
      title: "World News",
      topic: "HEADLINES",
      headline: "GLOBAL CLIMATE ACCORD REACHED",
      paragraphs: [
        "Representatives from 195 nations signed a historic agreement today.",
        "The treaty mandates radical reductions in emissions by the end of the decade.",
      ],
      fastext: { red: 102, green: 200, yellow: 300, cyan: 100 },
      timestamp: fixedTimestamp,
    });

    // Invariant P1: Exactly 25 rows
    expect(page.rows.length).toBe(25);

    // Invariant P2: Every row contains exactly 40 logical character cells
    page.rows.forEach((row, rowIndex) => {
      const rowLength = row.spans.reduce((sum, s) => sum + getGraphemeCount(s.text), 0);
      expect(rowLength).toBe(40);
    });

    // Row 1 is header
    expect(page.rows[0].spans[0].text.startsWith("P101")).toBe(true);
    // Row 25 is Fastext navigation
    expect(page.rows[24].spans.length).toBe(4);
  });

  it("produces 100% deterministic layout given identical inputs", () => {
    const params = {
      pageNumber: 102,
      title: "Science Update",
      topic: "PHYSICS",
      headline: "QUANTUM BREAKTHROUGH ANNOUNCED",
      paragraphs: ["A new optical processor operates at room temperature."],
      fastext: { red: 103, green: 200, yellow: 300, cyan: 100 },
      timestamp: fixedTimestamp,
    };

    const page1 = layoutBulletinPage(params);
    const page2 = layoutBulletinPage(params);

    expect(page1).toEqual(page2);
  });
});
