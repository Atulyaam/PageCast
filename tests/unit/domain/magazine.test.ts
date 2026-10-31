import { describe, it, expect } from "vitest";
import {
  MAGAZINES,
  getMagazineDefinition,
  formatSubPageId,
  parseSubPageId,
  formatSubPageIndicator,
  validateSubPages,
} from "@/domain/teletext/magazine";
import { layoutBulletinPage } from "@/domain/layout-engine/layout";
import type { TeletextPage } from "@/domain/teletext/types";

describe("Teletext Magazine and Sub-Page Domain Logic", () => {
  it("defines exactly 8 standard Teletext magazines covering 100 to 899", () => {
    expect(MAGAZINES).toHaveLength(8);

    MAGAZINES.forEach((mag, idx) => {
      expect(mag.number).toBe(idx + 1);
      expect(mag.pageRange[0]).toBe((idx + 1) * 100);
      expect(mag.pageRange[1]).toBe((idx + 1) * 100 + 99);
      expect(mag.name).toBeTruthy();
      expect(mag.defaultColor).toBeTruthy();
    });
  });

  it("retrieves magazine definitions by magazine number and page number", () => {
    const mag1 = getMagazineDefinition(1);
    expect(mag1.name).toBe("News & Index");

    const mag2FromPage = getMagazineDefinition(250);
    expect(mag2FromPage.name).toBe("Technology & Resilience");
    expect(mag2FromPage.number).toBe(2);

    const mag8 = getMagazineDefinition(899);
    expect(mag8.name).toBe("Emergency & Engineering");

    expect(() => getMagazineDefinition(9)).toThrow(/INVALID_MAGAZINE/);
    expect(() => getMagazineDefinition(950)).toThrow();
  });

  it("formats and parses sub-page identifiers", () => {
    expect(formatSubPageId(101, 1)).toBe("101/1");
    expect(formatSubPageId(101, 2, true)).toBe("101/02");
    expect(() => formatSubPageId(99, 1)).toThrow(/Invalid page number/);

    expect(parseSubPageId("101/1")).toEqual({ pageNumber: 101, subPageNumber: 1 });
    expect(parseSubPageId("200/03")).toEqual({ pageNumber: 200, subPageNumber: 3 });
    expect(parseSubPageId("400")).toEqual({ pageNumber: 400, subPageNumber: 1 });

    expect(parseSubPageId("invalid")).toBeNull();
    expect(parseSubPageId("99/1")).toBeNull();
    expect(parseSubPageId("101/0")).toBeNull();
    expect(parseSubPageId("101/abc")).toBeNull();
  });

  it("formats sub-page position indicators for header display", () => {
    expect(formatSubPageIndicator(1, 1)).toBe("");
    expect(formatSubPageIndicator(1, 3)).toBe("1/3");
    expect(formatSubPageIndicator(2, 4, true)).toBe("02/04");
  });

  describe("validateSubPages", () => {
    const validPage1: TeletextPage = layoutBulletinPage({
      pageNumber: 101,
      subPageNumber: 1,
      subPageCount: 2,
      title: "Subpage One",
      paragraphs: ["Paragraph for subpage 1."],
      fastext: { red: 100, green: 102, yellow: 200, cyan: 300 },
    });

    const validPage2: TeletextPage = layoutBulletinPage({
      pageNumber: 101,
      subPageNumber: 2,
      subPageCount: 2,
      title: "Subpage Two",
      paragraphs: ["Paragraph for subpage 2."],
      fastext: { red: 100, green: 102, yellow: 200, cyan: 300 },
    });

    it("validates a harmonious multi-page sequence", () => {
      const result = validateSubPages([validPage1, validPage2]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects an empty list of pages", () => {
      const result = validateSubPages([]);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/at least 1 page/);
    });

    it("rejects pages with mismatched primary page numbers", () => {
      const mismatchedPage = { ...validPage2, pageNumber: 102 };
      const result = validateSubPages([validPage1, mismatchedPage]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("pageNumber 102"))).toBe(true);
    });

    it("rejects non-sequential or duplicate subPageNumbers", () => {
      const duplicatePage = { ...validPage2, subPageNumber: 1 };
      const result = validateSubPages([validPage1, duplicatePage]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("expected sequential 2"))).toBe(true);
    });

    it("rejects pages violating 40x25 grid geometry", () => {
      const corruptPage = {
        ...validPage2,
        rows: validPage2.rows.slice(0, 20), // Only 20 rows
      };
      const result = validateSubPages([validPage1, corruptPage]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("grid error"))).toBe(true);
    });
  });
});
