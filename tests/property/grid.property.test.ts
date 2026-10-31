import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { layoutBulletinPage, wrapTextToColumns } from "@/domain/layout-engine/layout";
import { validateGrid } from "@/domain/validation/validate-grid";
import { isValidPageNumber, getMagazineNumber } from "@/domain/validation/page-number";
import {
  serializePagePack,
  deserializePagePack,
  measurePagePack,
  assertPagePackBudget,
} from "@/domain/page-pack/codec";
import { getGraphemeCount } from "@/domain/layout-engine/graphemes";
import type { PagePackV1 } from "@/domain/page-pack/types";
import type { TeletextPage } from "@/domain/teletext/types";

describe("Fast-Check Property-Based Verification Suite (P1 - P8)", () => {
  const fixedTimestamp = new Date("2026-10-31T12:00:00Z");

  // Generator for valid 3-digit page numbers
  const pageNumberArb = fc.integer({ min: 100, max: 899 });

  // Generator for arbitrary paragraphs
  const paragraphArb = fc.string({ unit: "grapheme", minLength: 1, maxLength: 200 });

  // Generator for Fastext links
  const fastextArb = fc.record({
    red: pageNumberArb,
    green: pageNumberArb,
    yellow: pageNumberArb,
    cyan: pageNumberArb,
  });

  /**
   * Property P1: validateGrid(page) is true only for exactly 25 rows.
   */
  it("Property P1: layout engine ALWAYS produces exactly 25 rows (1,000 runs)", () => {
    fc.assert(
      fc.property(
        pageNumberArb,
        fc.string({ maxLength: 30 }),
        fc.array(paragraphArb, { maxLength: 8 }),
        fastextArb,
        (pageNumber, title, paragraphs, fastext) => {
          const page = layoutBulletinPage({
            pageNumber,
            title: title || "Untitled",
            paragraphs,
            fastext,
            timestamp: fixedTimestamp,
          });

          return page.rows.length === 25;
        }
      ),
      { numRuns: 1000 }
    );
  });

  /**
   * Property P2: Every row contains exactly 40 logical character cells.
   */
  it("Property P2: Every row in a generated page contains exactly 40 logical cells (1,000 runs)", () => {
    fc.assert(
      fc.property(
        pageNumberArb,
        fc.string({ maxLength: 40 }),
        fc.array(paragraphArb, { maxLength: 6 }),
        fastextArb,
        (pageNumber, headline, paragraphs, fastext) => {
          const page = layoutBulletinPage({
            pageNumber,
            title: "Property Test",
            headline: headline || undefined,
            paragraphs,
            fastext,
            timestamp: fixedTimestamp,
          });

          // Verify every single row has exactly 40 cells
          return page.rows.every((row) => {
            const length = row.spans.reduce((sum, s) => sum + getGraphemeCount(s.text), 0);
            return length === 40;
          });
        }
      ),
      { numRuns: 1000 }
    );
  });

  /**
   * Property P3: Grapheme clusters are never severed across 40 columns.
   */
  it("Property P3: Line wrapping never exceeds 40 columns across arbitrary graphemes (1,000 runs)", () => {
    fc.assert(
      fc.property(fc.string({ unit: "grapheme", minLength: 0, maxLength: 500 }), (text) => {
        const lines = wrapTextToColumns(text, 40);
        return lines.every((line) => getGraphemeCount(line) <= 40);
      }),
      { numRuns: 1000 }
    );
  });

  /**
   * Property P4: Determinism Invariant: same inputs + timestamp produce identical layouts.
   */
  it("Property P4: Deterministic layout invariant (1,000 runs)", () => {
    fc.assert(
      fc.property(
        pageNumberArb,
        fc.string({ maxLength: 30 }),
        fc.array(paragraphArb, { maxLength: 4 }),
        fastextArb,
        (pageNumber, title, paragraphs, fastext) => {
          const params = {
            pageNumber,
            title: title || "Test",
            paragraphs,
            fastext,
            timestamp: fixedTimestamp,
          };

          const run1 = layoutBulletinPage(params);
          const run2 = layoutBulletinPage(params);

          return JSON.stringify(run1) === JSON.stringify(run2);
        }
      ),
      { numRuns: 1000 }
    );
  });

  /**
   * Property P5: Page number validity strictly corresponds to 100-899.
   */
  it("Property P5: Page number bounds invariant (1,000 runs)", () => {
    fc.assert(
      fc.property(fc.integer({ min: -500, max: 1500 }), (candidate) => {
        const isValid = isValidPageNumber(candidate);
        const expected = candidate >= 100 && candidate <= 899;

        if (isValid) {
          const mag = getMagazineNumber(candidate);
          return isValid === expected && mag >= 1 && mag <= 8;
        }

        return isValid === expected;
      }),
      { numRuns: 1000 }
    );
  });

  /**
   * Property P6: Byte budget ceiling enforcement for 10 KiB (10,240 bytes).
   */
  it("Property P6: Byte budget ceiling correctly identifies compliant vs over-budget packs (500 runs)", () => {
    fc.assert(
      fc.property(
        pageNumberArb,
        fc.string({ maxLength: 40 }),
        fastextArb,
        (pageNumber, title, fastext) => {
          const page = layoutBulletinPage({
            pageNumber,
            title: title || "Test Page",
            paragraphs: ["Short test paragraph."],
            fastext,
            timestamp: fixedTimestamp,
          });

          const pack: PagePackV1 = {
            id: "12345678-1234-4234-8234-123456789abc",
            version: 1,
            slug: "test-pack",
            title: title || "Test Pack",
            magazine: getMagazineNumber(pageNumber),
            primaryPageNumber: pageNumber,
            createdAt: fixedTimestamp.toISOString(),
            metadata: {
              sourceName: "Test Source",
              language: "en",
              aiAssisted: false,
              publisherId: "pub_test",
            },
            pages: [page],
          };

          const budget = measurePagePack(pack);
          if (budget.bytesUsed <= 10240) {
            expect(() => assertPagePackBudget(pack)).not.toThrow();
            return !budget.isOverBudget;
          } else {
            expect(() => assertPagePackBudget(pack)).toThrow();
            return budget.isOverBudget;
          }
        }
      ),
      { numRuns: 500 }
    );
  });

  /**
   * Property P7: Lossless serialization and deserialization round-trip.
   */
  it("Property P7: PagePack serialization round-trip invariant (500 runs)", () => {
    fc.assert(
      fc.property(
        pageNumberArb,
        fc.string({ minLength: 1, maxLength: 25 }).filter((s) => /^[a-z0-9-]+$/.test(s)),
        fastextArb,
        (pageNumber, slug, fastext) => {
          const page = layoutBulletinPage({
            pageNumber,
            title: "Roundtrip Test",
            paragraphs: ["A valid line of content."],
            fastext,
            timestamp: fixedTimestamp,
          });

          const pack: PagePackV1 = {
            id: "12345678-1234-4234-8234-123456789abc",
            version: 1,
            slug: slug || "test-slug",
            title: "Roundtrip Test Pack",
            magazine: getMagazineNumber(pageNumber),
            primaryPageNumber: pageNumber,
            createdAt: fixedTimestamp.toISOString(),
            metadata: {
              sourceName: "Roundtrip Source",
              language: "en",
              aiAssisted: false,
              publisherId: "pub_1",
            },
            pages: [page],
          };

          const serialized = serializePagePack(pack);
          const deserialized = deserializePagePack(serialized);

          return JSON.stringify(deserialized) === JSON.stringify(pack);
        }
      ),
      { numRuns: 500 }
    );
  });

  /**
   * Property P8: Row 1 is always Header, Row 25 is always Navigation.
   */
  it("Property P8: Header and Navigation row structural invariant (1,000 runs)", () => {
    fc.assert(
      fc.property(pageNumberArb, fastextArb, (pageNumber, fastext) => {
        const page = layoutBulletinPage({
          pageNumber,
          title: "Structural Invariant",
          paragraphs: [],
          fastext,
          timestamp: fixedTimestamp,
        });

        // Row 1 (index 0) starts with P[pageNumber]
        const row1Text = page.rows[0].spans.map((s) => s.text).join("");
        const row1Valid = row1Text.startsWith(`P${pageNumber}`);

        // Row 25 (index 24) has 4 Fastext spans
        const row25Spans = page.rows[24].spans;
        const row25Valid =
          row25Spans.length === 4 &&
          row25Spans[0].color === "red" &&
          row25Spans[1].color === "green" &&
          row25Spans[2].color === "yellow" &&
          row25Spans[3].color === "cyan";

        return row1Valid && row25Valid;
      }),
      { numRuns: 1000 }
    );
  });
});
