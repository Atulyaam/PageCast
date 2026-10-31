import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { indexedDB, IDBKeyRange } from "fake-indexeddb";
import {
  getPageCastDb,
  resetPageCastDbForTesting,
  type SavedPageRecord,
} from "@/lib/storage/dexie-db";
import { page100 } from "@/data/seed-pages";
import type { PagePackV1 } from "@/domain/page-pack/types";

describe("Dexie Database & Schema Versioning (TASK-S4-OFF-03 / FR-071 / FR-077)", () => {
  let db: ReturnType<typeof getPageCastDb>;

  const mockPack: PagePackV1 = {
    id: "pack-test-100",
    version: 1,
    slug: "main-index",
    title: "PageCast Main Index",
    magazine: 1,
    primaryPageNumber: 100,
    createdAt: "2026-10-31T10:00:00Z",
    metadata: {
      sourceName: "PageCast Seed Broadcast",
      language: "en",
      aiAssisted: false,
      publisherId: "system",
    },
    pages: [page100],
  };

  const sampleRecord: SavedPageRecord = {
    pageNumber: 100,
    slug: "main-index",
    title: "PageCast Main Index",
    magazineNumber: 1,
    language: "en",
    savedAt: new Date().toISOString(),
    version: 1,
    schemaVersion: 1,
    pack: mockPack,
    sourceUrl: "https://pagecast.app",
    sourceDomain: "pagecast.app",
    byteLength: 1200,
  };

  beforeEach(async () => {
    db = getPageCastDb({ indexedDB, IDBKeyRange });
    await db.open();
  });

  afterEach(async () => {
    await resetPageCastDbForTesting(db);
  });

  it("initializes Dexie database with expected version and object stores", () => {
    expect(db.verno).toBe(1);
    expect(db.tables.map((t) => t.name)).toContain("saved_pages");
    expect(db.tables.map((t) => t.name)).toContain("catalog_snapshot");
  });

  it("persists and retrieves a full PagePack record by primary key", async () => {
    await db.saved_pages.put(sampleRecord);

    const retrieved = await db.saved_pages.get(100);
    expect(retrieved).toBeDefined();
    expect(retrieved?.pageNumber).toBe(100);
    expect(retrieved?.title).toBe("PageCast Main Index");
    expect(retrieved?.pack.version).toBe(1);
    expect(retrieved?.pack.pages.length).toBe(1);
  });

  it("updates existing saved page without duplicate primary key creation", async () => {
    await db.saved_pages.put(sampleRecord);

    const updatedRecord: SavedPageRecord = {
      ...sampleRecord,
      title: "Updated Title for Page 100",
    };
    await db.saved_pages.put(updatedRecord);

    const count = await db.saved_pages.count();
    expect(count).toBe(1);

    const retrieved = await db.saved_pages.get(100);
    expect(retrieved?.title).toBe("Updated Title for Page 100");
  });

  it("queries saved pages by indexed fields", async () => {
    await db.saved_pages.put(sampleRecord);

    const page205Record: SavedPageRecord = {
      ...sampleRecord,
      pageNumber: 205,
      magazineNumber: 2,
      slug: "tech-news",
      title: "Tech News Bulletin",
    };
    await db.saved_pages.put(page205Record);

    // Query by magazine
    const mag2Pages = await db.saved_pages.where("magazineNumber").equals(2).toArray();
    expect(mag2Pages).toHaveLength(1);
    expect(mag2Pages[0].pageNumber).toBe(205);

    // Total count
    const totalCount = await db.saved_pages.count();
    expect(totalCount).toBe(2);
  });

  it("removes a saved page by primary key", async () => {
    await db.saved_pages.put(sampleRecord);
    expect(await db.saved_pages.count()).toBe(1);

    await db.saved_pages.delete(100);
    expect(await db.saved_pages.count()).toBe(0);

    const retrieved = await db.saved_pages.get(100);
    expect(retrieved).toBeUndefined();
  });

  it("persists and retrieves catalogue snapshot record", async () => {
    const snapshot = {
      id: "latest",
      snapshotAt: new Date().toISOString(),
      itemCount: 8,
      itemsJson: JSON.stringify([{ pageNumber: 100, title: "Index" }]),
    };

    await db.catalog_snapshot.put(snapshot);

    const retrieved = await db.catalog_snapshot.get("latest");
    expect(retrieved).toBeDefined();
    expect(retrieved?.itemCount).toBe(8);
    expect(JSON.parse(retrieved!.itemsJson)).toHaveLength(1);
  });
});
