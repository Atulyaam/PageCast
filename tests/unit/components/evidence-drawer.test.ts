import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { EvidenceDrawer } from "@/components/teletext/EvidenceDrawer";
import { handleTeletextKeyDown } from "@/hooks/useTeletextKeyboard";
import type { PagePackV1 } from "@/domain/page-pack/types";

describe("Source Evidence Explorer (TASK-ENH-01 / ENH-01)", () => {
  const mockPackWithEvidence: PagePackV1 = {
    id: "00000000-0000-4000-8000-000000000101",
    version: 1,
    slug: "world-news-climate",
    title: "World News — Climate Treaty",
    magazine: 1,
    primaryPageNumber: 101,
    createdAt: "2026-10-31T12:00:00.000Z",
    metadata: {
      sourceName: "Reuters International",
      originalUrl: "https://www.reuters.com/sustainability/climate-treaty-geneva",
      author: "Diplomatic Affairs Desk",
      language: "en",
      aiAssisted: true,
      promptVersion: "v1.2",
      modelId: "gemini-2.5-flash",
      publisherId: "editor_editorial_desk",
      evidenceReferences: [
        {
          pointId: "pt-1",
          sourceSentenceId: "s1",
          sentenceText:
            "Delegates from 140 nations ratified the landmark climate treaty in Geneva today.",
          sentenceHash: "7b8d4f2a1e3c5a6b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
        },
        {
          pointId: "pt-2",
          sourceSentenceId: "s2",
          sentenceText:
            "Key provisions mandate carbon emission disclosures and transition financing.",
          sentenceHash: "8c9e5f3b2f4d6a7b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2c",
        },
      ],
    },
    pages: [],
  };

  const mockPackWithoutEvidence: PagePackV1 = {
    id: "00000000-0000-4000-8000-000000000199",
    version: 1,
    slug: "empty-evidence",
    title: "Bulletin Without Provenance",
    magazine: 1,
    primaryPageNumber: 199,
    createdAt: "2026-10-31T12:00:00.000Z",
    metadata: {
      sourceName: "Legacy Wire",
      language: "en",
      aiAssisted: false,
      publisherId: "anon_pub",
    },
    pages: [],
  };

  it("renders null when isOpen is false", () => {
    const html = renderToString(
      React.createElement(EvidenceDrawer, {
        isOpen: false,
        onClose: () => {},
        pack: mockPackWithEvidence,
        pageNumber: 101,
      })
    );
    expect(html).toBe("");
  });

  it("renders accessible dialog semantics and page header when isOpen is true", () => {
    const html = renderToString(
      React.createElement(EvidenceDrawer, {
        isOpen: true,
        onClose: () => {},
        pack: mockPackWithEvidence,
        pageNumber: 101,
      })
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("SOURCE EVIDENCE EXPLORER • P101");
  });

  it("displays canonical source attribution including author, publisher and original URL", () => {
    const html = renderToString(
      React.createElement(EvidenceDrawer, {
        isOpen: true,
        onClose: () => {},
        pack: mockPackWithEvidence,
        pageNumber: 101,
      })
    );

    expect(html).toContain("Reuters International");
    expect(html).toContain("Diplomatic Affairs Desk");
    expect(html).toContain("https://www.reuters.com/sustainability/climate-treaty-geneva");
    expect(html).toContain("English");
  });

  it("displays editorial certificate and AI disclosure metadata", () => {
    const html = renderToString(
      React.createElement(EvidenceDrawer, {
        isOpen: true,
        onClose: () => {},
        pack: mockPackWithEvidence,
        pageNumber: 101,
        reviewedBy: "senior_editor_raj",
        reviewedAt: "2026-10-31T12:30:00.000Z",
      })
    );

    expect(html).toContain("senior_editor_raj");
    expect(html).toContain("2026-10-31 12:30:00");
    expect(html).toContain("gemini-2.5-flash");
    expect(html).toContain("v1.2");
    expect(html).toContain("2 POINTS GROUNDED");
  });

  it("renders sentence-level evidence excerpts and SHA-256 fingerprints", () => {
    const html = renderToString(
      React.createElement(EvidenceDrawer, {
        isOpen: true,
        onClose: () => {},
        pack: mockPackWithEvidence,
        pageNumber: 101,
      })
    );

    expect(html).toContain("Delegates from 140 nations ratified the landmark climate treaty");
    expect(html).toContain("pt-1");
    expect(html).toContain("s1");
    expect(html).toContain("7b8d4f2a1e3c5a6b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b");
  });

  it("renders clear 'Evidence unavailable' fallback when bulletin has no provenance", () => {
    const html = renderToString(
      React.createElement(EvidenceDrawer, {
        isOpen: true,
        onClose: () => {},
        pack: mockPackWithoutEvidence,
        pageNumber: 199,
      })
    );

    expect(html).toContain("Evidence unavailable for this page");
    expect(html).toContain("NO GROUNDING RECORDS");
    expect(html).toContain(
      "This bulletin was created without granular sentence-level provenance records."
    );
  });

  it("triggers onToggleEvidence when 'e' or 'E' key is pressed in handleTeletextKeyDown", () => {
    const onToggleEvidence = vi.fn();
    const bufferState = {
      current: "",
      set: vi.fn(),
      clear: vi.fn(),
    };

    const handled = handleTeletextKeyDown(
      { key: "e" },
      {
        onNavigatePage: () => {},
        onToggleEvidence,
      },
      bufferState
    );

    expect(handled).toBe(true);
    expect(onToggleEvidence).toHaveBeenCalledTimes(1);
  });
});
