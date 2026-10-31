import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import NotFound from "@/app/not-found";
import ErrorBoundary from "@/app/error";
import GlobalError from "@/app/global-error";

describe("Teletext Error Boundaries & Failure States (TASK-S5-05)", () => {
  describe("NotFound (P404) Component", () => {
    it("renders the Teletext P404 header and not-found message", () => {
      const html = renderToString(React.createElement(NotFound));

      expect(html).toContain('role="main"');
      expect(html).toContain('aria-label="404 Page Not Found"');
      expect(html).toContain("PAGECAST");
      expect(html).toContain("P404");
      expect(html).toContain("SIGNAL LOST");
      expect(html).toContain("ERROR: PAGE NOT FOUND");
    });

    it("provides recovery links to index, tech, home, and publisher", () => {
      const html = renderToString(React.createElement(NotFound));

      expect(html).toContain('href="/pages/100"');
      expect(html).toContain("[RED] INDEX");
      expect(html).toContain('href="/pages/200"');
      expect(html).toContain("[GRN] TECH");
      expect(html).toContain('href="/"');
      expect(html).toContain("[YEL] HOME");
      expect(html).toContain('href="/publisher"');
      expect(html).toContain("[CYN] STUDIO");
    });
  });

  describe("ErrorBoundary Component", () => {
    it("renders CRT signal fault state without leaking stack traces", () => {
      const mockError = new Error("Sensitive database connection string leaked in error");
      mockError.stack = "Error: at eval (src/internal/database/secret.ts:42:15)";
      const mockReset = vi.fn();

      const html = renderToString(
        React.createElement(ErrorBoundary, {
          error: mockError,
          reset: mockReset,
        })
      );

      expect(html).toContain('role="main"');
      expect(html).toContain('aria-label="Application Error"');
      expect(html).toContain("P888");
      expect(html).toContain("SIGNAL FAULT");
      expect(html).toContain("TRANSMISSION INTERRUPTED");
      expect(html).toContain("[RETRY SIGNAL RECEPTION]");
      expect(html).toContain('href="/pages/100"');
      expect(html).toContain("[100] MAIN INDEX");

      // Ensure raw error message and stack trace are NEVER displayed in the rendered markup
      expect(html).not.toContain("Sensitive database connection string");
      expect(html).not.toContain("src/internal/database/secret.ts");
    });

    it("displays error diagnostic digest when available", () => {
      const mockError = Object.assign(new Error("Generic fault"), { digest: "DIGEST-9988-SEC" });
      const mockReset = vi.fn();

      const html = renderToString(
        React.createElement(ErrorBoundary, {
          error: mockError,
          reset: mockReset,
        })
      );

      expect(html).toContain("DIAGNOSTIC DIGEST: DIGEST-9988-SEC");
    });
  });

  describe("GlobalError Component", () => {
    it("renders critical fault container with html and body structure", () => {
      const mockError = Object.assign(new Error("Fatal layout crash"), { digest: "CRIT-001" });
      const mockReset = vi.fn();

      const html = renderToString(
        React.createElement(GlobalError, {
          error: mockError,
          reset: mockReset,
        })
      );

      expect(html).toContain("<html");
      expect(html).toContain("<body");
      expect(html).toContain('role="main"');
      expect(html).toContain('aria-label="Critical System Error"');
      expect(html).toContain("CRITICAL FAULT");
      expect(html).toContain("UNRECOVERABLE FRAME ERROR");
      expect(html).toContain("ERROR DIGEST: CRIT-001");
      expect(html).toContain("REINITIALIZE TERMINAL");

      // Ensure stack traces are suppressed
      expect(html).not.toContain("Fatal layout crash");
    });
  });
});
