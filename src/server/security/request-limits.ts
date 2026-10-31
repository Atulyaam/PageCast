/**
 * PageCast Request Body Size Limits & Safe JSON Parser (TASK-S5-01 / SEC-008, TR-013)
 *
 * Enforces strict request body size ceilings on Next.js API routes before memory
 * allocation or expensive JSON parsing, defending against denial-of-service and memory exhaustion.
 */

import { NextResponse } from "next/server";

export const DEFAULT_MAX_BODY_BYTES = 512 * 1024; // 512 KiB default
export const MAX_PAGEPACK_BODY_BYTES = 15 * 1024; // 15 KiB ceiling for PagePack endpoints
export const MAX_SOURCE_TEXT_BODY_BYTES = 2 * 1024 * 1024; // 2 MiB ceiling for source text ingestion

export type SafeJsonResult<T = unknown> =
  { success: true; data: T } | { success: false; response: NextResponse };

/**
 * Validates request size limits and parses JSON body safely.
 */
export async function parseJsonWithLimit<T = unknown>(
  request: Request,
  maxBytes: number = DEFAULT_MAX_BODY_BYTES
): Promise<SafeJsonResult<T>> {
  // 1. Check Content-Length header if provided by client
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsedLength = parseInt(contentLength, 10);
    if (!isNaN(parsedLength) && parsedLength > maxBytes) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: `Payload too large: Content-Length ${parsedLength} bytes exceeds limit of ${maxBytes} bytes.`,
            code: "PAYLOAD_TOO_LARGE",
          },
          {
            status: 413,
            headers: {
              "Content-Type": "application/json",
            },
          }
        ),
      };
    }
  }

  // 2. Read body with byte-metering limit
  let text = "";
  try {
    if (!request.body) {
      text = await request.text();
    } else {
      const reader = request.body.getReader();
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.byteLength;
          if (totalBytes > maxBytes) {
            reader.cancel("Payload limit exceeded");
            return {
              success: false,
              response: NextResponse.json(
                {
                  success: false,
                  error: `Payload too large: Request body exceeded limit of ${maxBytes} bytes.`,
                  code: "PAYLOAD_TOO_LARGE",
                },
                { status: 413 }
              ),
            };
          }
          chunks.push(value);
        }
      }

      const totalArray = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        totalArray.set(chunk, offset);
        offset += chunk.byteLength;
      }
      text = new TextDecoder().decode(totalArray);
    }
  } catch (err: any) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: `Error reading request body: ${err?.message || "Unknown error"}`,
          code: "REQUEST_BODY_ERROR",
        },
        { status: 400 }
      ),
    };
  }

  // 3. Handle empty payload
  if (!text || !text.trim()) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Empty JSON request body",
          code: "INVALID_JSON",
        },
        { status: 400 }
      ),
    };
  }

  // 4. Safe JSON parsing
  try {
    const data = JSON.parse(text) as T;
    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: `Invalid JSON syntax: ${err?.message || "Malformed JSON"}`,
          code: "INVALID_JSON",
        },
        { status: 400 }
      ),
    };
  }
}
