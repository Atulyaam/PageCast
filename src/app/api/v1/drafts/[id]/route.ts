import { NextResponse } from "next/server";
import { z } from "zod";
import { getPersistenceRepository } from "@/server/database";
import { BulletinDraftSchema } from "@/domain/source-provenance/schema";
import { PagePackV1Schema } from "@/domain/page-pack/schema";
import { parseJsonWithLimit, DEFAULT_MAX_BODY_BYTES } from "@/server/security/request-limits";
import { enforceRateLimit, RATE_LIMIT_PROFILES } from "@/server/security/rate-limiter";

const UpdateDraftApiSchema = z.object({
  pageNumber: z.number().int().min(100).max(899).optional(),
  slug: z.string().optional(),
  language: z.enum(["en", "hi"]).optional(),
  draft: BulletinDraftSchema.optional(),
  pack: PagePackV1Schema.optional(),
  userId: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;

    const repo = getPersistenceRepository();
    const draft = await repo.getDraft(id, userId);

    if (!draft) {
      return NextResponse.json(
        { error: "DRAFT_NOT_FOUND", message: `No draft found with ID ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: draft,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve draft" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  // 1. Enforce rate limiting
  const rateLimitResult = await enforceRateLimit(
    request,
    "drafts:patch",
    RATE_LIMIT_PROFILES.PUBLISH
  );
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }

  try {
    const { id } = await params;
    // 2. Enforce request size limit
    const parsedBody = await parseJsonWithLimit(request, DEFAULT_MAX_BODY_BYTES);
    if (!parsedBody.success) {
      return parsedBody.response;
    }

    const parsed = UpdateDraftApiSchema.safeParse(parsedBody.data);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "INVALID_REQUEST",
          details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        },
        { status: 400 }
      );
    }

    const { userId, ...updates } = parsed.data;
    const repo = getPersistenceRepository();
    const result = await repo.updateDraft(id, updates, userId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const msg = error?.message || "";
    if (msg.includes("DRAFT_NOT_FOUND")) {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    if (msg.includes("UNAUTHORIZED")) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    if (msg.includes("PAGE_OVER_BUDGET")) {
      return NextResponse.json({ error: msg }, { status: 422 });
    }
    return NextResponse.json({ error: msg || "Failed to update draft" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;

    const repo = getPersistenceRepository();
    const deleted = await repo.deleteDraft(id, userId);

    if (!deleted) {
      return NextResponse.json(
        { error: "DRAFT_NOT_FOUND", message: `Draft ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: true,
    });
  } catch (error: any) {
    const msg = error?.message || "";
    if (msg.includes("UNAUTHORIZED")) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: msg || "Failed to delete draft" }, { status: 500 });
  }
}
