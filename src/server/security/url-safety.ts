/**
 * PageCast — URL Safety & SSRF Protection Engine
 *
 * Implements multi-layered defense-in-depth against Server-Side Request Forgery (SSRF),
 * DNS rebinding, private network scanning, and resource exhaustion.
 *
 * Invariant: Never allow outbound requests to loopback, private, link-local,
 * cloud metadata (169.254.169.254), or reserved networks.
 */

import net from "node:net";
import dns from "node:dns/promises";

export interface UrlValidationResult {
  readonly valid: boolean;
  readonly error?: string;
  readonly sanitizedUrl?: string;
  readonly resolvedIps?: readonly string[];
}

export class SecurityError extends Error {
  readonly code: string;

  constructor(message: string, code = "SECURITY_VIOLATION") {
    super(message);
    this.name = "SecurityError";
    this.code = code;
  }
}

/**
 * Parses an IPv4 address into its 4 octets. Returns null if invalid IPv4.
 */
function parseIPv4(ip: string): [number, number, number, number] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return null;
  }

  const octets: number[] = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      return null;
    }
    const num = Number.parseInt(part, 10);
    if (num < 0 || num > 255) {
      return null;
    }
    octets.push(num);
  }

  return octets as [number, number, number, number];
}

/**
 * Checks whether an IPv4 address belongs to a private, loopback, link-local,
 * or reserved address space.
 */
export function isPrivateIPv4(ip: string): boolean {
  const octets = parseIPv4(ip);
  if (!octets) {
    return true; // Fail closed if not a valid IPv4
  }

  const [o0, o1, o2] = octets;

  // 0.0.0.0/8 — Current network ("this host")
  if (o0 === 0) {
    return true;
  }

  // 10.0.0.0/8 — Private-Use (RFC 1918)
  if (o0 === 10) {
    return true;
  }

  // 100.64.0.0/10 — Shared Address Space / CGNAT (RFC 6598)
  if (o0 === 100 && o1 >= 64 && o1 <= 127) {
    return true;
  }

  // 127.0.0.0/8 — Loopback (RFC 1122)
  if (o0 === 127) {
    return true;
  }

  // 169.254.0.0/16 — Link-Local (RFC 3927) includes Cloud Metadata 169.254.169.254
  if (o0 === 169 && o1 === 254) {
    return true;
  }

  // 172.16.0.0/12 — Private-Use (RFC 1918)
  if (o0 === 172 && o1 >= 16 && o1 <= 31) {
    return true;
  }

  // 192.0.0.0/24 — IETF Protocol Assignments
  // 192.0.2.0/24 — TEST-NET-1 (RFC 5737)
  if (o0 === 192 && o1 === 0 && (o2 === 0 || o2 === 2)) {
    return true;
  }

  // 192.168.0.0/16 — Private-Use (RFC 1918)
  if (o0 === 192 && o1 === 168) {
    return true;
  }

  // 198.18.0.0/15 — Benchmarking (RFC 2544)
  if (o0 === 198 && (o1 === 18 || o1 === 19)) {
    return true;
  }

  // 198.51.100.0/24 — TEST-NET-2 (RFC 5737)
  if (o0 === 198 && o1 === 51 && o2 === 100) {
    return true;
  }

  // 203.0.113.0/24 — TEST-NET-3 (RFC 5737)
  if (o0 === 203 && o1 === 0 && o2 === 113) {
    return true;
  }

  // 224.0.0.0/4 — Multicast (RFC 5771)
  if (o0 >= 224 && o0 <= 239) {
    return true;
  }

  // 240.0.0.0/4 — Reserved for Future Use (RFC 1112)
  if (o0 >= 240) {
    return true;
  }

  return false;
}

/**
 * Checks whether an IPv6 address belongs to a private, loopback, link-local,
 * or IPv4-mapped address space.
 */
export function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  // ::1 — Loopback
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") {
    return true;
  }

  // :: — Unspecified
  if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") {
    return true;
  }

  // IPv4-mapped IPv6 address (::ffff:192.168.1.1 or ::ffff:7f00:1)
  if (normalized.startsWith("::ffff:") || normalized.startsWith("0:0:0:0:0:ffff:")) {
    const parts = normalized.split(":");
    const lastPart = parts[parts.length - 1];
    if (net.isIPv4(lastPart)) {
      return isPrivateIPv4(lastPart);
    }
    return true; // Fail closed for hex-formatted mapped addresses
  }

  // fe80::/10 — Link-local unicast
  if (
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  ) {
    return true;
  }

  // fc00::/7 — Unique Local Address (ULA)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }

  // ff00::/8 — Multicast
  if (normalized.startsWith("ff")) {
    return true;
  }

  // 2001:db8::/32 — Documentation
  if (normalized.startsWith("2001:db8")) {
    return true;
  }

  return false;
}

