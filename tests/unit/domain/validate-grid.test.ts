import { describe, it, expect } from "vitest";
import { validateGrid } from "@/domain/validation/validate-grid";
import type { TeletextPage } from "@/domain/teletext/types";

describe("validateGrid (Properties P1 & P2)", () => {
  const createValid25Rows = () =>
    Array.from({ length: 25 }, (_, i) => ({
      spans: [{ text: `Row ${i + 1} `.padEnd(40, " ") }],
    }));

  const validPage: TeletextPage = {
    pageNumber: 100,
    title: "Main Index",
    rows: createValid25Rows(),
    fastext: { red: 101, green: 200, yellow: 300, cyan: 400 },
  };

  it("passes validation for a strictly compliant 25-row x 40-cell page", () => {
    const result = validateGrid(validPage);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects a page with only 24 rows (Property P1 violation)", () => {
    const page24: TeletextPage = {
      ...validPage,
      rows: validPage.rows.slice(0, 24),
    };

    const result = validateGrid(page24);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("expected exactly 25 rows"))).toBe(true);
  });

  it("rejects a page with 26 rows (Property P1 violation)", () => {
    const page26: TeletextPage = {
      ...validPage,
      rows: [...validPage.rows, { spans: [{ text: "EXTRA ROW".padEnd(40, " ") }] }],
    };

    const result = validateGrid(page26);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("expected exactly 25 rows"))).toBe(true);
  });

  it("rejects a page where a row has fewer than 40 cells (Property P2 violation)", () => {
    const shortRows = createValid25Rows();
    shortRows[5] = { spans: [{ text: "Short line of 20 chars" }] }; // length 22

    const pageShort: TeletextPage = {
      ...validPage,
      rows: shortRows,
    };

    const result = validateGrid(pageShort);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Row 6 has invalid column count"))).toBe(true);
  });

  it("rejects a page where a row has more than 40 cells (Property P2 violation)", () => {
    const longRows = createValid25Rows();
    longRows[10] = { spans: [{ text: "X".repeat(45) }] };

    const pageLong: TeletextPage = {
      ...validPage,
      rows: longRows,
    };

    const result = validateGrid(pageLong);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Row 11 has invalid column count"))).toBe(true);
  });
});
