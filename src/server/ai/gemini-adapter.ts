/**
 * PageCast — Google Gemini AI Provider Adapter
 *
 * Implements structured JSON bulletin generation using Google Generative AI API
 * (Gemini 2.5 Flash / Gemini 1.5 Flash).
 *
 * Security Invariant: API key is isolated strictly to server-side code; never exposed
 * to client browsers.
 */

import type { AiProvider, GenerateBulletinParams } from "./provider";
import { AiProviderError } from "./provider";
import type { BulletinDraft } from "@/domain/source-provenance/types";
import { validateBulletinDraft } from "@/domain/source-provenance/schema";

export interface GeminiAdapterConfig {
  readonly apiKey?: string;
  readonly model?: string;
}

export class GeminiAiProvider implements AiProvider {
  readonly id = "google";
  readonly model: string;
  private readonly apiKey: string | undefined;

  constructor(config: GeminiAdapterConfig = {}) {
    this.apiKey = config.apiKey ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    this.model = config.model ?? process.env.PAGECAST_AI_MODEL ?? "gemini-2.5-flash";
  }

  async generateBulletin(params: GenerateBulletinParams): Promise<BulletinDraft> {
    if (!this.apiKey || this.apiKey.trim() === "") {
      throw new AiProviderError(
        this.id,
        "GOOGLE_GENERATIVE_AI_API_KEY is not configured on the server.",
        "MISSING_CREDENTIAL"
      );
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const timeoutMs = params.timeoutMs ?? 15000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const payload = {
      systemInstruction: {
        parts: [{ text: params.systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: params.userPrompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    };

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        throw new AiProviderError(
          this.id,
          `Request to Gemini timed out after ${timeoutMs}ms.`,
          "TIMEOUT"
        );
      }
      throw new AiProviderError(
        this.id,
        `Network error communicating with Gemini API: ${err instanceof Error ? err.message : String(err)}`,
        "NETWORK_ERROR"
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const status = response.status;
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch {
        // ignore
      }

      if (status === 429) {
        throw new AiProviderError(
          this.id,
          "Gemini API rate limit or quota exceeded (HTTP 429).",
          "QUOTA_EXCEEDED"
        );
      }

      throw new AiProviderError(
        this.id,
        `Gemini API returned error HTTP ${status}: ${errorBody.slice(0, 200)}`,
        `HTTP_${status}`
      );
    }

    let responseJson: any;
    try {
      responseJson = await response.json();
    } catch {
      throw new AiProviderError(
        this.id,
        "Failed to parse Gemini response as JSON.",
        "MALFORMED_RESPONSE"
      );
    }

    const textCandidate = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textCandidate) {
      throw new AiProviderError(
        this.id,
        "Gemini response did not contain text content candidate.",
        "EMPTY_RESPONSE"
      );
    }

    let parsedDraftData: unknown;
    try {
      parsedDraftData = JSON.parse(textCandidate);
    } catch {
      throw new AiProviderError(
        this.id,
        "Gemini candidate text could not be parsed as valid JSON.",
        "MALFORMED_OUTPUT"
      );
    }

    // Attach metadata and ensure structural validation with Zod
    const enriched = {
      sourceId: params.source.id,
      pageNumber: params.targetPageNumber ?? 101,
      language: params.language,
      warnings: ["AI-generated draft requires human publisher review before broadcast."],
      ...(typeof parsedDraftData === "object" && parsedDraftData !== null ? parsedDraftData : {}),
      metadata: {
        provider: this.id,
        model: this.model,
        promptVersion: "1.0.0",
        generatedAt: new Date().toISOString(),
        humanReviewed: false,
      },
    };

    try {
      return validateBulletinDraft(enriched);
    } catch (err: unknown) {
      throw new AiProviderError(
        this.id,
        `Gemini output failed BulletinDraft schema validation: ${err instanceof Error ? err.message : String(err)}`,
        "SCHEMA_VALIDATION_FAILED"
      );
    }
  }
}
