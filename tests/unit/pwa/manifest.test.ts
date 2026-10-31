import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import manifest from "@/app/manifest";

describe("PWA Manifest & Icon Validation (TASK-S4-OFF-01 / FR-070)", () => {
  it("generates a compliant W3C Web App Manifest", () => {
    const config = manifest();

    expect(config.name).toContain("PageCast");
    expect(config.short_name).toBe("PageCast");
    expect(config.start_url).toBe("/");
    expect(config.display).toBe("standalone");
    expect(config.theme_color).toBe("#000000");
    expect(config.background_color).toBe("#050505");
    expect(config.icons).toBeDefined();
    expect(config.icons?.length).toBeGreaterThanOrEqual(3);

    const sizes = config.icons?.map((icon) => icon.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");

    const maskable = config.icons?.find((icon) => icon.purpose === "maskable");
    expect(maskable).toBeDefined();
    expect(maskable?.sizes).toBe("512x512");
  });

  it("verifies physical existence of PWA icon assets on disk", () => {
    const publicDir = path.resolve(process.cwd(), "public");

    const icon192 = path.join(publicDir, "icons/icon-192x192.png");
    const icon512 = path.join(publicDir, "icons/icon-512x512.png");
    const iconMaskable = path.join(publicDir, "icons/icon-maskable-512x512.png");
    const favicon = path.join(publicDir, "favicon.ico");

    expect(fs.existsSync(icon192)).toBe(true);
    expect(fs.existsSync(icon512)).toBe(true);
    expect(fs.existsSync(iconMaskable)).toBe(true);
    expect(fs.existsSync(favicon)).toBe(true);

    // Verify non-empty files
    expect(fs.statSync(icon192).size).toBeGreaterThan(500);
    expect(fs.statSync(icon512).size).toBeGreaterThan(1000);
  });

  it("verifies valid PNG binary signature of icon assets", () => {
    const icon192Path = path.resolve(process.cwd(), "public/icons/icon-192x192.png");
    const buffer = fs.readFileSync(icon192Path);

    // PNG Magic bytes: 89 50 4E 47 0D 0A 1A 0A
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (let i = 0; i < 8; i++) {
      expect(buffer[i]).toBe(pngSignature[i]);
    }
  });
});

