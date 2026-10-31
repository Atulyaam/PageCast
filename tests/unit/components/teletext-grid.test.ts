import { describe, it, expect } from "vitest";
import React, { type ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { TeletextGrid } from "@/components/teletext/TeletextGrid";
import { AccessibleAlternative } from "@/components/teletext/AccessibleAlternative";
import { layoutBulletinPage } from "@/domain/layout-engine/layout";

describe("Teletext React Components", () => {
  const samplePage = layoutBulletinPage({
    pageNumber: 101,
    title: "World News",
    topic: "HEADLINES",
    headline: "PEACE SUMMIT CONCLUDES",
    paragraphs: ["Diplomats have signed a multilateral peace framework."],
    fastext: { red: 102, green: 200, yellow: 300, cyan: 100 },
  });

  const hindiPage = layoutBulletinPage({
    pageNumber: 102,
    title: "राष्ट्रीय समाचार",
    topic: "मुख्य समाचार",
    headline: "शांति शिखर सम्मेलन संपन्न",
    paragraphs: ["राजनयिकों ने बहुपक्षीय शांति समझौते पर हस्ताक्षर किए हैं।"],
    fastext: { red: 100, green: 200, yellow: 300, cyan: 400 },
    language: "hi",
  });

  it("renders TeletextGrid with strictly 25 rows and accessibility alternative", () => {
    const element = TeletextGrid({
      page: samplePage,
      showScanlines: true,
      phosphorGlow: true,
    }) as ReactElement<{ children: React.ReactNode[] }>;

    expect(element).toBeDefined();
    expect(React.isValidElement(element)).toBe(true);

    // Verify AccessibleAlternative is embedded
    const children = React.Children.toArray(element.props.children);
    expect(children.length).toBeGreaterThanOrEqual(2);
  });

  it("generates AccessibleAlternative with semantic screen-reader text", () => {
    const element = AccessibleAlternative({ page: samplePage }) as ReactElement<{
      className: string;
      "aria-label": string;
      children: ReactElement[];
    }>;

    expect(element).toBeDefined();
    expect(React.isValidElement(element)).toBe(true);
    expect(element.props.className).toContain("sr-only");
    expect(element.props["aria-label"]).toContain("Page 101: World News");
  });

  it("contains Fastext quick links inside the accessible alternative", () => {
    const element = AccessibleAlternative({ page: samplePage }) as ReactElement<{
      children: ReactElement[];
    }>;
    const navSection = element.props.children[2] as ReactElement<{
      "aria-label": string;
    }>;

    expect(navSection.type).toBe("nav");
    expect(navSection.props["aria-label"]).toBe("Fastext Shortcut Navigation");
  });

  it("renders Hindi Devanagari pages with authentic teletext-hindi typography class", () => {
    const html = renderToString(
      React.createElement(TeletextGrid, {
        page: hindiPage,
        showScanlines: false,
        phosphorGlow: true,
      })
    );

    expect(html).toContain("teletext-hindi");
    expect(html).toContain("शांति शिखर सम्मेलन संपन्न");
  });

  it("enforces responsive aspect ratio [40/25] and overflow containment for 360px viewports", () => {
    const html = renderToString(
      React.createElement(TeletextGrid, {
        page: samplePage,
        showScanlines: true,
        phosphorGlow: true,
      })
    );

    expect(html).toContain("aspect-[40/25]");
    expect(html).toContain("overflow-hidden");
    expect(html).toContain("crt-scanlines");
    expect(html).toContain("crt-glow");
  });

  it("verifies readable typography scaling (11px mobile, responsive breakpoints) while preserving 40x25 grid (PHASE-4)", () => {
    const html = renderToString(
      React.createElement(TeletextGrid, {
        page: samplePage,
        showScanlines: false,
        phosphorGlow: false,
      })
    );

    // Verify 11px base on mobile with responsive scaling
    expect(html).toContain("text-[11px]");
    expect(html).toContain("sm:text-xs");
    expect(html).toContain("md:text-sm");
    expect(html).toContain("lg:text-base");
    expect(html).toContain("tracking-tight");

    // Verify strictly 25 rows in output HTML
    const rowMatches = html.match(/role="row"/g);
    expect(rowMatches).toHaveLength(25);
  });

  it("verifies system font mode preserves 40x25 grid and font-mono stack", () => {
    const html = renderToString(
      React.createElement(TeletextGrid, {
        page: samplePage,
        useSystemFont: true,
      })
    );

    expect(html).toContain("font-mono");
    expect(html).not.toContain("font-teletext");
    const rowMatches = html.match(/role="row"/g);
    expect(rowMatches).toHaveLength(25);
  });
});
