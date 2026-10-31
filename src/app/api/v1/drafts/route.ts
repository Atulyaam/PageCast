import { NextResponse } from "next/server";
import { z } from "zod";
import { getPersistenceRepository } from "@/server/database";
import { convertDraftToPagePack } from "@/server/conversion/bulletin-to-pagepack";
import { BulletinDraftSchema, ExtractedSourceSchema } from "@/domain/source-provenance/schema";
import { PagePackV1Schema } from "@/domain/page-pack/schema";
import type { PagePackV1 } from "@/domain/page-pack/types";
import { parseJsonWithLimit, DEFAULT_MAX_BODY_BYTES } from "@/server/security/request-limits";
import { enforceRateLimit, RATE_LIMIT_PROFILES } from "@/server/security/rate-limiter";

const CreateDraftApiSchema = z.object({
  pageNumber: z.number().int().min(100).max(899),
  slug: z.string().optional(),
  language: z.enum(["en", "hi"]).default("en"),
  draft: BulletinDraftSchema,
  pack: PagePackV1Schema.optional(),
  source: ExtractedSourceSchema.optional(),
  userId: z.string().optional(),
});

export async function POST(request: Request) {
  // 1. Enforce rate limiting
  const rateLimitResult = await enforceRateLimit(
    request,
    "drafts:create",
    RATE_LIMIT_PROFILES.PUBLISH
  );
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }

  try {
    // 2. Enforce request size limit and parse JSON safely
    const parsedBody = await parseJsonWithLimit(request, DEFAULT_MAX_BODY_BYTES);
    if (!parsedBody.success) {
      return parsedBody.response;
    }

    const parsed = CreateDraftApiSchema.safeParse(parsedBody.data);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "INVALID_REQUEST",
          details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        },
        { status: 400 }
      );
    }

    const { pageNumber, language, draft, source, userId } = parsed.data;
    const repo = getPersistenceRepository();

    let sourceId: string | undefined;
    if (source) {
      const savedSource = await repo.saveSource(source, userId);
      sourceId = savedSource.id;
    }

    // Use passed pack or convert draft to canonical pack
    const pack: PagePackV1 = parsed.data.pack
      ? (parsed.data.pack as unknown as PagePackV1)
      : convertDraftToPagePack({ ...draft, pageNumber }, source).pack;

    const slug = parsed.data.slug || pack.slug;

    const result = await repo.createDraft({
      pageNumber,
      slug,
      language,
      draft,
      pack,
      userId,
      sourceId,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    const isBudgetError = error?.message?.includes("PAGE_OVER_BUDGET");
    const status = isBudgetError ? 422 : 500;

    return NextResponse.json(
      {
        error: error?.message || "Failed to create draft",
      },
      { status }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;

    const repo = getPersistenceRepository();
    const drafts = await repo.listDrafts(userId);

    return NextResponse.json({
      success: true,
      data: drafts,
      count: drafts.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Failed to list drafts",
      },
      { status: 500 }
    );
  }
}
