/**
 * In-Memory Persistence Repository Implementation (TASK-S3-03)
 *
 * Implements IPersistenceRepository with full constraint validation,
 * RLS simulation, and seed catalogue initialization.
 * Used for CI testing, offline local development, and fallback.
 */

import type { ExtractedSource } from "@/domain/source-provenance/types";
import { measurePagePack } from "@/domain/page-pack/codec";
import { isValidPageNumber, getMagazineNumber } from "@/domain/validation/page-number";
import { SEED_PAGES } from "@/data/seed-pages";
import type { PagePackV1 } from "@/domain/page-pack/types";
import type {
  IPersistenceRepository,
  CreateDraftInput,
  UpdateDraftInput,
  CatalogItem,
} from "./repository";
import type {
  PageRow,
  PageRevisionRow,
  SourceRow,
  SourceSentenceRow,
  MagazineRow,
  PublisherAuditLogRow,
} from "./schema-contracts";

const INITIAL_MAGAZINES: MagazineRow[] = [
  {
    id: 1,
    title: "News & Index",
    description: "General news, breaking headlines and main index",
    icon: "newspaper",
  },
  {
    id: 2,
    title: "Technology & Resilience",
    description: "Low-bandwidth computing and decentralization",
    icon: "cpu",
  },
  {
    id: 3,
    title: "Weather & Environment",
    description: "Weather forecasts, climate alerts and air quality",
    icon: "cloud-sun",
  },
  {
    id: 4,
    title: "Sports & Scores",
    description: "Match reports, tables and sporting news",
    icon: "trophy",
  },
  {
    id: 5,
    title: "Culture & Features",
    description: "Arts, literature and entertainment",
    icon: "film",
  },
  {
    id: 6,
    title: "Markets & Finance",
    description: "Economic indices, commodity prices and currencies",
    icon: "trending-up",
  },
  {
    id: 7,
    title: "Public Notices",
    description: "Community announcements and civic bulletins",
    icon: "megaphone",
  },
  {
    id: 8,
    title: "Emergency & System",
    description: "Emergency dispatches, system info and assistance",
    icon: "alert-triangle",
  },
];

export class MemoryPersistenceRepository implements IPersistenceRepository {
  private sources = new Map<string, SourceRow>();
  private sourceSentences = new Map<string, SourceSentenceRow>();
  private pages = new Map<string, PageRow>();
  private pageRevisions = new Map<string, PageRevisionRow>();
  private pageSources = new Set<string>(); // "revisionId:sourceId"
  private magazines = new Map<number, MagazineRow>();
  private auditLogs = new Map<string, PublisherAuditLogRow>();

  constructor() {
    this.seedDefaults();
  }

  /**
   * Resets all in-memory tables and re-seeds default data.
   */
  public reset(): void {
    this.sources.clear();
    this.sourceSentences.clear();
    this.pages.clear();
    this.pageRevisions.clear();
    this.pageSources.clear();
    this.magazines.clear();
    this.auditLogs.clear();
    this.seedDefaults();
  }

  private seedDefaults(): void {
    // Seed magazines 1-8
    for (const mag of INITIAL_MAGAZINES) {
      this.magazines.set(mag.id, mag);
    }

    // Seed initial published pages from Sprint 1
    for (const page of SEED_PAGES) {
      const pageId = `seed-${page.pageNumber}`;
      const revId = `rev-${pageId}-1`;
      const dateStr = new Date().toISOString();

      const pack: PagePackV1 = {
        id: `00000000-0000-4000-8000-${String(page.pageNumber).padStart(12, "0")}`,
        version: 1,
        slug: `bulletin-p${page.pageNumber}`,
        title: page.title,
        magazine: getMagazineNumber(page.pageNumber),
        primaryPageNumber: page.pageNumber,
        createdAt: dateStr,
        metadata: {
          sourceName: "PageCast Official Broadcast",
          language: page.language || "en",
          aiAssisted: false,
          publisherId: "pagecast_system",
        },
        pages: [page],
      };

      const budget = measurePagePack(pack);

      const pageRow: PageRow = {
        id: pageId,
        page_number: page.pageNumber,
        slug: pack.slug,
        language: pack.metadata.language,
        status: "published",
        current_revision: 1,
        created_by: null,
        created_at: dateStr,
        updated_at: dateStr,
      };

      const revisionRow: PageRevisionRow = {
        id: revId,
        page_id: pageId,
        revision: 1,
        page_pack_json: pack,
        payload_bytes: budget.bytesUsed,
        renderer_version: "1.0.0",
        reviewed_by: "system-seed",
        reviewed_at: dateStr,
        created_at: dateStr,
      };

      this.pages.set(pageId, pageRow);
      this.pageRevisions.set(revId, revisionRow);
    }
  }

