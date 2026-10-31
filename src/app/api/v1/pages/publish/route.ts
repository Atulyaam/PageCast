/**
 * PageCast Authenticated Publish API Route (TASK-S3-07)
 * POST /api/v1/pages/publish
 *
 * Enforces pre-publication review verification, grid compliance,
 * 10,240-byte ceiling, and duplicate active page number prevention.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getBulletinPublisher } from "@/server/publishing/bulletin-publisher";

const PublishRequestSchema = z.object({
  draftId: z.string().optional(),
  pack: z.record(z.string(), z.any()),
  reviewedAt: z.string().min(1, "Review timestamp is required before publishing"),
  reviewerId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = PublishRequestSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      const isReviewMissing = parseResult.error.issues.some((i) => i.path.includes("reviewedAt"));

      return NextResponse.json(
        {
          error: isReviewMissing ? "UNREVIEWED_DRAFT" : "VALIDATION_FAILED",
          message: issue.message || "Invalid publish request body",
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

    if (msg.includes("PAGE_OVER_BUDGET")) {
      return NextResponse.json({ error: "PAGE_OVER_BUDGET", message: msg }, { status: 400 });
    }

    if (msg.includes("DUPLICATE_PAGE_NUMBER")) {
      return NextResponse.json({ error: "DUPLICATE_PAGE_NUMBER", message: msg }, { status: 409 });
    }

    return NextResponse.json({ error: "INTERNAL_PUBLISH_ERROR", message: msg }, { status: 500 });
  }
}
