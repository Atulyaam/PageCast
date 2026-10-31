import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PosterModal } from "@/components/publisher/PosterModal";

describe("PosterModal Component (ENH-03)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when isOpen is false", () => {
    const html = renderToStaticMarkup(
      React.createElement(PosterModal, {
        isOpen: false,
        onClose: vi.fn(),
        pageNumber: 501,
        title: "Campus Notice",
      })
    );
    expect(html).toBe("");
  });

  it("renders poster preview dialog with correct metadata and instructions", () => {
    const html = renderToStaticMarkup(
      React.createElement(PosterModal, {
        isOpen: true,
        onClose: vi.fn(),
        pageNumber: 501,
        title: "End-Semester Examination Schedule",
        categoryName: "CAMPUS NOTICEBOARD",
        textContent: "Morning session: 09:30 to 12:30 IST.\nHall tickets mandatory at Gate 2.",
      })
    );

    expect(html).toContain("PAGECAST P501");
    expect(html).toContain("CAMPUS NOTICEBOARD");
    expect(html).toContain("End-Semester Examination Schedule");
    expect(html).toContain("OFFLINE TELETEXT BROADCAST");
    expect(html).toContain("Morning session: 09:30 to 12:30 IST.");
    expect(html).toContain("Hall tickets mandatory at Gate 2.");
    expect(html).toContain("SCAN WITH ANY MOBILE CAMERA");
    expect(html).toContain("NO INTERNET RE-DOWNLOAD NEEDED");
    expect(html).toContain("Print Poster");
  });

  it("renders with a PagePack lines if provided", () => {
    const mockPack = {
      id: "test-pack-1",
      version: 1 as const,
      slug: "health-alert",
      title: "Measles Vaccination Camp",
      magazine: 6,
      primaryPageNumber: 601,
      createdAt: new Date().toISOString(),
      metadata: {
        sourceName: "Community Health Clinic",
        language: "en" as const,
        aiAssisted: false,
        publisherId: "test-publisher",
        evidenceReferences: [],
      },
      pages: [
        {
          pageNumber: 601,
          subPageNumber: 1,
          subPageCount: 1,
          title: "Measles Vaccination Camp",
          rows: [
            { spans: [{ text: "PAGECAST 601 01/01" }] },
            { spans: [{ text: "----------------------------------------" }] },
            { spans: [{ text: "FREE MEASLES VACCINATION CLINIC" }] },
            { spans: [{ text: "BOOSTER DOSES AVAILABLE AT PRIMARY HC" }] },
            { spans: [{ text: "----------------------------------------" }] },
          ],
          fastext: { red: 100, green: 200, yellow: 300, cyan: 400 },
        },
      ],
    };

    const html = renderToStaticMarkup(
      React.createElement(PosterModal, {
        isOpen: true,
        onClose: vi.fn(),
        pageNumber: 601,
        title: mockPack.title,
        pack: mockPack,
      })
    );

    expect(html).toContain("P601");
    expect(html).toContain("FREE MEASLES VACCINATION CLINIC");
    expect(html).toContain("BOOSTER DOSES AVAILABLE AT PRIMARY HC");
  });
});
