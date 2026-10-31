import { NextResponse } from "next/server";
import { z } from "zod";
import { PagePackV1Schema } from "@/domain/page-pack/schema";
import { BulletinDraftSchema, ExtractedSourceSchema } from "@/domain/source-provenance/schema";
import { measurePagePack } from "@/domain/page-pack/codec";
import { validateGrid } from "@/domain/validation/validate-grid";
import { isValidPageNumber } from "@/domain/validation/page-number";
import { convertDraftToPagePack } from "@/server/conversion/bulletin-to-pagepack";
import type { PagePackV1 } from "@/domain/page-pack/types";

const ValidateRequestSchema = z.object({
  pack: PagePackV1Schema.optional(),
  draft: BulletinDraftSchema.optional(),
  pageNumber: z.number().int().min(100).max(899).optional(),
  source: ExtractedSourceSchema.optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = ValidateRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          valid: false,
          error: "INVALID_REQUEST",
          details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        },
        { status: 400 }
      );
    }

    let pack: PagePackV1;
    if (parsed.data.pack) {
      pack = parsed.data.pack as unknown as PagePackV1;
    } else if (parsed.data.draft) {
      const pageNumber = parsed.data.pageNumber || parsed.data.draft.pageNumber || 100;
      const conversion = convertDraftToPagePack(
        { ...parsed.data.draft, pageNumber },
        parsed.data.source
      );
      pack = conversion.pack;
    } else {
      return NextResponse.json(
        { valid: false, error: "Provide either 'pack' or 'draft' in request payload" },
        { status: 400 }
      );
    }

    const errors: string[] = [];

    // 1. Page Number Range Check
    if (!isValidPageNumber(pack.primaryPageNumber)) {
      errors.push(`Invalid page number ${pack.primaryPageNumber}: expected 100-899`);
    }

    // 2. Byte Budget Ceiling Check (<= 10,240 bytes)
    const budget = measurePagePack(pack);
    if (budget.isOverBudget) {
      errors.push(
        `Payload size (${budget.bytesUsed} bytes) exceeds strict 10 KiB ceiling (10,240 bytes)`
      );
    }

    // 3. Grid Geometry Check (Every page must be 25 rows x 40 cols)
    for (let idx = 0; idx < pack.pages.length; idx++) {
      const page = pack.pages[idx];
      const gridResult = validateGrid(page);
      if (!gridResult.valid) {
        errors.push(
          `Page ${idx + 1} (P${page.pageNumber}) geometry invalid: ${gridResult.errors.join("; ")}`
        );
      }
    }

    // 4. Source Attribution Requirement
    if (!pack.metadata?.sourceName) {
      errors.push("Missing source attribution in metadata");
    }

    const valid = errors.length === 0;

    return NextResponse.json({
      valid,
      errors,
      budget,
      pagesValidated: pack.pages.length,
      primaryPageNumber: pack.primaryPageNumber,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        valid: false,
        error: error?.message || "Validation failed unexpectedly",
      },
      { status: 500 }
    );
  }
}
