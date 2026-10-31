import { NextResponse } from "next/server";
import { z } from "zod";
import { extractFromPastedText } from "@/server/ingestion/extractor";
import { parseJsonWithLimit, MAX_SOURCE_TEXT_BODY_BYTES } from "@/server/security/request-limits";
import { enforceRateLimit, RATE_LIMIT_PROFILES } from "@/server/security/rate-limiter";

const FromTextRequestSchema = z.object({
  text: z.string().min(5, "Pasted text must be at least 5 characters long"),
  title: z.string().max(80).optional(),
  siteName: z.string().max(50).optional(),
  byline: z.string().max(50).optional(),
  language: z.enum(["en", "hi"]).optional(),
});

export async function POST(request: Request) {
  // 1. Enforce rate limiting
  const rateLimitResult = await enforceRateLimit(
    request,
    "sources:from-text",
    RATE_LIMIT_PROFILES.SOURCE_EXTRACT
  );
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }

  try {
    // 2. Enforce request size limit and parse JSON safely
    const parsedBody = await parseJsonWithLimit(request, MAX_SOURCE_TEXT_BODY_BYTES);
    if (!parsedBody.success) {
      return parsedBody.response;
    }

    const parseResult = FromTextRequestSchema.safeParse(parsedBody.data);
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
