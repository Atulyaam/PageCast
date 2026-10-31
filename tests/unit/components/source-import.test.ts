import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SourceImport } from "@/components/publisher/SourceImport";

describe("SourceImport Component with Community Templates (ENH-03)", () => {
  it("renders with community presets option visible", () => {
    const html = renderToStaticMarkup(
      React.createElement(SourceImport, {
        onSourceExtracted: vi.fn(),
      })
    );

    expect(html).toContain("SOURCE ARTICLE INGESTION");
    expect(html).toContain("Import URL");
    expect(html).toContain("Paste Text");
    expect(html).toContain("Community Presets");
  });

  it("renders URL input by default", () => {
    const html = renderToStaticMarkup(
      React.createElement(SourceImport, {
        onSourceExtracted: vi.fn(),
      })
    );

    expect(html).toContain("Public Article URL (HTTP / HTTPS)");
    expect(html).toContain("Fetch &amp; Extract");
  });

  it("renders community templates when defaultMode is set to template", () => {
    const html = renderToStaticMarkup(
      React.createElement(SourceImport, {
        onSourceExtracted: vi.fn(),
        defaultMode: "template",
      })
    );

    expect(html).toContain("Select Community Template:");
    expect(html).toContain("Academic &amp; Campus Notice");
    expect(html).toContain("Community Health &amp; Clinic Alert");
    expect(html).toContain("Emergency Disaster &amp; Weather Alert");
    expect(html).toContain("Local Civic &amp; Municipal Notice");
    expect(html).toContain("P501");
    expect(html).toContain("P601");
    expect(html).toContain("P101");
    expect(html).toContain("P401");
    expect(html).toContain("Use Template &amp; Segment Notice");
  });
});
