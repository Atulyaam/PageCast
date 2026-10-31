/**
 * PageCast — Deterministic Extractive Fallback Summarizer
 *
 * Provides resilient, zero-network, zero-cost bulletin composition when
 * external AI APIs are unconfigured, rate-limited, or unavailable.
 *
 * Invariant: 100% deterministic — same ExtractedSource produces identical BulletinDraft.
 * Never hallucinate facts or invent sentence IDs.
 */

import type { ExtractedSource, BulletinDraft, BulletinKeyPoint } from "@/domain/source-provenance/types";
import { validateBulletinDraft } from "@/domain/source-provenance/schema";

export interface ExtractiveSummarizerOptions {
  readonly language?: "en" | "hi";
  readonly targetPageNumber?: number;
  readonly maxKeyPoints?: number;
}

const ENGLISH_STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "up", "about", "into", "over", "after",
  "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
  "do", "does", "did", "can", "could", "will", "would", "shall", "should",
  "it", "its", "they", "them", "their", "we", "us", "our", "you", "your",
  "this", "that", "these", "those", "not", "also", "more", "as", "such"
]);

const HINDI_STOP_WORDS = new Set([
  "है", "हैं", "था", "थे", "थी", "का", "की", "के", "में", "से", "को",
  "पर", "और", "या", "यह", "वह", "ये", "वे", "तो", "ही", "भी", "ने",
  "किया", "गया", "गई", "गए", "कर", "रहे", "रहा", "रही", "होता", "होती"
]);

/**
 * Computes an importance score for each sentence based on word frequencies
 * and positional lead bonus.
 */
function scoreSentences(
  sentences: readonly { id: string; index: number; text: string }[],
  isHindi: boolean
): Array<{ index: number; score: number }> {
  const stopWords = isHindi ? HINDI_STOP_WORDS : ENGLISH_STOP_WORDS;
  const wordFreq = new Map<string, number>();

  // 1. Build word frequency map
  for (const s of sentences) {
    const words = s.text.toLowerCase().split(/\s+/);
    for (const word of words) {
      const clean = word.replace(/[^\p{L}\p{N}]/gu, "");
      if (clean.length > 2 && !stopWords.has(clean)) {
        wordFreq.set(clean, (wordFreq.get(clean) ?? 0) + 1);
      }
    }
  }

  // 2. Score sentences
  return sentences.map((s, idx) => {
    let score = 0;
    const words = s.text.toLowerCase().split(/\s+/);
    for (const word of words) {
      const clean = word.replace(/[^\p{L}\p{N}]/gu, "");
      if (wordFreq.has(clean)) {
        score += wordFreq.get(clean)!;
      }
    }

    // Lead sentence bonus
    if (idx === 0) {
      score *= 1.5;
    } else if (idx === 1) {
      score *= 1.2;
    }

    // Normalize slightly by length to prevent run-on sentence bias
    const lengthFactor = Math.sqrt(Math.max(words.length, 5));
    const normalizedScore = score / lengthFactor;

    return { index: idx, score: normalizedScore };
  });
}

/**
 * Generates an extractive, deterministic BulletinDraft from an ExtractedSource.
 */
export function generateExtractiveBulletin(
  source: ExtractedSource,
  options: ExtractiveSummarizerOptions = {}
): BulletinDraft {
  const language = options.language ?? source.language ?? "en";
  const isHindi = language === "hi";
  const maxPoints = options.maxKeyPoints ?? 3;
  const pageNumber = options.targetPageNumber ?? 101;

  const sentences = source.sentences;

  // Title formatting: clean, uppercase, strictly <= 38 characters
  let title = source.title.trim();
  if (title.length > 38) {
    title = `${title.slice(0, 35)}...`;
  }
  if (!isHindi) {
    title = title.toUpperCase();
  }

  // Headline
  const headline = source.title.length <= 70 ? source.title : `${source.title.slice(0, 67)}...`;

  // If no sentences exist, generate minimal notice
  if (!sentences || sentences.length === 0) {
    return validateBulletinDraft({
      sourceId: source.id,
      pageNumber,
      title: title || (isHindi ? "सूचना" : "NOTICE"),
      topic: isHindi ? "सूचना" : "BULLETIN",
      headline,
      summary: isHindi ? "कोई विवरण उपलब्ध नहीं है।" : "No source text available to summarize.",
      sections: [
        {
          heading: isHindi ? "विवरण" : "DETAILS",
          points: [
            {
              text: isHindi ? "स्रोत सामग्री उपलब्ध नहीं है।" : "Source content was not provided.",
              sourceSentenceIds: [],
            },
          ],
        },
      ],
      language,
      warnings: ["Generated via deterministic fallback summarizer."],
      metadata: {
        provider: "extractive-fallback",
        model: "text-frequency-v1",
        promptVersion: "1.0.0",
        generatedAt: new Date().toISOString(),
        humanReviewed: false,
      },
    });
  }

  // Summary: use first sentence (or trimmed version)
  const leadSentence = sentences[0].text;
  const summary =
    leadSentence.length > 200 ? `${leadSentence.slice(0, 197)}...` : leadSentence;

  // Key Points: score sentences, pick top N (excluding lead if more sentences available)
  const scored = scoreSentences(sentences, isHindi);
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  const selectedIndices = new Set<number>();
  // Include lead sentence index if very short article
  if (sentences.length <= 3) {
    for (let i = 0; i < sentences.length; i++) {
      selectedIndices.add(i);
    }
  } else {
    for (const item of scored) {
      if (selectedIndices.size >= maxPoints) break;
      selectedIndices.add(item.index);
    }
  }

  // Sort selected indices ascending to preserve chronological reading order
  const orderedIndices = Array.from(selectedIndices).sort((a, b) => a - b);

  const points: BulletinKeyPoint[] = orderedIndices.map((idx) => {
    const s = sentences[idx];
    const text = s.text.length > 120 ? `${s.text.slice(0, 117)}...` : s.text;
    return {
      text,
      sourceSentenceIds: [s.id],
    };
  });

  const rawDraft: BulletinDraft = {
    sourceId: source.id,
    pageNumber,
    title: title || (isHindi ? "समाचार" : "NEWS SUMMARY"),
    topic: isHindi ? "समाचार सारांश" : "NEWS SUMMARY",
    headline,
    summary,
    sections: [
      {
        heading: isHindi ? "मुख्य बिंदु" : "KEY DEVELOPMENTS",
        points: points.length > 0 ? points : [{ text: summary, sourceSentenceIds: [sentences[0].id] }],
      },
    ],
    language,
    warnings: ["Generated via deterministic extractive summarizer (fallback mode)."],
    metadata: {
      provider: "extractive-fallback",
      model: "text-frequency-v1",
      promptVersion: "1.0.0",
      generatedAt: new Date().toISOString(),
      humanReviewed: false,
    },
  };

  return validateBulletinDraft(rawDraft);
}
