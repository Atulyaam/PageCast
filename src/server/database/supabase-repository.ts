/**
 * Supabase Persistence Repository Implementation (TASK-S3-03)
 *
 * Implements IPersistenceRepository via the Supabase client when configured.
 */

import type { ExtractedSource } from "@/domain/source-provenance/types";
import { measurePagePack } from "@/domain/page-pack/codec";
import { isValidPageNumber, getMagazineNumber } from "@/domain/validation/page-number";
import { getSupabaseServerClient } from "./client";
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
} from "./schema-contracts";

export class SupabasePersistenceRepository implements IPersistenceRepository {
  private get client() {
    return getSupabaseServerClient();
  }

  async saveSource(source: ExtractedSource, userId?: string): Promise<SourceRow> {
    const { data: sourceRow, error: sourceErr } = await this.client
      .from("sources")
      .insert({
        canonical_url: source.url || null,
        title: source.title,
        publisher: source.siteName || null,
        published_at: source.publishedTime || null,
        fetched_at: source.fetchedAt,
        content_hash: source.content ? String(source.content.length) : "hash",
        language: source.language || "en",
        created_by: userId || null,
      })
      .select()
      .single();

    if (sourceErr || !sourceRow) {
      throw new Error(`Failed to save source: ${sourceErr?.message}`);
    }

    if (source.sentences.length > 0) {
      const sentenceInserts = source.sentences.map((s) => ({
        source_id: sourceRow.id,
        sentence_index: s.index,
        sentence_hash: s.hash,
        sentence_text: s.text,
      }));

      const { error: sentErr } = await this.client.from("source_sentences").insert(sentenceInserts);

      if (sentErr) {
        throw new Error(`Failed to save source sentences: ${sentErr.message}`);
      }
    }

    return sourceRow as SourceRow;
  }

  async getSource(
    id: string
  ): Promise<{ source: SourceRow; sentences: SourceSentenceRow[] } | null> {
    const { data: source, error: sourceErr } = await this.client
      .from("sources")
      .select("*")
      .eq("id", id)
      .single();

    if (sourceErr || !source) return null;

    const { data: sentences, error: sentErr } = await this.client
      .from("source_sentences")
      .select("*")
      .eq("source_id", id)
      .order("sentence_index", { ascending: true });

    if (sentErr) return null;

    return {
      source: source as SourceRow,
      sentences: (sentences || []) as SourceSentenceRow[],
    };
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

    const { data: page, error: pageErr } = await this.client
      .from("pages")
      .insert({
        page_number: input.pageNumber,
        slug: input.slug,
        language: input.language,
        status: "draft",
        current_revision: 1,
        created_by: input.userId || null,
      })
      .select()
      .single();

    if (pageErr || !page) {
      throw new Error(`Failed to create page draft: ${pageErr?.message}`);
    }

    const { data: revision, error: revErr } = await this.client
      .from("page_revisions")
      .insert({
        page_id: page.id,
        revision: 1,
        page_pack_json: input.pack,
        payload_bytes: budget.bytesUsed,
        renderer_version: "1.0.0",
      })
      .select()
      .single();

    if (revErr || !revision) {
      throw new Error(`Failed to create page revision: ${revErr?.message}`);
    }

    if (input.sourceId) {
      await this.client.from("page_sources").insert({
        page_revision_id: revision.id,
        source_id: input.sourceId,
      });
    }

    return { page: page as PageRow, revision: revision as PageRevisionRow };
  }

  async updateDraft(
    pageId: string,
    input: UpdateDraftInput,
    userId?: string
  ): Promise<{ page: PageRow; revision: PageRevisionRow }> {
    const { data: page, error: pageErr } = await this.client
      .from("pages")
      .select("*")
      .eq("id", pageId)
      .single();

    if (pageErr || !page) {
      throw new Error(`DRAFT_NOT_FOUND: No draft found with ID ${pageId}`);
    }

    if (page.status !== "draft") {
      throw new Error(`CANNOT_EDIT_PUBLISHED: Page ${page.page_number} is already published.`);
    }

    if (userId && page.created_by && page.created_by !== userId) {
      throw new Error("UNAUTHORIZED: Cannot edit draft owned by another publisher.");
    }

    const pageUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.pageNumber !== undefined) pageUpdates.page_number = input.pageNumber;
    if (input.slug !== undefined) pageUpdates.slug = input.slug;
    if (input.language !== undefined) pageUpdates.language = input.language;

    const { data: updatedPage, error: updatePageErr } = await this.client
      .from("pages")
      .update(pageUpdates)
      .eq("id", pageId)
      .select()
      .single();

    if (updatePageErr || !updatedPage) {
      throw new Error(`Failed to update page: ${updatePageErr?.message}`);
    }

    let revision: PageRevisionRow | null = null;
    if (input.pack) {
      const budget = measurePagePack(input.pack);
      if (budget.isOverBudget) {
        throw new Error(
          `PAGE_OVER_BUDGET: Draft payload exceeds budget (${budget.bytesUsed} > 10240 bytes)`
        );
      }

      const { data: updatedRev, error: revErr } = await this.client
        .from("page_revisions")
        .update({
          page_pack_json: input.pack,
          payload_bytes: budget.bytesUsed,
          renderer_version: "1.0.0",
        })
        .eq("page_id", pageId)
        .eq("revision", page.current_revision)
        .select()
        .single();

      if (revErr || !updatedRev) {
        throw new Error(`Failed to update revision: ${revErr?.message}`);
      }
      revision = updatedRev as PageRevisionRow;
    } else {
      const { data: currentRev } = await this.client
        .from("page_revisions")
        .select("*")
        .eq("page_id", pageId)
        .eq("revision", page.current_revision)
        .single();
      revision = currentRev as PageRevisionRow;
    }

