import { NextResponse } from "next/server";
import { z } from "zod";
import { convertDraftToPagePack } from "@/server/conversion/bulletin-to-pagepack";
import { BulletinDraftSchema, ExtractedSourceSchema } from "@/domain/source-provenance/schema";

const ConvertRequestSchema = z.object({
  draft: BulletinDraftSchema,
  source: ExtractedSourceSchema.optional(),
  edition: z.string().optional(),
  publisherName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    const parseResult = ConvertRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message ?? "Invalid draft parameters",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const { draft, source, edition, publisherName } = parseResult.data;

    const result = convertDraftToPagePack(draft, source, {
      edition,
      publisherName,
    });

    return NextResponse.json({
      success: true,
      pack: result.pack,
      payloadBytes: result.payloadBytes,
      withinBudget: result.withinBudget,
      pageCount: result.pageCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Conversion failed: ${message}`, code: "CONVERSION_FAILED" },
      { status: 400 }
    );
  }
}
