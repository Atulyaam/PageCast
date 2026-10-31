import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { QrScannerModal } from "@/components/teletext/QrScannerModal";
import { layoutBulletinPage } from "@/domain/layout-engine/layout";
import { encodeMultiFramePack, MultiFrameReassembler } from "@/lib/qr/multi-frame-codec";
import { savePageLocally } from "@/lib/storage/saved-pages";
import type { PagePackV1 } from "@/domain/page-pack/types";
import { getPageCastDb } from "@/lib/storage/dexie-db";

describe("QrScannerModal Component & Optical Ingestion (TASK-S4-OFF-10 / TR-009)", () => {
  const samplePage = layoutBulletinPage({
    pageNumber: 201,
    title: "Scanner Test Page",
    paragraphs: ["Verified paragraph text for QR scanner ingestion test."],
    fastext: { red: 100, green: 202, yellow: 300, cyan: 400 },
  });

  const validPack: PagePackV1 = {
    id: "pack-scanner-test-201",
    version: 1,
    slug: "scanner-test-page",
    title: "Scanner Test Page",
    magazine: 2,
    primaryPageNumber: 201,
    createdAt: "2026-10-31T12:00:00Z",
    metadata: {
      sourceName: "PageCast Optical Feed",
      language: "en",
      aiAssisted: false,
      publisherId: "test-publisher",
    },
    pages: [samplePage],
  };

  beforeEach(async () => {
    const db = getPageCastDb();
    await db.saved_pages.clear();
  });

  it("does not render when isOpen is false", () => {
    const html = renderToString(
      React.createElement(QrScannerModal, {
        isOpen: false,
        onClose: vi.fn(),
      })
    );
    expect(html).toBe("");
  });

  it("renders modal structure, camera/manual mode controls when isOpen is true", () => {
    const html = renderToString(
      React.createElement(QrScannerModal, {
        isOpen: true,
        onClose: vi.fn(),
      })
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("OPTICAL QR &amp; AIR-GAP RECEIVER");
    expect(html).toContain("CAMERA SCANNER");
    expect(html).toContain("MANUAL CODE INPUT");
    expect(html).toContain("Zero Network Overhead");
  });

  it("handles multi-frame burst reassembly via reassembler and produces verified pack", async () => {
    const frames = await encodeMultiFramePack(validPack, 300);
    expect(frames.length).toBeGreaterThan(1);

    const reassembler = new MultiFrameReassembler();
    for (let i = 0; i < frames.length - 1; i++) {
      const res = await reassembler.feedFrame(frames[i]);
      expect(res.status).toBe("progress");
    }

    const finalRes = await reassembler.feedFrame(frames[frames.length - 1]);
    expect(finalRes.status).toBe("complete");
    if (finalRes.status === "complete") {
      expect(finalRes.pack.primaryPageNumber).toBe(201);
      expect(finalRes.pack.title).toBe("Scanner Test Page");

      // Verify saving to local vault
      const saveRes = await savePageLocally(finalRes.pack);
      expect(saveRes.success).toBe(true);

      const db = getPageCastDb();
      const saved = await db.saved_pages.get(201);
      expect(saved).toBeDefined();
      expect(saved?.title).toBe("Scanner Test Page");
    }
  });

  it("detects and rejects corrupted air-gap frames with SHA-256 integrity error", async () => {
    const frames = await encodeMultiFramePack(validPack, 300);
    const tampered = frames[0].replace(/:[A-Za-z0-9+/=]{10}/, ":tampered__");

    const reassembler = new MultiFrameReassembler();
    await reassembler.feedFrame(tampered);

    for (let i = 1; i < frames.length; i++) {
      const res = await reassembler.feedFrame(frames[i]);
      if (i === frames.length - 1) {
        expect(res.status).toBe("corrupted");
      }
    }
  });
});

