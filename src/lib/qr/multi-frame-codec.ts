/**
 * PageCast Multi-Frame QR Transfer & SHA-256 Integrity Codec (TASK-S4-OFF-11 / FR-082, FR-083)
 *
 * Implements animated, air-gapped QR distribution of PagePack bulletins.
 * Splits PagePack payloads into sequential frames with SHA-256 integrity digests,
 * and reassembles them client-side in the reader terminal with cryptographic verification.
 *
 * Protocol Wire Format:
 * PAGECAST:v1:<bundleId>:<index>:<total>:<sha256>:<base64Chunk>
 */

import type { PagePackV1 } from "@/domain/page-pack/types";
import { importPagePackFromJson } from "@/lib/export/pack-export";

export const MULTI_FRAME_PREFIX = "PAGECAST:v1";
export const DEFAULT_CHUNK_SIZE = 400; // Optimal for high-density QR scan reliability

export interface MultiFrameMeta {
  bundleId: string;
  index: number;
  total: number;
  sha256: string;
  chunk: string;
}

export interface ReassemblyProgress {
  bundleId: string;
  receivedCount: number;
  total: number;
  percentage: number;
  missingIndexes: number[];
}

export type ReassemblyResult =
  | { status: "progress"; progress: ReassemblyProgress }
  | { status: "complete"; bundleId: string; pack: PagePackV1; rawJson: string }
  | { status: "corrupted"; bundleId: string; error: string }
  | { status: "invalid_frame"; error: string };

/**
 * Encodes Uint8Array to standard Base64 string in any environment.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes standard Base64 string to Uint8Array.
 */
export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Computes lowercase 64-character hex SHA-256 digest using Web Crypto API.
 */
export async function computeSha256Hex(data: Uint8Array | string): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes as unknown as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates an 8-character random alphanumeric session bundle ID.
 */
