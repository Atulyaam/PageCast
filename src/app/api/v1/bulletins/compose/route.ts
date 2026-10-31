import { NextResponse } from "next/server";
import { z } from "zod";
import { composeBulletin } from "@/server/ai/composer";
import { ExtractedSourceSchema } from "@/domain/source-provenance/schema";
import { parseJsonWithLimit, DEFAULT_MAX_BODY_BYTES } from "@/server/security/request-limits";
import { enforceRateLimit, RATE_LIMIT_PROFILES } from "@/server/security/rate-limiter";
import { logger, getCorrelationId } from "@/server/logging/logger";

const ComposeRequestSchema = z.object({
  source: ExtractedSourceSchema,
  language: z.enum(["en", "hi"]).optional(),
  targetPageNumber: z.number().int().min(100).max(899).optional(),
  forceExtractiveFallback: z.boolean().optional(),
});

export async function POST(request: Request) {
  const startTime = performance.now();
  const correlationId = getCorrelationId(request);

  // 1. Enforce rate limiting on expensive AI endpoint
  const rateLimitResult = await enforceRateLimit(
    request,
    "bulletins:compose",
    RATE_LIMIT_PROFILES.AI_COMPOSE
  );
  if (!rateLimitResult.success) {
    logger.warn("AI compose rate limit exceeded", {
      category: "SECURITY",
      route: "/api/v1/bulletins/compose",
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

    const parseResult = ComposeRequestSchema.safeParse(parsedBody.data);
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

    logger.info("Bulletin composed successfully", {
      category: "AI",
      route: "/api/v1/bulletins/compose",
      correlationId,
      status: 200,
      durationMs: performance.now() - startTime,
      meta: {
        provider: draft.metadata.provider,
        model: draft.metadata.model,
        pageNumber: draft.targetPageNumber,
      },
    });

    return NextResponse.json({
      success: true,
      draft,
    });
  } catch (err: unknown) {
    logger.error("Bulletin composition failed", {
      category: "AI",
      route: "/api/v1/bulletins/compose",
      correlationId,
      status: 500,
      durationMs: performance.now() - startTime,
      error: err,
    });

    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Composition failed: ${message}`, code: "COMPOSITION_FAILED" },
      { status: 500 }
    );
  }
}
