/**
 * Type-Safe Persistence Repository Interface (TASK-S3-03)
 *
 * Defines domain data access contracts for sources, drafts, published PagePacks,
 * and magazine catalogues, completely decoupled from React and HTTP handlers.
 */

import type { ExtractedSource, BulletinDraft } from "@/domain/source-provenance/types";
import type { PagePackV1 } from "@/domain/page-pack/types";
import type {
  PageRow,
  PageRevisionRow,
  SourceRow,
  SourceSentenceRow,
  MagazineRow,
  LanguageCode,
} from "./schema-contracts";

export interface CreateDraftInput {
  pageNumber: number;
  slug: string;
  language: LanguageCode;
  draft: BulletinDraft;
  pack: PagePackV1;
  userId?: string;
  sourceId?: string;
}

export interface UpdateDraftInput {
  pageNumber?: number;
  slug?: string;
  language?: LanguageCode;
  draft?: BulletinDraft;
  pack?: PagePackV1;
  sourceId?: string;
}

export interface CatalogItem {
  pageNumber: number;
  slug: string;
  title: string;
  language: LanguageCode;
  magazineNumber: number;
  publishedAt: string;
  revision: number;
}

export interface IPersistenceRepository {
  // Source Management
  saveSource(source: ExtractedSource, userId?: string): Promise<SourceRow>;
  getSource(id: string): Promise<{ source: SourceRow; sentences: SourceSentenceRow[] } | null>;

  // Draft Management
  createDraft(input: CreateDraftInput): Promise<{ page: PageRow; revision: PageRevisionRow }>;
  updateDraft(
    pageId: string,
    input: UpdateDraftInput,
    userId?: string
  ): Promise<{ page: PageRow; revision: PageRevisionRow }>;
  getDraft(
    pageId: string,
    userId?: string
  ): Promise<{ page: PageRow; revision: PageRevisionRow } | null>;
  listDrafts(userId?: string): Promise<Array<{ page: PageRow; revision: PageRevisionRow }>>;
  deleteDraft(pageId: string, userId?: string): Promise<boolean>;

  // Publishing & Verification Gate
  publishPage(
    pageId: string,
    reviewerId?: string
  ): Promise<{ page: PageRow; revision: PageRevisionRow }>;

  // Public Reader & Catalog
  getPageByNumber(pageNumber: number): Promise<{ page: PageRow; revision: PageRevisionRow } | null>;
  getCatalog(): Promise<CatalogItem[]>;
  getMagazines(): Promise<MagazineRow[]>;
}
