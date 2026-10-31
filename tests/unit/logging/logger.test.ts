import { describe, it, expect, vi } from "vitest";
import {
  logger,
  redactSensitiveData,
  getCorrelationId,
  type StructuredLogEntry,
} from "@/server/logging/logger";

describe("Structured Server-Side Logger (TASK-S5-06 / NFR-014)", () => {
  describe("getCorrelationId()", () => {
    it("generates a prefixed random ID when no request is provided", () => {
      const id = getCorrelationId();
      expect(id).toMatch(/^corr_[a-f0-9-]+$/);
    });

    it("reads x-correlation-id from request headers", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-correlation-id": "client-corr-12345" },
      });
      expect(getCorrelationId(req)).toBe("client-corr-12345");
    });

    it("reads x-request-id as secondary fallback", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-request-id": "req-gateway-987" },
      });
      expect(getCorrelationId(req)).toBe("req-gateway-987");
    });
  });

  describe("redactSensitiveData()", () => {
    it("redacts sensitive object keys (apiKey, password, secret, token, authorization)", () => {
      const sensitiveObj = {
        username: "editor1",
        apiKey: "AIzaSySecretApiKey123",
        password: "SuperSecretPassword!",
        nested: {
          client_secret: "nested_secret_val",
          userToken: "jwt.token.here",
        },
      };

      const redacted = redactSensitiveData(sensitiveObj);
      expect(redacted.username).toBe("editor1");
      expect(redacted.apiKey).toBe("[REDACTED]");
      expect(redacted.password).toBe("[REDACTED]");
      expect(redacted.nested.client_secret).toBe("[REDACTED]");
      expect(redacted.nested.userToken).toBe("[REDACTED]");
    });

    it("redacts inline Bearer tokens and query parameters in string values", () => {
      const text = "Authorization header was Bearer secret-jwt-payload-abc and key=mysecretkey123 in url";
      const sanitized = redactSensitiveData(text);

      expect(sanitized).not.toContain("secret-jwt-payload-abc");
      expect(sanitized).toContain("Bearer [REDACTED]");
      expect(sanitized).not.toContain("mysecretkey123");
      expect(sanitized).toContain("key=[REDACTED]");
    });

    it("truncates large content fields to prevent log flooding", () => {
      const largePayload = {
        title: "News Headline",
        content: "A".repeat(1500),
      };

      const redacted = redactSensitiveData(largePayload);
      expect(redacted.title).toBe("News Headline");
      expect(redacted.content).toBe("[TRUNCATED_CONTENT len=1500]");
    });

    it("truncates oversized generic strings over 300 characters", () => {
      const longString = "x".repeat(500);
      const sanitized = redactSensitiveData(longString);

      expect(sanitized.length).toBeLessThan(400);
      expect(sanitized).toContain("[TRUNCATED len=500]");
    });
  });

  describe("StructuredLogger methods", () => {
    it("formats INFO log entry with structured metadata and correlation ID", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const entry = logger.info("Article extracted successfully", {
        category: "INGESTION",
        route: "/api/v1/sources/extract",
        correlationId: "corr_test_01",
        status: 200,
        durationMs: 42.156,
        meta: {
          sourceUrl: "https://example.com/article",
          apiKey: "should-be-redacted",
        },
      });

      expect(entry.level).toBe("INFO");
      expect(entry.category).toBe("INGESTION");
      expect(entry.route).toBe("/api/v1/sources/extract");
      expect(entry.correlationId).toBe("corr_test_01");
      expect(entry.status).toBe(200);
      expect(entry.durationMs).toBe(42.16);
      expect(entry.meta?.sourceUrl).toBe("https://example.com/article");
      expect(entry.meta?.apiKey).toBe("[REDACTED]");

      expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(entry));
      consoleSpy.mockRestore();
    });

    it("formats ERROR log entry without leaking raw stack trace", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const err = new Error("Database timeout connection error");
      err.stack = "Error: at eval (internal/secret.ts:12:4)";

      const entry = logger.error("Failed to persist bulletin", {
        category: "PERSISTENCE",
        route: "/api/v1/pages/publish",
        correlationId: "corr_err_02",
        status: 500,
        error: err,
      });

      expect(entry.level).toBe("ERROR");
      expect(entry.category).toBe("PERSISTENCE");
      expect(entry.error?.name).toBe("Error");
      expect(entry.error?.message).toBe("Database timeout connection error");
      // Stack property is not included in the structured log entry
      expect((entry.error as Record<string, unknown>)?.stack).toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(entry));
      consoleSpy.mockRestore();
    });

    it("formats WARN and DEBUG entries correctly", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const warnEntry = logger.warn("Rate limit approaching", {
        category: "SECURITY",
        status: 429,
      });
      expect(warnEntry.level).toBe("WARN");
      expect(warnSpy).toHaveBeenCalled();

      const debugEntry = logger.debug("Cache miss for page 101", {
        category: "DELIVERY",
      });
      expect(debugEntry.level).toBe("DEBUG");
      expect(logSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
      logSpy.mockRestore();
    });
  });
});
