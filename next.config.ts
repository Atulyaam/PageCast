import type { NextConfig } from "next";

/**
 * Builds Content Security Policy string.
 * Allows 'unsafe-eval' strictly in development mode for Turbopack/Next.js HMR debugging.
 * Production policy NEVER includes 'unsafe-eval'.
 */
export function buildCspHeader(isDev: boolean = false): string {
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval';"
    : "script-src 'self' 'unsafe-inline';";

  return `
  default-src 'self';
  ${scriptSrc}
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com;
  media-src 'self' blob:;
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Canonical production CSP (strictly without unsafe-eval)
export const productionCspHeader = buildCspHeader(false);

// Exported for backward-compatibility with tests and callers
export const isDevelopment = process.env.NODE_ENV === "development";
export const cspHeader = isDevelopment ? buildCspHeader(true) : productionCspHeader;

export function getSecurityHeaders(isDev: boolean = isDevelopment) {
  const csp = isDev ? buildCspHeader(true) : productionCspHeader;
  return [
    {
      key: "Content-Security-Policy",
      value: csp,
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(self), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
    },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
  ];
}

export const securityHeaders = getSecurityHeaders(isDevelopment);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getSecurityHeaders(process.env.NODE_ENV === "development"),
      },
    ];
  },
};

export default nextConfig;
