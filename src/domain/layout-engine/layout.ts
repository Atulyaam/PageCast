import type { TeletextPage, TeletextRow, TeletextSpan, FastextLinks } from "../teletext/types";
import { getGraphemeCount, segmentGraphemes, padToColumns } from "./graphemes";
import { formatHeaderRow, formatNavigationRow } from "./header";

export interface LayoutPageParams {
  pageNumber: number;
  subPageNumber?: number;
  subPageCount?: number;
  title: string;
  topic?: string;
  headline?: string;
  paragraphs: readonly string[];
  fastext: FastextLinks;
  fastextLabels?: {
    red?: string;
    green?: string;
    yellow?: string;
    cyan?: string;
  };
  language?: "en" | "hi";
  timestamp?: Date;
}

/**
 * Wraps text to fit within a given column width using grapheme-cluster counting.
 * Preserves words across word boundaries; splits long continuous words without
 * severing multi-byte or combining characters.
 */
export function wrapTextToColumns(text: string, columns = 40, locale = "und"): string[] {
  if (!text) {
    return [];
  }

  // Handle existing newlines first
  const rawLines = text.split(/\r?\n/);
  const resultLines: string[] = [];

  for (const rawLine of rawLines) {
    if (!rawLine.trim()) {
      resultLines.push("");
      continue;
    }

    const words = rawLine.split(/\s+/).filter(Boolean);
    let currentLine = "";

    for (const word of words) {
      const wordLen = getGraphemeCount(word, locale);

      // If word itself exceeds columns, chunk it safely by graphemes
      if (wordLen > columns) {
        if (currentLine) {
          resultLines.push(currentLine);
          currentLine = "";
        }

        const clusters = segmentGraphemes(word, locale);
        let start = 0;
        while (start < clusters.length) {
          const chunk = clusters.slice(start, start + columns).join("");
          if (start + columns >= clusters.length) {
            currentLine = chunk;
          } else {
            resultLines.push(chunk);
          }
          start += columns;
        }
        continue;
      }

      if (!currentLine) {
        currentLine = word;
      } else {
        const candidate = `${currentLine} ${word}`;
        if (getGraphemeCount(candidate, locale) <= columns) {
          currentLine = candidate;
        } else {
          resultLines.push(currentLine);
          currentLine = word;
        }
      }
    }

    if (currentLine) {
      resultLines.push(currentLine);
    }
  }

  return resultLines;
}

/**
 * Creates a single TeletextRow padded to exactly 40 logical cells.
 */
export function createRow(
  text: string,
  color: TeletextSpan["color"] = "white",
  doubleHeight = false,
  locale = "und"
): TeletextRow {
  const padded = padToColumns(text, 40, " ", locale);
  return {
    spans: [{ text: padded, color, doubleHeight }],
  };
}

/**
 * Creates an empty, 40-space TeletextRow.
 */
export function createBlankRow(): TeletextRow {
  return createRow("", "white");
}

/**
 * Creates a decorative divider row padded to 40 columns.
 */
export function createDividerRow(char = "=", color: TeletextSpan["color"] = "blue"): TeletextRow {
  return createRow(char.repeat(40), color);
}

/**
 * Lays out a full 40x25 TeletextPage.
 *
 * Structure:
 * - Row 1 (index 0): Header Row (Broadcast P100 PAGECAST...)
 * - Rows 2-24 (indices 1-23): 23 Content Rows
 * - Row 25 (index 24): Navigation Row (Fastext Bar)
 *
 * Total rows: EXACTLY 25 rows.
 * Total width per row: EXACTLY 40 logical cells.
 */
export function layoutBulletinPage(params: LayoutPageParams): TeletextPage {
  const {
    pageNumber,
    subPageNumber,
    subPageCount,
    title,
    topic,
    headline,
    paragraphs,
    fastext,
    fastextLabels,
    language = "en",
    timestamp = new Date(),
  } = params;

  const rows: TeletextRow[] = [];

  // 1. Row 1 (index 0): Broadcast Header Row
  rows.push(formatHeaderRow(pageNumber, "PAGECAST", timestamp));

  // Content Row Budget: Rows 2-24 = exactly 23 content rows
  const contentRows: TeletextRow[] = [];

  // Optional Topic Header
  if (topic) {
    contentRows.push(createRow(topic.toUpperCase(), "cyan", false, language));
    contentRows.push(createDividerRow("=", "blue"));
  }

  // Headline
  if (headline) {
    const wrappedHeadline = wrapTextToColumns(headline, 40, language);
    for (const hLine of wrappedHeadline) {
      contentRows.push(createRow(hLine, "yellow", false, language));
    }
    contentRows.push(createBlankRow());
  }

  // Paragraphs
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      contentRows.push(createBlankRow());
      continue;
    }

    const wrapped = wrapTextToColumns(paragraph, 40, language);
    for (const line of wrapped) {
      contentRows.push(createRow(line, "white", false, language));
    }
    contentRows.push(createBlankRow());
  }

  // Cap or pad content rows to exactly 23 rows (Rows 2-24)
  const MAX_CONTENT_ROWS = 23;
  const boundedContentRows = contentRows.slice(0, MAX_CONTENT_ROWS);

  while (boundedContentRows.length < MAX_CONTENT_ROWS) {
    boundedContentRows.push(createBlankRow());
  }

  rows.push(...boundedContentRows);

  // 3. Row 25 (index 24): Navigation / Fastext Row
  rows.push(formatNavigationRow(fastext, fastextLabels, language));

  return {
    pageNumber,
    subPageNumber,
    subPageCount,
    title,
    rows,
    fastext,
    language,
  };
}
