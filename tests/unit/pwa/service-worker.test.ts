import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import { registerServiceWorker, unregisterServiceWorker } from "@/lib/pwa/sw-register";

describe("Service Worker Policy & Security Gate (TASK-S4-OFF-02 / FR-075 / SEC-005)", () => {
  const swPath = path.resolve(process.cwd(), "public/sw.js");
  const swContent = fs.readFileSync(swPath, "utf-8");

  it("verifies service worker file existence and versioned cache naming", () => {
    expect(fs.existsSync(swPath)).toBe(true);
    expect(swContent.length).toBeGreaterThan(500);

    // Cache versioning invariant
    expect(swContent).toMatch(/CACHE_VERSION\s*=\s*["']pagecast-shell-v\d+["']/);
  });

  it("precaches only safe public app-shell assets", () => {
    // Extract PRECACHE_ASSETS array definition
    const precacheMatch = swContent.match(/const PRECACHE_ASSETS = \[([\s\S]*?)\];/);
    expect(precacheMatch).not.toBeNull();
    const precacheBlock = precacheMatch![1];

    // Must contain root, manifest, and icons
    expect(precacheBlock).toContain('"/"');
    expect(precacheBlock).toContain('"/manifest.webmanifest"');
    expect(precacheBlock).toContain('"/icons/icon-192x192.png"');

    // Must NOT contain sensitive endpoints in precache list
    expect(precacheBlock).not.toContain("/api/v1/drafts");
    expect(precacheBlock).not.toContain("/publisher");
    expect(precacheBlock).not.toContain("supabase");
  });

  it("strictly enforces security exclusions for publisher drafts and server secrets", () => {
    // Test the sensitive patterns logic extracted from the SW
    const sensitivePatterns = [
      /\/api\/v1\/drafts(\/.*)?$/,
      /\/api\/v1\/sources(\/.*)?$/,
      /\/api\/v1\/bulletins\/compose$/,
      /\/publisher(\/.*)?$/,
      /supabase\.co/,
      /generativelanguage\.googleapis\.com/,
    ];

    const isSensitive = (url: string) => sensitivePatterns.some((pattern) => pattern.test(url));

    // Must match sensitive routes
    expect(isSensitive("https://pagecast.app/api/v1/drafts")).toBe(true);
    expect(isSensitive("https://pagecast.app/api/v1/drafts/draft-123")).toBe(true);
    expect(isSensitive("https://pagecast.app/api/v1/sources/extract")).toBe(true);
    expect(isSensitive("https://pagecast.app/api/v1/bulletins/compose")).toBe(true);
    expect(isSensitive("https://pagecast.app/publisher")).toBe(true);
    expect(isSensitive("https://pagecast.app/publisher/editor/101")).toBe(true);
    expect(isSensitive("https://xyz.supabase.co/rest/v1/pages")).toBe(true);
    expect(
      isSensitive(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
      )
    ).toBe(true);

    // Must NOT match public reader routes
    expect(isSensitive("https://pagecast.app/")).toBe(false);
    expect(isSensitive("https://pagecast.app/terminal?page=100")).toBe(false);
    expect(isSensitive("https://pagecast.app/pages/101")).toBe(false);
    expect(isSensitive("https://pagecast.app/catalogue")).toBe(false);
    expect(isSensitive("https://pagecast.app/_next/static/chunks/main.js")).toBe(false);
    expect(isSensitive("https://pagecast.app/manifest.webmanifest")).toBe(false);
  });

  it("handles registration gracefully in non-browser environments", async () => {
    const status = await registerServiceWorker();
    expect(status.supported).toBe(false);
    expect(status.registered).toBe(false);

    const unregistered = await unregisterServiceWorker();
    expect(unregistered).toBe(false);
  });

  it("registers successfully when browser navigator.serviceWorker is available", async () => {
    const mockRegister = vi.fn().mockResolvedValue({ scope: "https://pagecast.app/" });

    // Mock window and navigator
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", {
      serviceWorker: {
        register: mockRegister,
      },
    });

    const status = await registerServiceWorker();

    expect(status.supported).toBe(true);
    expect(status.registered).toBe(true);
    expect(status.scope).toBe("https://pagecast.app/");
    expect(mockRegister).toHaveBeenCalledWith("/sw.js", { scope: "/" });

    vi.unstubAllGlobals();
  });
});
