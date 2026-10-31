/**
 * PageCast QR Code Distribution & Optical Encoding (TASK-S3-08)
 *
 * Implements high-contrast Teletext QR code generation for:
 * 1. Compact Public URL QR distribution (Tier 1 - P0).
 * 2. Raw JSON Payload QR with optical scan capacity bounds checking (Tier 2 - P0).
 */

import QRCode from "qrcode";
import type { PagePackV1 } from "@/domain/page-pack/types";
import { isValidPageNumber } from "@/domain/validation/page-number";

export const MAX_QR_PAYLOAD_CHARS = 2500;
export const DEFAULT_PAGECAST_BASE_URL = "https://pagecast.app";

export interface QrCodeOptions {
  baseUrl?: string;
  darkColor?: string;
  lightColor?: string;
  width?: number;
}

export interface UrlQrResult {
  targetUrl: string;
  dataUrl: string;
  pageNumber: number;
}

export interface RawPayloadQrResult {
  scannable: boolean;
  byteLength: number;
  dataUrl?: string;
  warning?: string;
}

/**
 * Builds the canonical public share URL for a Teletext bulletin.
 */
export function getBulletinShareUrl(
  pageNumber: number,
  baseUrl: string = DEFAULT_PAGECAST_BASE_URL
): string {
  if (!isValidPageNumber(pageNumber)) {
    throw new Error(`Invalid page number: ${pageNumber}`);
  }
  const cleanBase = baseUrl.replace(/\/+$/, "");
  return `${cleanBase}/terminal?page=${pageNumber}`;
}

/**
 * Generates an optical QR code encoding the public bulletin URL.
 */
export async function generateBulletinQrCode(
  pageNumber: number,
  options: QrCodeOptions = {}
): Promise<UrlQrResult> {
  const targetUrl = getBulletinShareUrl(pageNumber, options.baseUrl);

  const dataUrl = await QRCode.toDataURL(targetUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: options.width || 256,
    color: {
      dark: options.darkColor || "#000000",
      light: options.lightColor || "#ffffff",
    },
  });

  return {
    targetUrl,
    dataUrl,
    pageNumber,
  };
}

/**
 * Generates an optical QR code encoding the raw JSON payload with capacity safeguards.
 * If the payload exceeds 2,500 bytes/chars, warns that single-QR optical scanning is unfeasible.
 */
export async function generateRawPayloadQrCode(
  pack: PagePackV1,
  options: QrCodeOptions = {}
): Promise<RawPayloadQrResult> {
  const serialized = JSON.stringify(pack);
  const encoder = new TextEncoder();
  const byteLength = encoder.encode(serialized).length;

  if (serialized.length > MAX_QR_PAYLOAD_CHARS) {
    return {
      scannable: false,
      byteLength,
      warning: `Payload exceeds ${MAX_QR_PAYLOAD_CHARS} character capacity for reliable single-QR scanning. Distribute via URL QR code or JSON file export.`,
    };
  }

  const dataUrl = await QRCode.toDataURL(serialized, {
    errorCorrectionLevel: "L", // Lowest ECC to maximize data capacity
    margin: 2,
    width: options.width || 320,
    color: {
      dark: options.darkColor || "#000000",
      light: options.lightColor || "#ffffff",
    },
  });

  return {
    scannable: true,
    byteLength,
    dataUrl,
  };
}
