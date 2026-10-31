import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { indexedDB, IDBKeyRange } from "fake-indexeddb";
import { getPageCastDb, resetPageCastDbForTesting } from "@/lib/storage/dexie-db";
import { savePageLocally } from "@/lib/storage/saved-pages";
import { fetchPublishedPage } from "@/lib/reader/reader-client";
import { page100 } from "@/data/seed-pages";
import type { PagePackV1 } from "@/domain/page-pack/types";

describe("Offline Reader Behavior & Persistence (TASK-S4-OFF-06 / FR-007 / FR-008 / FR-072 / FR-076)", () => {
  let db: ReturnType<typeof getPageCastDb>;

  const mockPack205: PagePackV1 = {
    id: "pack-205",
    version: 1,
    slug: "mesh-networks",
    title: "Resilient Mesh Networks",
    magazine: 2,
    primaryPageNumber: 205,
    createdAt: "2026-10-31T12:00:00Z",
    metadata: {
      sourceName: "Mesh Protocol Org",
      language: "en",
      aiAssisted: false,
      publisherId: "system",
    },
    pages: [
      {
        ...page100,
        pageNumber: 205,
        title: "Resilient Mesh Networks",
      },
    ],
  };

  beforeEach(async () => {
    db = getPageCastDb({ indexedDB, IDBKeyRange });
    await db.open();
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    await resetPageCastDbForTesting(db);
    vi.unstubAllGlobals();
  });

  it("loads user-saved bulletin from IndexedDB when network is offline", async () => {
    // 1. User saves page while online
    await savePageLocally(mockPack205, db);

    // 2. Browser goes offline (fetch fails)
    const mockOfflineFetch = vi.fn().mockRejectedValue(new Error("Network offline"));

    // 3. User requests P205
    const result = await fetchPublishedPage(205, mockOfflineFetch);

    // 4. Page is retrieved from IndexedDB without online fetch succeeding
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.page.page_number).toBe(205);
    expect(result.data?.pack.title).toBe("Resilient Mesh Networks");
    expect(result.data?.isSavedCopy).toBe(true);
    expect(result.data?.isFallback).toBe(false);
  });

  it("falls back to hardcoded seed broadcast when network is offline and page was not explicitly saved", async () => {
    const mockOfflineFetch = vi.fn().mockRejectedValue(new Error("Network offline"));

    // Page 100 is a seed page, but not explicitly saved by user
    const result = await fetchPublishedPage(100, mockOfflineFetch);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.page.page_number).toBe(100);
    expect(result.data?.isFallback).toBe(true);
    expect(result.data?.isSavedCopy).toBe(false);
  });

  it("reports clear offline unavailable error when page is neither saved nor a seed page", async () => {
    const mockOfflineFetch = vi.fn().mockRejectedValue(new Error("Network offline"));

    // Page 250 is neither saved in IndexedDB nor a seed page
    const result = await fetchPublishedPage(250, mockOfflineFetch);

    expect(result.success).toBe(false);
    expect(result.notFound).toBe(true);
    expect(result.isOfflineUnavailable).toBe(true);
    expect(result.error).toContain("is not saved locally and cannot be loaded offline");
  });

  it("resolves from IndexedDB immediately when navigator.onLine is false", async () => {
    await savePageLocally(mockPack205, db);

    vi.stubGlobal("navigator", {
      onLine: false,
    });

    const mockFetch = vi.fn(); // Should never even be called when navigator.onLine is false

    const result = await fetchPublishedPage(205, mockFetch);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.data?.page.page_number).toBe(205);
    expect(result.data?.isSavedCopy).toBe(true);
  });
});
