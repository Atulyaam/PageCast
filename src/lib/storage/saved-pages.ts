/**
 * PageCast Local Saved Pages Service (TASK-S4-OFF-04 / FR-071 / FR-073 / FR-074)
 *
 * Implements high-level operations for saving, removing, querying, and verifying
 * locally persisted PagePack bulletins in IndexedDB via Dexie.
 */

import type { PagePackV1 } from "@/domain/page-pack/types";
import { measurePagePack } from "@/domain/page-pack/codec";
import { validateSubPages } from "@/domain/teletext/magazine";
import { isValidPageNumber, getMagazineNumber } from "@/domain/validation/page-number";
import {
  getPageCastDb,
  LOCAL_SCHEMA_VERSION,
  type PageCastDatabase,
  type SavedPageRecord,
} from "./dexie-db";

export interface SavePageResult {
  success: boolean;
  record?: SavedPageRecord;
  error?: string;
}

/**
 * Validates and saves a PagePack to local IndexedDB storage.
 */
export async function savePageLocally(
  pack: PagePackV1,
  customDb?: PageCastDatabase
): Promise<SavePageResult> {
  if (!pack || typeof pack !== "object") {
    return { success: false, error: "Invalid PagePack object" };
  }

  if (pack.version !== 1) {
    return { success: false, error: `Unsupported PagePack version: ${pack.version}` };
  }

  if (!isValidPageNumber(pack.primaryPageNumber)) {
    return { success: false, error: `Invalid page number: ${pack.primaryPageNumber}` };
  }

  if (!pack.pages || !Array.isArray(pack.pages) || pack.pages.length === 0) {
    return { success: false, error: "PagePack contains no pages" };
  }

  const subValidation = validateSubPages(pack.pages);
  if (!subValidation.valid) {
    return {
      success: false,
      error: `Invalid grid geometry: ${subValidation.errors.join("; ")}`,
    };
  }

  const budget = measurePagePack(pack);
  if (budget.isOverBudget) {
    return {
      success: false,
      error: `PagePack exceeds 10,240-byte ceiling (${budget.bytesUsed} bytes)`,
    };
  }

  try {
    const db = customDb || getPageCastDb();
    const magazineNum = getMagazineNumber(pack.primaryPageNumber);
    const serialized = JSON.stringify(pack);
    const byteLength = new TextEncoder().encode(serialized).length;

    const record: SavedPageRecord = {
      pageNumber: pack.primaryPageNumber,
      slug: pack.slug || `page-${pack.primaryPageNumber}`,
      title: pack.title || `Page ${pack.primaryPageNumber}`,
      magazineNumber: magazineNum,
      language: (pack.metadata?.language as "en" | "hi") || "en",
      savedAt: new Date().toISOString(),
      version: pack.version,
      schemaVersion: LOCAL_SCHEMA_VERSION,
      pack,
      sourceUrl: pack.metadata?.sourceName,
      sourceDomain: (pack.metadata as any)?.sourceDomain,
      byteLength,
    };

    await db.saved_pages.put(record);

    return {
      success: true,
      record,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to write record to IndexedDB",
    };
  }
}

/**
 * Removes a saved page from local IndexedDB storage.
 */
export async function removeSavedPage(
  pageNumber: number,
  customDb?: PageCastDatabase
): Promise<boolean> {
  if (!isValidPageNumber(pageNumber)) {
    return false;
  }

  try {
    const db = customDb || getPageCastDb();
    const existing = await db.saved_pages.get(pageNumber);
    if (!existing) {
      return false;
    }

    await db.saved_pages.delete(pageNumber);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks whether a page is currently saved in local IndexedDB storage.
 */
export async function isPageSaved(
  pageNumber: number,
  customDb?: PageCastDatabase
): Promise<boolean> {
  if (!isValidPageNumber(pageNumber)) {
    return false;
  }

  try {
    const db = customDb || getPageCastDb();
    const count = await db.saved_pages.where("pageNumber").equals(pageNumber).count();
    return count > 0;
  } catch {
    return false;
  }
}

/**
 * Retrieves a single saved page by page number.
 */
export async function getSavedPage(
  pageNumber: number,
  customDb?: PageCastDatabase
): Promise<SavedPageRecord | null> {
  if (!isValidPageNumber(pageNumber)) {
    return null;
  }

  try {
    const db = customDb || getPageCastDb();
    const record = await db.saved_pages.get(pageNumber);
    return record || null;
  } catch {
    return null;
  }
}

/**
 * Retrieves all saved pages sorted by save timestamp (newest first).
 */
export async function getAllSavedPages(customDb?: PageCastDatabase): Promise<SavedPageRecord[]> {
  try {
    const db = customDb || getPageCastDb();
    const records = await db.saved_pages.toArray();
    return records.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  } catch {
    return [];
  }
}
