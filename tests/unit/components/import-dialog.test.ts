import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ImportDialog } from "@/components/teletext/ImportDialog";
import { layoutBulletinPage } from "@/domain/layout-engine/layout";
import { exportPagePackToJson, importPagePackFromJson } from "@/lib/export/pack-export";
import { savePageLocally } from "@/lib/storage/saved-pages";
import type { PagePackV1 } from "@/domain/page-pack/types";
import { getPageCastDb } from "@/lib/storage/dexie-db";

describe("ImportDialog Component & Ingestion Verification (TASK-S4-OFF-09 / FR-081, FR-084, FR-085)", () => {
  const samplePage = layoutBulletinPage({
    pageNumber: 104,
    title: "Test Ingestion Page",
    paragraphs: ["Verified paragraph text for import test."],
    fastext: { red: 100, green: 105, yellow: 200, cyan: 300 },
  });

  const validPack: PagePackV1 = {
    id: "pack-unit-test-104",
    version: 1,
    slug: "test-ingestion-page",
    title: "Test Ingestion Page",
    magazine: 1,
    primaryPageNumber: 104,
    createdAt: "2026-10-31T12:00:00Z",
    metadata: {
      sourceName: "PageCast Test Feed",
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

  it("does not render HTML output when isOpen is false", () => {
    const html = renderToString(
      React.createElement(ImportDialog, {
        isOpen: false,
        onClose: vi.fn(),
      })
    );
    expect(html).toBe("");
  });

  it("renders modal dialog markup with title and controls when isOpen is true", () => {
    const html = renderToString(
      React.createElement(ImportDialog, {
        isOpen: true,
        onClose: vi.fn(),
      })
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("PAGEPACK INGESTION");
    expect(html).toContain("SELECT FILE (.JSON)");
    expect(html).toContain("PASTE JSON TEXT");
    expect(html).toContain("Max byte ceiling: 10,240 bytes (10 KiB)");
  });

  it("validates well-formed JSON string and successfully imports valid PagePack", () => {
    const exported = exportPagePackToJson(validPack);
    const result = importPagePackFromJson(exported.content);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.pack).toBeDefined();
    expect(result.pack?.primaryPageNumber).toBe(104);
    expect(result.pack?.title).toBe("Test Ingestion Page");
  });

  it("safely rejects malformed JSON with descriptive syntax error (FR-084)", () => {
    const result = importPagePackFromJson("{ broken_json: true, ");

    expect(result.valid).toBe(false);
    expect(result.pack).toBeUndefined();
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/JSON syntax error/i);
  });

  it("safely rejects non-object or empty JSON payload", () => {
    const emptyResult = importPagePackFromJson("");
    expect(emptyResult.valid).toBe(false);

    const arrayResult = importPagePackFromJson("[1, 2, 3]");
    expect(arrayResult.valid).toBe(false);
    expect(arrayResult.errors[0]).toContain("not a valid PagePack object");
  });

  it("safely rejects invalid schema versions and out-of-bounds page numbers (FR-084)", () => {
    const invalidVersionPack = {
      ...validPack,
      version: 2, // Unsupported schema version
    };
    const verResult = importPagePackFromJson(JSON.stringify(invalidVersionPack));
    expect(verResult.valid).toBe(false);
    expect(verResult.errors.some((e) => e.includes("schema version"))).toBe(true);

    const invalidPagePack = {
      ...validPack,
      primaryPageNumber: 999, // Out of bounds [100-899]
    };
    const pageResult = importPagePackFromJson(JSON.stringify(invalidPagePack));
    expect(pageResult.valid).toBe(false);
    expect(pageResult.errors.some((e) => e.includes("primaryPageNumber"))).toBe(true);
  });

  it("safely rejects PagePacks exceeding the 10,240-byte ceiling (FR-085)", () => {
    // Generate massive text content exceeding 10 KiB
    const oversizedPage = layoutBulletinPage({
      pageNumber: 104,
      title: "Massive Page Exceeding Budget Ceiling",
      paragraphs: Array(15).fill(
        "PageCast low-bandwidth constraint test sentence repeating to exceed 10 kilobytes UTF-8 ceiling!"
      ),
      fastext: { red: 100, green: 105, yellow: 200, cyan: 300 },
    });

    const oversizedPack: PagePackV1 = {
      ...validPack,
      pages: Array(10).fill(oversizedPage), // 10 pages will vastly exceed 10 KiB
    };

    const result = importPagePackFromJson(JSON.stringify(oversizedPack));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("10,240-byte ceiling"))).toBe(true);
  });

  it("persists imported PagePack into IndexedDB offline storage (FR-081)", async () => {
    const exported = exportPagePackToJson(validPack);
    const importResult = importPagePackFromJson(exported.content);

    expect(importResult.valid).toBe(true);
    const saveResult = await savePageLocally(importResult.pack!);

    expect(saveResult.success).toBe(true);
    expect(saveResult.record?.pageNumber).toBe(104);

    const db = getPageCastDb();
    const stored = await db.saved_pages.get(104);
    expect(stored).toBeDefined();
    expect(stored?.title).toBe("Test Ingestion Page");
    expect(stored?.magazineNumber).toBe(1);
    expect(stored?.pack.pages).toHaveLength(1);
  });
});
