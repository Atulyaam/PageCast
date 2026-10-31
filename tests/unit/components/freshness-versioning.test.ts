import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  formatRelativeFreshness,
  isNoticeExpired,
  isCopyStale,
  formatNoticeValidityWindow,
} from "@/domain/freshness/freshness";
import { TerminalHeader } from "@/components/teletext/TerminalHeader";

describe("Bulletin Freshness & Version History (ENH-06)", () => {
  const baseNow = new Date("2026-10-31T12:00:00Z");

  describe("formatRelativeFreshness", () => {
    it("formats relative timestamps accurately", () => {
      expect(formatRelativeFreshness(null)).toBe("Unknown");
      expect(formatRelativeFreshness("invalid-date")).toBe("Unknown");

      // 30 seconds ago
      const thirtySecsAgo = new Date("2026-10-31T11:59:30Z").toISOString();
      expect(formatRelativeFreshness(thirtySecsAgo, baseNow)).toBe("just now");

      // 15 minutes ago
      const fifteenMinsAgo = new Date("2026-10-31T11:45:00Z").toISOString();
      expect(formatRelativeFreshness(fifteenMinsAgo, baseNow)).toBe("15m ago");

      // 4 hours ago
      const fourHoursAgo = new Date("2026-10-31T08:00:00Z").toISOString();
      expect(formatRelativeFreshness(fourHoursAgo, baseNow)).toBe("4h ago");

      // 1 day ago
      const oneDayAgo = new Date("2026-10-30T10:00:00Z").toISOString();
      expect(formatRelativeFreshness(oneDayAgo, baseNow)).toBe("yesterday");

      // 4 days ago
      const fourDaysAgo = new Date("2026-10-27T10:00:00Z").toISOString();
      expect(formatRelativeFreshness(fourDaysAgo, baseNow)).toBe("4d ago");
    });
  });

  describe("isNoticeExpired", () => {
    it("identifies expired vs active validity windows non-destructively", () => {
      expect(isNoticeExpired(null, baseNow)).toBe(false);
      expect(isNoticeExpired(undefined, baseNow)).toBe(false);

      // Future validity: active
      const futureDate = new Date("2026-10-31T18:00:00Z").toISOString();
      expect(isNoticeExpired(futureDate, baseNow)).toBe(false);

      // Past validity: expired
      const pastDate = new Date("2026-10-30T18:00:00Z").toISOString();
      expect(isNoticeExpired(pastDate, baseNow)).toBe(true);
    });
  });

  describe("isCopyStale", () => {
    it("flags copies older than 24 hours as stale", () => {
      expect(isCopyStale(null)).toBe(false);

      const recentSave = new Date("2026-10-31T10:00:00Z").toISOString(); // 2h ago
      expect(isCopyStale(recentSave, 24, baseNow)).toBe(false);

      const oldSave = new Date("2026-10-29T10:00:00Z").toISOString(); // 48h ago
      expect(isCopyStale(oldSave, 24, baseNow)).toBe(true);
    });
  });

  describe("formatNoticeValidityWindow", () => {
    it("formats notice validity description", () => {
      expect(formatNoticeValidityWindow("2026-10-31T10:00:00Z", null)).toBe(
        "Standard Broadcast (No Expiry)"
      );

      const windowStr = formatNoticeValidityWindow("2026-10-31T10:00:00Z", "2026-11-05T18:00:00Z");
      expect(windowStr).toContain("Valid until");
      expect(windowStr).toContain("Nov");
    });
  });

  describe("TerminalHeader Revision & Freshness Badges", () => {
    it("renders revision badge and updated time in header", () => {
      const html = renderToStaticMarkup(
        React.createElement(TerminalHeader, {
          pageNumber: 101,
          showScanlines: false,
          phosphorGlow: true,
          onToggleScanlines: vi.fn(),
          onTogglePhosphorGlow: vi.fn(),
          revision: 3,
          updatedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        })
      );

      expect(html).toContain("Rev 3");
      expect(html).toContain("1h ago");
    });
  });
});
