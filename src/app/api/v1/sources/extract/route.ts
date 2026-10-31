import { NextResponse } from "next/server";
import { z } from "zod";
import { safeFetchArticle } from "@/server/security/safe-fetch";
import { extractArticleFromHtml } from "@/server/ingestion/extractor";
import { SecurityError } from "@/server/security/url-safety";
import { parseJsonWithLimit, DEFAULT_MAX_BODY_BYTES } from "@/server/security/request-limits";
import { enforceRateLimit, RATE_LIMIT_PROFILES } from "@/server/security/rate-limiter";
import { logger, getCorrelationId } from "@/server/logging/logger";

const ExtractRequestSchema = z.object({
  url: z.string().url("A valid URL is required"),
  language: z.enum(["en", "hi"]).optional(),
});

export async function POST(request: Request) {
  const startTime = performance.now();
  const correlationId = getCorrelationId(request);

  // 1. Enforce rate limiting
  const rateLimitResult = await enforceRateLimit(
    request,
    "sources:extract",
    RATE_LIMIT_PROFILES.SOURCE_EXTRACT
  );
  if (!rateLimitResult.success) {
    logger.warn("Extract rate limit exceeded", {
      category: "SECURITY",
      route: "/api/v1/sources/extract",
      correlationId,
      status: 429,
      durationMs: performance.now() - startTime,
    });
    return rateLimitResult.response;
  }

  try {
    // 2. Enforce request size limit and parse JSON safely
    const parsedBody = await parseJsonWithLimit(request, DEFAULT_MAX_BODY_BYTES);
    if (!parsedBody.success) {
      return parsedBody.response;
    }

    const parseResult = ExtractRequestSchema.safeParse(parsedBody.data);
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

    // 3. Fetch HTML safely with complete SSRF and DNS rebinding protection
    const fetchResult = await safeFetchArticle(url);

    // 4. Extract article structure without executing any scripts
    const source = extractArticleFromHtml(fetchResult.text, fetchResult.finalUrl, {
      language,
    });

    logger.info("Article extracted successfully", {
      category: "INGESTION",
      route: "/api/v1/sources/extract",
      correlationId,
      status: 200,
      durationMs: performance.now() - startTime,
      meta: { url, bytesFetched: fetchResult.bytesFetched },
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
    const status = err instanceof SecurityError ? 403 : 500;
    logger.error("Article extraction failed", {
      category: "INGESTION",
      route: "/api/v1/sources/extract",
      correlationId,
      status,
      durationMs: performance.now() - startTime,
      error: err,
    });

    if (err instanceof SecurityError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: 403 }
      );
    }

    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message, code: "INGESTION_ERROR" },
      { status: 500 }
    );
  }
}
