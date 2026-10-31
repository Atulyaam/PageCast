import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ExportDialog } from "@/components/publisher/ExportDialog";
import { generateBulletinQrCode, getBulletinShareUrl } from "@/server/export/qr-distribution";
import { page100 } from "@/data/seed-pages";
import type { PagePackV1 } from "@/domain/page-pack/types";

describe("Public-Link QR & Export Verification (TASK-S4-OFF-08 / FR-080)", () => {
  const mockPack: PagePackV1 = {
    id: "pack-100",
    version: 1,
    slug: "main-index",
    title: "PageCast Main Index",
    magazine: 1,
    primaryPageNumber: 100,
    createdAt: "2026-10-31T10:00:00Z",
    metadata: {
      sourceName: "PageCast Broadcast",
      language: "en",
      aiAssisted: false,
      publisherId: "system",
    },
    pages: [page100],
  };

  it("constructs canonical public bulletin URL", () => {
    const url = getBulletinShareUrl(101, "https://pagecast.app");
    expect(url).toBe("https://pagecast.app/terminal?page=101");

    const customUrl = getBulletinShareUrl(205, "https://teletext.local:3000/");
    expect(customUrl).toBe("https://teletext.local:3000/terminal?page=205");
  });

  it("throws error for out-of-bounds page numbers in URL generation", () => {
    expect(() => getBulletinShareUrl(99)).toThrow("Invalid page number: 99");
    expect(() => getBulletinShareUrl(900)).toThrow("Invalid page number: 900");
  });

  it("generates optical QR code containing valid data URL and target URL", async () => {
    const qrResult = await generateBulletinQrCode(100, {
      baseUrl: "https://pagecast.app",
      darkColor: "#00ff66",
      lightColor: "#000000",
    });

    expect(qrResult.pageNumber).toBe(100);
    expect(qrResult.targetUrl).toBe("https://pagecast.app/terminal?page=100");
    expect(qrResult.dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("renders ExportDialog with accessible modal attributes and action buttons", () => {
    const html = renderToString(
      React.createElement(ExportDialog, {
        isOpen: true,
        onClose: vi.fn(),
        pageNumber: 100,
        pack: mockPack,
      })
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("Export &amp; Distribute");
    expect(html).toContain("Terminal Link QR");
    expect(html).toContain("Download .JSON");
    expect(html).toContain("COPY");
  });

  it("returns null when ExportDialog is not open", () => {
    const html = renderToString(
      React.createElement(ExportDialog, {
        isOpen: false,
        onClose: vi.fn(),
        pageNumber: 100,
        pack: mockPack,
      })
    );

    expect(html).toBe("");
  });
});
