import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { FocusTrap } from "@/components/common/FocusTrap";
import { KeyboardShortcutsModal } from "@/components/teletext/KeyboardShortcutsModal";
import { ImportDialog } from "@/components/teletext/ImportDialog";
import { QrScannerModal } from "@/components/teletext/QrScannerModal";
import { ExportDialog } from "@/components/publisher/ExportDialog";
import { AccessibleTextView } from "@/components/teletext/AccessibleTextView";
import { page100 } from "@/data/seed-pages";

/**
 * Calculates WCAG 2.2 relative luminance for an sRGB component [0..255].
 */
function sRgbLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/**
 * Calculates WCAG 2.2 relative luminance of a hex color string.
 */
function getRelativeLuminance(hex: string): number {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);

  return (
    0.2126 * sRgbLuminance(r) +
    0.7152 * sRgbLuminance(g) +
    0.0722 * sRgbLuminance(b)
  );
}

/**
 * Calculates contrast ratio between two colors according to W3C guidelines.
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Automated Accessibility Audit & Focus Traps (TASK-S5-07 / NFR-011, UXR-016)", () => {
  describe("WCAG 2.2 AA Contrast Compliance of Teletext Palette on Pure Black (#000000)", () => {
    const BLACK = "#000000";

    it("verifies White (#ffffff) achieves >= 7.0:1 (AAA compliance)", () => {
      const ratio = getContrastRatio("#ffffff", BLACK);
      expect(ratio).toBeCloseTo(21.0, 1);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it("verifies Yellow (#ffff00) achieves >= 7.0:1 (AAA compliance)", () => {
      const ratio = getContrastRatio("#ffff00", BLACK);
      expect(ratio).toBeGreaterThan(19.0);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it("verifies Cyan (#00ffff) achieves >= 7.0:1 (AAA compliance)", () => {
      const ratio = getContrastRatio("#00ffff", BLACK);
      expect(ratio).toBeGreaterThan(16.0);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it("verifies Green (#00ff00) achieves >= 7.0:1 (AAA compliance)", () => {
      const ratio = getContrastRatio("#00ff00", BLACK);
      expect(ratio).toBeGreaterThan(15.0);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it("verifies Magenta (#ff00ff) achieves >= 4.5:1 (AA normal text compliance)", () => {
      const ratio = getContrastRatio("#ff00ff", BLACK);
      expect(ratio).toBeGreaterThan(6.0);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("verifies Red (#ff0000) achieves >= 3.0:1 (AA large/bold text & accent compliance)", () => {
      const ratio = getContrastRatio("#ff0000", BLACK);
      expect(ratio).toBeGreaterThan(3.9);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });
  });

  describe("Modal Accessibility & Dialog Semantics", () => {
    it("KeyboardShortcutsModal implements role=dialog, aria-modal, and labelledby", () => {
      const html = renderToString(
        React.createElement(KeyboardShortcutsModal, {
          isOpen: true,
          onClose: () => {},
        })
      );

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="shortcuts-title"');
      expect(html).toContain('id="shortcuts-title"');
      expect(html).toContain('aria-label="Close keyboard shortcuts"');
    });

    it("ImportDialog implements role=dialog, aria-modal, and labelledby", () => {
      const html = renderToString(
        React.createElement(ImportDialog, {
          isOpen: true,
          onClose: () => {},
        })
      );

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="import-dialog-title"');
      expect(html).toContain('aria-label="Close import dialog"');
    });

    it("QrScannerModal implements role=dialog, aria-modal, and labelledby", () => {
      const html = renderToString(
        React.createElement(QrScannerModal, {
          isOpen: true,
          onClose: () => {},
        })
      );

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="qr-scanner-title"');
      expect(html).toContain('aria-label="Close scanner dialog"');
    });

    it("ExportDialog implements role=dialog, aria-modal, and labelledby", () => {
      const html = renderToString(
        React.createElement(ExportDialog, {
          isOpen: true,
          onClose: () => {},
          pageNumber: 101,
        })
      );

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="export-dialog-title"');
      expect(html).toContain('aria-label="Close export dialog"');
    });
  });

  describe("Screen Reader Landmarks & Plain Text Alternative", () => {
    it("AccessibleTextView provides semantic landmarks, heading hierarchy, and list points", () => {
      const html = renderToString(
        React.createElement(AccessibleTextView, {
          page: page100,
          onSwitchToCrt: () => {},
        })
      );

      expect(html).toContain("<article");
      expect(html).toContain('aria-label="Teletext Page 100: PageCast Main Index"');
      expect(html).toContain("<main");
      expect(html).toContain("<nav");
      expect(html).toContain('aria-label="Fastext quick links"');
      expect(html).toContain("<h1");
      expect(html).toContain("PAGECAST INDEX");
      expect(html).toContain("Screen reader accessible mode");
    });
  });

  describe("FocusTrap Component", () => {
    it("renders children wrapped inside focus trap boundary", () => {
      const html = renderToString(
        React.createElement(
          FocusTrap,
          { active: true, className: "test-focus-trap" },
          React.createElement("button", { type: "button" }, "Action 1"),
          React.createElement("button", { type: "button" }, "Action 2")
        )
      );

      expect(html).toContain("test-focus-trap");
      expect(html).toContain("Action 1");
      expect(html).toContain("Action 2");
    });
  });
});
