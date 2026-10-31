import { describe, it, expect } from "vitest";
import {
  isValidPageNumber,
  getMagazineNumber,
  formatPageNumber,
  getNextPageNumber,
  getPreviousPageNumber,
} from "@/domain/validation/page-number";

describe("Page Number Validation & Navigation", () => {
  it("accepts valid 3-digit page numbers in 100-899", () => {
    expect(isValidPageNumber(100)).toBe(true);
    expect(isValidPageNumber(101)).toBe(true);
    expect(isValidPageNumber(450)).toBe(true);
    expect(isValidPageNumber(899)).toBe(true);
  });

  it("rejects invalid page numbers outside 100-899", () => {
    expect(isValidPageNumber(0)).toBe(false);
    expect(isValidPageNumber(99)).toBe(false);
    expect(isValidPageNumber(900)).toBe(false);
    expect(isValidPageNumber(999)).toBe(false);
    expect(isValidPageNumber(-100)).toBe(false);
    expect(isValidPageNumber(100.5)).toBe(false);
  });

  it("extracts magazine number (1-8) accurately", () => {
    expect(getMagazineNumber(100)).toBe(1);
    expect(getMagazineNumber(105)).toBe(1);
    expect(getMagazineNumber(200)).toBe(2);
    expect(getMagazineNumber(399)).toBe(3);
    expect(getMagazineNumber(899)).toBe(8);
  });

  it("throws error when extracting magazine from invalid page number", () => {
    expect(() => getMagazineNumber(99)).toThrow();
    expect(() => getMagazineNumber(900)).toThrow();
  });

  it("formats valid page numbers as 3-digit strings", () => {
    expect(formatPageNumber(100)).toBe("100");
    expect(formatPageNumber(404)).toBe("404");
    expect(formatPageNumber(99)).toBe("100"); // Fallback
  });

  it("navigates next and previous pages sequentially with cycle wrap-around", () => {
    const catalog = [100, 101, 102, 200, 400];

    // Next
    expect(getNextPageNumber(100, catalog)).toBe(101);
    expect(getNextPageNumber(101, catalog)).toBe(102);
    expect(getNextPageNumber(400, catalog)).toBe(100); // Wraps around to 100

    // Previous
    expect(getPreviousPageNumber(102, catalog)).toBe(101);
    expect(getPreviousPageNumber(101, catalog)).toBe(100);
    expect(getPreviousPageNumber(100, catalog)).toBe(400); // Wraps around to 400
  });
});
