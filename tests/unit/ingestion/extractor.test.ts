import { describe, it, expect } from "vitest";
import {
  cleanHtmlToText,
  decodeHtmlEntities,
  extractArticleFromHtml,
  extractFromPastedText,
} from "@/server/ingestion/extractor";

describe("Article Content Extractor Suite", () => {
  it("decodes HTML entities into Unicode characters", () => {
    const raw = "Tom &amp; Jerry &quot;Show&quot; &#39;Special&#39; &mdash; 5 &lt; 10 &gt; 2";
    const decoded = decodeHtmlEntities(raw);
    expect(decoded).toBe("Tom & Jerry \"Show\" 'Special' — 5 < 10 > 2");
  });

  it("strips scripts, styles, navigation, footer, and ads", () => {
    const dirtyHtml = `
      <html>
        <head>
          <script>alert("malicious script");</script>
          <style>body { color: red; }</style>
        </head>
        <body>
          <header><nav><a href="/">Home</a><a href="/news">News</a></nav></header>
          <aside class="ad-banner">Buy widgets now!</aside>
          <article>
            <h1>Major Tech Breakthrough</h1>
            <p>Engineers have resurrected retro teletext.</p>
            <p>It transmits essential news at 10 KiB.</p>
          </article>
          <footer>&copy; 2026 Evil Tracking Corp. All rights reserved.</footer>
        </body>
      </html>
    `;

    const cleaned = cleanHtmlToText(dirtyHtml);
    expect(cleaned).not.toContain("alert");
    expect(cleaned).not.toContain("Buy widgets");
    expect(cleaned).not.toContain("Home");
    expect(cleaned).not.toContain("Evil Tracking Corp");
    expect(cleaned).toContain("Major Tech Breakthrough");
    expect(cleaned).toContain("Engineers have resurrected retro teletext.");
  });

  it("extracts structured article and metadata from HTML", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Apollo Returns to Lunar Orbit | Space News</title>
          <meta property="og:title" content="Apollo Returns to Lunar Orbit" />
          <meta property="og:site_name" content="Space Daily" />
          <meta name="author" content="Gene Kranz" />
          <meta property="article:published_time" content="2026-10-31T12:00:00Z" />
        </head>
        <body>
          <main>
            <p>The spacecraft completed its orbital insertion burn successfully.</p>
            <p>Telemetry indicates all subsystems are nominal.</p>
          </main>
        </body>
      </html>
    `;

    const extracted = extractArticleFromHtml(html, "https://spacedaily.com/apollo-mission");

    expect(extracted.title).toBe("Apollo Returns to Lunar Orbit");
    expect(extracted.siteName).toBe("Space Daily");
    expect(extracted.byline).toBe("Gene Kranz");
    expect(extracted.publishedTime).toBe("2026-10-31T12:00:00Z");
    expect(extracted.sentences.length).toBe(2);
    expect(extracted.sentences[0].id).toBe("s1");
    expect(extracted.sentences[0].text).toContain("orbital insertion burn");
  });

  it("records missing metadata as undefined rather than fabricating false values", () => {
    const bareHtml = `
      <html>
        <body>
          <p>Bare notice without any meta tags or author credits.</p>
        </body>
      </html>
    `;

    const extracted = extractArticleFromHtml(bareHtml, "https://example.com/bare-notice");
    expect(extracted.byline).toBeUndefined();
    expect(extracted.publishedTime).toBeUndefined();
    expect(extracted.title).toBe("Untitled Bulletin Source");
    expect(extracted.sentences.length).toBe(1);
  });

  it("correctly handles Hindi Devanagari HTML content", () => {
    const hindiHtml = `
      <html lang="hi">
        <head>
          <title>मौसम बुलेटिन: भारी वर्षा की चेतावनी</title>
        </head>
        <body>
          <article>
            <h1>मौसम बुलेटिन</h1>
            <p>नई दिल्ली में कल रात से भारी वर्षा हो रही है। मौसम विभाग ने अलर्ट जारी किया है।</p>
          </article>
        </body>
      </html>
    `;

    const extracted = extractArticleFromHtml(hindiHtml, "https://weather.in/delhi", {
      language: "hi",
    });

    expect(extracted.language).toBe("hi");
    expect(extracted.title).toBe("मौसम बुलेटिन: भारी वर्षा की चेतावनी");
    expect(extracted.sentences.length).toBeGreaterThanOrEqual(2);
    expect(extracted.sentences[0].text).toBe("मौसम बुलेटिन");
    expect(extracted.sentences[1].text).toContain("नई दिल्ली");
  });

  it("extracts source from user-pasted text directly", () => {
    const pasted = `Breaking Emergency Dispatch
Flood waters are receding across the eastern valley.
Shelters have sufficient food and clean drinking water.
Transportation services resume tomorrow morning.`;

    const extracted = extractFromPastedText(pasted, {
      title: "Flood Recovery Update",
      byline: "Disaster Relief Operations",
    });

    expect(extracted.url).toBe("text://pasted-source");
    expect(extracted.title).toBe("Flood Recovery Update");
    expect(extracted.byline).toBe("Disaster Relief Operations");
    expect(extracted.sentences.length).toBe(4);
    expect(extracted.sentences[0].id).toBe("s1");
  });
});
