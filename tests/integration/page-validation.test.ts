import { describe, it, expect } from "vitest";
import { POST as validatePost } from "@/app/api/v1/pages/validate/route";
import { SEED_PAGE_PACK } from "@/data/seed-pages";
import type { BulletinDraft, ExtractedSource } from "@/domain/source-provenance/types";
import type { PagePackV1 } from "@/domain/page-pack/types";

describe("Page Validation Server Endpoint Integration (TASK-S3-06)", () => {
  const mockSource: ExtractedSource = {
    id: "src-val-1",
    url: "https://example.com/item",
    title: "Validation Test Source",
    content: "Validating content sentence one.",
    siteName: "News Wire",
    publishedTime: "2026-10-31T12:00:00Z",
    language: "en",
    fetchedAt: "2026-10-31T12:01:00Z",
    sentences: [{ id: "s0", index: 0, text: "Validating content sentence one.", hash: "h0" }],
  };

  const mockDraft: BulletinDraft = {
    sourceId: "src-val-1",
    pageNumber: 250,
    language: "en",
    title: "VALIDATION PASS BULLETIN",
    summary: "Checking that all validation invariants pass cleanly.",
    sections: [
      {
        heading: "CRITICAL CHECKS",
        points: [
          {
            text: "All points verified.",
            sourceSentenceIds: ["s0"],
          },
        ],
      },
    ],
    metadata: {
      provider: "mock-ai",
      model: "test-model",
      promptVersion: "1.0",
      generatedAt: "2026-10-31T12:02:00Z",
    },
  };

  it("validates a compliant PagePack successfully", async () => {
    const req = new Request("http://localhost:3000/api/v1/pages/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pack: SEED_PAGE_PACK }),
    });

    const res = await validatePost(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.errors).toHaveLength(0);
    expect(data.budget.isOverBudget).toBe(false);
    expect(data.pagesValidated).toBe(2);
  });

  it("validates a compliant BulletinDraft successfully", async () => {
    const req = new Request("http://localhost:3000/api/v1/pages/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draft: mockDraft,
        pageNumber: 250,
        source: mockSource,
      }),
    });

    const res = await validatePost(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.errors).toHaveLength(0);
    expect(data.primaryPageNumber).toBe(250);
  });

  it("rejects an over-budget pack exceeding 10,240 bytes", async () => {
    const oversizedPack: PagePackV1 = {
      ...SEED_PAGE_PACK,
      metadata: {
        ...SEED_PAGE_PACK.metadata,
        sourceName: "A".repeat(11000), // Exceeds 10 KiB ceiling
      },
    };

    const req = new Request("http://localhost:3000/api/v1/pages/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pack: oversizedPack }),
    });

    const res = await validatePost(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.errors.some((e: string) => e.includes("exceeds strict 10 KiB ceiling"))).toBe(true);
  });

  it("rejects invalid page numbers outside 100-899", async () => {
    const invalidPageNumPack: PagePackV1 = {
      ...SEED_PAGE_PACK,
      primaryPageNumber: 950, // Out of range
    };

    const req = new Request("http://localhost:3000/api/v1/pages/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pack: invalidPageNumPack }),
    });

    const res = await validatePost(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.details.some((e: string) => e.includes("primaryPageNumber"))).toBe(true);
  });
});
