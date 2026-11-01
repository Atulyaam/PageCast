"use client";

import React, { useState } from "react";
import type { TeletextPage } from "@/domain/teletext/types";
import { getMagazineDefinition } from "@/domain/teletext/magazine";

export type ContrastMode = "standard" | "high-contrast-light" | "high-contrast-dark";
export type FontSizeScale = "normal" | "large" | "xlarge";

export interface AccessibleTextViewProps {
  readonly page: TeletextPage;
  readonly sourceUrl?: string;
  readonly sourceDomain?: string;
  readonly publishedAt?: string;
  readonly onNavigate?: (pageNumber: number) => void;
  readonly onToggleViewMode?: () => void;
  readonly initialContrast?: ContrastMode;
  readonly initialFontSize?: FontSizeScale;
  readonly className?: string;
}

export interface ExtractedSection {
  type: "heading" | "paragraph" | "list";
  content?: string;
  items?: string[];
}

/**
 * Extracts semantic document structure from raw 40x25 Teletext rows.
 * Skips row 0 (teletext clock/header) and row 24 (fastext bar).
 * Detects double-height rows as headings and bulleted lines as unordered lists.
 */
export function extractAccessibleContent(page: TeletextPage): ExtractedSection[] {
  const sections: ExtractedSection[] = [];
  const rows = page.rows || [];

  // Content rows are between row 0 (header) and the last row (fastext bar)
  const endRowIndex = rows.length > 24 ? 24 : Math.max(1, rows.length - 1);
  const contentRows = rows.slice(1, endRowIndex);
  let currentListItems: string[] = [];
  let currentParagraphLines: string[] = [];
  let previousRowText = "";

  const flushList = () => {
    if (currentListItems.length > 0) {
      sections.push({ type: "list", items: [...currentListItems] });
      currentListItems = [];
    }
  };

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join(" ").trim();
      if (text) {
        sections.push({ type: "paragraph", content: text });
      }
      currentParagraphLines = [];
    }
  };

  for (const row of contentRows) {
    // Extract non-mosaic characters
    const rowText = (row.spans || [])
      .filter((s) => !s.mosaic)
      .map((s) => s.text)
      .join("")
      .trim();

    if (!rowText) {
      flushList();
      flushParagraph();
      previousRowText = "";
      continue;
    }

    // Deduplicate consecutive double-height rows (Teletext hardware renders top/bottom lines identically)
    const isDoubleHeight = (row.spans || []).some((s) => s.doubleHeight);
    if (isDoubleHeight && rowText === previousRowText) {
      continue;
    }
    previousRowText = rowText;

    if (isDoubleHeight) {
      flushList();
      flushParagraph();
      sections.push({ type: "heading", content: rowText });
      continue;
    }

    // Detect list items (bullet points, dashes, numbers)
    const bulletMatch = rowText.match(/^([•\-\*→\u2022]|\d+[\.\)])\s*(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      currentListItems.push(bulletMatch[2] || bulletMatch[0]);
    } else {
      flushList();
      currentParagraphLines.push(rowText);
    }
  }

  flushList();
  flushParagraph();

  return sections;
}

