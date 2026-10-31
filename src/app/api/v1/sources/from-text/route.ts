import { NextResponse } from "next/server";
import { z } from "zod";
import { extractFromPastedText } from "@/server/ingestion/extractor";

const FromTextRequestSchema = z.object({
  text: z.string().min(5, "Pasted text must be at least 5 characters long"),
  title: z.string().max(80).optional(),
  siteName: z.string().max(50).optional(),
  byline: z.string().max(50).optional(),
  language: z.enum(["en", "hi"]).optional(),
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

    const parseResult = FromTextRequestSchema.safeParse(body);
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

    const { text, title, siteName, byline, language } = parseResult.data;

    const source = extractFromPastedText(text, {
      title,
      siteName,
      byline,
      language,
    });

    return NextResponse.json({
      success: true,
      source,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Failed to process text: ${message}`, code: "PROCESSING_FAILED" },
      { status: 500 }
    );
  }
}
