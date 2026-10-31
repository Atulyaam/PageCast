/**
 * PageCast — Structured Server-Side Logger (TASK-S5-06 / NFR-014)
 *
 * Implements high-performance, structured JSON logging for Next.js API routes.
 *
 * Key Guarantees:
 * 1. Structured JSON Format: Emits parseable single-line JSON log entries.
 * 2. Automatic Redaction: Redacts authorization tokens, API keys, secrets, and truncates large payloads.
 * 3. Request Correlation: Generates or propagates correlation IDs across distributed operations.
 * 4. Categorization: Tags log events with operational categories (SECURITY, INGESTION, AI, PERSISTENCE, DELIVERY).
 */

import crypto from "node:crypto";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export type LogCategory = "SECURITY" | "INGESTION" | "AI" | "PERSISTENCE" | "DELIVERY" | "GENERAL";

export interface LogContext {
  readonly correlationId?: string;
  readonly route?: string;
  readonly category?: LogCategory;
  readonly status?: number;
  readonly durationMs?: number;
  readonly meta?: Record<string, unknown>;
  readonly error?: Error | unknown;
}

export interface StructuredLogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly message: string;
  readonly category: LogCategory;
  readonly correlationId?: string;
  readonly route?: string;
  readonly status?: number;
  readonly durationMs?: number;
  readonly meta?: Record<string, unknown>;
  readonly error?: {
    readonly name: string;
    readonly message: string;
  };
}

const SENSITIVE_KEY_PATTERN =
  /(?:api[-_]?key|authorization|bearer|token|secret|password|credential|cookie)/i;
const MAX_STRING_LOG_LENGTH = 300;

/**
 * Recursively deep-clones an object while redacting sensitive fields and truncating oversized strings.
 */
export function redactSensitiveData<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    // Redact bearer tokens or key patterns embedded inside strings
    let sanitized = input.replace(/Bearer\s+[A-Za-z0-9_\-.]+/gi, "Bearer [REDACTED]");
    sanitized = sanitized.replace(/((?:key|secret|token)=)[^&\s]+/gi, "$1[REDACTED]");

    if (sanitized.length > MAX_STRING_LOG_LENGTH) {
      return `${sanitized.slice(0, MAX_STRING_LOG_LENGTH)}... [TRUNCATED len=${sanitized.length}]` as unknown as T;
    }
    return sanitized as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveData(item)) as unknown as T;
  }

  if (typeof input === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        result[key] = "[REDACTED]";
      } else if (
        key.toLowerCase().includes("content") &&
        typeof value === "string" &&
        value.length > 200
      ) {
        result[key] = `[TRUNCATED_CONTENT len=${value.length}]`;
      } else {
        result[key] = redactSensitiveData(value);
      }
    }

    return result as T;
  }

  return input;
}

/**
 * Extracts or generates a unique correlation ID from a Next.js Request.
 */
export function getCorrelationId(request?: Request): string {
  if (!request) {
    return `corr_${crypto.randomUUID().slice(0, 8)}`;
  }

  const existing = request.headers.get("x-correlation-id") || request.headers.get("x-request-id");

  if (existing && existing.trim().length > 0) {
    return existing.trim().slice(0, 64);
  }

  return `corr_${crypto.randomUUID().slice(0, 8)}`;
}

class StructuredLogger {
  private formatEntry(level: LogLevel, message: string, ctx?: LogContext): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      category: ctx?.category ?? "GENERAL",
      ...(ctx?.correlationId ? { correlationId: ctx.correlationId } : {}),
      ...(ctx?.route ? { route: ctx.route } : {}),
      ...(ctx?.status !== undefined ? { status: ctx.status } : {}),
      ...(ctx?.durationMs !== undefined
        ? { durationMs: Math.round(ctx.durationMs * 100) / 100 }
        : {}),
      ...(ctx?.meta ? { meta: redactSensitiveData(ctx.meta) } : {}),
      ...(ctx?.error
        ? {
            error: {
              name: ctx.error instanceof Error ? ctx.error.name : "UnknownError",
              message: ctx.error instanceof Error ? ctx.error.message : String(ctx.error),
            },
          }
        : {}),
    };

    return entry;
  }

  private write(level: LogLevel, message: string, ctx?: LogContext): StructuredLogEntry {
    const entry = this.formatEntry(level, message, ctx);
    const jsonString = JSON.stringify(entry);

    if (level === "ERROR") {
      console.error(jsonString);
    } else if (level === "WARN") {
      console.warn(jsonString);
    } else {
      console.log(jsonString);
    }

    return entry;
  }

  public debug(message: string, ctx?: LogContext): StructuredLogEntry {
    return this.write("DEBUG", message, ctx);
  }

  public info(message: string, ctx?: LogContext): StructuredLogEntry {
    return this.write("INFO", message, ctx);
  }

  public warn(message: string, ctx?: LogContext): StructuredLogEntry {
    return this.write("WARN", message, ctx);
  }

  public error(message: string, ctx?: LogContext): StructuredLogEntry {
    return this.write("ERROR", message, ctx);
  }
}

export const logger = new StructuredLogger();
