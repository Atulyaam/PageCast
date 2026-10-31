import { describe, it, expect, beforeEach } from "vitest";
import {
  encodeMultiFramePack,
  MultiFrameReassembler,
  computeSha256Hex,
  parseFrame,
  classifyScannedQr,
} from "@/lib/qr/multi-frame-codec";
import { layoutBulletinPage } from "@/domain/layout-engine/layout";
import type { PagePackV1 } from "@/domain/page-pack/types";

describe("Multi-Frame QR Transfer & Cryptographic Integrity (TASK-S4-OFF-11 / FR-082, FR-083)", () => {
  const samplePage = layoutBulletinPage({
    pageNumber: 106,
    title: "Air-Gap QR Transfer Bulletin",
    paragraphs: [
      "This bulletin is partitioned into sequential optical QR frames.",
      "Transmission verifies cryptographic SHA-256 digest before local ingestion.",
    ],
    fastext: { red: 100, green: 107, yellow: 200, cyan: 300 },
  });

  const testPack: PagePackV1 = {
    id: "pack-unit-airgap-106",
    version: 1,
    slug: "air-gap-qr-transfer",
    title: "Air-Gap QR Transfer Bulletin",
    magazine: 1,
    primaryPageNumber: 106,
    createdAt: "2026-10-31T12:00:00Z",
    metadata: {
      sourceName: "Air-Gap Broadcast Service",
      language: "en",
      aiAssisted: false,
      publisherId: "test-publisher",
    },
    pages: [samplePage],
  };

  let reassembler: MultiFrameReassembler;

  beforeEach(() => {
    reassembler = new MultiFrameReassembler();
  });

  it("computes accurate SHA-256 lowercase 64-hex digest", async () => {
    const hash = await computeSha256Hex("hello pagecast");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe("8917e09486b3c15268f2c83137f81da46019fbeed98b09d2484dc7193128e0a3");
  });

  it("encodes PagePack into sequential animated QR frame strings", async () => {
    const frames = await encodeMultiFramePack(testPack, 300, "session1");

    expect(frames.length).toBeGreaterThan(1);
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      expect(frame.startsWith("PAGECAST:v1:session1:")).toBe(true);

      const parsed = parseFrame(frame);
      expect(parsed).not.toBeNull();
      expect(parsed?.bundleId).toBe("session1");
      expect(parsed?.index).toBe(i + 1);
      expect(parsed?.total).toBe(frames.length);
      expect(parsed?.sha256).toHaveLength(64);
      expect(parsed?.chunk.length).toBeLessThanOrEqual(300);
    }
  });

  it("reassembles multi-frame sequence in sequential order", async () => {
    const frames = await encodeMultiFramePack(testPack, 250);
    expect(frames.length).toBeGreaterThanOrEqual(3);

    // Feed all but the last frame
    for (let i = 0; i < frames.length - 1; i++) {
      const res = await reassembler.feedFrame(frames[i]);
      expect(res.status).toBe("progress");
      if (res.status === "progress") {
        expect(res.progress.receivedCount).toBe(i + 1);
        expect(res.progress.total).toBe(frames.length);
        expect(res.progress.percentage).toBeLessThan(100);
      }
    }

    // Feed final frame
    const finalRes = await reassembler.feedFrame(frames[frames.length - 1]);
    expect(finalRes.status).toBe("complete");
    if (finalRes.status === "complete") {
      expect(finalRes.pack.primaryPageNumber).toBe(106);
      expect(finalRes.pack.title).toBe("Air-Gap QR Transfer Bulletin");
      expect(finalRes.pack.pages).toHaveLength(1);
    }
  });

  it("reassembles frames received out-of-order and handles duplicate arrivals", async () => {
    const frames = await encodeMultiFramePack(testPack, 250);
    expect(frames.length).toBeGreaterThanOrEqual(3);

    // Reverse order
    const reversed = [...frames].reverse();

    // Feed first frame (which is the last index)
    const firstFeed = await reassembler.feedFrame(reversed[0]);
    expect(firstFeed.status).toBe("progress");

    // Feed same frame again (duplicate)
    const dupFeed = await reassembler.feedFrame(reversed[0]);
    expect(dupFeed.status).toBe("progress");
    if (dupFeed.status === "progress") {
      expect(dupFeed.progress.receivedCount).toBe(1); // Didn't duplicate count
    }

    // Feed remainder
    for (let i = 1; i < reversed.length; i++) {
      await reassembler.feedFrame(reversed[i]);
    }

    const progress = reassembler.getActiveProgress();
    expect(progress?.receivedCount).toBe(frames.length);
    expect(progress?.percentage).toBe(100);
  });

  it("rejects altered payload chunks due to SHA-256 integrity mismatch (FR-083)", async () => {
    const frames = await encodeMultiFramePack(testPack, 250);
    expect(frames.length).toBeGreaterThan(1);

    // Tamper with middle frame chunk
    const parsed = parseFrame(frames[0])!;
    // Corrupt base64 character in chunk
    const tamperedChunk = "A" + parsed.chunk.slice(1);
    const tamperedFrame = `PAGECAST:v1:${parsed.bundleId}:${parsed.index}:${parsed.total}:${parsed.sha256}:${tamperedChunk}`;

    // Feed corrupted frame first
    await reassembler.feedFrame(tamperedFrame);

    // Feed other genuine frames
    for (let i = 1; i < frames.length; i++) {
      const res = await reassembler.feedFrame(frames[i]);
      if (i === frames.length - 1) {
        // Last frame should trigger reassembly and fail verification
        expect(res.status).toBe("corrupted");
        if (res.status === "corrupted") {
          expect(res.error).toMatch(/SHA-256 integrity mismatch|Base64 decoding failed/i);
        }
      }
    }
  });

  it("classifies diverse optical QR payloads correctly", () => {
    // Multi-frame packet
    const mfResult = classifyScannedQr(
      "PAGECAST:v1:bundle99:1:3:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:dGVzdA=="
    );
    expect(mfResult.type).toBe("multiframe");
    if (mfResult.type === "multiframe") {
      expect(mfResult.meta.bundleId).toBe("bundle99");
      expect(mfResult.meta.index).toBe(1);
      expect(mfResult.meta.total).toBe(3);
    }

    // Terminal public URL
    const urlResult = classifyScannedQr("https://pagecast.app/terminal?page=204");
    expect(urlResult.type).toBe("url");
    if (urlResult.type === "url") {
      expect(urlResult.pageNumber).toBe(204);
    }

    // Relative terminal URL
    const relResult = classifyScannedQr("/terminal?page=301");
    expect(relResult.type).toBe("url");
    if (relResult.type === "url") {
      expect(relResult.pageNumber).toBe(301);
    }

    // Unknown raw string
    const unkResult = classifyScannedQr("Random WiFi payload: WIFI:S:TestNet;P:password;;");
    expect(unkResult.type).toBe("unknown");
  });
});
