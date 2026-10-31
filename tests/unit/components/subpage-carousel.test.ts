import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { SubPageCarousel } from "@/components/teletext/SubPageCarousel";

describe("SubPageCarousel Component (TASK-S4-03)", () => {
  it("renders minimal static indicator when subPageCount is 1", () => {
    const html = renderToString(
      React.createElement(SubPageCarousel, {
        pageNumber: 100,
        currentSubIndex: 0,
        subPageCount: 1,
        onSubPageChange: () => {},
      })
    );

    expect(html).toContain("Single Frame Bulletin");
    expect(html).toContain("STATIC BROADCAST");
    expect(html).not.toContain("PAUSE");
  });

  it("renders full carousel controls when multiple subpages exist", () => {
    const html = renderToString(
      React.createElement(SubPageCarousel, {
        pageNumber: 205,
        currentSubIndex: 1,
        subPageCount: 3,
        onSubPageChange: () => {},
      })
    );

    expect(html).toContain("2/3");
    expect(html).toContain("CAROUSEL FRAMES:");
    expect(html).toContain("PAUSE");
    expect(html).toContain("PREV");
    expect(html).toContain("NEXT");

    // All 3 subpage jump buttons rendered
    expect(html).toContain('aria-label="Jump to subpage 1"');
    expect(html).toContain('aria-label="Jump to subpage 2"');
    expect(html).toContain('aria-label="Jump to subpage 3"');
  });

  it("marks the active subpage with aria-current", () => {
    const html = renderToString(
      React.createElement(SubPageCarousel, {
        pageNumber: 101,
        currentSubIndex: 0,
        subPageCount: 2,
        onSubPageChange: () => {},
      })
    );

    expect(html).toContain('aria-current="true"');
    expect(html).toContain("1/2");
  });
});
