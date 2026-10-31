/**
 * PageCast Canonical PagePack JSON Export & Import (TASK-S3-08 / TASK-S4-OFF-09)
 *
 * Implements strict, verifiable JSON export and import for PagePackV1 payloads,
 * guaranteeing schema conformance, 40x25 grid geometry, and 10 KiB byte ceilings.
 * Safe for both browser and server environments.
 */

import type { PagePackV1 } from "@/domain/page-pack/types";
import { measurePagePack } from "@/domain/page-pack/codec";
import { validateSubPages } from "@/domain/teletext/magazine";
import { isValidPageNumber } from "@/domain/validation/page-number";

export interface ExportResult {
  filename: string;
  content: string;
  byteLength: number;
  pack: PagePackV1;
}

export interface ImportResult {
  valid: boolean;
  pack?: PagePackV1;
  errors: string[];
}

/**
 * Exports a PagePackV1 to a formatted JSON string with canonical metadata and filename.
 */
export function exportPagePackToJson(pack: PagePackV1): ExportResult {
  if (!pack || typeof pack !== "object") {
    throw new Error("INVALID_PACK: Provided pack is null or invalid.");
  }

  if (pack.version !== 1) {
    throw new Error(`UNSUPPORTED_VERSION: PagePack schema version ${pack.version} not supported.`);
  }

  if (!isValidPageNumber(pack.primaryPageNumber)) {
    throw new Error(`INVALID_PAGE_NUMBER: ${pack.primaryPageNumber} is out of bounds [100-899].`);
  }

  const subValidation = validateSubPages(pack.pages);
  if (!subValidation.valid) {
    throw new Error(`INVALID_GRID_GEOMETRY: ${subValidation.errors.join("; ")}`);
  }

  const budget = measurePagePack(pack);
  if (budget.isOverBudget) {
    throw new Error(
      `PAGE_OVER_BUDGET: Pack payload (${budget.bytesUsed} bytes) exceeds 10,240-byte ceiling.`
    );
  }

  const content = JSON.stringify(pack, null, 2);
  const encoder = new TextEncoder();
  const byteLength = encoder.encode(content).length;

  const safeSlug = pack.slug ? pack.slug.replace(/[^a-z0-9_-]/gi, "-") : "bulletin";
  const filename = `pagecast-p${pack.primaryPageNumber}-${safeSlug}.json`;

  return {
    filename,
    content,
    byteLength,
    pack,
  };
}

/**
 * Imports and rigorously validates a candidate PagePack JSON string.
 */
export function importPagePackFromJson(jsonString: string): ImportResult {
  const errors: string[] = [];

  if (!jsonString || typeof jsonString !== "string" || !jsonString.trim()) {
    return { valid: false, errors: ["Empty or non-string JSON content."] };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e: any) {
    return { valid: false, errors: [`JSON syntax error: ${e?.message || "Invalid JSON"}`] };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { valid: false, errors: ["Parsed JSON is not a valid PagePack object."] };
  }

  if (parsed.version !== 1) {
    errors.push(`Invalid or missing schema version: ${parsed.version}. Expected 1.`);
  }

  if (!isValidPageNumber(parsed.primaryPageNumber)) {
    errors.push(`Invalid primaryPageNumber: ${parsed.primaryPageNumber}. Expected 100-899.`);
  }

  if (!parsed.pages || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
    errors.push("PagePack must contain a non-empty 'pages' array.");
  } else {
    const subValidation = validateSubPages(parsed.pages);
    if (!subValidation.valid) {
      errors.push(...subValidation.errors);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const pack = parsed as PagePackV1;
  const budget = measurePagePack(pack);
  if (budget.isOverBudget) {
    errors.push(`PagePack payload exceeds 10,240-byte ceiling (${budget.bytesUsed} bytes).`);
  }

  return {
    valid: errors.length === 0,
    pack: errors.length === 0 ? pack : undefined,
    errors,
  };
}

