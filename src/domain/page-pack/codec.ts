import type { PagePackV1 } from "./types";
import { PagePackV1Schema } from "./schema";
import {
  evaluateByteBudget,
  ByteBudgetExceededError,
  type ByteBudgetResult,
  PAGECAST_MAX_PACK_BYTES,
} from "../byte-budget/measure";

/**
 * Serializes a PagePack into canonical compact JSON.
 */
export function serializePagePack(pack: PagePackV1): string {
  return JSON.stringify(pack);
}

/**
 * Deserializes and validates a PagePack JSON string using Zod schema.
 */
export function deserializePagePack(jsonString: string): PagePackV1 {
  const parsed = JSON.parse(jsonString);
  return PagePackV1Schema.parse(parsed) as PagePackV1;
}

/**
 * Measures the exact UTF-8 byte budget consumption of a PagePack.
 */
export function measurePagePack(
  pack: PagePackV1,
  maxBytes = PAGECAST_MAX_PACK_BYTES
): ByteBudgetResult {
  const serialized = serializePagePack(pack);
  return evaluateByteBudget(serialized, maxBytes);
}

/**
 * Asserts that a PagePack complies with the 10 KiB byte budget ceiling.
 * Throws ByteBudgetExceededError if violated.
 */
export function assertPagePackBudget(pack: PagePackV1, maxBytes = PAGECAST_MAX_PACK_BYTES): void {
  const result = measurePagePack(pack, maxBytes);
  if (result.isOverBudget) {
    throw new ByteBudgetExceededError(result.bytesUsed, maxBytes);
  }
}
