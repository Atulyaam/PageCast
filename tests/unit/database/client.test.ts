import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getSupabaseConfig,
  isValidSupabaseUrl,
  isNonPlaceholderKey,
  maskKey,
} from "@/server/database/config";
import {
  getSupabaseBrowserClient,
  getSupabaseServerClient,
  isSupabaseConfigured,
  resetClientSingletonsForTesting,
} from "@/server/database/client";

describe("Supabase Configuration & Client Factory (TASK-S3-01)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetClientSingletonsForTesting();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    resetClientSingletonsForTesting();
  });

  describe("Configuration & Environment Helpers", () => {
    it("recognizes placeholder URLs as invalid/unconfigured", () => {
      expect(isValidSupabaseUrl("https://your-project.supabase.co")).toBe(false);
      expect(isValidSupabaseUrl(undefined)).toBe(false);
      expect(isValidSupabaseUrl("not-a-valid-url")).toBe(false);
    });

    it("recognizes valid Supabase URLs", () => {
      expect(isValidSupabaseUrl("https://xyzcompany.supabase.co")).toBe(true);
      expect(isValidSupabaseUrl("http://localhost:54321")).toBe(true);
    });

    it("recognizes placeholder keys", () => {
      expect(isNonPlaceholderKey("your-supabase-anon-key")).toBe(false);
      expect(isNonPlaceholderKey("placeholder-key")).toBe(false);
      expect(isNonPlaceholderKey("short")).toBe(false);
      expect(
        isNonPlaceholderKey("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.real.token.for.supabase.testing")
      ).toBe(true);
    });

    it("masks sensitive secrets safely", () => {
      expect(maskKey(null)).toBe("[NOT_SET]");
      expect(maskKey(undefined)).toBe("[NOT_SET]");
      expect(maskKey("12345")).toBe("[MASKED]");
      expect(maskKey("sbp_1234567890abcdef")).toBe("sbp_...cdef");
    });

    it("reports isConfigured as false when environment uses placeholders", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-supabase-anon-key";
      expect(isSupabaseConfigured()).toBe(false);
    });

    it("reports isConfigured as true when valid credentials are provided", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://myproject.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid.token";
      expect(isSupabaseConfigured()).toBe(true);
    });
  });

  describe("Client Factory & Secret Isolation", () => {
    it("instantiates browser client with anon key", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://myproject.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid.token";

      const client = getSupabaseBrowserClient();
      expect(client).toBeDefined();
      expect(typeof client.from).toBe("function");
      expect(typeof client.auth.getSession).toBe("function");

      // Verify singleton caching
      const client2 = getSupabaseBrowserClient();
      expect(client2).toBe(client);
    });

    it("instantiates server client with service role key", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://myproject.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon.token";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service.token";

      const client = getSupabaseServerClient();
      expect(client).toBeDefined();
      expect(typeof client.from).toBe("function");
      expect(typeof client.auth.admin).toBe("object");

      // Verify singleton caching
      const client2 = getSupabaseServerClient();
      expect(client2).toBe(client);
    });

    it("throws a security error if getSupabaseServerClient is called in browser", () => {
      // Simulate browser runtime
      const originalWindow = global.window;
      try {
        // @ts-expect-error Mocking window global
        global.window = {};
        expect(() => getSupabaseServerClient()).toThrow(/SECURITY VIOLATION/);
      } finally {
        global.window = originalWindow;
      }
    });
  });
});