/**
 * Evaluates whether an IP address (v4 or v6) is private or reserved.
 */
export function isPrivateIP(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) {
    return isPrivateIPv4(ip);
  }
  if (version === 6) {
    return isPrivateIPv6(ip);
  }
  // If not recognized as a valid IP, fail closed
  return true;
}

/**
 * Validates a target URL string against SSRF security policies:
 * - Scheme must be http: or https:
 * - Credentials (user:pass) are forbidden
 * - Ports must be standard (80 or 443)
 * - Hostname cannot be localhost or local tld (.local, .internal, .lan, etc.)
 * - DNS resolution cannot resolve to private/loopback/link-local/cloud-metadata addresses
 */
export async function validateUrlForIngestion(
  rawUrl: string,
  options?: { dnsLookup?: typeof dns.lookup }
): Promise<UrlValidationResult> {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, error: "URL cannot be empty" };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { valid: false, error: "Malformed URL syntax" };
  }

  // 1. Protocol check
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      valid: false,
      error: `Unsupported protocol '${parsed.protocol}'. Only http: and https: are allowed.`,
    };
  }

  // 2. Disallow user:password embedded credentials
  if (parsed.username || parsed.password) {
    return {
      valid: false,
      error: "URLs with embedded credentials (user:password) are forbidden.",
    };
  }

  // 3. Port check (allow standard 80 / 443 or omitted)
  if (parsed.port) {
    const portNum = Number.parseInt(parsed.port, 10);
    const isStandard =
      (parsed.protocol === "http:" && portNum === 80) ||
      (parsed.protocol === "https:" && portNum === 443);
    if (!isStandard) {
      return {
        valid: false,
        error: `Non-standard port '${parsed.port}' is forbidden for ingestion.`,
      };
    }
  }

  const hostname = parsed.hostname.toLowerCase().trim();

  // 4. Block obvious localhost & private domain suffixes
  const blockedHostnames = new Set([
    "localhost",
    "localhost.localdomain",
    "127.0.0.1",
    "::1",
    "0.0.0.0",
    "metadata.google.internal",
    "instance-data",
  ]);

  if (blockedHostnames.has(hostname)) {
    return {
      valid: false,
      error: `Access to loopback/metadata host '${hostname}' is strictly forbidden.`,
    };
  }

  const blockedSuffixes = [".local", ".internal", ".lan", ".home", ".corp", ".arpa"];
  if (blockedSuffixes.some((suffix) => hostname.endsWith(suffix))) {
    return {
      valid: false,
      error: `Access to local/internal domain '${hostname}' is strictly forbidden.`,
    };
  }

  // 5. If hostname is directly an IP literal, validate immediately
  const ipVersion = net.isIP(hostname);
  if (ipVersion !== 0) {
    if (isPrivateIP(hostname)) {
      return {
        valid: false,
        error: `Direct connection to private/reserved IP '${hostname}' is forbidden.`,
      };
    }
    return {
      valid: true,
      sanitizedUrl: parsed.toString(),
      resolvedIps: [hostname],
    };
  }

  // 6. Perform DNS resolution check
  const lookupFn = options?.dnsLookup ?? dns.lookup;
  let resolvedAddresses: Array<{ address: string; family: number }>;

  try {
    const results = await lookupFn(hostname, { all: true });
    resolvedAddresses = results;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      valid: false,
      error: `DNS resolution failed for host '${hostname}': ${msg}`,
    };
  }

  if (!resolvedAddresses || resolvedAddresses.length === 0) {
    return {
      valid: false,
      error: `DNS resolution returned no IP addresses for host '${hostname}'.`,
    };
  }

  const resolvedIps = resolvedAddresses.map((r) => r.address);

  // 7. Every resolved IP MUST be checked. If ANY IP is private, fail closed!
  for (const ip of resolvedIps) {
    if (isPrivateIP(ip)) {
      return {
        valid: false,
        error: `Host '${hostname}' resolves to private/reserved IP '${ip}', which is strictly forbidden.`,
      };
    }
  }

  return {
    valid: true,
    sanitizedUrl: parsed.toString(),
    resolvedIps,
  };
}
