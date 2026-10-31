import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/v1/pages/publish/route";
import { layoutBulletinPage } from "@/domain/layout-engine/layout";
import { getBulletinPublisher } from "@/server/publishing/bulletin-publisher";
import { getPersistenceRepository } from "@/server/database";
import type { PagePackV1 } from "@/domain/page-pack/types";

describe("Multi-Page Bulletin & Magazine Publishing Integration", () => {
  const repository = getPersistenceRepository();
  const publisher = getBulletinPublisher();

  const subPage1 = layoutBulletinPage({
    pageNumber: 210,
    subPageNumber: 1,
    subPageCount: 2,
    title: "Resilient Systems Part 1",
    paragraphs: ["Exploring low-bandwidth offline-first computing for Kiroween."],
    fastext: { red: 100, green: 211, yellow: 300, cyan: 400 },
  });

  const subPage2 = layoutBulletinPage({
    pageNumber: 210,
    subPageNumber: 2,
    subPageCount: 2,
    title: "Resilient Systems Part 2",
    paragraphs: ["Teletext guarantees instantaneous rendering at 9600 baud."],
    fastext: { red: 100, green: 211, yellow: 300, cyan: 400 },
  });

  const validMultiPack: PagePackV1 = publisher.bundleMultiPageBulletin({
    pageNumber: 210,
    title: "Resilient Systems",
    language: "en",
    sourceName: "Tech Journal",
    pages: [subPage1, subPage2],
  });

  it("successfully publishes a multi-page bulletin with verified review timestamp", async () => {
    const request = new Request("http://localhost:3000/api/v1/pages/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pack: validMultiPack,
        reviewedAt: new Date().toISOString(),
        reviewerId: "editor-usr-01",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.page.pageNumber).toBe(210);
    expect(data.page.subPageCount).toBe(2);
    expect(data.page.revision).toBe(1);

    // Verify presence in repository
    const retrieved = await repository.getPageByNumber(210);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.page.status).toBe("published");
    expect(retrieved?.revision.reviewed_by).toBe("editor-usr-01");
  });

  it("rejects publishing when reviewedAt timestamp is missing (unreviewed draft)", async () => {
    const request = new Request("http://localhost:3000/api/v1/pages/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pack: {
          ...validMultiPack,
          primaryPageNumber: 220,
          pages: validMultiPack.pages.map((p) => ({ ...p, pageNumber: 220 })),
        },
        // reviewedAt omitted
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("UNREVIEWED_DRAFT");
  });

  it("rejects publishing when an active published page already occupies the page number", async () => {
    // Attempt to publish again on page 210 which was published in the first test
    const duplicatePack = publisher.bundleMultiPageBulletin({
      pageNumber: 210,
      title: "Conflicting Article",
      language: "en",
      sourceName: "Another Outlet",
      pages: [
        layoutBulletinPage({
          pageNumber: 210,
          title: "Conflicting Page",
          paragraphs: ["Will conflict with page 210."],
          fastext: { red: 100, green: 200, yellow: 300, cyan: 400 },
        }),
      ],
    });

    const request = new Request("http://localhost:3000/api/v1/pages/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pack: duplicatePack,
        reviewedAt: new Date().toISOString(),
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(409);

    const data = await response.json();
    expect(data.error).toBe("DUPLICATE_PAGE_NUMBER");
  });

  it("rejects publishing when subpages violate 40x25 grid rules", async () => {
    const corruptPage = {
      ...subPage1,
      pageNumber: 230,
      rows: subPage1.rows.slice(0, 15), // Invalid row count
    };

    const corruptPack: PagePackV1 = {
      ...validMultiPack,
      primaryPageNumber: 230,
      pages: [corruptPage],
    };

    const request = new Request("http://localhost:3000/api/v1/pages/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pack: corruptPack,
        reviewedAt: new Date().toISOString(),
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("INVALID_GRID_GEOMETRY");
  });

  it("rejects publishing when byte payload exceeds 10,240-byte ceiling", async () => {
    // Construct a bloated pack
    const bloatedParagraphs = Array.from({ length: 40 }, () =>
      "OverBudget Payload Text ".repeat(20)
    );

    const bloatedPack: PagePackV1 = {
      ...validMultiPack,
      primaryPageNumber: 240,
      title: "A".repeat(10000), // Inflate payload over 10 KiB
      pages: [
        layoutBulletinPage({
          pageNumber: 240,
          title: "Bloated Bulletin",
          paragraphs: ["Short row"],
          fastext: { red: 100, green: 200, yellow: 300, cyan: 400 },
        }),
      ],
    };

    const request = new Request("http://localhost:3000/api/v1/pages/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pack: bloatedPack,
        reviewedAt: new Date().toISOString(),
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("PAGE_OVER_BUDGET");
  });
});
