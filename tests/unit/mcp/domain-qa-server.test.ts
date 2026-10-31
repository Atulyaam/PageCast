import { describe, it, expect } from "vitest";
import { DomainQaMcpServer } from "@/server/mcp/domain-qa-server";
import type { TeletextPage } from "@/domain/teletext/types";
import type { PagePackV1 } from "@/domain/page-pack/types";

describe("PageCast Domain QA MCP Server (ENH-04)", () => {
  const server = new DomainQaMcpServer();

  it("handles initialize handshake per MCP specification", async () => {
    const res = await server.handleRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05" },
    });

    expect(res).toBeDefined();
    expect(res?.id).toBe(1);
    expect((res?.result as any)?.serverInfo?.name).toBe("pagecast-domain-qa");
    expect((res?.result as any)?.protocolVersion).toBe("2024-11-05");
  });

  it("returns null for notifications/initialized", async () => {
    const res = await server.handleRequest({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    });
    expect(res).toBeNull();
  });

  it("handles ping request", async () => {
    const res = await server.handleRequest({
      jsonrpc: "2.0",
      id: "ping-1",
      method: "ping",
    });
    expect(res?.result).toEqual({});
  });

  it("lists all 5 domain QA tools via tools/list", async () => {
    const res = await server.handleRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
    });

    const tools = (res?.result as any)?.tools;
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBe(5);

    const names = tools.map((t: any) => t.name);
    expect(names).toContain("validate_page_grid");
    expect(names).toContain("measure_pagepack_bytes");
    expect(names).toContain("verify_source_evidence");
    expect(names).toContain("generate_multi_frame_qr");
    expect(names).toContain("validate_page_number");
  });

  it("executes validate_page_number tool correctly", async () => {
    // Valid page
    const validRes = await server.handleRequest({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "validate_page_number",
        arguments: { pageNumber: 201 },
      },
    });

    const validContent = JSON.parse((validRes?.result as any).content[0].text);
    expect(validContent.valid).toBe(true);
    expect(validContent.magazineNumber).toBe(2);
    expect(validContent.magazineName).toBe("Technology & Resilience");

    // Invalid page out of range
    const invalidRes = await server.handleRequest({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "validate_page_number",
        arguments: { pageNumber: 999 },
      },
    });

    const invalidContent = JSON.parse((invalidRes?.result as any).content[0].text);
    expect(invalidContent.valid).toBe(false);
  });

  it("executes validate_page_grid tool on compliant and malformed grids", async () => {
    // Construct 25 rows with exactly 40 spaces each
    const validRows = Array.from({ length: 25 }, () => ({
      spans: [{ text: " ".repeat(40) }],
    }));

    const validPage: TeletextPage = {
      pageNumber: 101,
      title: "Test Page",
      rows: validRows,
      fastext: { red: 100, green: 200, yellow: 300, cyan: 400 },
    };

    const resValid = await server.handleRequest({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "validate_page_grid",
        arguments: { page: validPage },
      },
    });

    const validData = JSON.parse((resValid?.result as any).content[0].text);
    expect(validData.valid).toBe(true);
    expect(validData.rowCount).toBe(25);
    expect(validData.errorCount).toBe(0);

    // Malformed page: only 10 rows
    const invalidPage = {
      ...validPage,
      rows: validRows.slice(0, 10),
    };

    const resInvalid = await server.handleRequest({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "validate_page_grid",
        arguments: { page: invalidPage },
      },
    });

    const invalidData = JSON.parse((resInvalid?.result as any).content[0].text);
    expect(invalidData.valid).toBe(false);
    expect(invalidData.errorCount).toBeGreaterThan(0);
  });

  it("executes measure_pagepack_bytes tool", async () => {
    const validRows = Array.from({ length: 25 }, () => ({
      spans: [{ text: " ".repeat(40) }],
    }));

    const mockPack: PagePackV1 = {
      id: "77777777-7777-7777-7777-777777777777",
      version: 1,
      slug: "mcp-test",
      title: "MCP Test Bulletin",
      magazine: 1,
      primaryPageNumber: 101,
      createdAt: new Date().toISOString(),
      metadata: {
        sourceName: "MCP QA Test",
        language: "en",
        aiAssisted: false,
        publisherId: "qa-lead",
        evidenceReferences: [],
      },
      pages: [
        {
          pageNumber: 101,
          title: "MCP Test",
          rows: validRows,
          fastext: { red: 100, green: 200, yellow: 300, cyan: 400 },
        },
      ],
    };

    const res = await server.handleRequest({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "measure_pagepack_bytes",
        arguments: { pack: mockPack },
      },
    });

    const data = JSON.parse((res?.result as any).content[0].text);
    expect(data.bytesUsed).toBeGreaterThan(0);
    expect(data.isWithinBudget).toBe(true);
    expect(data.maxBytes).toBe(10240);
  });

  it("executes verify_source_evidence tool", async () => {
    const sourceSentences = [
      { id: "s-001", text: "Sentence 1", hash: "hash-aaa" },
      { id: "s-002", text: "Sentence 2", hash: "hash-bbb" },
    ];

    const evidenceReferences = [
      { pointId: "p1", sourceSentenceId: "s-001", sentenceHash: "hash-aaa" },
      { pointId: "p2", sourceSentenceId: "s-missing", sentenceHash: "hash-xxx" },
    ];

    const res = await server.handleRequest({
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: {
        name: "verify_source_evidence",
        arguments: { sourceSentences, evidenceReferences },
      },
    });

    const data = JSON.parse((res?.result as any).content[0].text);
    expect(data.totalClaims).toBe(2);
    expect(data.verifiedClaims).toBe(1);
    expect(data.unverifiedClaims).toBe(1);
    expect(data.matchPercentage).toBe(50);
  });

  it("handles parse error gracefully in processLine", async () => {
    const reply = await server.processLine("not a json string");
    expect(reply).toBeDefined();
    const parsed = JSON.parse(reply!);
    expect(parsed.error.code).toBe(-32700);
  });
});

