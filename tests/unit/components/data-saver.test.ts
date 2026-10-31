import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { handleTeletextKeyDown } from "@/hooks/useTeletextKeyboard";
import { TeletextGrid } from "@/components/teletext/TeletextGrid";
import { WebTerminal } from "@/components/teletext/WebTerminal";
import { fetchPublishedPage } from "@/lib/reader/reader-client";
import type { TeletextPage } from "@/domain/teletext/types";

describe("Low-Bandwidth Data Saver Profile (ENH-05)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("triggers onToggleDataSaver when 'd' or 'D' key is pressed", () => {
    const onToggleDataSaver = vi.fn();
    const mockEvent = {
      key: "d",
      preventDefault: vi.fn(),
    };
    const bufferState = {
      current: "",
      set: vi.fn(),
      clear: vi.fn(),
    };

    const handled = handleTeletextKeyDown(
      mockEvent,
      {
        onNavigatePage: vi.fn(),
        onToggleDataSaver,
      },
      bufferState
    );

    expect(handled).toBe(true);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(onToggleDataSaver).toHaveBeenCalledTimes(1);
  });

  it("renders Data Saver toggle button in WebTerminal", () => {
    const html = renderToStaticMarkup(React.createElement(WebTerminal));
    expect(html).toContain("DATA SAVER [D]");
  });

  it("applies system monospace font and omits CRT glow when useSystemFont is enabled", () => {
    const testPage: TeletextPage = {
      pageNumber: 101,
      title: "Test Page",
      rows: Array.from({ length: 25 }, () => ({
        spans: [{ text: " ".repeat(40) }],
      })),
      fastext: { red: 100, green: 200, yellow: 300, cyan: 400 },
    };

    // Standard CRT mode: uses font-teletext, crt-glow
    const standardHtml = renderToStaticMarkup(
      React.createElement(TeletextGrid, {
        page: testPage,
        showScanlines: true,
        phosphorGlow: true,
        useSystemFont: false,
      })
    );
    expect(standardHtml).toContain("font-teletext");
    expect(standardHtml).toContain("crt-glow");
    expect(standardHtml).toContain("crt-scanlines");

    // Data Saver mode: uses font-mono, no crt-glow, no scanlines
    const dataSaverHtml = renderToStaticMarkup(
      React.createElement(TeletextGrid, {
        page: testPage,
        showScanlines: false,
        phosphorGlow: false,
        useSystemFont: true,
      })
    );
    expect(dataSaverHtml).toContain("font-mono");
    expect(dataSaverHtml).not.toContain("crt-glow");
    expect(dataSaverHtml).not.toContain("crt-scanlines");
  });

  it("resolves from offline cache first when preferOfflineFirst is enabled", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          page: { page_number: 100 },
          pack: { pages: [] },
        },
      }),
    });

    // P100 is always present in local seed broadcast
    const result = await fetchPublishedPage(100, mockFetch as any, true);

    expect(result.success).toBe(true);
    // Because P100 was resolved locally from offline seed cache, mockFetch was never invoked over the wire!
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.data?.isFallback).toBe(true);
  });
});
