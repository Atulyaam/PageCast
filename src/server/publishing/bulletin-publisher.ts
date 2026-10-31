/**
 * PageCast Bulletin Publisher & Orchestrator (TASK-S3-07)
 *
 * Coordinates multi-page bulletin bundling, pre-flight review confirmation,
 * grid & byte budget verification, and persistence to Supabase/Memory repository.
 */

import { getPersistenceRepository } from "@/server/database";
import type { IPersistenceRepository } from "@/server/database/repository";
import type { PagePackV1 } from "@/domain/page-pack/types";
import type { TeletextPage } from "@/domain/teletext/types";
import { getMagazineNumber, isValidPageNumber } from "@/domain/validation/page-number";
import { validateSubPages } from "@/domain/teletext/magazine";
import { measurePagePack } from "@/domain/page-pack/codec";

export interface BundleMultiPageOptions {
  pageNumber: number;
  title: string;
  slug?: string;
  language?: "en" | "hi";
  sourceName?: string;
  originalUrl?: string;
  author?: string;
  publisherId?: string;
  pages: readonly TeletextPage[];
}

export interface PublishBulletinParams {
  draftId?: string;
  pack: PagePackV1;
  reviewedAt: string; // ISO timestamp - mandatory verification gate
  reviewerId?: string;
}

export interface PublishBulletinResult {
  success: true;
  pageId: string;
  pageNumber: number;
  slug: string;
  subPageCount: number;
  payloadBytes: number;
  publishedAt: string;
  revision: number;
}

export class BulletinPublisher {
  constructor(private readonly repository: IPersistenceRepository = getPersistenceRepository()) {}

  /**
   * Bundles an array of TeletextPage sub-pages into a canonical PagePackV1 payload.
   */
  bundleMultiPageBulletin(options: BundleMultiPageOptions): PagePackV1 {
    if (!isValidPageNumber(options.pageNumber)) {
      throw new Error(`Invalid page number: ${options.pageNumber}. Expected 100-899.`);
    }

    const subPageValidation = validateSubPages(options.pages);
    if (!subPageValidation.valid) {
      throw new Error(`INVALID_SUBPAGES: ${subPageValidation.errors.join("; ")}`);
    }

    const magazine = getMagazineNumber(options.pageNumber);
    const slug =
      options.slug ||
      options.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") ||
      `page-${options.pageNumber}`;

    const pack: PagePackV1 = {
      id: `pack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      version: 1,
      slug,
      title: options.title,
      magazine,
      primaryPageNumber: options.pageNumber,
      createdAt: new Date().toISOString(),
      metadata: {
        sourceName: options.sourceName || "Manual Publication",
        originalUrl: options.originalUrl,
        author: options.author,
        language: options.language || "en",
        aiAssisted: false,
        publisherId: options.publisherId || "anonymous-publisher",
      },
      pages: options.pages,
    };

    return pack;
  }

  /**
   * Publishes a bulletin with strict pre-publication gates:
   * 1. Requires explicit reviewedAt confirmation timestamp.
   * 2. Validates subpage integrity and 40x25 grid geometry.
   * 3. Validates payload UTF-8 ceiling <= 10,240 bytes.
   * 4. Enforces duplicate active page number prevention.
   */
  async publishBulletin(params: PublishBulletinParams): Promise<PublishBulletinResult> {
    // 1. Review confirmation gate
    if (!params.reviewedAt || typeof params.reviewedAt !== "string" || !params.reviewedAt.trim()) {
      throw new Error(
        "UNREVIEWED_DRAFT: Draft must be explicitly reviewed and confirmed before publishing."
      );
    }

    const { pack } = params;

    // 2. Validate subpage geometry and continuity
    const subValidation = validateSubPages(pack.pages);
    if (!subValidation.valid) {
      throw new Error(`INVALID_GRID_GEOMETRY: ${subValidation.errors.join("; ")}`);
    }

    // 3. Validate byte budget ceiling
    const budget = measurePagePack(pack);
    if (budget.isOverBudget) {
      throw new Error(
        `PAGE_OVER_BUDGET: Payload of ${budget.bytesUsed} bytes exceeds the 10,240-byte ceiling.`
      );
    }

    // 4. Duplicate page number check on active published pages
    const existingActive = await this.repository.getPageByNumber(pack.primaryPageNumber);
    if (existingActive && existingActive.page.id !== params.draftId) {
      throw new Error(
        `DUPLICATE_PAGE_NUMBER: Page ${pack.primaryPageNumber} is already published. Choose a different page number or unpublish the active page.`
      );
    }

    let targetPageId = params.draftId;

    if (targetPageId) {
      // Update draft with active pack before publishing
      await this.repository.updateDraft(targetPageId, {
        pageNumber: pack.primaryPageNumber,
        slug: pack.slug,
        language: pack.metadata.language,
        pack,
      });
    } else {
      // Create new draft
      const created = await this.repository.createDraft({
        pageNumber: pack.primaryPageNumber,
        slug: pack.slug,
        language: pack.metadata.language,
        draft: {
          sourceId: pack.id,
          pageNumber: pack.primaryPageNumber,
          title: pack.title,
          summary: pack.title,
          sections: [],
          language: pack.metadata.language,
          metadata: {
            provider: "manual",
            model: "publisher-studio",
            promptVersion: "1.0.0",
            generatedAt: new Date().toISOString(),
            humanReviewed: true,
            reviewedAt: params.reviewedAt,
          },
        },
        pack,
        userId: params.reviewerId,
      });
      targetPageId = created.page.id;
    }

    // Publish page via repository
    const published = await this.repository.publishPage(targetPageId, params.reviewerId);

    return {
      success: true,
      pageId: published.page.id,
      pageNumber: published.page.page_number,
      slug: published.page.slug,
      subPageCount: pack.pages.length,
      payloadBytes: budget.bytesUsed,
      publishedAt: published.page.updated_at,
      revision: published.page.current_revision,
    };
  }
}

let defaultPublisher: BulletinPublisher | null = null;

export function getBulletinPublisher(): BulletinPublisher {
  if (!defaultPublisher) {
    defaultPublisher = new BulletinPublisher();
  }
  return defaultPublisher;
}
