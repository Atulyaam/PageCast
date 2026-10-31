import { describe, it, expect } from "vitest";
import { POST as createDraftPost, GET as listDraftsGet } from "@/app/api/v1/drafts/route";
import { GET as getDraftGet, PATCH as updateDraftPatch } from "@/app/api/v1/drafts/[id]/route";
import { POST as validatePost } from "@/app/api/v1/pages/validate/route";
import { POST as publishPost } from "@/app/api/v1/pages/publish/route";
import { GET as downloadPackGet } from "@/app/api/v1/pages/[pageNumber]/pack/route";
import { layoutBulletinPage } from "@/domain/layout-engine/layout";
import { getPersistenceRepository } from "@/server/database";
import type { PagePackV1 } from "@/domain/page-pack/types";

describe("Publisher Studio End-to-End Workflow Integration", () => {
  const repository = getPersistenceRepository();
  const testPageNumber = 350;

  const initialPage = layoutBulletinPage({
    pageNumber: testPageNumber,
    title: "Cyclone Advisory",
    headline: "Severe Weather Front Approaching",
    paragraphs: [
      "Meteorological bureau warns of gale force winds across coastal districts.",
      "Residents advised to secure loose objects and observe emergency broadcast alerts.",
    ],
    fastext: { red: 100, green: 351, yellow: 200, cyan: 800 },
  });

  const initialPack: PagePackV1 = {
    id: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d",
    version: 1,
    slug: "cyclone-advisory",
    title: "Cyclone Advisory",
    magazine: 3,
    primaryPageNumber: testPageNumber,
    createdAt: new Date().toISOString(),
    metadata: {
      sourceName: "National Weather Service",
      originalUrl: "https://weather.gov/bulletin-350",
      language: "en",
      aiAssisted: true,
      publisherId: "test-publisher-01",
    },
    pages: [initialPage],
  };

  let createdDraftId: string;

  it("Step 1: Ingests & persists a new bulletin draft", async () => {
    const draftBody = {
      pageNumber: testPageNumber,
      slug: "cyclone-advisory",
      language: "en",
      draft: {
        sourceId: "src-weather-1",
        pageNumber: testPageNumber,
        title: "Cyclone Advisory",
        summary: "Severe weather alert",
        sections: [
          {
            heading: "ADVISORY",
            points: [
              {
                text: "Residents advised to seek shelter.",
                sourceSentenceIds: ["s0"],
              },
            ],
          },
        ],
        language: "en",
        metadata: {
          provider: "gemini",
          model: "gemini-2.5-pro",
          promptVersion: "1.0.0",
          generatedAt: new Date().toISOString(),
        },
      },
      pack: initialPack,
      userId: "test-publisher-01",
    };

    const request = new Request("http://localhost:3000/api/v1/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftBody),
    });

    const response = await createDraftPost(request);
    expect(response.status).toBe(201);

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.page.id).toBeDefined();
    expect(result.data.page.page_number).toBe(testPageNumber);
    expect(result.data.page.status).toBe("draft");

    createdDraftId = result.data.page.id;
  });

  it("Step 2: Retrieves draft for studio editor", async () => {
    const request = new Request(`http://localhost:3000/api/v1/drafts/${createdDraftId}`);
    const response = await getDraftGet(request, {
      params: Promise.resolve({ id: createdDraftId }),
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.page.id).toBe(createdDraftId);
    expect(result.data.revision.page_pack_json.title).toBe("Cyclone Advisory");
  });

  it("Step 3: Saves draft edits made via 40x25 Teletext editor", async () => {
    const updatedPage = layoutBulletinPage({
      pageNumber: testPageNumber,
      title: "Updated Cyclone Advisory",
      headline: "Category 3 Cyclone Intensifies",
      paragraphs: ["Evacuation shelters are open in sector 4."],
      fastext: { red: 100, green: 351, yellow: 200, cyan: 800 },
    });

    const updatedPack: PagePackV1 = {
      ...initialPack,
      title: "Updated Cyclone Advisory",
      pages: [updatedPage],
    };

    const request = new Request(`http://localhost:3000/api/v1/drafts/${createdDraftId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pack: updatedPack,
      }),
    });

    const response = await updateDraftPatch(request, {
      params: Promise.resolve({ id: createdDraftId }),
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.revision.page_pack_json.title).toBe("Updated Cyclone Advisory");
  });

  it("Step 4: Pre-flight validation gate passes candidate payload", async () => {
    const candidatePack: PagePackV1 = {
      ...initialPack,
      title: "Updated Cyclone Advisory",
    };

    const request = new Request("http://localhost:3000/api/v1/pages/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pack: candidatePack }),
    });

    const response = await validatePost(request);
    expect(response.status).toBe(200);

    const result = await response.json();
    expect(result.valid).toBe(true);
    expect(result.budget.bytesUsed).toBeLessThanOrEqual(10240);
  });

  it("Step 5: Publishes bulletin through human review gate", async () => {
    const publishBody = {
      draftId: createdDraftId,
      pack: {
        ...initialPack,
        title: "Updated Cyclone Advisory",
      },
      reviewedAt: new Date().toISOString(),
      reviewerId: "editor-in-chief",
    };

    const request = new Request("http://localhost:3000/api/v1/pages/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(publishBody),
    });

    const response = await publishPost(request);
    expect(response.status).toBe(201);

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.page.pageNumber).toBe(testPageNumber);
    expect(result.page.publishedAt).toBeDefined();

    // Verify repository status
    const verified = await repository.getPageByNumber(testPageNumber);
    expect(verified).not.toBeNull();
    expect(verified?.page.status).toBe("published");
  });

  it("Step 6: Downloads canonical PagePack JSON from public distribution endpoint", async () => {
    const request = new Request(`http://localhost:3000/api/v1/pages/${testPageNumber}/pack`);
    const response = await downloadPackGet(request, {
      params: Promise.resolve({ pageNumber: String(testPageNumber) }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");

    const jsonText = await response.text();
    const downloadedPack = JSON.parse(jsonText);

    expect(downloadedPack.version).toBe(1);
    expect(downloadedPack.primaryPageNumber).toBe(testPageNumber);
    expect(downloadedPack.pages).toHaveLength(1);
  });
});
