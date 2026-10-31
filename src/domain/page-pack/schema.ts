import { z } from "zod";
import { TELETEXT_COLORS } from "../teletext/types";

export const TeletextColorSchema = z.enum(TELETEXT_COLORS);

export const TeletextSpanSchema = z.object({
  text: z.string(),
  color: TeletextColorSchema.optional(),
  doubleHeight: z.boolean().optional(),
  mosaic: z.boolean().optional(),
});

export const TeletextRowSchema = z.object({
  spans: z.array(TeletextSpanSchema),
});

export const FastextLinksSchema = z.object({
  red: z.number().int().min(100).max(899),
  green: z.number().int().min(100).max(899),
  yellow: z.number().int().min(100).max(899),
  cyan: z.number().int().min(100).max(899),
});

export const TeletextPageSchema = z.object({
  pageNumber: z.number().int().min(100).max(899),
  subPageNumber: z.number().int().min(1).max(99).optional(),
  subPageCount: z.number().int().min(1).max(99).optional(),
  title: z.string().min(1),
  rows: z.array(TeletextRowSchema).length(25), // Strictly 25 rows (P1)
  fastext: FastextLinksSchema,
  language: z.enum(["en", "hi"]).optional(),
});

export const EvidenceReferenceSchema = z.object({
  pointId: z.string(),
  sourceSentenceId: z.string(),
});

export const PagePackMetadataSchema = z.object({
  originalUrl: z.string().url().optional(),
  sourceName: z.string().min(1),
  author: z.string().optional(),
  language: z.enum(["en", "hi"]),
  aiAssisted: z.boolean(),
  promptVersion: z.string().optional(),
  modelId: z.string().optional(),
  publisherId: z.string().min(1),
  evidenceReferences: z.array(EvidenceReferenceSchema).optional(),
});

export const PagePackV1Schema = z.object({
  id: z.string().uuid(),
  version: z.literal(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  magazine: z.number().int().min(1).max(8),
  primaryPageNumber: z.number().int().min(100).max(899),
  createdAt: z.string().datetime(),
  metadata: PagePackMetadataSchema,
  pages: z.array(TeletextPageSchema).min(1),
});

export type PagePackV1Validated = z.infer<typeof PagePackV1Schema>;
export type TeletextPageValidated = z.infer<typeof TeletextPageSchema>;
