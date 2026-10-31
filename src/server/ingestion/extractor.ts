/**
 * PageCast — Secure Article Content Extractor
 *
 * Extracts readable article content and metadata from HTML documents or pasted text
 * without executing client scripts or fetching external sub-resources.
 *
 * Invariant: Never execute JavaScript. Record missing metadata as undefined
 * rather than fabricating values.
 */

import crypto from "node:crypto";
import type { ExtractedSource } from "@/domain/source-provenance/types";
import { createSourceSentences } from "./sentence-ids";

export interface ExtractionOptions {
  readonly language?: "en" | "hi";
  readonly maxContentChars?: number;
}

const DEFAULT_MAX_CONTENT_CHARS = 100_000;

/**
 * Decodes common HTML entities into their plain text Unicode characters.
 */
export function decodeHtmlEntities(html: string): string {
  if (!html) {
    return "";
  }

  return html
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCodePoint(Number.parseInt(dec, 10));
      } catch {
        return "";
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        return String.fromCodePoint(Number.parseInt(hex, 16));
      } catch {
        return "";
      }
    });
}

/**
 * Strips HTML tags, comments, and noise containers from an HTML string.
 */
export function cleanHtmlToText(html: string): string {
  if (!html) {
    return "";
  }

  let cleaned = html;

  // 1. Remove comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");

  // 2. Remove script, style, iframe, svg, noscript
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, "");
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, "");
  cleaned = cleaned.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  cleaned = cleaned.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  cleaned = cleaned.replace(/<svg[\s\S]*?<\/svg>/gi, "");

  // 3. Remove non-content structural containers
  cleaned = cleaned.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  cleaned = cleaned.replace(/<header[\s\S]*?<\/header>/gi, "");
  cleaned = cleaned.replace(/<footer[\s\S]*?<\/footer>/gi, "");
  cleaned = cleaned.replace(/<aside[\s\S]*?<\/aside>/gi, "");
  cleaned = cleaned.replace(/<form[\s\S]*?<\/form>/gi, "");
  cleaned = cleaned.replace(/<button[\s\S]*?<\/button>/gi, "");
  cleaned = cleaned.replace(/<menu[\s\S]*?<\/menu>/gi, "");

  // 4. Convert block elements to newlines
  cleaned = cleaned.replace(/<\/(p|div|h[1-6]|li|blockquote|tr|section|article)>/gi, "\n\n");
  cleaned = cleaned.replace(/<br\s*\/?>/gi, "\n");

  // 5. Strip all remaining tags
  cleaned = cleaned.replace(/<[^>]+>/g, "");

  // 6. Decode HTML entities
  cleaned = decodeHtmlEntities(cleaned);

  // 7. Normalize whitespace
  const lines = cleaned.split("\n").map((line) => line.replace(/[ \t]+/g, " ").trim());

  // Collapse consecutive empty lines
  const result: string[] = [];
  let prevEmpty = false;
  for (const line of lines) {
    if (!line) {
      if (!prevEmpty) {
        result.push("");
        prevEmpty = true;
      }
    } else {
      result.push(line);
      prevEmpty = false;
    }
  }

  return result.join("\n").trim();
}

/**
 * Extracts meta tag content by property or name attribute.
 */
function extractMeta(html: string, attrName: string, attrValue: string): string | undefined {
  const regex = new RegExp(
    `<meta[^>]*?${attrName}=["']${attrValue}["'][^>]*?content=["']([^"']+)["']|<meta[^>]*?content=["']([^"']+)["'][^>]*?${attrName}=["']${attrValue}["']`,
    "i"
  );
  const match = html.match(regex);
  const val = match ? match[1] || match[2] : undefined;
  return val ? decodeHtmlEntities(val.trim()) : undefined;
}

/**
 * Extracts the title of the document.
 */
function extractTitle(html: string): string {
  // 1. og:title or twitter:title
  const ogTitle =
    extractMeta(html, "property", "og:title") || extractMeta(html, "name", "twitter:title");
  if (ogTitle) {
    return ogTitle;
  }

  // 2. <title>...</title>
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    const raw = titleMatch[1].trim();
    return decodeHtmlEntities(raw.replace(/\s+/g, " "));
  }

  // 3. First <h1> tag
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    return cleanHtmlToText(h1Match[1]);
  }

  return "Untitled Bulletin Source";
}

/**
 * Extracts main body text from an HTML document.
 */
function extractMainBody(html: string): string {
  // Try <article> tag first
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch && articleMatch[1]) {
    const text = cleanHtmlToText(articleMatch[1]);
    if (text.length > 50) {
      return text;
    }
  }

  // Try <main> tag second
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch && mainMatch[1]) {
    const text = cleanHtmlToText(mainMatch[1]);
    if (text.length > 50) {
      return text;
    }
  }

  // Fallback to body or entire cleaned HTML
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    return cleanHtmlToText(bodyMatch[1]);
  }

  return cleanHtmlToText(html);
}

/**
 * Extracts structured article content and metadata from an HTML document.
 */
export function extractArticleFromHtml(
  html: string,
  canonicalUrl: string,
  options: ExtractionOptions = {}
): ExtractedSource {
  const language = options.language ?? (html.includes('lang="hi"') ? "hi" : "en");
  const maxChars = options.maxContentChars ?? DEFAULT_MAX_CONTENT_CHARS;

  const title = extractTitle(html);
  const siteName =
    extractMeta(html, "property", "og:site_name") ??
    new URL(canonicalUrl).hostname.replace(/^www\./, "");
  const byline =
    extractMeta(html, "name", "author") ?? extractMeta(html, "property", "article:author");
  const publishedTime =
    extractMeta(html, "property", "article:published_time") ?? extractMeta(html, "name", "pubdate");

  let rawContent = extractMainBody(html);
  if (rawContent.length > maxChars) {
    rawContent = rawContent.slice(0, maxChars);
  }

  // If no content could be found, provide a graceful single-sentence fallback
  if (!rawContent.trim()) {
    rawContent = title;
  }

  const sentences = createSourceSentences(rawContent, language);

  return {
    id: crypto.randomUUID(),
    url: canonicalUrl,
    title,
    siteName,
    byline,
    publishedTime,
    fetchedAt: new Date().toISOString(),
    content: rawContent,
    sentences,
    language,
  };
}

/**
 * Extracts structured article content from raw user-pasted text.
 */
export function extractFromPastedText(
  rawText: string,
  metadata?: {
    title?: string;
    siteName?: string;
    byline?: string;
    language?: "en" | "hi";
  }
): ExtractedSource {
  const text = (rawText || "").trim();
  const language = metadata?.language ?? "en";

  // If no explicit title, use the first non-empty line (capped to 60 chars)
  let title = metadata?.title?.trim();
  if (!title) {
    const firstLine = text.split("\n")[0] ?? "Pasted Article";
    title = firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine;
  }

  const sentences = createSourceSentences(text, language);

  return {
    id: crypto.randomUUID(),
    url: "text://pasted-source",
    title: title || "Pasted Notice",
    siteName: metadata?.siteName ?? "Direct Input",
    byline: metadata?.byline,
    fetchedAt: new Date().toISOString(),
    content: text,
    sentences: sentences.length > 0 ? sentences : createSourceSentences(title, language),
    language,
  };
}
