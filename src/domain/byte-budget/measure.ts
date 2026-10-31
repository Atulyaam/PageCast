/**
 * PageCast Byte Budget Measurement Engine
 *
 * Enforces the canonical 10 KiB (10,240 bytes) PagePack ceiling using
 * UTF-8 byte measurement via TextEncoder (never JavaScript string.length).
 */

export const PAGECAST_MAX_PACK_BYTES = 10240; // 10 KiB

export interface ByteBudgetResult {
  readonly bytesUsed: number;
  readonly maxBytes: number;
  readonly bytesRemaining: number;
  readonly percentageUsed: number;
  readonly isOverBudget: boolean;
}

export class ByteBudgetExceededError extends Error {
  readonly bytesUsed: number;
  readonly maxBytes: number;

  constructor(bytesUsed: number, maxBytes = PAGECAST_MAX_PACK_BYTES) {
    super(
      `PagePack exceeds payload ceiling: ${bytesUsed.toLocaleString()} bytes used, maximum allowed is ${maxBytes.toLocaleString()} bytes (10 KiB).`
    );
    this.name = "ByteBudgetExceededError";
    this.bytesUsed = bytesUsed;
    this.maxBytes = maxBytes;
  }
}

/**
 * Calculates the exact UTF-8 byte weight of a string using TextEncoder.
 */
export function measureUtf8Bytes(text: string): number {
  if (!text) {
    return 0;
  }
  return new TextEncoder().encode(text).byteLength;
}

/**
 * Evaluates byte budget usage for a serialized JSON string.
 */
export function evaluateByteBudget(
  serializedJson: string,
  maxBytes = PAGECAST_MAX_PACK_BYTES
): ByteBudgetResult {
  const bytesUsed = measureUtf8Bytes(serializedJson);
  const bytesRemaining = Math.max(0, maxBytes - bytesUsed);
  const percentageUsed = Math.min(100, Math.round((bytesUsed / maxBytes) * 100));
  const isOverBudget = bytesUsed > maxBytes;

  return {
    bytesUsed,
    maxBytes,
    bytesRemaining,
    percentageUsed,
    isOverBudget,
  };
}