  async saveSource(source: ExtractedSource, userId?: string): Promise<SourceRow> {
    const sourceId = source.id || `src-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const row: SourceRow = {
      id: sourceId,
      canonical_url: source.url || null,
      title: source.title,
      publisher: source.siteName || null,
      published_at: source.publishedTime || null,
      fetched_at: source.fetchedAt,
      content_hash: source.content ? String(source.content.length) : "hash",
      language: source.language || "en",
      created_by: userId || null,
      created_at: now,
    };

    this.sources.set(sourceId, row);

    // Save sentences
    source.sentences.forEach((s) => {
      const sentenceId = `sent-${sourceId}-${s.index}`;
      this.sourceSentences.set(sentenceId, {
        id: sentenceId,
        source_id: sourceId,
        sentence_index: s.index,
        sentence_hash: s.hash,
        sentence_text: s.text,
        created_at: now,
      });
    });

    return row;
  }

  async getSource(
    id: string
  ): Promise<{ source: SourceRow; sentences: SourceSentenceRow[] } | null> {
    const source = this.sources.get(id);
    if (!source) return null;

    const sentences: SourceSentenceRow[] = [];
    for (const sent of this.sourceSentences.values()) {
      if (sent.source_id === id) {
        sentences.push(sent);
      }
    }
    sentences.sort((a, b) => a.sentence_index - b.sentence_index);

    return { source, sentences };
  }

  async createDraft(
    input: CreateDraftInput
  ): Promise<{ page: PageRow; revision: PageRevisionRow }> {
    if (!isValidPageNumber(input.pageNumber)) {
      throw new Error(`Invalid page number: ${input.pageNumber}. Expected 100-899.`);
    }

    const budget = measurePagePack(input.pack);
    if (budget.isOverBudget) {
      throw new Error(
        `PAGE_OVER_BUDGET: Draft payload exceeds budget (${budget.bytesUsed} > 10240 bytes)`
      );
    }

    const pageId = `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const revisionId = `rev-${pageId}-1`;
    const now = new Date().toISOString();

    const page: PageRow = {
      id: pageId,
      page_number: input.pageNumber,
      slug: input.slug,
      language: input.language,
      status: "draft",
      current_revision: 1,
      created_by: input.userId || null,
      created_at: now,
      updated_at: now,
    };

    const revision: PageRevisionRow = {
      id: revisionId,
      page_id: pageId,
      revision: 1,
      page_pack_json: input.pack,
      payload_bytes: budget.bytesUsed,
      renderer_version: "1.0.0",
      reviewed_by: null,
      reviewed_at: null,
      created_at: now,
    };

    this.pages.set(pageId, page);
    this.pageRevisions.set(revisionId, revision);

    if (input.sourceId) {
      this.pageSources.add(`${revisionId}:${input.sourceId}`);
    }

    return { page, revision };
  }

  async updateDraft(
    pageId: string,
    input: UpdateDraftInput,
    userId?: string
  ): Promise<{ page: PageRow; revision: PageRevisionRow }> {
    const page = this.pages.get(pageId);
    if (!page) {
      throw new Error(`DRAFT_NOT_FOUND: No draft found with ID ${pageId}`);
    }

    if (page.status !== "draft") {
      throw new Error(`CANNOT_EDIT_PUBLISHED: Page ${page.page_number} is already published.`);
    }

    // RLS ownership check
    if (userId && page.created_by && page.created_by !== userId) {
      throw new Error("UNAUTHORIZED: Cannot edit draft owned by another publisher.");
    }

    if (input.pageNumber !== undefined && !isValidPageNumber(input.pageNumber)) {
      throw new Error(`Invalid page number: ${input.pageNumber}. Expected 100-899.`);
    }

    const now = new Date().toISOString();
    const updatedPage: PageRow = {
      ...page,
      page_number: input.pageNumber ?? page.page_number,
      slug: input.slug ?? page.slug,
      language: input.language ?? page.language,
      updated_at: now,
    };

    // Retrieve active revision
    const currentRevId = `rev-${pageId}-${page.current_revision}`;
    const currentRevision = this.pageRevisions.get(currentRevId);

    let updatedRevision = currentRevision;
    if (input.pack) {
      const budget = measurePagePack(input.pack);
      if (budget.isOverBudget) {
        throw new Error(
          `PAGE_OVER_BUDGET: Draft payload exceeds budget (${budget.bytesUsed} > 10240 bytes)`
        );
      }

      updatedRevision = {
        id: currentRevId,
        page_id: pageId,
        revision: page.current_revision,
        page_pack_json: input.pack,
        payload_bytes: budget.bytesUsed,
        renderer_version: "1.0.0",
        reviewed_by: currentRevision?.reviewed_by || null,
        reviewed_at: currentRevision?.reviewed_at || null,
        created_at: currentRevision?.created_at || now,
      };
      this.pageRevisions.set(currentRevId, updatedRevision);
    }

    this.pages.set(pageId, updatedPage);

    if (!updatedRevision) {
      throw new Error(`REVISION_NOT_FOUND: Revision missing for page ${pageId}`);
    }

    return { page: updatedPage, revision: updatedRevision };
  }

