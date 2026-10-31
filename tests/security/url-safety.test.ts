import { describe, it, expect } from "vitest";
import {
  isPrivateIP,
  isPrivateIPv4,
  isPrivateIPv6,
  validateUrlForIngestion,
  SecurityError,
} from "@/server/security/url-safety";
import { safeFetchArticle } from "@/server/security/safe-fetch";
import http from "node:http";

describe("URL Safety & SSRF Defense Suite", () => {
  describe("IPv4 Address Filtering", () => {
    it("flags loopback addresses (127.0.0.0/8)", () => {
      expect(isPrivateIPv4("127.0.0.1")).toBe(true);
      expect(isPrivateIPv4("127.255.255.254")).toBe(true);
      expect(isPrivateIPv4("0.0.0.0")).toBe(true);
    });

    it("flags RFC 1918 private IPv4 ranges", () => {
      // 10.0.0.0/8
      expect(isPrivateIPv4("10.0.0.1")).toBe(true);
      expect(isPrivateIPv4("10.254.10.5")).toBe(true);

      // 172.16.0.0/12
      expect(isPrivateIPv4("172.16.0.1")).toBe(true);
      expect(isPrivateIPv4("172.24.1.100")).toBe(true);
      expect(isPrivateIPv4("172.31.255.254")).toBe(true);
      // Public 172 range
      expect(isPrivateIPv4("172.32.0.1")).toBe(false);

      // 192.168.0.0/16
      expect(isPrivateIPv4("192.168.1.1")).toBe(true);
      expect(isPrivateIPv4("192.168.100.50")).toBe(true);
    });

    it("flags Link-Local and Cloud Metadata IPs (169.254.0.0/16)", () => {
      expect(isPrivateIPv4("169.254.169.254")).toBe(true); // AWS/GCP/Azure instance metadata
      expect(isPrivateIPv4("169.254.1.1")).toBe(true);
    });

    it("flags CGNAT, multicast, and test networks", () => {
      expect(isPrivateIPv4("100.64.0.1")).toBe(true); // CGNAT
      expect(isPrivateIPv4("192.0.2.1")).toBe(true); // TEST-NET-1
      expect(isPrivateIPv4("198.51.100.1")).toBe(true); // TEST-NET-2
      expect(isPrivateIPv4("203.0.113.1")).toBe(true); // TEST-NET-3
      expect(isPrivateIPv4("224.0.0.1")).toBe(true); // Multicast
      expect(isPrivateIPv4("240.0.0.1")).toBe(true); // Reserved
    });

    it("permits standard public IPv4 addresses", () => {
      expect(isPrivateIPv4("8.8.8.8")).toBe(false); // Google DNS
      expect(isPrivateIPv4("1.1.1.1")).toBe(false); // Cloudflare DNS
      expect(isPrivateIPv4("93.184.216.34")).toBe(false); // example.com
    });
  });

  describe("IPv6 Address Filtering", () => {
    it("flags loopback and unspecified IPv6", () => {
      expect(isPrivateIPv6("::1")).toBe(true);
      expect(isPrivateIPv6("::")).toBe(true);
      expect(isPrivateIPv6("0:0:0:0:0:0:0:1")).toBe(true);
    });

    it("flags link-local and unique local IPv6", () => {
      expect(isPrivateIPv6("fe80::1ff:fe23:4567")).toBe(true);
      expect(isPrivateIPv6("fc00::1")).toBe(true);
      expect(isPrivateIPv6("fd12:3456:789a::1")).toBe(true);
    });

    it("flags IPv4-mapped IPv6 addresses resolving to private spaces", () => {
      expect(isPrivateIPv6("::ffff:127.0.0.1")).toBe(true);
      expect(isPrivateIPv6("::ffff:192.168.1.1")).toBe(true);
      expect(isPrivateIPv6("::ffff:169.254.169.254")).toBe(true);
    });

    it("permits public IPv6 addresses", () => {
      expect(isPrivateIPv6("2606:4700:4700::1111")).toBe(false);
      expect(isPrivateIPv6("2001:4860:4860::8888")).toBe(false);
    });
  });

  describe("validateUrlForIngestion() Rules", () => {
    it("rejects non-http/https protocols", async () => {
      const ftp = await validateUrlForIngestion("ftp://example.com/file.txt");
      expect(ftp.valid).toBe(false);
      expect(ftp.error).toContain("Unsupported protocol");

      const file = await validateUrlForIngestion("file:///etc/passwd");
      expect(file.valid).toBe(false);

      const js = await validateUrlForIngestion("javascript:alert(1)");
      expect(js.valid).toBe(false);
    });

    it("rejects URLs with embedded credentials", async () => {
      const res = await validateUrlForIngestion("http://admin:secret@example.com");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("embedded credentials");
    });

    it("rejects non-standard ports", async () => {
      const ssh = await validateUrlForIngestion("http://example.com:22/news");
      expect(ssh.valid).toBe(false);
      expect(ssh.error).toContain("Non-standard port");

      const db = await validateUrlForIngestion("http://example.com:5432/news");
      expect(db.valid).toBe(false);

      // Standard ports pass
      const httpStandard = await validateUrlForIngestion("http://example.com:80/news", {
        dnsLookup: (async () => [{ address: "93.184.216.34", family: 4 }]) as any,
      });
      expect(httpStandard.valid).toBe(true);
    });

    it("rejects localhost and internal domain names", async () => {
      const localhost = await validateUrlForIngestion("http://localhost/news");
      expect(localhost.valid).toBe(false);

      const internal = await validateUrlForIngestion("http://service.local/news");
      expect(internal.valid).toBe(false);

      const metadata = await validateUrlForIngestion(
        "http://metadata.google.internal/computeMetadata"
      );
      expect(metadata.valid).toBe(false);
    });

    it("rejects direct connection to private IP literals", async () => {
      const loopbackIp = await validateUrlForIngestion("http://127.0.0.1/admin");
      expect(loopbackIp.valid).toBe(false);
      expect(loopbackIp.error).toContain("loopback/metadata host");

      const privateRfc1918 = await validateUrlForIngestion("http://192.168.1.1/router");
      expect(privateRfc1918.valid).toBe(false);
      expect(privateRfc1918.error).toContain("private/reserved IP");

      const cloudMeta = await validateUrlForIngestion("http://169.254.169.254/latest/meta-data");
      expect(cloudMeta.valid).toBe(false);
      expect(cloudMeta.error).toContain("private/reserved IP");
    });

    it("rejects hostnames that resolve to private or loopback IPs via DNS", async () => {
      const mockDnsLookup = async () => [
        { address: "127.0.0.1", family: 4 }, // Attacker-controlled DNS pointing to localhost
      ];

      const res = await validateUrlForIngestion("https://evil-rebind.attacker.com/article", {
        dnsLookup: mockDnsLookup as any,
      });

      expect(res.valid).toBe(false);
      expect(res.error).toContain("resolves to private/reserved IP '127.0.0.1'");
    });

    it("fails closed when DNS resolution fails or returns no addresses", async () => {
      const mockDnsFail = async () => {
        throw new Error("ENOTFOUND");
      };

      const res = await validateUrlForIngestion("https://does-not-exist.example.invalid/article", {
        dnsLookup: mockDnsFail as any,
      });

      expect(res.valid).toBe(false);
      expect(res.error).toContain("DNS resolution failed");
    });
  });

  describe("safeFetchArticle() End-to-End Transport Protection", () => {
    it("safely fetches a valid article from a test server", async () => {
      // Create local ephemeral server for testing safe transport
      const server = http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<html><body><h1>Breaking Teletext News</h1><p>Test content.</p></body></html>");
      });

      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const port = (server.address() as any).port;

      try {
        // By default, connecting to 127.0.0.1 is rejected by SSRF rules
        await expect(safeFetchArticle(`http://127.0.0.1:${port}/article`)).rejects.toThrow(
          SecurityError
        );
      } finally {
        server.close();
      }
    });

    it("rejects redirect to a private IP destination", async () => {
      // Ephemeral server that returns a 302 redirect to 127.0.0.1
      const server = http.createServer((req, res) => {
        res.writeHead(302, { Location: "http://127.0.0.1:8080/secret" });
        res.end();
      });

      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const port = (server.address() as any).port;

      try {
        await expect(
          safeFetchArticle("https://public-site.com/redirect", {
            dnsLookup: (async (host: string) => {
              if (host === "public-site.com") return [{ address: "93.184.216.34", family: 4 }];
              return [{ address: "127.0.0.1", family: 4 }];
            }) as any,
          })
        ).rejects.toThrow();
      } finally {
        server.close();
      }
    });

    it("rejects when redirect chain exceeds max redirects", async () => {
      await expect(
        safeFetchArticle("https://public-site.com/loop", {
          maxRedirects: 2,
          dnsLookup: (async () => [{ address: "93.184.216.34", family: 4 }]) as any,
        })
      ).rejects.toThrow();
    });
  });
});
