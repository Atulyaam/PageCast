import { NextResponse } from "next/server";
import { z } from "zod";
import { safeFetchArticle } from "@/server/security/safe-fetch";
import { extractArticleFromHtml } from "@/server/ingestion/extractor";
import { SecurityError } from "@/server/security/url-safety";

const ExtractRequestSchema = z.object({
  url: z.string().url("A valid URL is required"),
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

    const parseResult = ExtractRequestSchema.safeParse(body);
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

    const { url, language } = parseResult.data;

    // 1. Fetch HTML safely with complete SSRF and DNS rebinding protection
    const fetchResult = await safeFetchArticle(url);

    // 2. Extract article structure without executing any scripts
    const source = extractArticleFromHtml(fetchResult.text, fetchResult.finalUrl, {
      language,
    });

    return NextResponse.json({
      success: true,
      source,
      meta: {
        bytesFetched: fetchResult.bytesFetched,
        statusCode: fetchResult.statusCode,
      },
    });
  } catch (err: unknown) {
    if (err instanceof SecurityError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: 403 }
      );
    }

    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Failed to extract article: ${message}`, code: "EXTRACTION_FAILED" },
      { status: 500 }
    );
  }
}
