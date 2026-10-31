import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { TerminalHeader } from "@/components/teletext/TerminalHeader";
import { createNotFoundPage } from "@/components/teletext/TerminalNotFound";
import { createLoadingPage } from "@/components/teletext/TerminalLoading";
import { validateGrid } from "@/domain/validation/validate-grid";

describe("Reader Terminal UI Components (TASK-S4-02)", () => {
  describe("TerminalHeader", () => {
    it("renders live broadcast badge and magazine name", () => {
      const html = renderToString(
        React.createElement(TerminalHeader, {
          pageNumber: 201,
          showScanlines: false,
          phosphorGlow: true,
          onToggleScanlines: () => {},
          onTogglePhosphorGlow: () => {},
          isOffline: false,
        })
      );

      expect(html).toContain("LIVE BROADCAST");
      expect(html).toContain("MAG 2");
      expect(html).toContain("TECHNOLOGY &amp; RESILIENCE");
      expect(html).toContain("CRT SCANLINES: OFF");
      expect(html).toContain("GLOW: ON");
    });

    it("renders offline badge when disconnected", () => {
      const html = renderToString(
        React.createElement(TerminalHeader, {
          pageNumber: 100,
          showScanlines: true,
          phosphorGlow: false,
          onToggleScanlines: () => {},
          onTogglePhosphorGlow: () => {},
          isOffline: true,
        })
      );

      expect(html).toContain("CACHED / OFFLINE");
      expect(html).toContain("CRT SCANLINES: ON");
      expect(html).toContain("GLOW: OFF");
    });
  });

  describe("TerminalNotFound", () => {
    it("generates an authentic 40x25 grid conforming to Teletext invariants", () => {
      const notFoundPage = createNotFoundPage(550);

      expect(notFoundPage.pageNumber).toBe(550);
      expect(notFoundPage.rows).toHaveLength(25);

      const validation = validateGrid(notFoundPage);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Check Fastext navigation links
      expect(notFoundPage.fastext.red).toBe(100);
      expect(notFoundPage.fastext.green).toBe(200);
      expect(notFoundPage.fastext.yellow).toBe(300);
      expect(notFoundPage.fastext.cyan).toBe(400);
    });

    it("safely handles out-of-bounds page numbers by falling back to 404", () => {
      const page = createNotFoundPage(999);
      expect(page.pageNumber).toBe(404);
      expect(validateGrid(page).valid).toBe(true);
    });
  });

  describe("TerminalLoading", () => {
    it("generates a valid 40x25 searching/tuning Teletext grid", () => {
      const loadingPage = createLoadingPage(301);

      expect(loadingPage.pageNumber).toBe(301);
      expect(loadingPage.rows).toHaveLength(25);

      const validation = validateGrid(loadingPage);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Verify row 0 header text
      const headerText = loadingPage.rows[0].spans.map((s) => s.text).join("");
      expect(headerText).toContain("P301");
    });
  });
});
