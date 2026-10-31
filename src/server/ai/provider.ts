/**
 * PageCast — AI Provider Contract
 *
 * Defines the abstract interface for LLM bulletin generation, isolating
 * external providers (Google Gemini, Groq, local mocks) from domain and UI logic.
 */

import type { ExtractedSource, BulletinDraft } from "@/domain/source-provenance/types";

export interface GenerateBulletinParams {
  readonly source: ExtractedSource;
  readonly language: "en" | "hi";
  readonly targetPageNumber?: number;
  readonly systemPrompt: string;
  readonly userPrompt: string;
  readonly timeoutMs?: number;
}

export interface AiProvider {
  readonly id: string;
  readonly model: string;
  generateBulletin(params: GenerateBulletinParams): Promise<BulletinDraft>;
}

export class AiProviderError extends Error {
  readonly provider: string;
  readonly code: string;

  constructor(provider: string, message: string, code = "AI_PROVIDER_ERROR") {
    super(`[${provider}] ${message}`);
    this.name = "AiProviderError";
    this.provider = provider;
    this.code = code;
  }
}
