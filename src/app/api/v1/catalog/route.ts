/**
 * PageCast Public Broadcast Catalogue API Route (TASK-S4-05)
 * GET /api/v1/catalog
 *
 * Returns live published bulletins grouped under the 8 standard Teletext magazines.
 */

import { NextResponse } from "next/server";
import { getPersistenceRepository } from "@/server/database";
import { MAGAZINES } from "@/domain/teletext/magazine";
import type { CatalogItem } from "@/server/database/repository";

export interface GroupedMagazineCatalog {
  magazineNumber: number;
  name: string;
  description: string;
  pageRange: readonly [number, number];
  defaultColor: string;
  bulletins: CatalogItem[];
}

export async function GET() {
  try {
    const repo = getPersistenceRepository();
    const catalogItems = await repo.getCatalog();

    // Group catalogue items under all 8 standard Teletext magazines
    const grouped: GroupedMagazineCatalog[] = MAGAZINES.map((mag) => {
      const bulletins = catalogItems.filter(
        (item) => item.pageNumber >= mag.pageRange[0] && item.pageNumber <= mag.pageRange[1]
      );

      return {
        magazineNumber: mag.number,
        name: mag.name,
        description: mag.description,
        pageRange: mag.pageRange,
        defaultColor: mag.defaultColor,
        bulletins,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: catalogItems,
        magazines: grouped,
        totalBulletins: catalogItems.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "INTERNAL_CATALOGUE_ERROR",
        message: error?.message || "Failed to load broadcast catalogue",
      },
      { status: 500 }
    );
  }
}
