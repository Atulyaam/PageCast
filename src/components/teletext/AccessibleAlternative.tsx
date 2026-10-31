import React from "react";
import type { TeletextPage } from "@/domain/teletext/types";

export interface AccessibleAlternativeProps {
  readonly page: TeletextPage;
}

/**
 * Screen-Reader Accessible Alternative (WCAG 2.1 AA)
 *
 * Visually hidden (sr-only) representation providing a clean semantic
 * linear transcription of the 40x25 Teletext page.
 */
export const AccessibleAlternative: React.FC<AccessibleAlternativeProps> = ({ page }) => {
  // Extract text lines while skipping completely blank rows and decorative dividers
  const contentLines: string[] = [];

  page.rows.forEach((row, idx) => {
    // Skip row 0 (header) and row 24 (nav bar) as they are summarized separately
    if (idx === 0 || idx === 24) {
      return;
    }

    const rowText = row.spans
      .map((s) => s.text)
      .join("")
      .trim();

    // Skip blank lines and pure divider lines (e.g. === or ---)
    if (rowText && !/^([=-])\1+$/.test(rowText)) {
      contentLines.push(rowText);
    }
  });

  return (
    <article className="sr-only" aria-label={`Teletext Page ${page.pageNumber}: ${page.title}`}>
      <header>
        <h1>{`Page ${page.pageNumber}: ${page.title}`}</h1>
        {page.subPageNumber && page.subPageCount && (
          <p>{`Sub-page ${page.subPageNumber} of ${page.subPageCount}`}</p>
        )}
      </header>

      <section aria-label="Page Content">
        {contentLines.map((line, index) => (
          <p key={`sr-line-${index}`}>{line}</p>
        ))}
      </section>

      <nav aria-label="Fastext Shortcut Navigation">
        <h2>Fastext Quick Links</h2>
        <ul>
          <li>{`Red Button: Page ${page.fastext.red}`}</li>
          <li>{`Green Button: Page ${page.fastext.green}`}</li>
          <li>{`Yellow Button: Page ${page.fastext.yellow}`}</li>
          <li>{`Cyan Button: Page ${page.fastext.cyan}`}</li>
        </ul>
      </nav>
    </article>
  );
};
