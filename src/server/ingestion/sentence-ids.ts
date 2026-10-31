/**
 * PageCast — Sentence Segmentation and Cryptographic Provenance
 *
 * Employs Unicode Intl.Segmenter with granularity: 'sentence' (supporting English
 * and Hindi Devanagari danda punctuation) to split source text into discrete,
 * verifiable sentences with stable sentence IDs.
 */

import crypto from "node:crypto";
import type { SourceSentence } from "@/domain/source-provenance/types";

/**
 * Computes a short, deterministic 8-character SHA-256 hash of a sentence text.
 */
export function hashSentence(text: string): string {
  return crypto.createHash("sha256").update(text.trim()).digest("hex").slice(0, 8);
}

/**
 * Segments text into discrete sentences using Unicode rules (or regex fallback),
 * filtering out blank lines and whitespace.
 */
export function segmentSentences(text: string, locale = "und"): string[] {
  if (!text || !text.trim()) {
    return [];
  }

  const normalized = text.replace(/\r\n/g, "\n").trim();

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(locale, { granularity: "sentence" });
    const segments = segmenter.segment(normalized);
    const results: string[] = [];

    for (const { segment } of segments) {
      const trimmed = segment.trim();
      if (trimmed.length > 0) {
        // Further split on newlines if multiple paragraphs got grouped into one sentence
        const lines = trimmed
          .split(/\n+/)
          .map((l) => l.trim())
          .filter(Boolean);
        results.push(...lines);
      }
    }

    return results;
  }

  // Fallback regex splitting on English (. ! ?) and Hindi (। ॥) sentence delimiters
  return normalized
    .split(/(?<=[.!?।॥])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Transforms raw source text into an array of verifiable SourceSentence objects
 * with sequential IDs (s1, s2, ...) and deterministic hashes.
 */
export function createSourceSentences(
  text: string,
  locale = "und",
  idPrefix = "s"
): SourceSentence[] {
  const rawSentences = segmentSentences(text, locale);
  return rawSentences.map((sentenceText, index) => ({
    id: `${idPrefix}${index + 1}`,
    index,
    text: sentenceText,
    hash: hashSentence(sentenceText),
  }));
}