  async getDraft(
    pageId: string,
    userId?: string
  ): Promise<{ page: PageRow; revision: PageRevisionRow } | null> {
    const page = this.pages.get(pageId);
    if (!page) return null;

    // RLS simulation: draft is private to creator unless unauthenticated local dev
    if (page.status === "draft" && userId && page.created_by && page.created_by !== userId) {
      return null;
    }

    const currentRevId = `rev-${pageId}-${page.current_revision}`;
    const revision = this.pageRevisions.get(currentRevId);
    if (!revision) return null;

    return { page, revision };
  }

  async listDrafts(userId?: string): Promise<Array<{ page: PageRow; revision: PageRevisionRow }>> {
    const result: Array<{ page: PageRow; revision: PageRevisionRow }> = [];

    for (const page of this.pages.values()) {
      if (page.status !== "draft") continue;

      // Filter by user if specified
      if (userId && page.created_by && page.created_by !== userId) {
        continue;
      }

      const revId = `rev-${page.id}-${page.current_revision}`;
      const revision = this.pageRevisions.get(revId);
      if (revision) {
        result.push({ page, revision });
      }
    }

    result.sort(
      (a, b) => new Date(b.page.updated_at).getTime() - new Date(a.page.updated_at).getTime()
    );
    return result;
  }

  async deleteDraft(pageId: string, userId?: string): Promise<boolean> {
    const page = this.pages.get(pageId);
    if (!page) return false;

    if (userId && page.created_by && page.created_by !== userId) {
      throw new Error("UNAUTHORIZED: Cannot delete draft owned by another publisher.");
    }

    this.pages.delete(pageId);
    for (const [revId, rev] of this.pageRevisions.entries()) {
      if (rev.page_id === pageId) {
        this.pageRevisions.delete(revId);
      }
    }
    return true;
  }

  async publishPage(
    pageId: string,
    reviewerId?: string
  ): Promise<{ page: PageRow; revision: PageRevisionRow }> {
    const page = this.pages.get(pageId);
    if (!page) {
      throw new Error(`PAGE_NOT_FOUND: Page ${pageId} does not exist`);
    }

    // Check unique constraint for published page_number
    for (const existingPage of this.pages.values()) {
      if (
        existingPage.id !== pageId &&
        existingPage.status === "published" &&
        existingPage.page_number === page.page_number
      ) {
        throw new Error(
          `DUPLICATE_PAGE_NUMBER: Page ${page.page_number} is already published. Choose a different number or unpublish the existing page.`
        );
      }
    }

    const currentRevId = `rev-${pageId}-${page.current_revision}`;
    const revision = this.pageRevisions.get(currentRevId);
    if (!revision) {
      throw new Error(`REVISION_NOT_FOUND: Revision missing for page ${pageId}`);
    }

    // Verify budget
    const budget = measurePagePack(revision.page_pack_json);
    if (budget.isOverBudget) {
      throw new Error(
        `PAGE_OVER_BUDGET: Cannot publish over-budget pack (${budget.bytesUsed} > 10240 bytes)`
      );
    }

    const now = new Date().toISOString();
    const updatedPage: PageRow = {
      ...page,
      status: "published",
      updated_at: now,
    };

    const updatedRevision: PageRevisionRow = {
      ...revision,
      reviewed_by: reviewerId || page.created_by || "anonymous-publisher",
      reviewed_at: now,
    };

    this.pages.set(pageId, updatedPage);
    this.pageRevisions.set(currentRevId, updatedRevision);

    // Audit log
    const auditId = `audit-${Date.now()}`;
    this.auditLogs.set(auditId, {
      id: auditId,
      actor_id: reviewerId || null,
      action: "publish_page",
      resource_id: pageId,
      details: {
        pageNumber: page.page_number,
        payloadBytes: budget.bytesUsed,
      },
      created_at: now,
    });

    return { page: updatedPage, revision: updatedRevision };
  }

  async getPageByNumber(
    pageNumber: number
  ): Promise<{ page: PageRow; revision: PageRevisionRow } | null> {
    for (const page of this.pages.values()) {
      if (page.page_number === pageNumber && page.status === "published") {
        const revId = `rev-${page.id}-${page.current_revision}`;
        const revision = this.pageRevisions.get(revId);
        if (revision) {
          return { page, revision };
        }
      }
    }
    return null;
  }

  async getCatalog(): Promise<CatalogItem[]> {
    const items: CatalogItem[] = [];

    for (const page of this.pages.values()) {
      if (page.status !== "published") continue;

      const revId = `rev-${page.id}-${page.current_revision}`;
      const revision = this.pageRevisions.get(revId);
      if (!revision) continue;

      items.push({
        pageNumber: page.page_number,
        slug: page.slug,
        title:
          revision.page_pack_json.title ||
          revision.page_pack_json.pages?.[0]?.title ||
          `Page ${page.page_number}`,
        language: page.language,
        magazineNumber: getMagazineNumber(page.page_number),
        publishedAt: revision.reviewed_at || page.updated_at,
        revision: revision.revision,
      });
    }

    items.sort((a, b) => a.pageNumber - b.pageNumber);
    return items;
  }

  async getMagazines(): Promise<MagazineRow[]> {
    return Array.from(this.magazines.values()).sort((a, b) => a.id - b.id);
  }
}
