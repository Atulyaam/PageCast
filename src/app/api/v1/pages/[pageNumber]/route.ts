/**
 * PageCast Reader Published Page API Route (TASK-S4-01)
 * GET /api/v1/pages/[pageNumber]
 *
 * Public reader endpoint to fetch live published Teletext PagePacks.
 * Strictly isolates unpublished drafts from public reader consumption.
 */

import { NextResponse } from "next/server";
import { getPersistenceRepository } from "@/server/database";
import { isValidPageNumber } from "@/domain/validation/page-number";
import type { PagePackV1 } from "@/domain/page-pack/types";
import { logger, getCorrelationId } from "@/server/logging/logger";

interface RouteParams {
  params: Promise<{ pageNumber: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const startTime = performance.now();
  const correlationId = getCorrelationId(request);

  try {
    const { pageNumber: rawPageNumber } = await params;
    const pageNumber = parseInt(rawPageNumber, 10);

    if (!isValidPageNumber(pageNumber)) {
      return NextResponse.json(
        {
          error: "INVALID_PAGE_NUMBER",
          message: `Page number must be an integer between 100 and 899. Received: ${rawPageNumber}`,
        },
        { status: 400 }
      );
    }

    const repo = getPersistenceRepository();
    const result = await repo.getPageByNumber(pageNumber);

    // Draft isolation: Ensure page exists and is published
    if (!result || result.page.status !== "published") {
      logger.info("Page not found in broadcast stream", {
        category: "DELIVERY",
        route: `/api/v1/pages/${rawPageNumber}`,
        correlationId,
        status: 404,
        durationMs: performance.now() - startTime,
      });

      return NextResponse.json(
        {
          error: "PAGE_NOT_FOUND",
          message: `Page ${pageNumber} is not published or does not exist.`,
        },
        { status: 404 }
      );
    }

    const pack = result.revision.page_pack_json as PagePackV1;

    logger.info("Page retrieved for broadcast delivery", {
      category: "DELIVERY",
      route: `/api/v1/pages/${rawPageNumber}`,
      correlationId,
      status: 200,
      durationMs: performance.now() - startTime,
      meta: {
        pageNumber,
        subPages: pack.pages.length,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          page: result.page,
          revision: result.page.current_revision,
          pack,
          subPageCount: pack.pages.length,
          publishedAt: result.page.updated_at,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300",
        },
      }
    );
  } catch (error: any) {
    logger.error("Failed to retrieve page", {
      category: "DELIVERY",
      route: "/api/v1/pages/[pageNumber]",
      correlationId,
      status: 500,
      durationMs: performance.now() - startTime,
      error,
    });

    return NextResponse.json(
      {
        error: "INTERNAL_READER_ERROR",
        message: error?.message || "Failed to retrieve page",
      },
      { status: 500 }
    );
  }
}
