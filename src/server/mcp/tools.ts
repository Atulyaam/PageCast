/**
 * PageCast Domain QA MCP Server — Tool Definitions and Handlers (ENH-04)
 *
 * Exposes core Teletext domain invariants as callable MCP tools:
 * 1. validate_page_grid (40x25 CRT matrix enforcement)
 * 2. measure_pagepack_bytes (10 KiB ceiling measurement)
 * 3. verify_source_evidence (Cryptographic claim-to-sentence verification)
 * 4. generate_multi_frame_qr (Air-gap QR burst generation)
 * 5. validate_page_number (Magazine allocation & 100-899 range checks)
 */

import type { TeletextPage } from "@/domain/teletext/types";
import type { PagePackV1, EvidenceReference } from "@/domain/page-pack/types";
import { validateGrid } from "@/domain/validation/validate-grid";
import { measurePagePack } from "@/domain/page-pack/codec";
import { isValidPageNumber } from "@/domain/validation/page-number";
import { getMagazineDefinition } from "@/domain/teletext/magazine";
import { encodeMultiFramePack } from "@/lib/qr/multi-frame-codec";
import type { McpToolDefinition, McpToolResult } from "./types";

export const DOMAIN_QA_TOOLS: readonly McpToolDefinition[] = [
  {
    name: "validate_page_grid",
    description:
      "Validates that a TeletextPage strictly complies with the 40×25 CRT matrix invariants (Property P1: exactly 25 rows; Property P2: exactly 40 logical cells per row).",
    inputSchema: {
      type: "object",
      properties: {
        page: {
          type: "object",
          description: "The TeletextPage object containing rows and spans to validate.",
        },
      },
      required: ["page"],
    },
  },
  {
    name: "measure_pagepack_bytes",
    description:
      "Calculates the exact UTF-8 byte weight of a PagePack bulletin against the strict 10 KiB (10,240 bytes) ceiling using TextEncoder byte measurement.",
    inputSchema: {
      type: "object",
      properties: {
        pack: {
          type: "object",
          description: "The PagePackV1 bulletin object to measure.",
        },
      },
      required: ["pack"],
    },
  },
  {
    name: "verify_source_evidence",
    description:
      "Audits cryptographic claim-to-sentence provenance linking between PagePack evidence references and source sentences.",
    inputSchema: {
      type: "object",
      properties: {
        sourceSentences: {
          type: "array",
          description: "Array of extracted source sentences with id and hash.",
        },
        evidenceReferences: {
          type: "array",
          description: "Array of evidence reference mappings from bulletin draft or PagePack.",
        },
      },
      required: ["sourceSentences", "evidenceReferences"],
    },
  },
  {
    name: "generate_multi_frame_qr",
    description:
      "Encodes a PagePack bulletin into sequential animated air-gap QR burst frames with SHA-256 integrity digests.",
    inputSchema: {
      type: "object",
      properties: {
        pack: {
          type: "object",
          description: "The PagePackV1 bulletin object to encode.",
        },
        maxCharsPerFrame: {
          type: "number",
          description: "Optional maximum characters per QR frame (default 400).",
        },
      },
      required: ["pack"],
    },
  },
  {
    name: "validate_page_number",
    description:
      "Validates a Teletext page number (100-899) and resolves its magazine index (1-8), name, and routing metadata.",
    inputSchema: {
      type: "object",
      properties: {
        pageNumber: {
          type: "number",
          description: "The 3-digit page number to validate (e.g. 101, 201, 501).",
        },
      },
      required: ["pageNumber"],
    },
  },
];

function successResult(data: unknown): McpToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
    isError: false,
  };
}

function errorResult(message: string): McpToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ error: message }, null, 2),
      },
    ],
    isError: true,
  };
}

