import { NextResponse } from "next/server";
import { z } from "zod";
import { composeBulletin } from "@/server/ai/composer";
import { ExtractedSourceSchema } from "@/domain/source-provenance/schema";

const ComposeRequestSchema = z.object({
  source: ExtractedSourceSchema,
  language: z.enum(["en", "hi"]).optional(),
  targetPageNumber: z.number().int().min(100).max(899).optional(),
  forceExtractiveFallback: z.boolean().optional(),
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

    const parseResult = ComposeRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message ?? "Invalid request parameters",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const { source, language, targetPageNumber, forceExtractiveFallback } = parseResult.data;

    const draft = await composeBulletin(source, {
      language,
      targetPageNumber,
      forceExtractiveFallback,
    });

    return NextResponse.json({
      success: true,
      draft,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Composition failed: ${message}`, code: "COMPOSITION_FAILED" },
      { status: 500 }
    );
  }
}
