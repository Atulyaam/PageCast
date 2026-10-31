/**
 * PageCast Reader Client Data Access Helper (TASK-S4-01 / TASK-S4-OFF-06)
 *
 * Provides resilient published bulletin fetching with local IndexedDB saved page
 * lookup, offline seed fallback, caching, and type-safe payload resolution.
 */

import type { PagePackV1 } from "@/domain/page-pack/types";
import type { PageRow } from "@/server/database/schema-contracts";
import { isValidPageNumber } from "@/domain/validation/page-number";
import { getSeedPage } from "@/data/seed-pages";
import { getSavedPage } from "@/lib/storage/saved-pages";
import type { SavedPageRecord } from "@/lib/storage/dexie-db";

export interface PublishedPageResponse {
  page: PageRow;
  revision: number;
  pack: PagePackV1;
  subPageCount: number;
  publishedAt: string;
  isFallback?: boolean;
  isSavedCopy?: boolean;
}

export interface FetchPageResult {
  success: boolean;
  data?: PublishedPageResponse;
  error?: string;
  notFound?: boolean;
  isOfflineUnavailable?: boolean;
}

/**
 * Fetches a published page from the reader API with automatic local IndexedDB and offline seed fallback.
 */
export async function fetchPublishedPage(
  pageNumber: number,
  fetchFn: typeof fetch = fetch,
  preferOfflineFirst = false
): Promise<FetchPageResult> {
  if (!isValidPageNumber(pageNumber)) {
    return {
      success: false,
      error: `Invalid page number: ${pageNumber}. Expected 100-899.`,
    };
  }

  // Check if browser is explicitly offline or caller requested offline-first resolution (Data Saver)
  const isOffline =
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean" && !navigator.onLine;

  if (isOffline || preferOfflineFirst) {
    const offlineResult = await resolveOfflinePage(pageNumber);
    if (offlineResult.success) {
      return offlineResult;
    }
    if (isOffline) {
      return offlineResult;
    }
  }

  try {
    const res = await fetchFn(`/api/v1/pages/${pageNumber}`, {
      headers: { Accept: "application/json" },
    });

    if (res.status === 404) {
      // Check local saved copy or seed fallback
      return await resolveOfflinePage(pageNumber);
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      // On server error, attempt local fallback
      const fallback = await resolveOfflinePage(pageNumber);
      if (fallback.success) {
        return fallback;
      }
      return {
        success: false,
        error: errData.message || `HTTP ${res.status}: Failed to load page`,
      };
    }

    const json = await res.json();
    if (json.success && json.data) {
      return {
        success: true,
        data: json.data,
      };
    }

    return {
      success: false,
      error: "Malformed response payload from reader API.",
    };
  } catch {
    // Network error (offline or unreachable server) -> resolve local
    return await resolveOfflinePage(pageNumber);
  }
}

/**
 * Resolves a page from local IndexedDB storage, with seed page fallback.
 */
async function resolveOfflinePage(pageNumber: number): Promise<FetchPageResult> {
  // 1. Check user-saved pages in IndexedDB
  try {
    const saved = await getSavedPage(pageNumber);
    if (saved) {
      return {
        success: true,
        data: createSavedPageResponse(saved),
      };
    }
  } catch {
    // Continue to seed fallback
  }

  // 2. Check hardcoded seed page broadcast
  const seed = getSeedPage(pageNumber);
  if (seed) {
    return {
      success: true,
      data: createSeedFallbackResponse(pageNumber, seed),
    };
  }

  // 3. Page is genuinely unavailable offline (FR-076)
  return {
    success: false,
    notFound: true,
    isOfflineUnavailable: true,
    error: `Page P${pageNumber} is not saved locally and cannot be loaded offline.`,
  };
}

function createSavedPageResponse(saved: SavedPageRecord): PublishedPageResponse {
  const page: PageRow = {
    id: `saved-${saved.pageNumber}`,
    page_number: saved.pageNumber,
    slug: saved.slug,
    language: saved.language,
    status: "published",
    current_revision: saved.version,
    created_by: null,
    created_at: saved.savedAt,
    updated_at: saved.savedAt,
  };

  return {
    page,
    revision: saved.version,
    pack: saved.pack,
    subPageCount: saved.pack.pages.length,
    publishedAt: saved.savedAt,
    isFallback: false,
    isSavedCopy: true,
  };
}

function createSeedFallbackResponse(pageNumber: number, seed: any): PublishedPageResponse {
  const pack: PagePackV1 = {
    id: `seed-pack-${pageNumber}`,
    version: 1,
    slug: `page-${pageNumber}`,
    title: seed.title || `Page ${pageNumber}`,
    magazine: Math.floor(pageNumber / 100),
    primaryPageNumber: pageNumber,
    createdAt: new Date().toISOString(),
    metadata: {
      sourceName: "PageCast Seed Broadcast",
      language: seed.language || "en",
      aiAssisted: false,
      publisherId: "system",
    },
    pages: [seed],
  };

  const page: PageRow = {
    id: `seed-${pageNumber}`,
    page_number: pageNumber,
    slug: `page-${pageNumber}`,
    language: seed.language || "en",
    status: "published",
    current_revision: 1,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    page,
    revision: 1,
    pack,
    subPageCount: 1,
    publishedAt: page.updated_at,
    isFallback: true,
    isSavedCopy: false,
  };
}
