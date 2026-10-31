/**
 * PageCast Authenticated Publish API Route (TASK-S3-07 / TASK-S5-01 / TASK-S5-02)
 * POST /api/v1/pages/publish
 *
 * Enforces pre-publication review verification, grid compliance,
 * 10,240-byte ceiling, rate limiting, and duplicate active page number prevention.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getBulletinPublisher } from "@/server/publishing/bulletin-publisher";
import { parseJsonWithLimit, MAX_PAGEPACK_BODY_BYTES } from "@/server/security/request-limits";
import { enforceRateLimit, RATE_LIMIT_PROFILES } from "@/server/security/rate-limiter";

const PublishRequestSchema = z.object({
  draftId: z.string().optional(),
  pack: z.record(z.string(), z.any()),
  reviewedAt: z.string().min(1, "Review timestamp is required before publishing"),
  reviewerId: z.string().optional(),
});

export async function POST(request: Request) {
  // 1. Enforce rate limiting
  const rateLimitResult = await enforceRateLimit(
    request,
    "pages:publish",
    RATE_LIMIT_PROFILES.PUBLISH
  );
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }

  try {
    // 2. Enforce request size limit and parse JSON safely
    const parsedBody = await parseJsonWithLimit(request, MAX_PAGEPACK_BODY_BYTES);
    if (!parsedBody.success) {
      return parsedBody.response;
    }

    const parseResult = PublishRequestSchema.safeParse(parsedBody.data);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      const isReviewMissing = parseResult.error.issues.some((i) => i.path.includes("reviewedAt"));

      return NextResponse.json(
        {
          error: isReviewMissing ? "UNREVIEWED_DRAFT" : "VALIDATION_FAILED",
          message: issue?.message || "Invalid publish request body",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { draftId, pack, reviewedAt, reviewerId } = parseResult.data;
    const publisher = getBulletinPublisher();

    const result = await publisher.publishBulletin({
      draftId,
      pack: pack as any,
      reviewedAt,
      reviewerId,
    });

    return NextResponse.json({ success: true, page: result }, { status: 201 });
  } catch (error: any) {
    const msg = error?.message || "Failed to publish page";

    if (msg.includes("UNREVIEWED_DRAFT")) {
      return NextResponse.json({ error: "UNREVIEWED_DRAFT", message: msg }, { status: 400 });
    }

    if (msg.includes("INVALID_GRID_GEOMETRY") || msg.includes("INVALID_SUBPAGES")) {
      return NextResponse.json({ error: "INVALID_GRID_GEOMETRY", message: msg }, { status: 400 });
    }

    if (msg.includes("PAGE_OVER_BUDGET") || msg.includes("exceeds 10,240-byte ceiling")) {
      return NextResponse.json({ error: "PAGE_OVER_BUDGET", message: msg }, { status: 400 });
    }

    if (msg.includes("DUPLICATE_PAGE_NUMBER") || msg.includes("already published")) {
      return NextResponse.json({ error: "DUPLICATE_PAGE_NUMBER", message: msg }, { status: 409 });
    }

    return NextResponse.json({ error: "INTERNAL_ERROR", message: msg }, { status: 500 });
  }
}
