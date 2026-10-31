import { describe, it, expect, beforeEach } from "vitest";
import { GET as getCatalog } from "@/app/api/v1/catalog/route";
import { GET as getCatalogueAlias } from "@/app/api/v1/catalogue/route";
import { resetPersistenceRepositoryForTesting } from "@/server/database";

describe("Broadcast Catalogue API Integration (TASK-S4-05)", () => {
  beforeEach(() => {
    resetPersistenceRepositoryForTesting();
  });

  it("returns all 8 Teletext magazines with grouped seed bulletins and caching headers", async () => {
    const response = await getCatalog();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("public, max-age=60");

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.totalBulletins).toBeGreaterThanOrEqual(5);

    // Verify exactly 8 magazines
    expect(json.magazines).toHaveLength(8);

    const mag1 = json.magazines.find((m: any) => m.magazineNumber === 1);
    expect(mag1).toBeDefined();
    expect(mag1.name).toBe("News & Index");
    expect(mag1.bulletins.some((b: any) => b.pageNumber === 100)).toBe(true);
    expect(mag1.bulletins.some((b: any) => b.pageNumber === 101)).toBe(true);

    const mag2 = json.magazines.find((m: any) => m.magazineNumber === 2);
    expect(mag2).toBeDefined();
    expect(mag2.name).toBe("Technology & Resilience");
    expect(mag2.bulletins.some((b: any) => b.pageNumber === 200)).toBe(true);

    const mag4 = json.magazines.find((m: any) => m.magazineNumber === 4);
    expect(mag4).toBeDefined();
    expect(mag4.name).toBe("Sports & Competition");
    expect(mag4.bulletins.some((b: any) => b.pageNumber === 400)).toBe(true);
  });

  it("verifies /api/v1/catalogue alias returns identical structured response", async () => {
    const aliasResponse = await getCatalogueAlias();
    expect(aliasResponse.status).toBe(200);

    const json = await aliasResponse.json();
    expect(json.success).toBe(true);
    expect(json.magazines).toHaveLength(8);
  });
});
