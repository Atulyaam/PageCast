/**
 * PageCast Reader Client Data Access Helper (TASK-S4-01)
 *
 * Provides resilient published bulletin fetching with local seed fallback,
 * caching, and type-safe payload resolution for the reader terminal.
 */

import type { PagePackV1 } from "@/domain/page-pack/types";
import type { PageRow } from "@/server/database/schema-contracts";
import { isValidPageNumber } from "@/domain/validation/page-number";
import { getSeedPage } from "@/data/seed-pages";

export interface PublishedPageResponse {
  page: PageRow;
  revision: number;
  pack: PagePackV1;
  subPageCount: number;
  publishedAt: string;
  isFallback?: boolean;
}

export interface FetchPageResult {
  success: boolean;
  data?: PublishedPageResponse;
  error?: string;
  notFound?: boolean;
}

/**
 * Fetches a published page from the reader API with automatic offline seed fallback.
 */
export async function fetchPublishedPage(
  pageNumber: number,
  fetchFn: typeof fetch = fetch
): Promise<FetchPageResult> {
  if (!isValidPageNumber(pageNumber)) {
    return {
      success: false,
      error: `Invalid page number: ${pageNumber}. Expected 100-899.`,
    };
  }

  try {
    const res = await fetchFn(`/api/v1/pages/${pageNumber}`, {
      headers: { Accept: "application/json" },
    });

    if (res.status === 404) {
      // Check seed page fallback
      const seed = getSeedPage(pageNumber);
      if (seed) {
        return {
          success: true,
          data: createSeedFallbackResponse(pageNumber, seed),
        };
      }
      return {
        success: false,
        notFound: true,
        error: `Page P${pageNumber} is not published.`,
      };
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
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
  } catch (err: any) {
    // If network fetch fails completely (offline), check seed page
    const seed = getSeedPage(pageNumber);
    if (seed) {
      return {
        success: true,
        data: createSeedFallbackResponse(pageNumber, seed),
      };
    }

    return {
      success: false,
      error: err?.message || "Network error fetching published page.",
    };
  }
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
  };
}
