/**
 * PageCast Domain QA MCP Server — Stdio Protocol Server (ENH-04)
 *
 * Implements a lightweight, zero-overhead Model Context Protocol (MCP) server
 * allowing external AI agents (such as Kiro agents, Claude Desktop, Antigravity)
 * to programmatically validate Teletext grids, enforce the 10 KiB payload ceiling,
 * audit evidence provenance hashes, and generate air-gap multi-frame QR bursts.
 *
 * Usage:
 *   npx tsx src/server/mcp/domain-qa-server.ts
 */

import readline from "node:readline";
import type { JsonRpcRequest, JsonRpcResponse, McpToolDefinition } from "./types";
import { DOMAIN_QA_TOOLS, executeDomainTool } from "./tools";

export const MCP_SERVER_NAME = "pagecast-domain-qa";
export const MCP_SERVER_VERSION = "1.0.0";
export const MCP_PROTOCOL_VERSION = "2024-11-05";

export class DomainQaMcpServer {
  readonly serverName: string = MCP_SERVER_NAME;
  readonly serverVersion: string = MCP_SERVER_VERSION;
  readonly tools: readonly McpToolDefinition[] = DOMAIN_QA_TOOLS;

  async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse | null> {
    if (!request || request.jsonrpc !== "2.0") {
      return {
        jsonrpc: "2.0",
        id: request?.id ?? null,
        error: {
          code: -32600,
          message: "Invalid Request: jsonrpc version must be '2.0'",
        },
      };
    }

    const { id, method, params } = request;

    switch (method) {
      case "initialize": {
        return {
          jsonrpc: "2.0",
          id: id ?? null,
          result: {
            protocolVersion: MCP_PROTOCOL_VERSION,
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: this.serverName,
              version: this.serverVersion,
            },
          },
        };
      }

      case "notifications/initialized": {
        // Client acknowledgment notification; no JSON-RPC response required
        return null;
      }

      case "ping": {
        return {
          jsonrpc: "2.0",
          id: id ?? null,
          result: {},
        };
      }

      case "tools/list": {
        return {
          jsonrpc: "2.0",
          id: id ?? null,
          result: {
            tools: this.tools,
          },
        };
      }

      case "tools/call": {
        if (!params || typeof params.name !== "string") {
          return {
            jsonrpc: "2.0",
            id: id ?? null,
            error: {
              code: -32602,
              message: "Invalid params: 'name' is required for tools/call",
            },
          };
        }

        const toolName = params.name;
        const toolArgs = (params.arguments as Record<string, unknown>) || {};

        try {
          const result = await executeDomainTool(toolName, toolArgs);
          return {
            jsonrpc: "2.0",
            id: id ?? null,
            result,
          };
        } catch (err: unknown) {
          return {
            jsonrpc: "2.0",
            id: id ?? null,
            error: {
              code: -32000,
              message: err instanceof Error ? err.message : String(err),
            },
          };
        }
      }

      default: {
        return {
          jsonrpc: "2.0",
          id: id ?? null,
          error: {
            code: -32601,
            message: `Method not found: '${method}'`,
          },
        };
      }
    }
  }

  async processLine(line: string): Promise<string | null> {
    const trimmed = line.trim();
    if (!trimmed) return null;

    try {
      const parsed = JSON.parse(trimmed) as JsonRpcRequest;
      const response = await this.handleRequest(parsed);
      return response ? JSON.stringify(response) : null;
    } catch {
      const errorResp: JsonRpcResponse = {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: "Parse error: invalid JSON input",
        },
      };
      return JSON.stringify(errorResp);
    }
  }

  startStdio(): void {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    rl.on("line", async (line) => {
      const reply = await this.processLine(line);
      if (reply) {
        process.stdout.write(reply + "\n");
      }
    });

    rl.on("close", () => {
      process.exit(0);
    });
  }
}

// Auto-run if executed directly as entrypoint
if (
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("domain-qa-server.ts") ||
    process.argv[1].endsWith("domain-qa-server.js"))
) {
  const server = new DomainQaMcpServer();
  server.startStdio();
}
