/**
 * PageCast — Bulletin Composition Orchestrator
 *
 * Coordinates prompt generation, AI provider invocation, sentence provenance validation,
 * and seamless fallback to deterministic extractive summarization.
 */

import type { ExtractedSource, BulletinDraft } from "@/domain/source-provenance/types";
import { validateSentenceProvenance } from "@/domain/source-provenance/schema";
import type { AiProvider } from "./provider";
import { MockAiProvider } from "./mock-adapter";
import { GeminiAiProvider } from "./gemini-adapter";
import { generateExtractiveBulletin } from "./extractive-fallback";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";

export interface ComposeOptions {
  readonly language?: "en" | "hi";
  readonly targetPageNumber?: number;
  readonly provider?: AiProvider;
  readonly forceExtractiveFallback?: boolean;
}

/**
 * Resolves the default AI provider based on environment variables and credentials.
 */
export function getDefaultAiProvider(): AiProvider {
  const providerName = (process.env.PAGECAST_AI_PROVIDER ?? "google").toLowerCase();

  if (providerName === "mock") {
    return new MockAiProvider();
  }

  const hasGeminiKey = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim());
  if (hasGeminiKey) {
    return new GeminiAiProvider();
  }

  // If no Gemini key in environment, default to Mock in non-production
  return new MockAiProvider();
}

/**
 * Composes a structured BulletinDraft from an ExtractedSource.
 * Employs AI provider if available, automatically falling back to deterministic
 * extractive summarization on any AI error or quota exhaustion.
 */
export async function composeBulletin(
  source: ExtractedSource,
  options: ComposeOptions = {}
): Promise<BulletinDraft> {
  const language = options.language ?? source.language ?? "en";
  const pageNumber = options.targetPageNumber ?? 101;

  // If client explicitly requests extractive fallback, run deterministic summarizer directly
  if (options.forceExtractiveFallback) {
    return generateExtractiveBulletin(source, {
      language,
      targetPageNumber: pageNumber,
    });
  }

  const provider = options.provider ?? getDefaultAiProvider();
  const systemPrompt = buildSystemPrompt(language);
  const userPrompt = buildUserPrompt(source, language, pageNumber);

  try {
    const draft = await provider.generateBulletin({
      source,
      language,
      targetPageNumber: pageNumber,
      systemPrompt,
      userPrompt,
    });

    // Verify factual sentence provenance
    const provenance = validateSentenceProvenance(draft, source);
    if (!provenance.valid) {
      // Hallucinated IDs detected: sanitize points by removing unmapped IDs and attach warning
      const validIds = new Set(source.sentences.map((s) => s.id));
      const sanitizedSections = draft.sections.map((section) => ({
        ...section,
        points: section.points.map((point) => ({
          ...point,
          sourceSentenceIds: point.sourceSentenceIds.filter((id) => validIds.has(id)),
        })),
      }));

      return {
        ...draft,
        sections: sanitizedSections,
        warnings: [
          ...(draft.warnings ?? []),
          `Hallucinated sentence references stripped: ${provenance.unmappedIds.join(", ")}`,
        ],
      };
    }

    return draft;
  } catch (err: unknown) {
    // Graceful fallback to deterministic extractive summarizer on any AI failure
    const errorMsg = err instanceof Error ? err.message : String(err);
    const fallbackDraft = generateExtractiveBulletin(source, {
      language,
      targetPageNumber: pageNumber,
    });

    return {
      ...fallbackDraft,
      warnings: [
        ...(fallbackDraft.warnings ?? []),
        `AI composition failed (${errorMsg}); successfully recovered via deterministic fallback.`,
      ],
    };
  }
}
