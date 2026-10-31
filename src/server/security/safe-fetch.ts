/**
 * PageCast — Safe HTTP Fetcher with SSRF and DNS Rebinding Defense
 *
 * Implements a secure HTTP/HTTPS transport that:
 * 1. Enforces strict URL and IP validation.
 * 2. Pins DNS resolution to verified IP addresses, eliminating DNS rebinding attacks.
 * 3. Enforces recursive redirect safety validation (max 3 redirects).
 * 4. Limits response body to 2 MiB.
 * 5. Times out after 8 seconds.
 * 6. Rejects unsupported non-text MIME types.
 */

import http from "node:http";
import https from "node:https";
import { URL } from "node:url";
import { validateUrlForIngestion, SecurityError } from "./url-safety";
import type dns from "node:dns/promises";

export interface SafeFetchOptions {
  readonly timeoutMs?: number;
  readonly maxBytes?: number;
  readonly maxRedirects?: number;
  readonly dnsLookup?: typeof dns.lookup;
  readonly userAgent?: string;
}

export interface SafeFetchResult {
  readonly text: string;
  readonly finalUrl: string;
  readonly contentType: string;
  readonly bytesFetched: number;
  readonly statusCode: number;
}

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024; // 2 MiB
const DEFAULT_MAX_REDIRECTS = 3;
const DEFAULT_USER_AGENT = "PageCast-Teletext-Ingest/1.0 (+https://pagecast.org)";

/**
 * Executes a single HTTP/HTTPS request pinned to a pre-validated IP address,
 * enforcing response size bounds, content-type checks, and timeouts.
 */
function performSingleSafeRequest(
  targetUrl: string,
  pinnedIp: string,
  options: SafeFetchOptions
): Promise<{
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  body: string;
  bytes: number;
}> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const isHttps = parsed.protocol === "https:";
    const transport = isHttps ? https : http;

    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;

    // Pin DNS resolution to the pre-verified safe IP address to prevent DNS rebinding
    const pinningLookup = (
      _hostname: string,
      _lookupOptions: unknown,
      callback: (err: Error | null, address: string, family: number) => void
    ) => {
      const family = pinnedIp.includes(":") ? 6 : 4;
      callback(null, pinnedIp, family);
    };

    const requestOptions: https.RequestOptions = {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: `${parsed.pathname}${parsed.search}`,
      method: "GET",
      headers: {
        Host: parsed.host,
        "User-Agent": options.userAgent ?? DEFAULT_USER_AGENT,
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1",
        "Accept-Encoding": "identity", // Disable compression in base fetch to accurately bound bytes
        Connection: "close",
      },
      lookup: pinningLookup as unknown as typeof http.request extends (
        options: infer O,
        ...args: any[]
      ) => any
        ? O
        : never,
      // For HTTPS, SNI servername must match the requested domain name
      ...(isHttps ? { servername: parsed.hostname } : {}),
    };

    let timer: NodeJS.Timeout | null = null;
    let settled = false;

    const req = transport.request(requestOptions, (res) => {
      const statusCode = res.statusCode ?? 500;
      const contentType = res.headers["content-type"] ?? "";

      // For non-redirect responses, validate Content-Type immediately
      if (statusCode >= 200 && statusCode < 300) {
        const lowerType = contentType.toLowerCase();
        const isAllowedType =
          lowerType.includes("text/html") ||
          lowerType.includes("application/xhtml+xml") ||
          lowerType.includes("text/plain") ||
          lowerType.includes("application/xml");

        if (!isAllowedType && contentType !== "") {
          res.destroy();
          cleanup();
          return reject(
            new SecurityError(
              `Unsupported Content-Type '${contentType}'. Only HTML and text documents can be ingested.`,
              "UNSUPPORTED_MEDIA_TYPE"
            )
          );
        }
      }

      const chunks: Buffer[] = [];
      let totalBytes = 0;

      res.on("data", (chunk: Buffer) => {
        totalBytes += chunk.length;
        if (totalBytes > maxBytes) {
          res.destroy();
          cleanup();
          return reject(
            new SecurityError(
              `Response size exceeded the maximum allowed limit of ${maxBytes} bytes (2 MiB).`,
              "PAYLOAD_TOO_LARGE"
            )
          );
        }
        chunks.push(chunk);
      });

      res.on("end", () => {
        cleanup();
        const bodyBuffer = Buffer.concat(chunks);
        resolve({
          statusCode,
          headers: res.headers,
          body: bodyBuffer.toString("utf-8"),
          bytes: totalBytes,
        });
      });

      res.on("error", (err) => {
        cleanup();
        reject(err);
      });
    });

    req.on("error", (err) => {
      cleanup();
      reject(err);
    });

    // Enforce request timeout
    timer = setTimeout(() => {
      if (!settled) {
        req.destroy();
        cleanup();
        reject(
          new SecurityError(
            `Request timed out after ${timeoutMs}ms while fetching '${targetUrl}'.`,
            "REQUEST_TIMEOUT"
          )
        );
      }
    }, timeoutMs);

    function cleanup() {
      settled = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    req.end();
  });
}

/**
 * Safely fetches an external web article with full SSRF and redirect protection.
 */
export async function safeFetchArticle(
  initialUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  let currentUrl = initialUrl.trim();
  let redirectCount = 0;

  while (redirectCount <= maxRedirects) {
    // 1. Full URL & DNS safety check on the current hop
    const safety = await validateUrlForIngestion(currentUrl, {
      dnsLookup: options.dnsLookup,
    });

    if (!safety.valid || !safety.resolvedIps || safety.resolvedIps.length === 0) {
      throw new SecurityError(
        safety.error ?? `URL '${currentUrl}' failed security validation.`,
        "SSRF_VALIDATION_FAILED"
      );
    }

    // 2. Select the first verified safe IP for pinning
    const pinnedIp = safety.resolvedIps[0];

    // 3. Perform request pinned to safe IP
    const response = await performSingleSafeRequest(currentUrl, pinnedIp, options);

    // 4. Handle Redirects (301, 302, 303, 307, 308)
    const isRedirect =
      response.statusCode === 301 ||
      response.statusCode === 302 ||
      response.statusCode === 303 ||
      response.statusCode === 307 ||
      response.statusCode === 308;

    if (isRedirect) {
      redirectCount++;
      if (redirectCount > maxRedirects) {
        throw new SecurityError(
          `Maximum redirect limit of ${maxRedirects} hops exceeded.`,
          "TOO_MANY_REDIRECTS"
        );
      }

      const locationHeader = response.headers.location;
      if (!locationHeader) {
        throw new SecurityError(
          `Redirect response with status ${response.statusCode} missing 'Location' header.`,
          "INVALID_REDIRECT"
        );
      }

      // Resolve relative redirect against current URL
      try {
        currentUrl = new URL(locationHeader, currentUrl).toString();
      } catch {
        throw new SecurityError(
          `Malformed redirect Location header '${locationHeader}'.`,
          "INVALID_REDIRECT"
        );
      }

      // Loop continues with new URL
      continue;
    }

    // 5. Successful or terminal status code
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new SecurityError(
        `HTTP fetch failed with status ${response.statusCode} for '${currentUrl}'.`,
        `HTTP_${response.statusCode}`
      );
    }

    return {
      text: response.body,
      finalUrl: currentUrl,
      contentType: String(response.headers["content-type"] ?? "text/html"),
      bytesFetched: response.bytes,
      statusCode: response.statusCode,
    };
  }

  throw new SecurityError("Failed to fetch article: maximum redirects exceeded.");
}
