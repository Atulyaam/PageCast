import { describe, it, expect } from "vitest";
import { exportPagePackToJson, importPagePackFromJson } from "@/server/export/pack-export";
import {
  generateBulletinQrCode,
  generateRawPayloadQrCode,
  getBulletinShareUrl,
  MAX_QR_PAYLOAD_CHARS,
} from "@/server/export/qr-distribution";
import { layoutBulletinPage } from "@/domain/layout-engine/layout";
import type { PagePackV1 } from "@/domain/page-pack/types";

describe("PagePack JSON Export/Import & QR Distribution Unit Suite", () => {
  const samplePage = layoutBulletinPage({
    pageNumber: 105,
    title: "Export Test Bulletin",
    paragraphs: ["This is a test paragraph for verifying export and QR generation."],
    fastext: { red: 100, green: 106, yellow: 200, cyan: 300 },
  });

  const validPack: PagePackV1 = {
    id: "pack-unit-test-105",
    version: 1,
    slug: "export-test-bulletin",
    title: "Export Test Bulletin",
    magazine: 1,
    primaryPageNumber: 105,
    createdAt: "2026-10-31T12:00:00Z",
    metadata: {
      sourceName: "PageCast Test",
      language: "en",
      aiAssisted: false,
      publisherId: "test-publisher",
    },
    pages: [samplePage],
  };

  describe("JSON Export & Import", () => {
    it("exports a valid PagePack to JSON with canonical filename and metadata", () => {
      const result = exportPagePackToJson(validPack);
      expect(result.filename).toBe("pagecast-p105-export-test-bulletin.json");
      expect(result.byteLength).toBeGreaterThan(0);
      expect(result.byteLength).toBeLessThan(10240);
      expect(typeof result.content).toBe("string");

      const parsed = JSON.parse(result.content);
      expect(parsed.primaryPageNumber).toBe(105);
      expect(parsed.version).toBe(1);
    });

    it("imports exported JSON and verifies round-trip fidelity", () => {
      const exported = exportPagePackToJson(validPack);
      const imported = importPagePackFromJson(exported.content);

      expect(imported.valid).toBe(true);
      expect(imported.pack).toBeDefined();
      expect(imported.pack?.primaryPageNumber).toBe(105);
      expect(imported.pack?.pages).toHaveLength(1);
      expect(imported.errors).toHaveLength(0);
    });

    it("rejects corrupted JSON syntax", () => {
      const result = importPagePackFromJson("{ corrupted: true, ");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("JSON syntax error"))).toBe(true);
    });

    it("rejects packs with invalid page numbers or missing pages", () => {
      const invalidPackJson = JSON.stringify({
        version: 1,
        primaryPageNumber: 999, // Out of bounds
        pages: [],
      });

      const result = importPagePackFromJson(invalidPackJson);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("QR Code Generation", () => {
    it("builds the correct public terminal URL", () => {
      const url = getBulletinShareUrl(105, "https://pagecast.app");
      expect(url).toBe("https://pagecast.app/terminal?page=105");

      expect(() => getBulletinShareUrl(99)).toThrow(/Invalid page number/);
    });

    it("generates a high-contrast public URL QR code data URI", async () => {
      const result = await generateBulletinQrCode(105);
      expect(result.targetUrl).toContain("page=105");
      expect(result.dataUrl.startsWith("data:image/png;base64,")).toBe(true);
    });

    it("generates raw optical QR for compact packs within capacity limits", async () => {
      const compactPack: PagePackV1 = {
        id: "pack-compact",
        version: 1,
        slug: "compact",
        title: "Compact",
        magazine: 1,
        primaryPageNumber: 105,
        createdAt: "2026-10-31T12:00:00Z",
        metadata: {
          sourceName: "P",
          language: "en",
          aiAssisted: false,
          publisherId: "u",
        },
        pages: [
          {
            pageNumber: 105,
            title: "T",
            rows: Array.from({ length: 25 }, () => ({ spans: [{ text: " " }] })),
            fastext: { red: 100, green: 101, yellow: 102, cyan: 103 },
          },
        ],
      };

      const result = await generateRawPayloadQrCode(compactPack);
      expect(result.scannable).toBe(true);
      expect(result.byteLength).toBeLessThanOrEqual(MAX_QR_PAYLOAD_CHARS);
      expect(result.dataUrl?.startsWith("data:image/png;base64,")).toBe(true);
    });

    it("flags payload overflow when pack exceeds single-QR capacity limit", async () => {
      const largePack: PagePackV1 = {
        ...validPack,
        title: "A".repeat(3000), // Exceeds 2,500 chars
      };

      const result = await generateRawPayloadQrCode(largePack);
      expect(result.scannable).toBe(false);
      expect(result.byteLength).toBeGreaterThan(MAX_QR_PAYLOAD_CHARS);
      expect(result.warning).toContain("exceeds");
      expect(result.dataUrl).toBeUndefined();
    });
  });
});