export const AccessibleTextView: React.FC<AccessibleTextViewProps> = ({
  page,
  sourceUrl,
  sourceDomain,
  publishedAt,
  onNavigate,
  onToggleViewMode,
  initialContrast = "standard",
  initialFontSize = "normal",
  className = "",
}) => {
  const [contrast, setContrast] = useState<ContrastMode>(initialContrast);
  const [fontSize, setFontSize] = useState<FontSizeScale>(initialFontSize);

  const magazineDef = getMagazineDefinition(page.pageNumber);
  const magazineNum = magazineDef.number;
  const magazineTitle = magazineDef.name;
  const sections = extractAccessibleContent(page);
  const lang = page.language || "en";

  // Contrast theme classes
  const themeClasses: Record<ContrastMode, { root: string; button: string; link: string }> = {
    standard: {
      root: "bg-surface-terminal text-text-primary border-surface-border",
      button:
        "bg-surface-panel border-surface-border text-text-primary hover:bg-surface-border-subtle",
      link: "text-teletext-cyan hover:underline",
    },
    "high-contrast-light": {
      root: "bg-white text-black border-black",
      button: "bg-gray-100 border-black text-black hover:bg-black hover:text-white",
      link: "text-blue-900 underline font-bold",
    },
    "high-contrast-dark": {
      root: "bg-black text-white border-white",
      button: "bg-zinc-900 border-white text-white hover:bg-white hover:text-black",
      link: "text-yellow-300 underline font-bold",
    },
  };

  // Font size scale classes
  const fontClasses: Record<FontSizeScale, { base: string; h1: string; h2: string }> = {
    normal: {
      base: "text-base leading-relaxed",
      h1: "text-2xl font-bold",
      h2: "text-xl font-semibold",
    },
    large: {
      base: "text-xl leading-relaxed",
      h1: "text-3xl font-bold",
      h2: "text-2xl font-semibold",
    },
    xlarge: {
      base: "text-2xl leading-relaxed",
      h1: "text-4xl font-bold",
      h2: "text-3xl font-semibold",
    },
  };

  const currentTheme = themeClasses[contrast];
  const currentFont = fontClasses[fontSize];

  return (
    <article
      role="article"
      lang={lang}
      aria-label={`Teletext Page ${page.pageNumber}: ${page.title || "Bulletin"}`}
      tabIndex={0}
      className={`focus-visible:ring-teletext-yellow mx-auto flex w-full max-w-4xl flex-col rounded-lg border p-6 font-sans shadow-md focus-visible:ring-2 focus-visible:outline-none ${currentTheme.root} ${className}`.trim()}
    >
      {/* Screen-reader skip instruction */}
      <div className="sr-only">
        Screen reader accessible mode. Displaying simplified structured article without 40x25 visual
        grid decoration.
      </div>

      {/* Control Bar: Mode Toggle, Contrast, Font Sizing */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {onToggleViewMode && (
            <button
              type="button"
              onClick={onToggleViewMode}
              className={`focus-visible:ring-teletext-yellow rounded border px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all focus-visible:ring-2 ${currentTheme.button}`}
              aria-label="Switch back to visual CRT Teletext grid view"
            >
              Switch to CRT View
            </button>
          )}

          <span className="text-xs uppercase opacity-75">
            Mag {magazineNum}: {magazineTitle}
          </span>
          <span aria-hidden="true" className="opacity-50">
            |
          </span>
          <span className="font-mono text-xs font-bold">
            PAGE {page.pageNumber}
            {page.subPageCount && page.subPageCount > 1 && (
              <span>
                {" "}
                (Subpage {page.subPageNumber || 1}/{page.subPageCount})
              </span>
            )}
          </span>
        </div>

        {/* Accessibility Toolbar: Contrast & Font Size */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Contrast Toggles */}
          <div
            role="group"
            aria-label="High contrast theme options"
            className="flex items-center gap-1"
          >
            <span className="mr-1 text-xs opacity-75">Contrast:</span>
            <button
              type="button"
              onClick={() => setContrast("standard")}
              aria-pressed={contrast === "standard"}
              className={`btn-tactile focus-visible:ring-teletext-yellow rounded border px-2 py-1 text-xs transition-all focus-visible:ring-2 active:scale-95 ${
                contrast === "standard" ? "ring-teletext-yellow font-bold ring-2" : ""
              } ${currentTheme.button}`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setContrast("high-contrast-light")}
              aria-pressed={contrast === "high-contrast-light"}
              className={`btn-tactile focus-visible:ring-teletext-yellow rounded border px-2 py-1 text-xs transition-all focus-visible:ring-2 active:scale-95 ${
                contrast === "high-contrast-light"
                  ? "bg-white font-bold text-black ring-2 ring-black"
                  : ""
              } ${currentTheme.button}`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setContrast("high-contrast-dark")}
              aria-pressed={contrast === "high-contrast-dark"}
              className={`btn-tactile focus-visible:ring-teletext-yellow rounded border px-2 py-1 text-xs transition-all focus-visible:ring-2 active:scale-95 ${
                contrast === "high-contrast-dark"
                  ? "bg-black font-bold text-white ring-2 ring-white"
                  : ""
              } ${currentTheme.button}`}
            >
              Dark
            </button>
          </div>

          {/* Font Scaling */}
          <div role="group" aria-label="Text size options" className="flex items-center gap-1">
            <span className="mr-1 text-xs opacity-75">Size:</span>
            <button
              type="button"
              onClick={() => setFontSize("normal")}
              aria-pressed={fontSize === "normal"}
              className={`btn-tactile focus-visible:ring-teletext-yellow rounded border px-2 py-1 text-xs transition-all focus-visible:ring-2 active:scale-95 ${
                fontSize === "normal" ? "ring-teletext-yellow font-bold ring-2" : ""
              } ${currentTheme.button}`}
            >
              100%
            </button>
            <button
              type="button"
              onClick={() => setFontSize("large")}
              aria-pressed={fontSize === "large"}
              className={`btn-tactile focus-visible:ring-teletext-yellow rounded border px-2 py-1 text-xs transition-all focus-visible:ring-2 active:scale-95 ${
                fontSize === "large" ? "ring-teletext-yellow font-bold ring-2" : ""
              } ${currentTheme.button}`}
            >
              125%
            </button>
            <button
              type="button"
              onClick={() => setFontSize("xlarge")}
              aria-pressed={fontSize === "xlarge"}
              className={`btn-tactile focus-visible:ring-teletext-yellow rounded border px-2 py-1 text-xs transition-all focus-visible:ring-2 active:scale-95 ${
                fontSize === "xlarge" ? "ring-teletext-yellow font-bold ring-2" : ""
              } ${currentTheme.button}`}
            >
              150%
            </button>
          </div>
        </div>
      </header>

      {/* Main Semantic Article Content */}
      <main className="flex-1 space-y-4">
        <h1 className={`${currentFont.h1} tracking-tight`}>
          {page.title || `Page ${page.pageNumber}`}
        </h1>

        {sections.length === 0 ? (
          <p className={currentFont.base}>No readable article content found on this page.</p>
        ) : (
          sections.map((section, idx) => {
            if (section.type === "heading") {
              return (
                <h2 key={idx} className={`${currentFont.h2} mt-4 border-t pt-2 opacity-90`}>
                  {section.content}
                </h2>
              );
            }
            if (section.type === "list" && section.items) {
              return (
                <ul key={idx} className={`list-disc space-y-1 pl-6 ${currentFont.base}`}>
                  {section.items.map((item, itemIdx) => (
                    <li key={itemIdx}>{item}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={idx} className={currentFont.base}>
                {section.content}
              </p>
            );
          })
        )}
      </main>

      {/* Fastext Accessible Navigation Section */}
      {page.fastext && (
        <nav
          aria-label="Fastext quick links"
          className="mt-8 rounded-lg border bg-black/10 p-4 dark:bg-white/5"
        >
          <h2 className="mb-3 text-sm font-semibold tracking-wider uppercase">
            Quick Navigation (Fastext)
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => onNavigate?.(page.fastext.red)}
              className="rounded border border-red-600 bg-red-950/40 p-2 text-left text-xs font-semibold text-red-400 hover:bg-red-900/50 focus-visible:ring-2 focus-visible:ring-red-400"
              aria-label={`Red shortcut: navigate to page ${page.fastext.red}`}
            >
              <span className="block font-bold">RED KEY</span>
              <span>{`Page ${page.fastext.red}`}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.(page.fastext.green)}
              className="rounded border border-green-600 bg-green-950/40 p-2 text-left text-xs font-semibold text-green-400 hover:bg-green-900/50 focus-visible:ring-2 focus-visible:ring-green-400"
              aria-label={`Green shortcut: navigate to page ${page.fastext.green}`}
            >
              <span className="block font-bold">GREEN KEY</span>
              <span>{`Page ${page.fastext.green}`}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.(page.fastext.yellow)}
              className="rounded border border-yellow-500 bg-yellow-950/40 p-2 text-left text-xs font-semibold text-yellow-300 hover:bg-yellow-900/50 focus-visible:ring-2 focus-visible:ring-yellow-300"
              aria-label={`Yellow shortcut: navigate to page ${page.fastext.yellow}`}
            >
              <span className="block font-bold">YELLOW KEY</span>
              <span>{`Page ${page.fastext.yellow}`}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.(page.fastext.cyan)}
              className="rounded border border-cyan-500 bg-cyan-950/40 p-2 text-left text-xs font-semibold text-cyan-300 hover:bg-cyan-900/50 focus-visible:ring-2 focus-visible:ring-cyan-300"
              aria-label={`Cyan shortcut: navigate to page ${page.fastext.cyan}`}
            >
              <span className="block font-bold">CYAN KEY</span>
              <span>{`Page ${page.fastext.cyan}`}</span>
            </button>
          </div>
        </nav>
      )}

      {/* Source Provenance & Metadata Footer */}
      {(sourceUrl || publishedAt) && (
        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs opacity-80">
          {sourceUrl ? (
            <div>
              <span>Source: </span>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={currentTheme.link}
              >
                {sourceDomain || sourceUrl} <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          ) : (
            <div />
          )}

          {publishedAt && (
            <time dateTime={publishedAt} suppressHydrationWarning>
              Published: {new Date(publishedAt).toLocaleString()}
            </time>
          )}
        </footer>
      )}
    </article>
  );
};
