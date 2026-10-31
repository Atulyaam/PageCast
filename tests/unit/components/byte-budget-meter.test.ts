import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ByteBudgetMeter } from "@/components/publisher/ByteBudgetMeter";
import { GridValidationBanner } from "@/components/publisher/GridValidationBanner";
import { SEED_PAGE_PACK, page100 } from "@/data/seed-pages";
import type { PagePackV1 } from "@/domain/page-pack/types";

describe("Byte Budget Meter & Validation Banner Components (TASK-S3-06)", () => {
  describe("ByteBudgetMeter", () => {
    it("renders empty state gracefully when pack is null", () => {
      const html = renderToString(React.createElement(ByteBudgetMeter, { pack: null }));
      expect(html).toContain("Payload Byte Budget:");
      expect(html).toContain("10,240");
    });

    it("renders compliant status for seed page pack", () => {
      const html = renderToString(React.createElement(ByteBudgetMeter, { pack: SEED_PAGE_PACK }));
      expect(html).toContain("COMPLIANT");
      expect(html).toContain("10,240");
      expect(html).toContain("Remaining:");
    });

    it("displays OVER BUDGET badge when pack exceeds 10,240 bytes", () => {
      // Create over-budget mock pack by injecting large metadata
      const oversizedPack: PagePackV1 = {
        ...SEED_PAGE_PACK,
        metadata: {
          ...SEED_PAGE_PACK.metadata,
          sourceName: "X".repeat(11000), // Pushes size over 10,240 bytes
        },
      };

      const html = renderToString(React.createElement(ByteBudgetMeter, { pack: oversizedPack }));
      expect(html).toContain("OVER BUDGET");
      expect(html).toContain("text-red-400");
    });
  });

  describe("GridValidationBanner", () => {
    it("renders READY TO PUBLISH for valid page and pack", () => {
      const html = renderToString(
        React.createElement(GridValidationBanner, {
          page: page100,
          pack: SEED_PAGE_PACK,
        })
      );
      expect(html).toContain("READY TO PUBLISH");
      expect(html).toContain("40×25 Grid Geometry");
      expect(html).toContain("Page 100–899 Range");
    });

    it("renders ACTION REQUIRED when geometry or budget fails", () => {
      const invalidPage = {
        ...page100,
        rows: page100.rows.slice(0, 20), // Invalid row count (20 instead of 25)
      };

      const html = renderToString(
        React.createElement(GridValidationBanner, {
          page: invalidPage,
          pack: SEED_PAGE_PACK,
        })
      );
      expect(html).toContain("ACTION REQUIRED");
      expect(html).toContain("Grid Errors:");
    });
  });
});
