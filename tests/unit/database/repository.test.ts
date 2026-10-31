import { describe, it, expect, beforeEach } from "vitest";
import { MemoryPersistenceRepository } from "@/server/database/memory-repository";
import type { ExtractedSource, BulletinDraft } from "@/domain/source-provenance/types";
import { convertDraftToPagePack } from "@/server/conversion/bulletin-to-pagepack";

describe("Persistence Repository Layer (TASK-S3-03)", () => {
  let repo: MemoryPersistenceRepository;

  const mockSource: ExtractedSource = {
    id: "src-test-01",
    url: "https://example.com/article",
    title: "Test Ingested Article",
    content: "First sentence here. Second sentence follows.",
    siteName: "Example News",
    publishedTime: "2026-10-31T12:00:00Z",
    language: "en",
    fetchedAt: "2026-10-31T12:05:00Z",
    sentences: [
      { id: "s0", index: 0, text: "First sentence here.", hash: "s0hash" },
      { id: "s1", index: 1, text: "Second sentence follows.", hash: "s1hash" },
    ],
  };

  const mockDraft: BulletinDraft = {
    sourceId: "src-test-01",
    language: "en",
    pageNumber: 205,
    title: "TEST BULLETIN",
    summary: "Brief summary of the bulletin content.",
    sections: [
      {
        heading: "HIGHLIGHTS",
        points: [
          {
            text: "Important point one.",
            sourceSentenceIds: ["s0"],
          },
        ],
      },
    ],
    metadata: {
      provider: "mock-ai",
      model: "test-model",
      promptVersion: "1.0",
      generatedAt: "2026-10-31T12:06:00Z",
    },
  };

  beforeEach(() => {
    repo = new MemoryPersistenceRepository();
  });

  describe("Source Persistence", () => {
    it("saves and retrieves source with granular sentences", async () => {
      const saved = await repo.saveSource(mockSource, "user-pub-1");
      expect(saved.id).toBe("src-test-01");
      expect(saved.title).toBe("Test Ingested Article");
      expect(saved.created_by).toBe("user-pub-1");

      const retrieved = await repo.getSource("src-test-01");
      expect(retrieved).not.toBeNull();
      expect(retrieved?.source.title).toBe("Test Ingested Article");
      expect(retrieved?.sentences.length).toBe(2);
      expect(retrieved?.sentences[0].sentence_text).toBe("First sentence here.");
    });

    it("returns null for non-existent source ID", async () => {
      const retrieved = await repo.getSource("non-existent-source");
      expect(retrieved).toBeNull();
    });
  });

  describe("Draft Lifecycle & Invariants", () => {
    it("creates, retrieves, and updates a valid draft", async () => {
      const pack = convertDraftToPagePack({ ...mockDraft, pageNumber: 205 }, mockSource).pack;
      const { page, revision } = await repo.createDraft({
        pageNumber: 205,
        slug: "test-bulletin",
        language: "en",
        draft: mockDraft,
        pack,
        userId: "pub-user-123",
        sourceId: mockSource.id,
      });

      expect(page.id).toBeDefined();
      expect(page.page_number).toBe(205);
      expect(page.status).toBe("draft");
      expect(revision.payload_bytes).toBeLessThanOrEqual(10240);

      // Retrieve draft
      const fetched = await repo.getDraft(page.id, "pub-user-123");
      expect(fetched).not.toBeNull();
      expect(fetched?.page.page_number).toBe(205);

      // Update draft
      const updated = await repo.updateDraft(
        page.id,
        {
          pageNumber: 206,
          slug: "test-bulletin-updated",
        },
        "pub-user-123"
      );

      expect(updated.page.page_number).toBe(206);
      expect(updated.page.slug).toBe("test-bulletin-updated");
    });

    it("rejects draft creation with invalid page numbers outside 100-899", async () => {
      const pack = convertDraftToPagePack({ ...mockDraft, pageNumber: 205 }, mockSource).pack;
      await expect(
        repo.createDraft({
          pageNumber: 99,
          slug: "invalid-page",
          language: "en",
          draft: mockDraft,
          pack,
        })
      ).rejects.toThrow(/Invalid page number/);
    });

    it("rejects unauthorized edits from a different user", async () => {
      const pack = convertDraftToPagePack({ ...mockDraft, pageNumber: 205 }, mockSource).pack;
      const { page } = await repo.createDraft({
        pageNumber: 205,
        slug: "test-bulletin",
        language: "en",
        draft: mockDraft,
        pack,
        userId: "owner-user",
      });

      await expect(repo.updateDraft(page.id, { pageNumber: 206 }, "intruder-user")).rejects.toThrow(
        /UNAUTHORIZED/
      );
    });

    it("lists only drafts and allows deletion", async () => {
      const pack = convertDraftToPagePack({ ...mockDraft, pageNumber: 205 }, mockSource).pack;
      const { page } = await repo.createDraft({
        pageNumber: 205,
        slug: "draft-to-delete",
        language: "en",
        draft: mockDraft,
        pack,
        userId: "pub-user-1",
      });

      const drafts = await repo.listDrafts("pub-user-1");
      expect(drafts.some((d) => d.page.id === page.id)).toBe(true);

      const deleted = await repo.deleteDraft(page.id, "pub-user-1");
      expect(deleted).toBe(true);

      const afterDelete = await repo.getDraft(page.id, "pub-user-1");
      expect(afterDelete).toBeNull();
    });
  });

  describe("Publishing & Catalogue Verification", () => {
    it("publishes an approved draft and makes it available in getPageByNumber", async () => {
      const pack = convertDraftToPagePack({ ...mockDraft, pageNumber: 210 }, mockSource).pack;
      const { page } = await repo.createDraft({
        pageNumber: 210,
        slug: "publish-test",
        language: "en",
        draft: mockDraft,
        pack,
        userId: "publisher-alice",
      });

      // Initially not visible to public reader
      expect(await repo.getPageByNumber(210)).toBeNull();

      // Publish draft
      const published = await repo.publishPage(page.id, "reviewer-bob");
      expect(published.page.status).toBe("published");
      expect(published.revision.reviewed_by).toBe("reviewer-bob");
      expect(published.revision.reviewed_at).toBeDefined();

      // Now visible to public reader
      const readerPage = await repo.getPageByNumber(210);
      expect(readerPage).not.toBeNull();
      expect(readerPage?.page.slug).toBe("publish-test");
    });

    it("prevents publishing a page number that is already published", async () => {
      // Page 100 is already seeded as published
      const pack = convertDraftToPagePack({ ...mockDraft, pageNumber: 100 }, mockSource).pack;
      const { page } = await repo.createDraft({
        pageNumber: 100,
        slug: "duplicate-100",
        language: "en",
        draft: mockDraft,
        pack,
      });

      await expect(repo.publishPage(page.id, "reviewer-bob")).rejects.toThrow(
        /DUPLICATE_PAGE_NUMBER/
      );
    });

    it("retrieves the public catalogue containing seed pages", async () => {
      const catalog = await repo.getCatalog();
      expect(catalog.length).toBeGreaterThanOrEqual(5);

      const page100 = catalog.find((c) => c.pageNumber === 100);
      expect(page100).toBeDefined();
      expect(page100?.magazineNumber).toBe(1);

      const page200 = catalog.find((c) => c.pageNumber === 200);
      expect(page200?.magazineNumber).toBe(2);
    });

    it("retrieves all 8 standard Teletext magazines", async () => {
      const magazines = await repo.getMagazines();
      expect(magazines.length).toBe(8);
      expect(magazines[0].id).toBe(1);
      expect(magazines[7].id).toBe(8);
    });
  });
});
