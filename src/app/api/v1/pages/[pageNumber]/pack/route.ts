/**
 * PageCast Raw PagePack Download Route (TASK-S3-08)
 * GET /api/v1/pages/[pageNumber]/pack
 *
 * Downloads canonical PagePack JSON payload with content-disposition attachment header.
 */

import { NextResponse } from "next/server";
import { getPersistenceRepository } from "@/server/database";
import { isValidPageNumber } from "@/domain/validation/page-number";
import { exportPagePackToJson } from "@/server/export/pack-export";
import type { PagePackV1 } from "@/domain/page-pack/types";

interface RouteParams {
  params: Promise<{ pageNumber: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
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

    if (!result || result.page.status !== "published") {
      return NextResponse.json(
        {
          error: "PAGE_NOT_FOUND",
          message: `Page ${pageNumber} is not published or does not exist.`,
        },
        { status: 404 }
      );
    }

    const pack = result.revision.page_pack_json as PagePackV1;
    const exported = exportPagePackToJson(pack);

    return new Response(exported.content, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exported.filename}"`,
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "INTERNAL_EXPORT_ERROR",
        message: error?.message || "Failed to export PagePack",
      },
      { status: 500 }
    );
  }
}
