import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { indexedDB, IDBKeyRange } from "fake-indexeddb";
import { getPageCastDb, resetPageCastDbForTesting } from "@/lib/storage/dexie-db";
import {
  saveCatalogueSnapshot,
  getCatalogueSnapshot,
  type SnapshotCatalogItem,
} from "@/lib/storage/catalogue-snapshot";

describe("Public Catalogue Snapshot Storage (TASK-S4-OFF-07 / FR-075)", () => {
  let db: ReturnType<typeof getPageCastDb>;

  const mockItems: SnapshotCatalogItem[] = [
    {
      pageNumber: 100,
      slug: "main-index",
      title: "PageCast Main Index",
      language: "en",
      magazineNumber: 1,
      publishedAt: "2026-10-31T10:00:00Z",
      revision: 1,
    },
    {
      pageNumber: 101,
      slug: "world-news",
      title: "World News",
      language: "en",
      magazineNumber: 1,
      publishedAt: "2026-10-31T10:00:00Z",
      revision: 1,
    },
    {
      pageNumber: 205,
      slug: "tech-mesh",
      title: "Tech Mesh Networks",
      language: "en",
      magazineNumber: 2,
      publishedAt: "2026-10-31T10:00:00Z",
      revision: 1,
    },
  ];

  beforeEach(async () => {
    db = getPageCastDb({ indexedDB, IDBKeyRange });
    await db.open();
  });

  afterEach(async () => {
    await resetPageCastDbForTesting(db);
  });

  it("returns null when no catalogue snapshot has been stored yet", async () => {
    const snapshot = await getCatalogueSnapshot(db);
    expect(snapshot).toBeNull();
  });

  it("persists catalogue items and retrieves snapshot with timestamp", async () => {
    await saveCatalogueSnapshot(mockItems, db);

    const snapshot = await getCatalogueSnapshot(db);
    expect(snapshot).not.toBeNull();
    expect(snapshot?.itemCount).toBe(3);
    expect(snapshot?.items).toHaveLength(3);
    expect(snapshot?.items.map((i) => i.pageNumber)).toEqual([100, 101, 205]);
    expect(snapshot?.snapshotAt).toBeDefined();
  });

  it("updates existing snapshot cleanly on subsequent saves", async () => {
    await saveCatalogueSnapshot(mockItems, db);

    const updatedItems = [mockItems[0]];
    await saveCatalogueSnapshot(updatedItems, db);

    const count = await db.catalog_snapshot.count();
    expect(count).toBe(1);

    const snapshot = await getCatalogueSnapshot(db);
    expect(snapshot?.itemCount).toBe(1);
    expect(snapshot?.items[0].pageNumber).toBe(100);
  });
});
