import { NextResponse } from "next/server";
import { z } from "zod";
import { convertDraftToPagePack } from "@/server/conversion/bulletin-to-pagepack";
import { BulletinDraftSchema, ExtractedSourceSchema } from "@/domain/source-provenance/schema";
import { parseJsonWithLimit, DEFAULT_MAX_BODY_BYTES } from "@/server/security/request-limits";
import { enforceRateLimit, RATE_LIMIT_PROFILES } from "@/server/security/rate-limiter";
import { logger, getCorrelationId } from "@/server/logging/logger";

const ConvertRequestSchema = z.object({
  draft: BulletinDraftSchema,
  source: ExtractedSourceSchema.optional(),
  edition: z.string().optional(),
  publisherName: z.string().optional(),
});

export async function POST(request: Request) {
  const startTime = performance.now();
  const correlationId = getCorrelationId(request);

  // 1. Enforce rate limiting
  const rateLimitResult = await enforceRateLimit(
    request,
    "bulletins:convert",
    RATE_LIMIT_PROFILES.SOURCE_EXTRACT
  );
  if (!rateLimitResult.success) {
    logger.warn("Convert rate limit exceeded", {
      category: "SECURITY",
      route: "/api/v1/bulletins/convert",
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

    const parseResult = ConvertRequestSchema.safeParse(parsedBody.data);
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

    logger.info("Draft converted to PagePack", {
      category: "DELIVERY",
      route: "/api/v1/bulletins/convert",
      correlationId,
      status: 200,
      durationMs: performance.now() - startTime,
      meta: {
        pageNumber: draft.targetPageNumber,
        payloadBytes: result.payloadBytes,
        withinBudget: result.withinBudget,
        pageCount: result.pageCount,
      },
    });

    return NextResponse.json({
      success: true,
      pack: result.pack,
      payloadBytes: result.payloadBytes,
      withinBudget: result.withinBudget,
      pageCount: result.pageCount,
    });
  } catch (err: unknown) {
    logger.error("Draft conversion failed", {
      category: "DELIVERY",
      route: "/api/v1/bulletins/convert",
      correlationId,
      status: 500,
      durationMs: performance.now() - startTime,
      error: err,
    });

    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Conversion failed: ${message}`, code: "CONVERSION_FAILED" },
      { status: 500 }
    );
  }
}
