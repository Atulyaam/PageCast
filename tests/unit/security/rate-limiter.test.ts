import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  enforceRateLimit,
  getClientIdentifier,
  MemoryRateLimitStore,
  type RateLimitConfig,
  type RateLimitStore,
} from "@/server/security/rate-limiter";

describe("API Rate Limiter & Resource Protection (TASK-S5-02 / TR-014)", () => {
  let store: MemoryRateLimitStore;
  const testConfig: RateLimitConfig = { maxRequests: 3, windowSeconds: 10 };

  beforeEach(() => {
    store = new MemoryRateLimitStore();
  });

  it("allows requests below the limit and decrements remaining quota", async () => {
    const key = "test-route:192.168.1.10";

    const res1 = await checkRateLimit(key, testConfig, store);
    expect(res1.allowed).toBe(true);
    expect(res1.limit).toBe(3);
    expect(res1.remaining).toBe(2);

    const res2 = await checkRateLimit(key, testConfig, store);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = await checkRateLimit(key, testConfig, store);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("blocks requests exceeding limit with HTTP 429 metadata and retry-after", async () => {
    const key = "test-route:192.168.1.10";

    // Consume all 3 requests
    await checkRateLimit(key, testConfig, store);
    await checkRateLimit(key, testConfig, store);
    await checkRateLimit(key, testConfig, store);

    // 4th request exceeds limit
    const blockedRes = await checkRateLimit(key, testConfig, store);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
    expect(blockedRes.retryAfterSeconds).toBeGreaterThan(0);
    expect(blockedRes.retryAfterSeconds).toBeLessThanOrEqual(10);
  });

  it("isolates rate limits between different client identifiers", async () => {
    const clientA = "test-route:client-A";
    const clientB = "test-route:client-B";

    // Exhaust client A
    await checkRateLimit(clientA, testConfig, store);
    await checkRateLimit(clientA, testConfig, store);
    await checkRateLimit(clientA, testConfig, store);
    const blockedA = await checkRateLimit(clientA, testConfig, store);
    expect(blockedA.allowed).toBe(false);

    // Client B should still be allowed with full quota
    const freshB = await checkRateLimit(clientB, testConfig, store);
    expect(freshB.allowed).toBe(true);
    expect(freshB.remaining).toBe(2);
  });

  it("resets quota after window expiration", async () => {
    const key = "test-route:expiring-client";
    const now = 1000000;

    // Use quota at T = now
    await checkRateLimit(key, testConfig, store, now);
    await checkRateLimit(key, testConfig, store, now);
    await checkRateLimit(key, testConfig, store, now);
    const blocked = await checkRateLimit(key, testConfig, store, now);
    expect(blocked.allowed).toBe(false);

    // T = now + 11 seconds (window expired)
    const afterExpiry = await checkRateLimit(key, testConfig, store, now + 11000);
    expect(afterExpiry.allowed).toBe(true);
    expect(afterExpiry.remaining).toBe(2);
  });

  it("extracts client IP from proxy headers securely", () => {
    // 1. Cloudflare header priority
    const cfReq = new Request("https://pagecast.app/api/v1/extract", {
      headers: { "cf-connecting-ip": "203.0.113.195", "x-real-ip": "10.0.0.1" },
    });
    expect(getClientIdentifier(cfReq)).toBe("203.0.113.195");

    // 2. X-Real-IP priority
    const realIpReq = new Request("https://pagecast.app/api/v1/extract", {
      headers: { "x-real-ip": "198.51.100.42", "x-forwarded-for": "10.0.0.2" },
    });
    expect(getClientIdentifier(realIpReq)).toBe("198.51.100.42");

    // 3. X-Forwarded-For: extracts first client IP in chain
    const fwdReq = new Request("https://pagecast.app/api/v1/extract", {
      headers: { "x-forwarded-for": "192.0.2.1, 10.0.0.1, 10.0.0.2" },
    });
    expect(getClientIdentifier(fwdReq)).toBe("192.0.2.1");

    // 4. Fallback when no headers present
    const bareReq = new Request("https://pagecast.app/api/v1/extract");
    expect(getClientIdentifier(bareReq)).toBe("127.0.0.1");
  });

  it("enforces rate limit on HTTP Request and returns standard 429 response when exceeded", async () => {
    const req = new Request("https://pagecast.app/api/v1/bulletins/compose", {
      headers: { "x-real-ip": "198.51.100.99" },
    });

    const smallConfig = { maxRequests: 2, windowSeconds: 30 };

    // Req 1 - Allowed
    const res1 = await enforceRateLimit(req, "compose", smallConfig, store);
    expect(res1.success).toBe(true);

    // Req 2 - Allowed
    const res2 = await enforceRateLimit(req, "compose", smallConfig, store);
    expect(res2.success).toBe(true);

    // Req 3 - Exceeded -> HTTP 429
    const res3 = await enforceRateLimit(req, "compose", smallConfig, store);
    expect(res3.success).toBe(false);
    if (!res3.success) {
      expect(res3.response.status).toBe(429);
      expect(res3.response.headers.get("Retry-After")).toBeDefined();
      expect(res3.response.headers.get("X-RateLimit-Limit")).toBe("2");
      expect(res3.response.headers.get("X-RateLimit-Remaining")).toBe("0");

      const body = await res3.response.json();
      expect(body.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(body.error).toContain("Rate limit exceeded");
    }
  });

  it("fails open gracefully if the storage backend throws an unexpected error", async () => {
    const faultyStore: RateLimitStore = {
      get: () => {
        throw new Error("Simulated storage timeout or network drop");
      },
      set: () => {},
      delete: () => {},
      clear: () => {},
    };

    const res = await checkRateLimit("key", testConfig, faultyStore);
    // Should fail open and allow request
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(1);
  });
});
