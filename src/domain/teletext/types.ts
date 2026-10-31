/**
 * PageCast Teletext Domain Types
 * Conforms to the canonical 40x25 Teletext grid geometry.
 */

export const TELETEXT_COLORS = [
  "black",
  "white",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
] as const;

export type TeletextColor = (typeof TELETEXT_COLORS)[number];

export interface TeletextSpan {
  readonly text: string;
  readonly color?: TeletextColor;
  readonly doubleHeight?: boolean;
  readonly mosaic?: boolean;
}

export interface TeletextRow {
  readonly spans: readonly TeletextSpan[];
}

export interface FastextLinks {
  readonly red: number; // 100 - 899
  readonly green: number; // 100 - 899
  readonly yellow: number; // 100 - 899
  readonly cyan: number; // 100 - 899
}

export interface TeletextPage {
  readonly pageNumber: number; // 100 - 899
  readonly subPageNumber?: number; // 1 - 99
  readonly subPageCount?: number;
  readonly title: string;
  readonly rows: readonly TeletextRow[]; // exactly 25 rows
  readonly fastext: FastextLinks;
  readonly language?: "en" | "hi";
}
