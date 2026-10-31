/**
 * PageCast — Source Provenance & Bulletin Zod Schemas
 *
 * Provides runtime schema validation and factual provenance integrity checks
 * for extracted articles and AI-composed bulletin drafts.
 */

import { z } from "zod";
import type {
  SourceSentence,
  ExtractedSource,
  BulletinKeyPoint,
  BulletinSection,
  BulletinMetadata,
  BulletinDraft,
} from "./types";

export const SourceSentenceSchema = z.object({
  id: z.string().min(1, "Sentence ID cannot be empty"),
  index: z.number().int().nonnegative(),
  text: z.string().min(1, "Sentence text cannot be empty"),
  hash: z.string().min(1, "Sentence hash cannot be empty"),
});

export const ExtractedSourceSchema = z.object({
  id: z.string().min(1, "Source ID cannot be empty"),
  url: z.string().min(1, "Source URL cannot be empty"),
  title: z.string().min(1, "Source title cannot be empty"),
  siteName: z.string().optional(),
  byline: z.string().optional(),
  publishedTime: z.string().optional(),
  fetchedAt: z.string().datetime({ offset: true }).or(z.string().min(10)),
  content: z.string().min(1, "Extracted content cannot be empty"),
  sentences: z.array(SourceSentenceSchema).min(1, "Source must contain at least one sentence"),
  language: z.enum(["en", "hi"]).optional(),
});

export const BulletinKeyPointSchema = z.object({
  text: z.string().min(1).max(200, "Key point must fit within 200 characters"),
  sourceSentenceIds: z.array(z.string()).default([]),
});

export const BulletinSectionSchema = z.object({
  heading: z.string().max(40, "Section heading cannot exceed 40 characters").optional(),
  points: z.array(BulletinKeyPointSchema).min(1, "Section must have at least one point"),
});

export const BulletinMetadataSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  promptVersion: z.string().min(1),
  generatedAt: z.string().min(10),
  humanReviewed: z.boolean().optional(),
  reviewedAt: z.string().optional(),
});

export const BulletinDraftSchema = z.object({
  sourceId: z.string().min(1, "sourceId is required"),
  pageNumber: z
    .number()
    .int()
    .min(100, "Page number must be >= 100")
    .max(899, "Page number must be <= 899"),
  title: z.string().min(1).max(40, "Title must fit within 40 characters for Teletext"),
  topic: z.string().max(20, "Topic must fit within 20 characters").optional(),
  headline: z.string().max(80, "Headline must fit within 80 characters").optional(),
  summary: z.string().min(1).max(300, "Summary must fit within 300 characters"),
  sections: z.array(BulletinSectionSchema).min(1, "Draft must have at least one section"),
  language: z.enum(["en", "hi"]),
  warnings: z.array(z.string()).optional(),
  metadata: BulletinMetadataSchema,
});

/**
 * Validates arbitrary input against the BulletinDraft schema.
 */
export function validateBulletinDraft(data: unknown): BulletinDraft {
  return BulletinDraftSchema.parse(data) as BulletinDraft;
}

/**
 * Validates arbitrary input against the ExtractedSource schema.
 */
export function validateExtractedSource(data: unknown): ExtractedSource {
  return ExtractedSourceSchema.parse(data) as ExtractedSource;
}

/**
 * Verifies factual sentence provenance:
 * Confirms that every `sourceSentenceId` referenced in key points exists in the source.
 * Returns true if 100% valid, throws an error or returns false if invalid IDs are found.
 */
export function validateSentenceProvenance(
  draft: BulletinDraft,
  source: ExtractedSource
): { valid: boolean; unmappedIds: readonly string[] } {
  const validSentenceIds = new Set(source.sentences.map((s) => s.id));
  const unmapped: string[] = [];

  for (const section of draft.sections) {
    for (const point of section.points) {
      for (const refId of point.sourceSentenceIds) {
        if (!validSentenceIds.has(refId)) {
          unmapped.push(refId);
        }
      }
    }
  }

  return {
    valid: unmapped.length === 0,
    unmappedIds: unmapped,
  };
}
