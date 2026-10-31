import type { TeletextPage, TeletextSpan } from "../teletext/types";
import { getGraphemeCount } from "../layout-engine/graphemes";

export interface GridValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Validates that a TeletextPage strictly complies with the 40x25 Teletext grid invariants:
 * - Property P1: Exactly 25 rows (page.rows.length === 25).
 * - Property P2: Every row contains exactly 40 logical character cells.
 */
export function validateGrid(page: TeletextPage): GridValidationResult {
  const errors: string[] = [];

  if (!page) {
    return { valid: false, errors: ["Page object is null or undefined"] };
  }

  // P1: Exactly 25 rows
  if (!Array.isArray(page.rows) || page.rows.length !== 25) {
    errors.push(`Invalid row count: expected exactly 25 rows, received ${page.rows?.length ?? 0}`);
  }

  // P2: Every row must contain exactly 40 logical cells
  if (Array.isArray(page.rows)) {
    page.rows.forEach((row, rowIndex) => {
      if (!row || !Array.isArray(row.spans)) {
        errors.push(`Row ${rowIndex + 1} has no valid spans array`);
        return;
      }

      const rowLength = row.spans.reduce(
        (sum: number, span: TeletextSpan) => sum + getGraphemeCount(span.text ?? ""),
        0
      );

      if (rowLength !== 40) {
        errors.push(
          `Row ${rowIndex + 1} has invalid column count: expected 40 logical cells, received ${rowLength}`
        );
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