    return { page: updatedPage as PageRow, revision: revision as PageRevisionRow };
  }

  async getDraft(
    pageId: string,
    userId?: string
  ): Promise<{ page: PageRow; revision: PageRevisionRow } | null> {
    const { data: page, error: pageErr } = await this.client
      .from("pages")
      .select("*")
      .eq("id", pageId)
      .single();

    if (pageErr || !page) return null;

    if (page.status === "draft" && userId && page.created_by && page.created_by !== userId) {
      return null;
    }

    const { data: revision, error: revErr } = await this.client
      .from("page_revisions")
      .select("*")
      .eq("page_id", pageId)
      .eq("revision", page.current_revision)
      .single();

    if (revErr || !revision) return null;

    return { page: page as PageRow, revision: revision as PageRevisionRow };
  }

  async listDrafts(userId?: string): Promise<Array<{ page: PageRow; revision: PageRevisionRow }>> {
    let query = this.client
      .from("pages")
      .select("*, page_revisions(*)")
      .eq("status", "draft")
      .order("updated_at", { ascending: false });

    if (userId) {
      query = query.eq("created_by", userId);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data
      .filter((row: any) => row.page_revisions && row.page_revisions.length > 0)
      .map((row: any) => ({
        page: {
          id: row.id,
          page_number: row.page_number,
          slug: row.slug,
          language: row.language,
          status: row.status,
          current_revision: row.current_revision,
          created_by: row.created_by,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
        revision: row.page_revisions[0] as PageRevisionRow,
      }));
  }

  async deleteDraft(pageId: string, userId?: string): Promise<boolean> {
    let query = this.client.from("pages").delete().eq("id", pageId);
    if (userId) {
      query = query.eq("created_by", userId);
    }
    const { error } = await query;
    return !error;
  }

  async publishPage(
    pageId: string,
    reviewerId?: string
  ): Promise<{ page: PageRow; revision: PageRevisionRow }> {
    const { data: page, error: pageErr } = await this.client
      .from("pages")
      .select("*, page_revisions(*)")
      .eq("id", pageId)
      .single();

    if (pageErr || !page) {
      throw new Error(`PAGE_NOT_FOUND: Page ${pageId} does not exist`);
    }

    const currentRev = (page.page_revisions || []).find(
      (r: any) => r.revision === page.current_revision
    );
    if (!currentRev) {
      throw new Error(`REVISION_NOT_FOUND: Revision missing for page ${pageId}`);
    }

    const budget = measurePagePack(currentRev.page_pack_json);
    if (budget.isOverBudget) {
      throw new Error(
        `PAGE_OVER_BUDGET: Cannot publish over-budget pack (${budget.bytesUsed} > 10240 bytes)`
      );
    }

    const now = new Date().toISOString();
    const { data: updatedPage, error: updateErr } = await this.client
      .from("pages")
      .update({
        status: "published",
        updated_at: now,
      })
      .eq("id", pageId)
      .select()
      .single();

    if (updateErr || !updatedPage) {
      throw new Error(`Failed to publish page: ${updateErr?.message}`);
    }

    const { data: updatedRev, error: revErr } = await this.client
      .from("page_revisions")
      .update({
        reviewed_by: reviewerId || null,
        reviewed_at: now,
      })
      .eq("id", currentRev.id)
      .select()
      .single();

    if (revErr || !updatedRev) {
      throw new Error(`Failed to update revision reviewed state: ${revErr?.message}`);
    }

    return { page: updatedPage as PageRow, revision: updatedRev as PageRevisionRow };
  }

  async getPageByNumber(
    pageNumber: number
  ): Promise<{ page: PageRow; revision: PageRevisionRow } | null> {
    const { data: page, error: pageErr } = await this.client
      .from("pages")
      .select("*, page_revisions(*)")
      .eq("page_number", pageNumber)
      .eq("status", "published")
      .single();

    if (pageErr || !page) return null;

    const revision = (page.page_revisions || []).find(
      (r: any) => r.revision === page.current_revision
    );
    if (!revision) return null;

    return {
      page: {
        id: page.id,
        page_number: page.page_number,
        slug: page.slug,
        language: page.language,
        status: page.status,
        current_revision: page.current_revision,
        created_by: page.created_by,
        created_at: page.created_at,
        updated_at: page.updated_at,
      },
      revision: revision as PageRevisionRow,
    };
  }

  async getCatalog(): Promise<CatalogItem[]> {
    const { data, error } = await this.client
      .from("pages")
      .select(
        "page_number, slug, language, status, updated_at, page_revisions(revision, reviewed_at, page_pack_json)"
      )
      .eq("status", "published")
      .order("page_number", { ascending: true });

    if (error || !data) return [];

    return data
      .filter((row: any) => row.page_revisions && row.page_revisions.length > 0)
      .map((row: any) => {
        const rev = row.page_revisions[0];
        return {
          pageNumber: row.page_number,
          slug: row.slug,
          title: rev?.page_pack_json?.page?.title || `Page ${row.page_number}`,
          language: row.language,
          magazineNumber: getMagazineNumber(row.page_number),
          publishedAt: rev?.reviewed_at || row.updated_at,
          revision: rev?.revision || 1,
        };
      });
  }

  async getMagazines(): Promise<MagazineRow[]> {
    const { data, error } = await this.client
      .from("magazines")
      .select("*")
      .order("id", { ascending: true });

    if (error || !data) return [];
    return data as MagazineRow[];
  }
}
