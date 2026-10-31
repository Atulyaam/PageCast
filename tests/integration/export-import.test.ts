import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/v1/pages/[pageNumber]/pack/route";

describe("PagePack Export & Download API Integration", () => {
  it("downloads canonical PagePack JSON for seeded page 100", async () => {
    const request = new Request("http://localhost:3000/api/v1/pages/100/pack");
    const response = await GET(request, {
      params: Promise.resolve({ pageNumber: "100" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("content-disposition")).toContain("attachment; filename=");

    const text = await response.text();
    const pack = JSON.parse(text);

    expect(pack.version).toBe(1);
    expect(pack.primaryPageNumber).toBe(100);
    expect(pack.pages).toBeDefined();
    expect(pack.pages.length).toBeGreaterThan(0);
  });

  it("returns 404 for non-existent or unpublished page", async () => {
    const request = new Request("http://localhost:3000/api/v1/pages/777/pack");
    const response = await GET(request, {
      params: Promise.resolve({ pageNumber: "777" }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("PAGE_NOT_FOUND");
  });

  it("returns 400 for non-numeric or out-of-bounds page numbers", async () => {
    const badReq1 = await GET(new Request("http://localhost:3000/api/v1/pages/abc/pack"), {
      params: Promise.resolve({ pageNumber: "abc" }),
    });
    expect(badReq1.status).toBe(400);

    const badReq2 = await GET(new Request("http://localhost:3000/api/v1/pages/99/pack"), {
      params: Promise.resolve({ pageNumber: "99" }),
    });
    expect(badReq2.status).toBe(400);

    const badReq3 = await GET(new Request("http://localhost:3000/api/v1/pages/900/pack"), {
      params: Promise.resolve({ pageNumber: "900" }),
    });
    expect(badReq3.status).toBe(400);
  });
});
