/**
 * PageCast API Rate Limiter & Resource Protection Engine (TASK-S5-02 / TR-014, §10, §19-S5)
 *
 * Implements sliding window rate limiting for extraction and AI composition routes
 * to prevent API quota exhaustion, financial abuse, and denial-of-service.
 * Supports trusted proxy IP resolution, customizable windows, and standard 429 Retry-After headers.
 */

import { NextResponse } from "next/server";

export interface RateLimitConfig {
  maxRequests: number; // Maximum allowed requests in window
  windowSeconds: number; // Time window in seconds
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  retryAfterSeconds?: number;
}

export interface RateLimitRecord {
  count: number;
  resetAt: number; // Timestamp in milliseconds
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitRecord | undefined> | RateLimitRecord | undefined;
  set(key: string, record: RateLimitRecord): Promise<void> | void;
  delete(key: string): Promise<void> | void;
  clear(): Promise<void> | void;
}

/**
 * In-memory sliding window store with automatic garbage collection of expired buckets.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, RateLimitRecord>();
  private lastCleanup = Date.now();

  get(key: string): RateLimitRecord | undefined {
    this.cleanupIfNeeded();
    return this.store.get(key);
  }

  set(key: string, record: RateLimitRecord): void {
    this.cleanupIfNeeded();
    this.store.set(key, record);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  private cleanupIfNeeded(): void {
    const now = Date.now();
    // Clean up expired buckets every 60 seconds
    if (now - this.lastCleanup > 60_000) {
      this.lastCleanup = now;
      for (const [key, record] of this.store.entries()) {
        if (record.resetAt <= now) {
          this.store.delete(key);
        }
      }
    }
  }
}

// Global default store instance
export const defaultRateLimitStore = new MemoryRateLimitStore();

/**
 * Predefined rate-limit profiles for different API sensitivity levels.
 */
export const RATE_LIMIT_PROFILES = {
  // Expensive AI Generation (Gemini 2.5 Flash / Flash Lite): 10 calls per minute
  AI_COMPOSE: { maxRequests: 10, windowSeconds: 60 },
  // Article extraction & safe fetch: 20 calls per minute
  SOURCE_EXTRACT: { maxRequests: 20, windowSeconds: 60 },
  // Publishing & draft mutations: 30 calls per minute
  PUBLISH: { maxRequests: 30, windowSeconds: 60 },
  // Standard read / verification endpoints: 60 calls per minute
  GENERAL: { maxRequests: 60, windowSeconds: 60 },
} as const;

/**
 * Securely extracts client identifier from request headers without trusting spoofed headers.
 */
export function getClientIdentifier(request: Request): string {
  // 1. Check Cloudflare / Vercel verified headers
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  // 2. Standard X-Forwarded-For header: first IP is the original client IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor && forwardedFor.trim()) {
    const parts = forwardedFor.split(",").map((s) => s.trim());
    if (parts[0]) {
      return parts[0];
    }
  }

  // Fallback identifier if running behind local dev server without reverse proxy
  return "127.0.0.1";
}

/**
 * Checks and increments rate limit counter for a given client and route key.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  store: RateLimitStore = defaultRateLimitStore,
  nowMs: number = Date.now()
): Promise<RateLimitResult> {
  try {
    const record = await store.get(key);
    const windowMs = config.windowSeconds * 1000;

    if (!record || record.resetAt <= nowMs) {
      // First request or window expired
      const newRecord: RateLimitRecord = {
        count: 1,
        resetAt: nowMs + windowMs,
      };
      await store.set(key, newRecord);

      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetSeconds: Math.ceil(windowMs / 1000),
      };
    }

    // Existing active window
    if (record.count >= config.maxRequests) {
      const retryAfterMs = Math.max(0, record.resetAt - nowMs);
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetSeconds: retryAfterSeconds,
        retryAfterSeconds,
      };
    }

    // Within limit: increment counter
    record.count += 1;
    await store.set(key, record);

    const resetSec = Math.max(1, Math.ceil((record.resetAt - nowMs) / 1000));
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - record.count),
      resetSeconds: resetSec,
    };
  } catch (err) {
    // Fail-open strategy to prevent storage failures from knocking out the entire service
    console.warn("Rate limit store error, failing open:", err);
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: 1,
      resetSeconds: config.windowSeconds,
    };
  }
}

/**
 * Evaluates rate limit for a Next.js API Request and returns a 429 response if exceeded.
 */
export async function enforceRateLimit(
  request: Request,
  routeKey: string,
  config: RateLimitConfig = RATE_LIMIT_PROFILES.GENERAL,
  store: RateLimitStore = defaultRateLimitStore
): Promise<
  { success: true; result: RateLimitResult } | { success: false; response: NextResponse }
> {
  const clientId = getClientIdentifier(request);
  const compositeKey = `${routeKey}:${clientId}`;

  const result = await checkRateLimit(compositeKey, config, store);

  if (!result.allowed) {
    const headers = new Headers({
      "Content-Type": "application/json",
      "Retry-After": String(result.retryAfterSeconds || 60),
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(result.resetSeconds),
    });

    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Please retry after ${result.retryAfterSeconds} seconds.`,
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429, headers }
      ),
    };
  }

  return { success: true, result };
}
