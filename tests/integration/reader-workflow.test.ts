import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { WebTerminal } from "@/components/teletext/WebTerminal";
import PageRoute from "@/app/pages/[pageNumber]/page";
import TerminalPage from "@/app/terminal/page";

describe("Reader Workflow & Deep-Linking (TASK-S4-09)", () => {
  it("renders WebTerminal with full Teletext components on initial load", () => {
    const html = renderToString(React.createElement(WebTerminal, { initialPageNumber: 100 }));

    // Header & live indicators
    expect(html).toContain("LIVE BROADCAST");
    expect(html).toContain("MAG 1: NEWS &amp; INDEX");
    expect(html).toContain("ACCESSIBLE TEXT MODE");

    // CRT Screen Grid
    expect(html).toContain("PageCast Main Index");
    expect(html).toContain("WELCOME TO PAGECAST TELETEXT");

    // Fastext bar
    expect(html).toContain("101");
    expect(html).toContain("News 101");

    // Audio & Dialer controls
    expect(html).toContain("SOUND FX: OFF");
    expect(html).toContain("CLR");
    expect(html).toContain("▲ PREV");
    expect(html).toContain("SHARE / QR");
    expect(html).toContain("KEYS (?)");
  });

  it("renders dedicated fullscreen /terminal page", async () => {
    const pageComponent = await TerminalPage({
      searchParams: Promise.resolve({ page: "101" }),
    });

    const html = renderToString(pageComponent);

    expect(html).toContain("DEDICATED TERMINAL");
    expect(html).toContain("WORLD NEWS");
    expect(html).toContain("GLOBAL CLIMATE ACCORD SIGNED");
  });

  it("renders dynamic /pages/[pageNumber] SSR route", async () => {
    const pageComponent = await PageRoute({
      params: Promise.resolve({ pageNumber: "102" }),
    });

    const html = renderToString(pageComponent);

    expect(html).toContain("P102");
    expect(html).toContain("राष्ट्रीय समाचार");
    expect(html).toContain("डिजिटल साक्षरता और कम-बैंडविड्थ क्रांति");
  });

  it("rejects invalid page numbers in dynamic route with notFound", async () => {
    let threw = false;
    try {
      await PageRoute({
        params: Promise.resolve({ pageNumber: "99" }),
      });
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
