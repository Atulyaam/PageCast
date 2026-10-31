import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/api/v1/pages/[pageNumber]/route";
import { fetchPublishedPage } from "@/lib/reader/reader-client";
import { getPersistenceRepository, resetPersistenceRepositoryForTesting } from "@/server/database";
import { layoutBulletinPage } from "@/domain/layout-engine/layout";
import type { PagePackV1 } from "@/domain/page-pack/types";

describe("Reader Published Page Retrieval API (TASK-S4-01)", () => {
  const repository = getPersistenceRepository();

  beforeEach(() => {
    resetPersistenceRepositoryForTesting();
  });

  it("retrieves published page 100 with canonical metadata and caching headers", async () => {
    const request = new Request("http://localhost:3000/api/v1/pages/100");
    const response = await GET(request, {
      params: Promise.resolve({ pageNumber: "100" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("public, max-age=60");

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.page.page_number).toBe(100);
    expect(json.data.page.status).toBe("published");
    expect(json.data.pack.primaryPageNumber).toBe(100);
    expect(json.data.pack.pages.length).toBeGreaterThanOrEqual(1);
  });

  it("strictly isolates unpublished drafts from anonymous reader access (returns 404)", async () => {
    // Create an explicit draft at page 299
    const draftPage = layoutBulletinPage({
      pageNumber: 299,
      title: "Secret In-Progress Article",
      paragraphs: ["Draft paragraphs that must remain private."],
      fastext: { red: 100, green: 200, yellow: 300, cyan: 400 },
    });

    const draftPack: PagePackV1 = {
      id: "b2c3d4e5-f6a1-4b2c-8d3e-4f5a6b7c8d9e",
      version: 1,
      slug: "secret-draft",
      title: "Secret In-Progress Article",
      magazine: 2,
      primaryPageNumber: 299,
      createdAt: new Date().toISOString(),
      metadata: {
        sourceName: "Confidential Source",
        language: "en",
        aiAssisted: false,
        publisherId: "publisher-secret",
      },
      pages: [draftPage],
    };

    await repository.createDraft({
      pageNumber: 299,
      slug: "secret-draft",
      language: "en",
      draft: {
        sourceId: "src-secret",
        pageNumber: 299,
        title: "Secret In-Progress Article",
        summary: "Top secret draft",
        sections: [
          {
            heading: "CONFIDENTIAL",
            points: [{ text: "Private notes", sourceSentenceIds: ["s0"] }],
          },
        ],
        language: "en",
        metadata: {
          provider: "manual",
          model: "editor",
          promptVersion: "1.0",
          generatedAt: new Date().toISOString(),
        },
      },
      pack: draftPack,
      userId: "publisher-secret",
    });

    // Public reader requests page 299
    const request = new Request("http://localhost:3000/api/v1/pages/299");
    const response = await GET(request, {
      params: Promise.resolve({ pageNumber: "299" }),
    });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe("PAGE_NOT_FOUND");
    expect(json.message).toContain("not published");
  });

  it("returns 404 for non-existent page numbers", async () => {
    const request = new Request("http://localhost:3000/api/v1/pages/789");
    const response = await GET(request, {
      params: Promise.resolve({ pageNumber: "789" }),
    });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe("PAGE_NOT_FOUND");
  });

  it("returns 400 for out-of-bounds or non-numeric page numbers", async () => {
    const req1 = await GET(new Request("http://localhost:3000/api/v1/pages/99"), {
      params: Promise.resolve({ pageNumber: "99" }),
    });
    expect(req1.status).toBe(400);

    const req2 = await GET(new Request("http://localhost:3000/api/v1/pages/900"), {
      params: Promise.resolve({ pageNumber: "900" }),
    });
    expect(req2.status).toBe(400);

    const req3 = await GET(new Request("http://localhost:3000/api/v1/pages/foo"), {
      params: Promise.resolve({ pageNumber: "foo" }),
    });
    expect(req3.status).toBe(400);
  });

  describe("fetchPublishedPage client helper", () => {
    it("successfully fetches published page 100 via mock fetch", async () => {
      const mockFetch = async () => {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              page: { page_number: 100, status: "published" },
              pack: { primaryPageNumber: 100, pages: [] },
              subPageCount: 1,
              publishedAt: new Date().toISOString(),
            },
          }),
          { status: 200 }
        );
      };

      const result = await fetchPublishedPage(100, mockFetch as any);
      expect(result.success).toBe(true);
      expect(result.data?.page.page_number).toBe(100);
    });

    it("falls back to seed page on 404 when seed page exists", async () => {
      const mockFetch = async () => {
        return new Response(JSON.stringify({ error: "PAGE_NOT_FOUND" }), { status: 404 });
      };

      const result = await fetchPublishedPage(101, mockFetch as any);
      expect(result.success).toBe(true);
      expect(result.data?.isFallback).toBe(true);
      expect(result.data?.page.page_number).toBe(101);
    });

    it("returns notFound when non-existent page has no seed fallback", async () => {
      const mockFetch = async () => {
        return new Response(JSON.stringify({ error: "PAGE_NOT_FOUND" }), { status: 404 });
      };

      const result = await fetchPublishedPage(777, mockFetch as any);
      expect(result.success).toBe(false);
      expect(result.notFound).toBe(true);
    });

    it("rejects invalid page numbers before making network requests", async () => {
      const result = await fetchPublishedPage(50);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid page number");
    });
  });
});
