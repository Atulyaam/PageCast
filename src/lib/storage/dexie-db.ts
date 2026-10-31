import Dexie, { type EntityTable, type DexieOptions } from "dexie";
import type { PagePackV1 } from "@/domain/page-pack/types";

export const LOCAL_SCHEMA_VERSION = 1;

export interface SavedPageRecord {
  pageNumber: number; // Primary key (100-899)
  slug: string;
  title: string;
  magazineNumber: number;
  language: "en" | "hi";
  savedAt: string; // ISO 8601 date
  version: number; // PagePack version (1)
  schemaVersion: number; // Local schema version (1)
  pack: PagePackV1;
  sourceUrl?: string;
  sourceDomain?: string;
  byteLength: number;
}

export interface CatalogSnapshotRecord {
  id: string; // "latest"
  snapshotAt: string; // ISO 8601 date
  itemCount: number;
  itemsJson: string; // Serialized catalog items
}

/**
 * PageCast Offline Dexie Database (TASK-S4-OFF-03 / FR-071 / FR-077)
 * Versioned local persistence for offline bulletins and catalogue snapshots.
 */
export class PageCastDatabase extends Dexie {
  saved_pages!: EntityTable<SavedPageRecord, "pageNumber">;
  catalog_snapshot!: EntityTable<CatalogSnapshotRecord, "id">;

  constructor(options?: DexieOptions) {
    super("PageCastOfflineDB", options);

    // Version 1 Schema Definition
    this.version(1).stores({
      saved_pages: "&pageNumber, slug, title, magazineNumber, language, savedAt, version",
      catalog_snapshot: "&id, snapshotAt",
    });
  }
}

let dbInstance: PageCastDatabase | null = null;

/**
 * Returns the active PageCast Dexie Database singleton.
 */
export function getPageCastDb(options?: DexieOptions): PageCastDatabase {
  if (options) {
    return new PageCastDatabase(options);
  }

  if (!dbInstance) {
    dbInstance = new PageCastDatabase();
  }
  return dbInstance;
}

/**
 * Resets the database singleton and clears stored data for test isolation.
 */
export async function resetPageCastDbForTesting(customDb?: PageCastDatabase): Promise<void> {
  const db = customDb || dbInstance;
  if (db) {
    await db.delete();
  }
  dbInstance = null;
}
