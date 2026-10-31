/**
 * PageCast — Edge Bulletin-to-Teletext PagePack Conversion Pipeline
 *
 * Converts a structured BulletinDraft into a fully validated, 40×25 Teletext
 * grid and serializes it into a canonical PagePackV1 strictly capped at 10 KiB.
 *
 * Invariants:
 * - 40 columns × 25 rows per page (Row 1 Header, Rows 2-24 Content, Row 25 Fastext).
 * - Total PagePack payload <= 10,240 UTF-8 bytes via TextEncoder.
 * - Devanagari Hindi combining marks and conjuncts preserved.
 */

import crypto from "node:crypto";
import type { BulletinDraft, ExtractedSource } from "@/domain/source-provenance/types";
import type { TeletextPage, FastextLinks } from "@/domain/teletext/types";
import type { PagePackV1, EvidenceReference } from "@/domain/page-pack/types";
import { layoutBulletinPage } from "@/domain/layout-engine/layout";
import { validateGrid } from "@/domain/validation/validate-grid";
import { isValidPageNumber, getMagazineNumber } from "@/domain/validation/page-number";
import { validatePagePack } from "@/domain/page-pack/schema";
import { measurePagePack } from "@/domain/page-pack/codec";
import { PAGECAST_MAX_PACK_BYTES } from "@/domain/byte-budget/measure";

export interface ConversionOptions {
  readonly fastext?: FastextLinks;
  readonly edition?: string;
  readonly publisherName?: string;
}

export interface ConversionResult {
  readonly pack: PagePackV1;
  readonly payloadBytes: number;
  readonly withinBudget: boolean;
  readonly pageCount: number;
}

/**
 * Generates an ASCII URL-safe lowercase slug matching /^[a-z0-9-]+$/ from a title and page number.
 */
function createSafeSlug(title: string, pageNumber: number): string {
  const asciiClean = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 30);

  return asciiClean.length >= 3 ? `${asciiClean}-${pageNumber}` : `bulletin-p${pageNumber}`;
}

/**
 * Computes default Fastext navigation shortcuts based on page number.
 */
function resolveFastextLinks(pageNumber: number, customFastext?: FastextLinks): FastextLinks {
  if (customFastext) {
    return customFastext;
  }

  // Cyclic next page in same magazine (e.g. 101 -> 102)
  const nextPage = pageNumber >= 899 ? 100 : pageNumber + 1;
  // Next magazine base (100 -> 200 -> 300...)
  const magazineBase = Math.floor(pageNumber / 100) * 100;
  const nextMag = magazineBase >= 800 ? 100 : magazineBase + 100;

  return {
    red: nextPage,
    green: nextMag,
    yellow: 100, // Always index
    cyan: 102, // Weather / Service
  };
}

/**
 * Transforms a BulletinDraft into one or more 40×25 Teletext pages.
 */
export function convertDraftToTeletextPages(
  draft: BulletinDraft,
  options: ConversionOptions = {}
): TeletextPage[] {
  if (!isValidPageNumber(draft.pageNumber)) {
    throw new Error(
      `Invalid page number ${draft.pageNumber}. Teletext page numbers must fall within 100-899.`
    );
  }

  const language = draft.language;
  const isHindi = language === "hi";
  const fastext = resolveFastextLinks(draft.pageNumber, options.fastext);

  // Build body paragraphs from summary and sections
  const paragraphs: string[] = [];

  if (draft.summary) {
    paragraphs.push(draft.summary);
  }

  for (const section of draft.sections) {
    if (section.heading) {
      paragraphs.push(section.heading.toUpperCase());
    }
    for (const point of section.points) {
      paragraphs.push(`- ${point.text}`);
    }
  }

  // Layout the primary page
  const primaryPage = layoutBulletinPage({
    pageNumber: draft.pageNumber,
    subPageNumber: 1,
    subPageCount: 1,
    title: draft.title,
    topic: draft.topic,
    headline: draft.headline,
    paragraphs,
    fastext,
    fastextLabels: {
      red: isHindi ? "अगला" : "NEXT",
      green: isHindi ? "मैगज़ीन" : "MAGAZINE",
      yellow: isHindi ? "इंडेक्स" : "INDEX",
      cyan: isHindi ? "सेवाएं" : "HELP",
    },
    language,
    timestamp: new Date(),
  });

  // Verify mathematical grid invariants (25 rows x 40 cells)
  const gridCheck = validateGrid(primaryPage);
  if (!gridCheck.valid) {
    throw new Error(
      `Generated Teletext page failed grid geometry validation: ${gridCheck.errors.join("; ")}`
    );
  }

  return [primaryPage];
}

/**
 * Converts a BulletinDraft and source into a canonical, budget-checked PagePackV1.
 */
export function convertDraftToPagePack(
  draft: BulletinDraft,
  source?: ExtractedSource,
  options: ConversionOptions = {}
): ConversionResult {
  const pages = convertDraftToTeletextPages(draft, options);
  const magazine = getMagazineNumber(draft.pageNumber);
  const slug = createSafeSlug(draft.title, draft.pageNumber);

  // Build evidence references with optional sentence excerpts
  const sentenceMap = new Map(source?.sentences?.map((s) => [s.id, s]) ?? []);
  const evidenceReferences: EvidenceReference[] = [];
  let ptIndex = 1;
  for (const section of draft.sections) {
    for (const point of section.points) {
      for (const sId of point.sourceSentenceIds) {
        const matched = sentenceMap.get(sId);
        evidenceReferences.push({
          pointId: `pt-${ptIndex}`,
          sourceSentenceId: sId,
          sentenceText: matched?.text,
          sentenceHash: matched?.hash,
        });
      }
      ptIndex++;
    }
  }

  // Validate URL format for metadata if present
  let originalUrl: string | undefined = undefined;
  if (source?.url && (source.url.startsWith("http://") || source.url.startsWith("https://"))) {
    originalUrl = source.url;
  }

  const pack: PagePackV1 = {
    id: crypto.randomUUID(),
    version: 1,
    slug,
    title: draft.title,
    magazine,
    primaryPageNumber: draft.pageNumber,
    createdAt: new Date().toISOString(),
    metadata: {
      originalUrl,
      sourceName: source?.siteName || "PageCast Publisher",
      author: source?.byline,
      language: draft.language,
      aiAssisted: draft.metadata.provider !== "extractive-fallback",
      promptVersion: draft.metadata.promptVersion,
      modelId: draft.metadata.model,
      publisherId: options.publisherName ?? "publisher-default",
      evidenceReferences: evidenceReferences.length > 0 ? evidenceReferences : undefined,
    },
    pages,
  };

  // Validate schema adherence
  const validatedPack = validatePagePack(pack) as PagePackV1;
  // Measure exact UTF-8 byte size via TextEncoder
  const budget = measurePagePack(validatedPack);

  if (budget.bytesUsed > PAGECAST_MAX_PACK_BYTES) {
    throw new Error(
      `Converted PagePack payload size of ${budget.bytesUsed} bytes exceeds maximum allowed budget of ${PAGECAST_MAX_PACK_BYTES} bytes (10 KiB).`
    );
  }

  return {
    pack: validatedPack,
    payloadBytes: budget.bytesUsed,
    withinBudget: !budget.isOverBudget,
    pageCount: pages.length,
  };
}
