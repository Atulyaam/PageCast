/**
 * PageCast Domain QA MCP Server — Type Definitions (ENH-04)
 *
 * Implements standard Model Context Protocol (MCP) JSON-RPC 2.0 schemas
 * for tool discovery and execution.
 */

export interface JsonRpcRequest {
  readonly jsonrpc: "2.0";
  readonly id?: string | number | null;
  readonly method: string;
  readonly params?: Record<string, unknown>;
}

export interface JsonRpcError {
  readonly code: number;
  readonly message: string;
  readonly data?: unknown;
}

export interface JsonRpcResponse {
  readonly jsonrpc: "2.0";
  readonly id?: string | number | null;
  readonly result?: unknown;
  readonly error?: JsonRpcError;
}

export interface McpToolInputProperty {
  readonly type: string;
  readonly description?: string;
  readonly items?: Record<string, unknown>;
  readonly properties?: Record<string, unknown>;
  readonly required?: readonly string[];
  readonly enum?: readonly (string | number)[];
  readonly default?: unknown;
}

export interface McpToolInputSchema {
  readonly type: "object";
  readonly properties: Record<string, McpToolInputProperty>;
  readonly required?: readonly string[];
}

export interface McpToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: McpToolInputSchema;
}

export interface McpContentItem {
  readonly type: "text";
  readonly text: string;
}

export interface McpToolResult {
  readonly content: readonly McpContentItem[];
  readonly isError?: boolean;
}

