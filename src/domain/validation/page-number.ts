/**
 * PageCast Teletext Page Numbering Rules
 *
 * Page numbers are 3-digit integers ranging strictly from 100 to 899.
 * The hundreds digit represents the Magazine (1 to 8).
 * Numbers 000-099 and 900-999 are reserved or invalid.
 */

export const MIN_PAGE_NUMBER = 100;
export const MAX_PAGE_NUMBER = 899;
export const DEFAULT_PAGE_NUMBER = 100;

/**
 * Validates whether a page number is within the valid 100-899 range.
 */
export function isValidPageNumber(pageNumber: number): boolean {
  return (
    Number.isInteger(pageNumber) && pageNumber >= MIN_PAGE_NUMBER && pageNumber <= MAX_PAGE_NUMBER
  );
}

/**
 * Extracts the magazine index (1-8) from a valid page number.
 */
export function getMagazineNumber(pageNumber: number): number {
  if (!isValidPageNumber(pageNumber)) {
    throw new Error(
      `Cannot extract magazine from invalid page number: ${pageNumber}. Expected 100-899.`
    );
  }
  return Math.floor(pageNumber / 100);
}

/**
 * Formats a numeric page number into a standard 3-digit string.
 */
export function formatPageNumber(pageNumber: number): string {
  if (!isValidPageNumber(pageNumber)) {
    return "100";
  }
  return String(pageNumber);
}

/**
 * Finds the next page number in a sorted catalogue array, cycling to the start.
 */
export function getNextPageNumber(currentPage: number, catalogue: readonly number[]): number {
  if (!catalogue.length) {
    return DEFAULT_PAGE_NUMBER;
  }

  const sorted = [...new Set(catalogue)].sort((a, b) => a - b);
  const index = sorted.indexOf(currentPage);

  if (index === -1 || index === sorted.length - 1) {
    return sorted[0]; // Wrap around to first page
  }

  return sorted[index + 1];
}

/**
 * Finds the previous page number in a sorted catalogue array, cycling to the end.
 */
export function getPreviousPageNumber(currentPage: number, catalogue: readonly number[]): number {
  if (!catalogue.length) {
    return DEFAULT_PAGE_NUMBER;
  }

  const sorted = [...new Set(catalogue)].sort((a, b) => a - b);
  const index = sorted.indexOf(currentPage);

  if (index === -1 || index === 0) {
    return sorted[sorted.length - 1]; // Wrap around to last page
  }

  return sorted[index - 1];
}