export function generateBundleId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  for (let i = 0; i < 8; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

/**
 * Encodes a PagePack into an array of sequential animated QR frame strings.
 */
export async function encodeMultiFramePack(
  pack: PagePackV1,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  customBundleId?: string
): Promise<string[]> {
  const jsonString = JSON.stringify(pack);
  const utf8Bytes = new TextEncoder().encode(jsonString);

  // Compute canonical SHA-256 digest of original JSON bytes
  const sha256 = await computeSha256Hex(utf8Bytes);
  const base64Data = bytesToBase64(utf8Bytes);

  const bundleId = customBundleId || generateBundleId();
  const totalFrames = Math.max(1, Math.ceil(base64Data.length / chunkSize));
  const frames: string[] = [];

  for (let i = 0; i < totalFrames; i++) {
    const chunk = base64Data.slice(i * chunkSize, (i + 1) * chunkSize);
    const frameIndex = i + 1;
    frames.push(
      `${MULTI_FRAME_PREFIX}:${bundleId}:${frameIndex}:${totalFrames}:${sha256}:${chunk}`
    );
  }

  return frames;
}

/**
 * Parses and validates an individual frame string.
 */
export function parseFrame(frameString: string): MultiFrameMeta | null {
  if (!frameString || !frameString.startsWith(`${MULTI_FRAME_PREFIX}:`)) {
    return null;
  }

  const parts = frameString.split(":");
  // PAGECAST (0), v1 (1), bundleId (2), index (3), total (4), sha256 (5), chunk (6...)
  if (parts.length < 7) {
    return null;
  }

  const bundleId = parts[2];
  const index = parseInt(parts[3], 10);
  const total = parseInt(parts[4], 10);
  const sha256 = parts[5].toLowerCase();
  // Chunk is everything from part 6 onwards (in case chunk itself had no colons, but joining safe)
  const chunk = parts.slice(6).join(":");

  if (
    !bundleId ||
    isNaN(index) ||
    isNaN(total) ||
    index < 1 ||
    total < 1 ||
    index > total ||
    sha256.length !== 64 ||
    !chunk
  ) {
    return null;
  }

  return { bundleId, index, total, sha256, chunk };
}

interface BundleState {
  bundleId: string;
  total: number;
  sha256: string;
  chunks: Map<number, string>;
}

/**
 * MultiFrameReassembler manages incoming sequential or interleaved QR frames,
 * tracks progress, and reassembles with cryptographic SHA-256 verification.
 */
export class MultiFrameReassembler {
  private bundles: Map<string, BundleState> = new Map();
  private activeBundleId: string | null = null;

  /**
   * Resets all internal reassembly state.
   */
  public reset(): void {
    this.bundles.clear();
    this.activeBundleId = null;
  }

  /**
   * Ingests a single scanned frame and returns the reassembly progress or completion status.
   */
  public async feedFrame(rawText: string): Promise<ReassemblyResult> {
    const meta = parseFrame(rawText.trim());
    if (!meta) {
      return { status: "invalid_frame", error: "Not a valid PageCast multi-frame QR packet." };
    }

    this.activeBundleId = meta.bundleId;

    let bundle = this.bundles.get(meta.bundleId);
    if (!bundle) {
      bundle = {
        bundleId: meta.bundleId,
        total: meta.total,
        sha256: meta.sha256,
        chunks: new Map(),
      };
      this.bundles.set(meta.bundleId, bundle);
    }

    // Save chunk
    bundle.chunks.set(meta.index, meta.chunk);

    // Check if all frames have been received
    if (bundle.chunks.size === bundle.total) {
      // Reassemble complete base64 payload
      let fullBase64 = "";
      for (let i = 1; i <= bundle.total; i++) {
        fullBase64 += bundle.chunks.get(i) || "";
      }

      let payloadBytes: Uint8Array;
      try {
        payloadBytes = base64ToBytes(fullBase64);
      } catch (err: any) {
        return {
          status: "corrupted",
          bundleId: bundle.bundleId,
          error: `Base64 decoding failed: ${err?.message || "Invalid payload encoding"}`,
        };
      }

      // Cryptographic SHA-256 verification (FR-083)
      const computedSha256 = await computeSha256Hex(payloadBytes);
      if (computedSha256.toLowerCase() !== bundle.sha256.toLowerCase()) {
        return {
          status: "corrupted",
          bundleId: bundle.bundleId,
          error: `SHA-256 integrity mismatch! Expected ${bundle.sha256.slice(0, 12)}..., computed ${computedSha256.slice(0, 12)}...`,
        };
      }

      // Decode and validate PagePack schema
      const jsonString = new TextDecoder().decode(payloadBytes);
      const imported = importPagePackFromJson(jsonString);

      if (!imported.valid || !imported.pack) {
        return {
          status: "corrupted",
          bundleId: bundle.bundleId,
          error: `PagePack validation error: ${imported.errors.join("; ")}`,
        };
      }

      return {
        status: "complete",
        bundleId: bundle.bundleId,
        pack: imported.pack,
        rawJson: jsonString,
      };
    }

    // In-progress calculation
    const missing: number[] = [];
    for (let i = 1; i <= bundle.total; i++) {
      if (!bundle.chunks.has(i)) {
        missing.push(i);
      }
    }

    const percentage = Math.round((bundle.chunks.size / bundle.total) * 100);

    return {
      status: "progress",
      progress: {
        bundleId: bundle.bundleId,
        receivedCount: bundle.chunks.size,
        total: bundle.total,
        percentage,
        missingIndexes: missing,
      },
    };
  }

  /**
   * Returns current active progress, if any.
   */
  public getActiveProgress(): ReassemblyProgress | null {
    if (!this.activeBundleId) return null;
    const bundle = this.bundles.get(this.activeBundleId);
    if (!bundle) return null;

    const missing: number[] = [];
    for (let i = 1; i <= bundle.total; i++) {
      if (!bundle.chunks.has(i)) {
        missing.push(i);
      }
    }

    return {
      bundleId: bundle.bundleId,
      receivedCount: bundle.chunks.size,
      total: bundle.total,
      percentage: Math.round((bundle.chunks.size / bundle.total) * 100),
      missingIndexes: missing,
    };
  }
}

export type ScannedQrType =
  | { type: "multiframe"; meta: MultiFrameMeta }
  | { type: "url"; url: string; pageNumber?: number }
  | { type: "json"; pack: PagePackV1 }
  | { type: "unknown"; text: string };

/**
 * Universal classifier for scanned optical QR payloads.
 */
export function classifyScannedQr(text: string): ScannedQrType {
  const trimmed = text.trim();

  // Multi-frame packet check
  if (trimmed.startsWith(`${MULTI_FRAME_PREFIX}:`)) {
    const meta = parseFrame(trimmed);
    if (meta) {
      return { type: "multiframe", meta };
    }
  }

  // Terminal URL check
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    try {
      // Resolve relative URLs using dummy base
      const parsedUrl = new URL(trimmed, "https://pagecast.local");
      const pageParam = parsedUrl.searchParams.get("page");
      const pageNum = pageParam ? parseInt(pageParam, 10) : undefined;
      return {
        type: "url",
        url: trimmed,
        pageNumber: pageNum && !isNaN(pageNum) ? pageNum : undefined,
      };
    } catch {
      // Continue to next check
    }
  }

  // Direct PagePack JSON check
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    const imported = importPagePackFromJson(trimmed);
    if (imported.valid && imported.pack) {
      return { type: "json", pack: imported.pack };
    }
  }

  return { type: "unknown", text: trimmed };
}
