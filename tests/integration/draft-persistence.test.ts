import { describe, it, expect, beforeEach } from "vitest";
import { POST as createDraftPost, GET as listDraftsGet } from "@/app/api/v1/drafts/route";
import {
  GET as getDraftGet,
  PATCH as updateDraftPatch,
  DELETE as deleteDraftDelete,
} from "@/app/api/v1/drafts/[id]/route";
import { GET as getSourceGet } from "@/app/api/v1/sources/route";
import { resetPersistenceRepositoryForTesting } from "@/server/database";
import type { ExtractedSource, BulletinDraft } from "@/domain/source-provenance/types";

describe("Publisher Drafts & Saved Sources API Integration (TASK-S3-04)", () => {
  beforeEach(() => {
    resetPersistenceRepositoryForTesting();
  });

  const mockSource: ExtractedSource = {
    id: "src-int-100",
    url: "https://news.example.com/teletext-revival",
    title: "Teletext Returns in 2026",
    content:
      "Teletext has returned as a resilient low-bandwidth standard. Millions of users save data.",
    siteName: "Tech News Daily",
    publishedTime: "2026-10-31T09:00:00Z",
    language: "en",
    fetchedAt: "2026-10-31T09:05:00Z",
    sentences: [
      {
        id: "s0",
        index: 0,
        text: "Teletext has returned as a resilient low-bandwidth standard.",
        hash: "h0",
      },
      { id: "s1", index: 1, text: "Millions of users save data.", hash: "h1" },
    ],
  };

  const mockDraft: BulletinDraft = {
    sourceId: "src-int-100",
    pageNumber: 215,
    language: "en",
    title: "TELETEXT REVIVAL 2026",
    summary: "Teletext returns as an offline-first low-bandwidth standard.",
    sections: [
      {
        heading: "KEY DEVELOPMENTS",
        points: [
          {
            text: "Delivers full bulletins under 10 KiB.",
            sourceSentenceIds: ["s0"],
          },
        ],
      },
    ],
    metadata: {
      provider: "mock-ai",
      model: "test-model",
      promptVersion: "1.0",
      generatedAt: "2026-10-31T09:06:00Z",
    },
  };

  it("creates a draft, saves the source, and retrieves the draft by ID", async () => {
    // 1. Create Draft
    const postReq = new Request("http://localhost:3000/api/v1/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageNumber: 215,
        language: "en",
        draft: mockDraft,
        source: mockSource,
        userId: "pub-user-alpha",
      }),
    });

    const postRes = await createDraftPost(postReq);
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    expect(postData.success).toBe(true);
    expect(postData.data.page.page_number).toBe(215);

    const draftId = postData.data.page.id;

    // 2. Retrieve Draft by ID
    const getReq = new Request(
      `http://localhost:3000/api/v1/drafts/${draftId}?userId=pub-user-alpha`
    );
    const getRes = await getDraftGet(getReq, { params: Promise.resolve({ id: draftId }) });
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.data.page.id).toBe(draftId);
    expect(getData.data.page.status).toBe("draft");

    // 3. Verify Source was saved
    const sourceReq = new Request(`http://localhost:3000/api/v1/sources?id=src-int-100`);
    const sourceRes = await getSourceGet(sourceReq);
    expect(sourceRes.status).toBe(200);
    const sourceData = await sourceRes.json();
    expect(sourceData.data.source.title).toBe("Teletext Returns in 2026");
    expect(sourceData.data.sentences.length).toBe(2);
  });

  it("lists drafts created by the publisher", async () => {
    // Create draft
    const postReq = new Request("http://localhost:3000/api/v1/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageNumber: 220,
        language: "en",
        draft: { ...mockDraft, pageNumber: 220 },
        userId: "pub-user-beta",
      }),
    });
    await createDraftPost(postReq);

    // List drafts
    const listReq = new Request("http://localhost:3000/api/v1/drafts?userId=pub-user-beta");
    const listRes = await listDraftsGet(listReq);
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.count).toBeGreaterThanOrEqual(1);
    expect(listData.data.some((d: any) => d.page.page_number === 220)).toBe(true);
  });

  it("updates an existing draft", async () => {
    // Create draft
    const postReq = new Request("http://localhost:3000/api/v1/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageNumber: 225,
        language: "en",
        draft: { ...mockDraft, pageNumber: 225 },
        userId: "pub-user-gamma",
      }),
    });
    const postRes = await createDraftPost(postReq);
    const { data } = await postRes.json();
    const draftId = data.page.id;

    // Update draft page number to 226
    const patchReq = new Request(`http://localhost:3000/api/v1/drafts/${draftId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageNumber: 226,
        slug: "updated-teletext-draft",
        userId: "pub-user-gamma",
      }),
    });

    const patchRes = await updateDraftPatch(patchReq, { params: Promise.resolve({ id: draftId }) });
    expect(patchRes.status).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.data.page.page_number).toBe(226);
    expect(patchData.data.page.slug).toBe("updated-teletext-draft");
  });

  it("deletes a draft", async () => {
    // Create draft
    const postReq = new Request("http://localhost:3000/api/v1/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageNumber: 230,
        language: "en",
        draft: { ...mockDraft, pageNumber: 230 },
        userId: "pub-user-delta",
      }),
    });
    const postRes = await createDraftPost(postReq);
    const { data } = await postRes.json();
    const draftId = data.page.id;

    // Delete
    const delReq = new Request(
      `http://localhost:3000/api/v1/drafts/${draftId}?userId=pub-user-delta`,
      {
        method: "DELETE",
      }
    );
    const delRes = await deleteDraftDelete(delReq, { params: Promise.resolve({ id: draftId }) });
    expect(delRes.status).toBe(200);

    // Verify 404 after delete
    const getReq = new Request(
      `http://localhost:3000/api/v1/drafts/${draftId}?userId=pub-user-delta`
    );
    const getRes = await getDraftGet(getReq, { params: Promise.resolve({ id: draftId }) });
    expect(getRes.status).toBe(404);
  });

  it("rejects invalid page numbers outside 100-899", async () => {
    const postReq = new Request("http://localhost:3000/api/v1/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageNumber: 999, // out of range
        draft: mockDraft,
      }),
    });

    const postRes = await createDraftPost(postReq);
    expect(postRes.status).toBe(400);
    const data = await postRes.json();
    expect(data.error).toBe("INVALID_REQUEST");
  });
});
