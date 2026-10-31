/**
 * PageCast Public Catalogue Snapshot Cache (TASK-S4-OFF-07 / FR-075)
 *
 * Persists and retrieves a small, public broadcast catalogue snapshot in IndexedDB
 * for offline directory browsing with stale-state transparency.
 */

import { getPageCastDb, type PageCastDatabase, type CatalogSnapshotRecord } from "./dexie-db";

export interface SnapshotCatalogItem {
  pageNumber: number;
  slug: string;
  title: string;
  language: string;
  magazineNumber: number;
  publishedAt: string;
  revision: number;
}

export interface RetrievedSnapshot {
  items: SnapshotCatalogItem[];
  snapshotAt: string;
  itemCount: number;
}

const SNAPSHOT_ID = "latest";

/**
 * Persists a public catalogue snapshot into IndexedDB.
 */
export async function saveCatalogueSnapshot(
  items: SnapshotCatalogItem[],
  customDb?: PageCastDatabase
): Promise<void> {
  if (!items || !Array.isArray(items)) return;

  try {
    const db = customDb || getPageCastDb();
    const record: CatalogSnapshotRecord = {
      id: SNAPSHOT_ID,
      snapshotAt: new Date().toISOString(),
      itemCount: items.length,
      itemsJson: JSON.stringify(items),
    };

    await db.catalog_snapshot.put(record);
  } catch {
    // Non-fatal if storage fails
  }
}

/**
 * Retrieves the latest cached public catalogue snapshot from IndexedDB.
 */
export async function getCatalogueSnapshot(
  customDb?: PageCastDatabase
): Promise<RetrievedSnapshot | null> {
  try {
    const db = customDb || getPageCastDb();
    const record = await db.catalog_snapshot.get(SNAPSHOT_ID);
    if (!record || !record.itemsJson) {
      return null;
    }

    const items = JSON.parse(record.itemsJson) as SnapshotCatalogItem[];
    return {
      items,
      snapshotAt: record.snapshotAt,
      itemCount: record.itemCount,
    };
  } catch {
    return null;
  }
}
