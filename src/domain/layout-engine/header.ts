import type { TeletextRow, FastextLinks } from "../teletext/types";
import { padToColumns } from "./graphemes";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

/**
 * Formats Row 1 (Header Row) of the 40x25 Teletext grid.
 * Format: P[page]  PAGECAST  [Day] [DD] [Mon]  [HH:MM:SS]
 * Example: P100  PAGECAST  SAT 31 OCT  10:04:12
 * Total width: exactly 40 character cells.
 */
export function formatHeaderRow(
  pageNumber: number,
  serviceName = "PAGECAST",
  timestamp: Date = new Date()
): TeletextRow {
  const pageStr = `P${pageNumber}`.padEnd(6, " ");
  const day = DAYS[timestamp.getUTCDay()];
  const dd = String(timestamp.getUTCDate()).padStart(2, "0");
  const mon = MONTHS[timestamp.getUTCMonth()];
  const hh = String(timestamp.getUTCHours()).padStart(2, "0");
  const mm = String(timestamp.getUTCMinutes()).padStart(2, "0");
  const ss = String(timestamp.getUTCSeconds()).padStart(2, "0");

  const clock = `${day} ${dd} ${mon}  ${hh}:${mm}:${ss}`;

  // Left: P100  PAGECAST
  // Right: SAT 31 OCT  10:04:12
  const left = `${pageStr}${serviceName} `;
  const remaining = 40 - left.length - clock.length;
  const spaces = " ".repeat(Math.max(1, remaining));

  const headerLine = padToColumns(`${left}${spaces}${clock}`, 40);

  return {
    spans: [
      { text: headerLine.slice(0, 6), color: "white" },
      { text: headerLine.slice(6, 15), color: "yellow" },
      { text: headerLine.slice(15), color: "cyan" },
    ],
  };
}

/**
 * Formats Row 25 (Navigation / Fastext Row) of the 40x25 Teletext grid.
 * Format: 4 equal 10-column zones: Red, Green, Yellow, Cyan.
 * Total width: exactly 40 character cells.
 */
export function formatNavigationRow(
  fastext: FastextLinks,
  labels?: { red?: string; green?: string; yellow?: string; cyan?: string }
): TeletextRow {
  const redLabel = (labels?.red ?? `P${fastext.red}`).padEnd(9, " ").slice(0, 9);
  const grnLabel = (labels?.green ?? `P${fastext.green}`).padEnd(9, " ").slice(0, 9);
  const yelLabel = (labels?.yellow ?? `P${fastext.yellow}`).padEnd(9, " ").slice(0, 9);
  const cynLabel = (labels?.cyan ?? `P${fastext.cyan}`).padEnd(9, " ").slice(0, 9);

  return {
    spans: [
      { text: `${redLabel} `, color: "red" },
      { text: `${grnLabel} `, color: "green" },
      { text: `${yelLabel} `, color: "yellow" },
      { text: `${cynLabel} `, color: "cyan" },
    ],
  };
}
