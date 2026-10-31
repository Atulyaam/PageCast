/**
 * PageCast — Mock AI Provider Adapter
 *
 * Deterministic, zero-network AI adapter for unit testing, CI pipelines,
 * and predictable local development.
 */

import type { AiProvider, GenerateBulletinParams } from "./provider";
import { AiProviderError } from "./provider";
import type { BulletinDraft } from "@/domain/source-provenance/types";
import { validateBulletinDraft } from "@/domain/source-provenance/schema";

export interface MockAdapterOptions {
  readonly simulateTimeout?: boolean;
  readonly simulateQuotaExceeded?: boolean;
  readonly simulateInvalidSchema?: boolean;
  readonly simulateHallucinatedIds?: boolean;
  readonly fixedDraft?: Partial<BulletinDraft>;
}

export class MockAiProvider implements AiProvider {
  readonly id = "mock";
  readonly model = "mock-teletext-llm";
  private readonly options: MockAdapterOptions;

  constructor(options: MockAdapterOptions = {}) {
    this.options = options;
  }

  async generateBulletin(params: GenerateBulletinParams): Promise<BulletinDraft> {
    if (this.options.simulateTimeout) {
      throw new AiProviderError(this.id, "Provider request timed out after 15000ms", "TIMEOUT");
    }

    if (this.options.simulateQuotaExceeded) {
      throw new AiProviderError(this.id, "API quota limit exceeded (429)", "QUOTA_EXCEEDED");
    }

    if (this.options.simulateInvalidSchema) {
      // Missing required fields like sections and summary
      return validateBulletinDraft({
        sourceId: params.source.id,
        invalid: true,
      });
    }

    const isHindi = params.language === "hi";
    const sentences = params.source.sentences;

    // Build key points using actual source sentence IDs to guarantee valid provenance
    const points = sentences.slice(0, 3).map((s, idx) => ({
      text: s.text.length > 80 ? `${s.text.slice(0, 77)}...` : s.text,
      sourceSentenceIds: this.options.simulateHallucinatedIds ? ["s999_fabricated"] : [s.id],
    }));

    // If source had fewer than 1 sentence, provide a fallback
    if (points.length === 0) {
      points.push({
        text: isHindi ? "कोई विवरण उपलब्ध नहीं है।" : "No further details available.",
        sourceSentenceIds: [],
      });
    }

    const rawDraft: BulletinDraft = {
      sourceId: params.source.id,
      pageNumber: params.targetPageNumber ?? 101,
      title: isHindi ? "टेलीटेक्स्ट बुलेटिन" : "TELETEXT BULLETIN",
      topic: isHindi ? "समाचार" : "NEWS SUMMARY",
      headline: params.source.title.slice(0, 70),
      summary: isHindi
        ? "संक्षिप्त बुलेटिन सारांश — मुख्य समाचार और तथ्य।"
        : "Concise bulletin summary of source facts and key developments.",
      sections: [
        {
          heading: isHindi ? "प्रमुख बिंदु" : "KEY DEVELOPMENTS",
          points,
        },
      ],
      language: params.language,
      warnings: ["AI-generated draft requires human publisher review before broadcast."],
      metadata: {
        provider: this.id,
        model: this.model,
        promptVersion: "1.0.0",
        generatedAt: new Date().toISOString(),
        humanReviewed: false,
      },
      ...this.options.fixedDraft,
    };

    return validateBulletinDraft(rawDraft);
  }
}
