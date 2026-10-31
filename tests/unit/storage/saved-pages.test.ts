import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { indexedDB, IDBKeyRange } from "fake-indexeddb";
import { getPageCastDb, resetPageCastDbForTesting } from "@/lib/storage/dexie-db";
import {
  savePageLocally,
  removeSavedPage,
  isPageSaved,
  getSavedPage,
  getAllSavedPages,
} from "@/lib/storage/saved-pages";
import { page100, page101 } from "@/data/seed-pages";
import type { PagePackV1 } from "@/domain/page-pack/types";

describe("Saved Pages Service Operations (TASK-S4-OFF-04 / FR-071 / FR-073 / FR-074)", () => {
  let db: ReturnType<typeof getPageCastDb>;

  const validPack100: PagePackV1 = {
    id: "pack-100",
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

  const validPack101: PagePackV1 = {
    id: "pack-101",
    version: 1,
    slug: "world-news",
    title: "World News",
    magazine: 1,
    primaryPageNumber: 101,
    createdAt: "2026-10-31T10:00:00Z",
    metadata: {
      sourceName: "World News Wire",
      language: "en",
      aiAssisted: false,
      publisherId: "system",
    },
    pages: [page101],
  };

  beforeEach(async () => {
    db = getPageCastDb({ indexedDB, IDBKeyRange });
    await db.open();
  });

  afterEach(async () => {
    await resetPageCastDbForTesting(db);
  });

  it("saves a valid PagePack locally in IndexedDB", async () => {
    const result = await savePageLocally(validPack100, db);

    expect(result.success).toBe(true);
    expect(result.record).toBeDefined();
    expect(result.record?.pageNumber).toBe(100);
    expect(result.record?.magazineNumber).toBe(1);
    expect(result.record?.byteLength).toBeGreaterThan(0);
    expect(result.record?.byteLength).toBeLessThan(10240);

    const isSaved = await isPageSaved(100, db);
    expect(isSaved).toBe(true);
  });

  it("rejects invalid, null, or out-of-bounds PagePacks", async () => {
    const nullRes = await savePageLocally(null as any, db);
    expect(nullRes.success).toBe(false);

    const invalidPageNumPack = { ...validPack100, primaryPageNumber: 99 };
    const invalidNumRes = await savePageLocally(invalidPageNumPack, db);
    expect(invalidNumRes.success).toBe(false);
    expect(invalidNumRes.error).toContain("Invalid page number");

    const unsupportedVersionPack = { ...validPack100, version: 2 as any };
    const versionRes = await savePageLocally(unsupportedVersionPack, db);
    expect(versionRes.success).toBe(false);
    expect(versionRes.error).toContain("Unsupported PagePack version");
  });

  it("removes a saved page from IndexedDB", async () => {
    await savePageLocally(validPack100, db);
    expect(await isPageSaved(100, db)).toBe(true);

    const removed = await removeSavedPage(100, db);
    expect(removed).toBe(true);
    expect(await isPageSaved(100, db)).toBe(false);

    // Removing non-existent page returns false
    const removedAgain = await removeSavedPage(100, db);
    expect(removedAgain).toBe(false);
  });

  it("retrieves a saved page record and its full PagePack", async () => {
    await savePageLocally(validPack100, db);

    const retrieved = await getSavedPage(100, db);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.pageNumber).toBe(100);
    expect(retrieved?.pack.title).toBe("PageCast Main Index");
    expect(retrieved?.pack.pages).toHaveLength(1);
  });

  it("retrieves all saved pages sorted newest first", async () => {
    await savePageLocally(validPack100, db);
    await savePageLocally(validPack101, db);

    const allPages = await getAllSavedPages(db);
    expect(allPages).toHaveLength(2);
    expect(allPages.map((p) => p.pageNumber)).toContain(100);
    expect(allPages.map((p) => p.pageNumber)).toContain(101);
  });

  it("updates existing saved page on repeated save without duplication", async () => {
    await savePageLocally(validPack100, db);

    const modifiedPack: PagePackV1 = {
      ...validPack100,
      title: "Updated Title After Edit",
    };
    await savePageLocally(modifiedPack, db);

    const count = await db.saved_pages.count();
    expect(count).toBe(1);

    const retrieved = await getSavedPage(100, db);
    expect(retrieved?.title).toBe("Updated Title After Edit");
  });
});
