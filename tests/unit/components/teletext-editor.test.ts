import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ColorPalettePicker } from "@/components/publisher/ColorPalettePicker";
import { TeletextEditor } from "@/components/publisher/TeletextEditor";
import { page100 } from "@/data/seed-pages";
import { TELETEXT_COLORS, type TeletextPage } from "@/domain/teletext/types";
import { TELETEXT_ROWS, TELETEXT_COLS } from "@/domain/layout-engine/layout";
import { validateGrid } from "@/domain/validation/validate-grid";

describe("Teletext Editor & Color Palette Component Suite (TASK-S3-05)", () => {
  describe("ColorPalettePicker", () => {
    it("renders all 8 Teletext colors with accessible radio roles", () => {
      const html = renderToString(
        React.createElement(ColorPalettePicker, {
          selectedColor: "yellow",
          onSelectColor: () => {},
        })
      );

      for (const color of TELETEXT_COLORS) {
        expect(html).toContain(`Teletext Color: ${color}`);
      }
    });

    it("indicates the currently selected color via aria-checked", () => {
      const html = renderToString(
        React.createElement(ColorPalettePicker, {
          selectedColor: "cyan",
          onSelectColor: () => {},
        })
      );

      expect(html).toContain('aria-label="Teletext Color: cyan (#00FFFF)"');
      expect(html).toContain('aria-checked="true"');
    });
  });

  describe("TeletextEditor", () => {
    it("renders with a 40x25 Teletext grid canvas", () => {
      const html = renderToString(
        React.createElement(TeletextEditor, {
          initialPage: page100,
        })
      );

      expect(html).toContain("40×25 CRT Canvas Preview");
      expect(html).toContain("P<!-- -->100");
      expect(html).toContain("Row 1 (Header - Locked)");
      expect(html).toContain("Row 25 (Fastext - Nav)");
    });

    it("preserves exact 40x25 grid geometry after row edits", () => {
      const editor = React.createElement(TeletextEditor, {
        initialPage: page100,
        onChange: () => {},
      });

      renderToString(editor);

      // Verify initial page grid validity
      const gridResult = validateGrid(page100);
      expect(gridResult.valid).toBe(true);
      expect(page100.rows.length).toBe(TELETEXT_ROWS);
      expect(page100.rows.length).toBe(25);
      for (const row of page100.rows) {
        const rowGraphemes = row.spans.reduce(
          (sum, span) => sum + (span.text ? span.text.length : 0),
          0
        );
        expect(validateGrid(page100).valid).toBe(true);
      }
    });

    it("disables editing on Row 0 (Header) and Row 24 (Fastext)", () => {
      const html = renderToString(
        React.createElement(TeletextEditor, {
          initialPage: page100,
        })
      );

      expect(html).toContain("disabled");
    });
  });
});