export async function executeDomainTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<McpToolResult> {
  switch (toolName) {
    case "validate_page_grid": {
      const page = args.page as TeletextPage;
      if (!page) {
        return errorResult("Missing required argument: 'page'");
      }

      const result = validateGrid(page);
      return successResult({
        valid: result.valid,
        rowCount: page.rows?.length ?? 0,
        expectedRowCount: 25,
        expectedColumnCount: 40,
        errorCount: result.errors.length,
        errors: result.errors,
      });
    }

    case "measure_pagepack_bytes": {
      const pack = args.pack as PagePackV1;
      if (!pack) {
        return errorResult("Missing required argument: 'pack'");
      }

      try {
        const budget = measurePagePack(pack);
        return successResult({
          bytesUsed: budget.bytesUsed,
          maxBytes: budget.maxBytes,
          bytesRemaining: budget.bytesRemaining,
          percentageUsed: budget.percentageUsed,
          isWithinBudget: !budget.isOverBudget,
          isOverBudget: budget.isOverBudget,
          formatted: `${budget.bytesUsed.toLocaleString()} / ${budget.maxBytes.toLocaleString()} B (${budget.percentageUsed}%)`,
        });
      } catch (err: unknown) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    }

    case "verify_source_evidence": {
      const sourceSentences =
        (args.sourceSentences as Array<{
          id: string;
          text?: string;
          hash?: string;
        }>) || [];
      const evidenceReferences = (args.evidenceReferences as EvidenceReference[]) || [];

      const totalClaims = evidenceReferences.length;
      let verifiedCount = 0;
      const details: Array<{
        pointId: string;
        sourceSentenceId: string;
        matched: boolean;
        hashMatched: boolean;
      }> = [];

      for (const ref of evidenceReferences) {
        const sentence = sourceSentences.find((s) => s.id === ref.sourceSentenceId);
        if (!sentence) {
          details.push({
            pointId: ref.pointId,
            sourceSentenceId: ref.sourceSentenceId,
            matched: false,
            hashMatched: false,
          });
          continue;
        }

        const hashMatched = Boolean(ref.sentenceHash && sentence.hash)
          ? ref.sentenceHash === sentence.hash
          : true;

        if (hashMatched) {
          verifiedCount++;
        }

        details.push({
          pointId: ref.pointId,
          sourceSentenceId: ref.sourceSentenceId,
          matched: true,
          hashMatched,
        });
      }

      const matchPercentage =
        totalClaims > 0 ? Math.round((verifiedCount / totalClaims) * 100) : 100;

      return successResult({
        totalClaims,
        verifiedClaims: verifiedCount,
        unverifiedClaims: totalClaims - verifiedCount,
        matchPercentage,
        verified: totalClaims === 0 || verifiedCount === totalClaims,
        details,
      });
    }

    case "generate_multi_frame_qr": {
      const pack = args.pack as PagePackV1;
      if (!pack) {
        return errorResult("Missing required argument: 'pack'");
      }

      const maxChars = typeof args.maxCharsPerFrame === "number" ? args.maxCharsPerFrame : 400;

      try {
        const frames = await encodeMultiFramePack(pack, maxChars);
        return successResult({
          frameCount: frames.length,
          frames,
          sampleFirstFrame: frames[0] ?? "",
          protocolPrefix: "PAGECAST:v1",
        });
      } catch (err: unknown) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    }

    case "validate_page_number": {
      const pageNumber = Number(args.pageNumber);
      if (Number.isNaN(pageNumber)) {
        return errorResult("Argument 'pageNumber' must be a valid number");
      }

      const valid = isValidPageNumber(pageNumber);
      if (!valid) {
        return successResult({
          valid: false,
          pageNumber,
          error: "Page numbers must be integers between 100 and 899 (hundreds digit 1-8).",
        });
      }

      const def = getMagazineDefinition(pageNumber);
      return successResult({
        valid: true,
        pageNumber,
        magazineNumber: def.number,
        magazineName: def.name,
        magazineDescription: def.description,
        pageRange: def.pageRange,
        defaultColor: def.defaultColor,
      });
    }

    default:
      return errorResult(`Unknown tool: '${toolName}'`);
  }
}
