import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  AccessibleTextView,
  extractAccessibleContent,
} from "@/components/teletext/AccessibleTextView";
import { page100, page101, page102 } from "@/data/seed-pages";
import type { TeletextPage } from "@/domain/teletext/types";

describe("AccessibleTextView (TASK-S4-08)", () => {
  it("extracts structured sections from Teletext rows", () => {
    const mockPage: TeletextPage = {
      pageNumber: 205,
      title: "Test Article Title",
      rows: [
        // Row 0: Header (skipped)
        { spans: [{ text: "PAGECAST P205 12:00:00" }] },
        // Row 1: Subheading (double height)
        { spans: [{ text: "BREAKING DEVELOPMENTS", doubleHeight: true }] },
        { spans: [{ text: "BREAKING DEVELOPMENTS", doubleHeight: true }] }, // Duplicate bottom row
        // Row 3: Paragraph
        { spans: [{ text: "The international summit concluded today with a joint declaration." }] },
        // Row 4: Bullet points
        { spans: [{ text: "• Emission caps reduced by 40%." }] },
        { spans: [{ text: "• Global energy transition fund established." }] },
        // Row 24: Fastext (skipped)
        { spans: [{ text: "RED 100 GREEN 200 YELLOW 300 CYAN 400" }] },
      ],
      fastext: { red: 100, green: 200, yellow: 300, cyan: 400 },
      language: "en",
    };

    const sections = extractAccessibleContent(mockPage);

    expect(sections.length).toBe(3);
    expect(sections[0]).toEqual({
      type: "heading",
      content: "BREAKING DEVELOPMENTS",
    });
    expect(sections[1]).toEqual({
      type: "paragraph",
      content: "The international summit concluded today with a joint declaration.",
    });
    expect(sections[2]).toEqual({
      type: "list",
      items: ["Emission caps reduced by 40%.", "Global energy transition fund established."],
    });
  });

  it("renders semantic HTML hierarchy with article, h1, and list elements", () => {
    const html = renderToString(
      React.createElement(AccessibleTextView, {
        page: page100,
        sourceUrl: "https://example.com/teletext-report",
        sourceDomain: "example.com",
        publishedAt: "2026-10-31T10:00:00Z",
      })
    );

    // Semantic container
    expect(html).toContain('role="article"');
    expect(html).toContain('lang="en"');
    expect(html).toContain("PageCast Main Index");
    expect(html).toContain("<h1");

    // Fastext navigation
    expect(html).toContain('aria-label="Fastext quick links"');
    expect(html).toContain("RED KEY");
    expect(html).toContain("Page 101");

    // Source provenance link
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("example.com");
    expect(html).toContain("(opens in a new tab)");
  });

  it("supports Hindi language with appropriate lang attribute", () => {
    const html = renderToString(
      React.createElement(AccessibleTextView, {
        page: page102,
      })
    );

    expect(html).toContain('lang="hi"');
    expect(html).toContain("राष्ट्रीय समाचार");
  });

  it("renders view toggle button when onToggleViewMode is provided", () => {
    const handleToggle = vi.fn();
    const html = renderToString(
      React.createElement(AccessibleTextView, {
        page: page101,
        onToggleViewMode: handleToggle,
      })
    );

    expect(html).toContain("Switch to CRT View");
    expect(html).toContain('aria-label="Switch back to visual CRT Teletext grid view"');
  });

  it("renders contrast and font sizing control groups", () => {
    const html = renderToString(
      React.createElement(AccessibleTextView, {
        page: page101,
        initialContrast: "high-contrast-light",
        initialFontSize: "large",
      })
    );

    expect(html).toContain('aria-label="High contrast theme options"');
    expect(html).toContain('aria-label="Text size options"');
    expect(html).toContain("bg-white text-black");
    expect(html).toContain("text-3xl font-bold");
  });
});
