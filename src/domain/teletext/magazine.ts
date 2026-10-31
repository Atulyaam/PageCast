/**
 * PageCast Teletext Magazine Classifications & Sub-Page Indexing
 *
 * Teletext allocates 3-digit page numbers (100-899) across 8 distinct magazines.
 * The hundreds digit defines the magazine (1 to 8).
 * Multi-page bulletins within a page number are represented as carousel sub-pages
 * (e.g. 101/1, 101/2, 101/3).
 */

import { isValidPageNumber, getMagazineNumber } from "../validation/page-number";
import { validateGrid } from "../validation/validate-grid";
import type { TeletextColor, TeletextPage } from "./types";

export interface MagazineDefinition {
  readonly number: number; // 1 - 8
  readonly name: string;
  readonly description: string;
  readonly pageRange: readonly [number, number];
  readonly defaultColor: TeletextColor;
}

/**
 * Standard Teletext Magazine Directory (Magazines 1-8)
 */
export const MAGAZINES: readonly MagazineDefinition[] = [
  {
    number: 1,
    name: "News & Index",
    description: "National & World News, Front Page Directory, Headlines",
    pageRange: [100, 199],
    defaultColor: "white",
  },
  {
    number: 2,
    name: "Technology & Resilience",
    description: "Low-Bandwidth Tech, Computing, Open Source, Resilient Systems",
    pageRange: [200, 299],
    defaultColor: "cyan",
  },
  {
    number: 3,
    name: "Weather & Environment",
    description: "Meteorology, Disaster Warnings, Atmospheric & Environmental Data",
    pageRange: [300, 399],
    defaultColor: "yellow",
  },
  {
    number: 4,
    name: "Sports & Competition",
    description: "League Tables, Fixtures, Match Reports, Athletic Results",
    pageRange: [400, 499],
    defaultColor: "green",
  },
  {
    number: 5,
    name: "Culture & Entertainment",
    description: "Cinema, Arts, Music, Puzzles, Broadcast Schedules",
    pageRange: [500, 599],
    defaultColor: "magenta",
  },
  {
    number: 6,
    name: "Markets & Finance",
    description: "Commodities, Currencies, Local Trade, Economic Indicators",
    pageRange: [600, 699],
    defaultColor: "yellow",
  },
  {
    number: 7,
    name: "Public Notices & Civic",
    description: "Civic Announcements, Community Transit, Health Advisories",
    pageRange: [700, 799],
    defaultColor: "cyan",
  },
  {
    number: 8,
    name: "Emergency & Engineering",
    description: "Civil Defense Alerts, Severe Crisis Data, System Telemetry",
    pageRange: [800, 899],
    defaultColor: "red",
  },
] as const;

/**
 * Look up the magazine definition for a given magazine number (1-8) or page number (100-899).
 */
export function getMagazineDefinition(pageOrMagazine: number): MagazineDefinition {
  const magNum = pageOrMagazine >= 100 ? getMagazineNumber(pageOrMagazine) : pageOrMagazine;

  const found = MAGAZINES.find((m) => m.number === magNum);
  if (!found) {
    throw new Error(`INVALID_MAGAZINE: Magazine ${pageOrMagazine} is invalid. Expected 1-8.`);
  }
  return found;
}

/**
 * Format a sub-page identifier (e.g. 101/1 or 200/02).
 */
export function formatSubPageId(
  pageNumber: number,
  subPageNumber: number,
  zeroPadded: boolean = false
): string {
  if (!isValidPageNumber(pageNumber)) {
    throw new Error(`Invalid page number: ${pageNumber}`);
  }
  const subStr = zeroPadded ? String(subPageNumber).padStart(2, "0") : String(subPageNumber);
  return `${pageNumber}/${subStr}`;
}

/**
 * Parse a subpage string such as "101/1" or "101/02" or "101".
 */
export function parseSubPageId(
  subPageId: string
): { pageNumber: number; subPageNumber: number } | null {
  const parts = subPageId.trim().split("/");
  const pageNumber = parseInt(parts[0], 10);

  if (!isValidPageNumber(pageNumber)) {
    return null;
  }

  if (parts.length === 1) {
    return { pageNumber, subPageNumber: 1 };
  }

  const subPageNumber = parseInt(parts[1], 10);
  if (isNaN(subPageNumber) || subPageNumber < 1 || subPageNumber > 99) {
    return null;
  }

  return { pageNumber, subPageNumber };
}

/**
 * Formats subpage position indicator for headers (e.g. "1/3" or "01/03").
 */
export function formatSubPageIndicator(
  subPageNumber: number,
  subPageCount: number,
  zeroPadded: boolean = false
): string {
  if (subPageCount <= 1) {
    return "";
  }
  if (zeroPadded) {
    return `${String(subPageNumber).padStart(2, "0")}/${String(subPageCount).padStart(2, "0")}`;
  }
  return `${subPageNumber}/${subPageCount}`;
}

/**
 * Validates a collection of subpages belonging to a multi-page bulletin.
 * Enforces:
 * 1. At least 1 page present.
 * 2. All pages share the same primary `pageNumber`.
 * 3. Sub-pages are sequentially numbered 1..N without gaps or duplicates.
 * 4. `subPageCount` matches total subpage count.
 * 5. Each individual page conforms to 40x25 Teletext grid geometry.
 */
export function validateSubPages(pages: readonly TeletextPage[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!pages || pages.length === 0) {
    return { valid: false, errors: ["A bulletin must contain at least 1 page."] };
  }

  const primaryPageNumber = pages[0].pageNumber;
  if (!isValidPageNumber(primaryPageNumber)) {
    errors.push(`Primary page number ${primaryPageNumber} is out of bounds [100-899].`);
  }

  const expectedCount = pages.length;
  const seenIndices = new Set<number>();

  pages.forEach((page, idx) => {
    // Check page number alignment
    if (page.pageNumber !== primaryPageNumber) {
      errors.push(
        `Subpage at index ${idx} has pageNumber ${page.pageNumber}, expected ${primaryPageNumber}.`
      );
    }

    // Check subPageNumber
    const subNum = page.subPageNumber ?? (expectedCount === 1 ? 1 : idx + 1);
    if (subNum !== idx + 1) {
      errors.push(
        `Subpage at index ${idx} has subPageNumber ${subNum}, expected sequential ${idx + 1}.`
      );
    }

    if (seenIndices.has(subNum)) {
      errors.push(`Duplicate subPageNumber ${subNum} detected.`);
    }
    seenIndices.add(subNum);

    // Check subPageCount
    if (page.subPageCount !== undefined && page.subPageCount !== expectedCount) {
      errors.push(
        `Subpage at index ${idx} reports subPageCount ${page.subPageCount}, expected ${expectedCount}.`
      );
    }

    // Check 40x25 grid geometry
    const gridRes = validateGrid(page);
    if (!gridRes.valid) {
      errors.push(`Subpage ${subNum} grid error: ${gridRes.errors.join("; ")}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
