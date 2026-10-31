import { describe, it, expect } from "vitest";
import { SEED_PAGES, SEED_PAGE_PACK, getSeedPage, getSeedPageCatalog } from "@/data/seed-pages";
import { validateGrid } from "@/domain/validation/validate-grid";
import { PagePackV1Schema } from "@/domain/page-pack/schema";
import { measurePagePack } from "@/domain/page-pack/codec";

describe("Seed Page Catalog & Official Bulletins", () => {
  it("contains at least 5 seeded Teletext pages", () => {
    expect(SEED_PAGES.length).toBeGreaterThanOrEqual(5);
  });

  it("verifies that EVERY seed page passes validateGrid (25 rows x 40 cells)", () => {
    for (const page of SEED_PAGES) {
      const result = validateGrid(page);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(page.rows.length).toBe(25);
    }
  });

  it("validates that SEED_PAGE_PACK complies with PagePackV1Schema", () => {
    const parseResult = PagePackV1Schema.safeParse(SEED_PAGE_PACK);
    expect(parseResult.success).toBe(true);
  });

  it("verifies that SEED_PAGE_PACK strictly complies with the 10 KiB byte budget", () => {
    const budget = measurePagePack(SEED_PAGE_PACK);
    expect(budget.isOverBudget).toBe(false);
    expect(budget.bytesUsed).toBeLessThanOrEqual(10240);
  });

  it("correctly retrieves Page 100 and Hindi Page 102", () => {
    const p100 = getSeedPage(100);
    expect(p100).toBeDefined();
    expect(p100?.title).toContain("Main Index");

    const p102 = getSeedPage(102);
    expect(p102).toBeDefined();
    expect(p102?.language).toBe("hi");
    expect(p102?.title).toBe("राष्ट्रीय समाचार");
  });

  it("returns valid seed page numbers from getSeedPageCatalog", () => {
    const catalog = getSeedPageCatalog();
    expect(catalog).toEqual([100, 101, 102, 200, 400]);
  });
});
