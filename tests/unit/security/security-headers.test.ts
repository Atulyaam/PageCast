import { describe, it, expect } from "vitest";
import nextConfig, { securityHeaders, cspHeader } from "@/../next.config";

describe("Production Security Headers & CSP (TASK-S5-03 / SEC-010)", () => {
  it("defines comprehensive security headers for all routes (/:path*)", async () => {
    expect(nextConfig.headers).toBeDefined();
    const routeHeaders = await nextConfig.headers!();

    expect(routeHeaders).toHaveLength(1);
    expect(routeHeaders[0].source).toBe("/:path*");
    expect(routeHeaders[0].headers).toEqual(securityHeaders);
  });

  it("configures strict Content-Security-Policy (CSP)", () => {
    const csp = securityHeaders.find((h) => h.key === "Content-Security-Policy");
    expect(csp).toBeDefined();
    expect(csp?.value).toBe(cspHeader);

    // Verify critical CSP directives
    expect(csp?.value).toContain("default-src 'self'");
    expect(csp?.value).toContain("frame-ancestors 'none'");
    expect(csp?.value).toContain("object-src 'none'");
    expect(csp?.value).toContain("base-uri 'self'");
    expect(csp?.value).toContain("form-action 'self'");
    expect(csp?.value).toContain("img-src 'self' data: blob:");
    expect(csp?.value).toContain("media-src 'self' blob:");
    expect(csp?.value).toContain("https://*.supabase.co");
  });

  it("configures HSTS (Strict-Transport-Security)", () => {
    const hsts = securityHeaders.find((h) => h.key === "Strict-Transport-Security");
    expect(hsts).toBeDefined();
    expect(hsts?.value).toContain("max-age=63072000");
    expect(hsts?.value).toContain("includeSubDomains");
  });

  it("configures clickjacking and MIME sniffing protections", () => {
    const nosniff = securityHeaders.find((h) => h.key === "X-Content-Type-Options");
    expect(nosniff?.value).toBe("nosniff");

    const frameOptions = securityHeaders.find((h) => h.key === "X-Frame-Options");
    expect(frameOptions?.value).toBe("DENY");

    const referrer = securityHeaders.find((h) => h.key === "Referrer-Policy");
    expect(referrer?.value).toBe("strict-origin-when-cross-origin");
  });

  it("configures Permissions-Policy allowing camera for QR and restricting dangerous APIs", () => {
    const permissions = securityHeaders.find((h) => h.key === "Permissions-Policy");
    expect(permissions).toBeDefined();
    expect(permissions?.value).toContain("camera=(self)");
    expect(permissions?.value).toContain("microphone=()");
    expect(permissions?.value).toContain("geolocation=()");
  });
});
