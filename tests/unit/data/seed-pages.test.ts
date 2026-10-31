import { describe, it, expect } from "vitest";
import {
  SEED_PAGES,
  SEED_PAGE_PACK,
  CURATED_DEMO_BULLETINS,
  getSeedPage,
  getSeedPageCatalog,
} from "@/data/seed-pages";
import { validateGrid } from "@/domain/validation/validate-grid";
import { PagePackV1Schema } from "@/domain/page-pack/schema";
import { measurePagePack } from "@/domain/page-pack/codec";

describe("Seed Page Catalog & Curated Demo Bulletins (TASK-S5-11 / SUB-007)", () => {
  it("contains 6 seeded Teletext pages (Index + 5 curated bulletins)", () => {
    expect(SEED_PAGES.length).toBe(6);
  });

  it("verifies that EVERY seed page strictly complies with the 40x25 Teletext grid", () => {
    for (const page of SEED_PAGES) {
      const result = validateGrid(page);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(page.rows.length).toBe(25);
    }
  });

  it("validates that SEED_PAGE_PACK complies with PagePackV1Schema and byte budget", () => {
    const parseResult = PagePackV1Schema.safeParse(SEED_PAGE_PACK);
    expect(parseResult.success).toBe(true);

    const budget = measurePagePack(SEED_PAGE_PACK);
    expect(budget.isOverBudget).toBe(false);
    expect(budget.bytesUsed).toBeLessThanOrEqual(10240);
  });

  it("verifies all 5 curated demo bulletins comply with schema, attribution, and byte budget", () => {
    expect(CURATED_DEMO_BULLETINS.length).toBe(5);

    // 3 English bulletins (P101, P200, P400), 2 Hindi bulletins (P102, P401)
    const englishBulletins = CURATED_DEMO_BULLETINS.filter((b) => b.metadata.language === "en");
    const hindiBulletins = CURATED_DEMO_BULLETINS.filter((b) => b.metadata.language === "hi");
    expect(englishBulletins.length).toBe(3);
    expect(hindiBulletins.length).toBe(2);

    for (const pack of CURATED_DEMO_BULLETINS) {
      // 1. Schema compliance
      const parseResult = PagePackV1Schema.safeParse(pack);
      expect(parseResult.success).toBe(true);

      // 2. Budget ceiling <= 10,240 bytes
      const budget = measurePagePack(pack);
      expect(budget.isOverBudget).toBe(false);
      expect(budget.bytesUsed).toBeLessThanOrEqual(10240);

      // 3. Genuine source URL attribution
      expect(pack.metadata.originalUrl).toBeDefined();
      expect(pack.metadata.originalUrl?.startsWith("https://")).toBe(true);

      // 4. Evidence references with sentence IDs
      expect(pack.metadata.evidenceReferences?.length).toBeGreaterThanOrEqual(1);
      for (const ref of pack.metadata.evidenceReferences || []) {
        expect(ref.sourceSentenceId).toMatch(/^s\d+$/);
      }
    }
  });

  it("correctly retrieves Hindi bulletins P102 and P401", () => {
    const p102 = getSeedPage(102);
    expect(p102).toBeDefined();
    expect(p102?.language).toBe("hi");
    expect(p102?.title).toBe("राष्ट्रीय समाचार");

    const p401 = getSeedPage(401);
    expect(p401).toBeDefined();
    expect(p401?.language).toBe("hi");
    expect(p401?.title).toBe("मौसम व आपदा चेतावनी");
  });

  it("returns all 6 seed page numbers from getSeedPageCatalog", () => {
    const catalog = getSeedPageCatalog();
    expect(catalog).toEqual([100, 101, 102, 200, 400, 401]);
  });
});
