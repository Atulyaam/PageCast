import React from "react";

export function DesignTokenPreview() {
  const teletextColors = [
    {
      name: "teletext-black",
      hex: "#0a0a0c",
      role: "Screen Background / Base",
      bgClass: "bg-[#0a0a0c]",
      textClass: "text-[#f8fafc]",
    },
    {
      name: "teletext-white",
      hex: "#f8fafc",
      role: "Primary Body Text / Borders",
      bgClass: "bg-[#f8fafc]",
      textClass: "text-[#0a0a0c]",
    },
    {
      name: "teletext-yellow",
      hex: "#facc15",
      role: "Section Headings / P# Num",
      bgClass: "bg-[#facc15]",
      textClass: "text-[#0a0a0c]",
    },
    {
      name: "teletext-cyan",
      hex: "#06b6d4",
      role: "Badges / Hyperlinks / Meta",
      bgClass: "bg-[#06b6d4]",
      textClass: "text-[#0a0a0c]",
    },
    {
      name: "teletext-green",
      hex: "#22c55e",
      role: "Success / Online Status",
      bgClass: "bg-[#22c55e]",
      textClass: "text-[#0a0a0c]",
    },
    {
      name: "teletext-magenta",
      hex: "#e11d48",
      role: "Category Tags / Highlights",
      bgClass: "bg-[#e11d48]",
      textClass: "text-[#f8fafc]",
    },
    {
      name: "teletext-red",
      hex: "#ef4444",
      role: "Errors / Over-Budget Alert",
      bgClass: "bg-[#ef4444]",
      textClass: "text-[#f8fafc]",
    },
    {
      name: "teletext-blue",
      hex: "#2563eb",
      role: "Header Bands / Accents",
      bgClass: "bg-[#2563eb]",
      textClass: "text-[#f8fafc]",
    },
  ];

  const surfaceColors = [
    { name: "surface-ground", hex: "#030712", role: "App Viewport Base", bgClass: "bg-[#030712]" },
    {
      name: "surface-terminal",
      hex: "#0b0f19",
      role: "Teletext Outer CRT Frame",
      bgClass: "bg-[#0b0f19]",
    },
    {
      name: "surface-panel",
      hex: "#111827",
      role: "Publisher Studio Cards",
      bgClass: "bg-[#111827]",
    },
    {
      name: "surface-border",
      hex: "#1f2937",
      role: "Dividers & Focus Outlines",
      bgClass: "bg-[#1f2937]",
    },
  ];

  // Sample 40x25 terminal mockup lines
  const terminalLines = [
    "P100  PAGECAST  TELETEXT NEWS   31 OCT 2026",
    "----------------------------------------",
    "WELCOME TO PAGECAST INFORMATION SYSTEM  ",
    "LOW-BANDWIDTH CONSTRAINED BULLETIN DIST.",
    "                                        ",
    "101 WORLD NEWS HEADLINES               ",
    "102 SCIENCE & TECHNOLOGY REPORT        ",
    "103 EMERGENCY COMMUNITY NOTICES        ",
    "104 हिंदी बुलेटिन (HINDI SUMMARY)      ",
    "                                        ",
    "KEY FEATURES:                           ",
    "* 40-COLUMN BY 25-ROW DETERMINISTIC GRID",
    "* STRICT 10 KIB PAYLOAD CEILING ENFORCED",
    "* MULTI-FRAME QR DEVICE-TO-DEVICE IMPORT",
    "* OFFLINE FIRST INDEXEDDB LOCAL STORAGE ",
    "                                        ",
    "SOURCE: PAGECAST KBH ARCHIVE            ",
    "CANONICAL: https://pagecast.network/p100",
    "REVISION: 1  |  BYTES: 7,420 / 10,240   ",
    "STATUS: [ONLINE - LOCAL CACHED]         ",
    "                                        ",
    "NAVIGATE: [100] [101] [102] [103] [104] ",
    "PRESS NUMBER OR ARROWS TO CHANGE PAGE   ",
    "----------------------------------------",
    "100 INDEX | 101 NEXT | S SAVE | Q SHARE ",
  ];

  return (
    <div className="min-h-screen space-y-12 bg-[#030712] p-4 text-[#f8fafc] md:p-8">
      {/* Header */}
      <header className="border-b border-[#1f2937] pb-6">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl font-bold tracking-widest text-[#facc15]">
            [▌▌] PAGECAST
          </span>
          <span className="rounded bg-[#06b6d4] px-2 py-0.5 text-xs font-bold text-[#0a0a0c]">
            DEV PREVIEW ONLY
          </span>
        </div>
        <p className="mt-1 text-sm text-[#9ca3af]">
          Visual Design Tokens &amp; Component Verification Harness — Sprint 0
        </p>
      </header>

      {/* 1. Teletext 8-Color Palette */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-mono text-xl font-bold text-[#facc15]">
          <span>01.</span> Classic Teletext 8-Color System
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {teletextColors.map((color) => (
            <div
              key={color.name}
              className={`rounded border border-[#1f2937] p-3 ${color.bgClass} ${color.textClass} flex h-28 flex-col justify-between shadow-sm`}
            >
              <div>
                <p className="font-mono text-xs leading-tight font-bold">{color.name}</p>
                <p className="font-mono text-[10px] opacity-80">{color.hex}</p>
              </div>
              <p className="font-sans text-[10px] leading-tight">{color.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Neutral Surface Tokens */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-mono text-xl font-bold text-[#06b6d4]">
          <span>02.</span> Modern Studio &amp; Neutral Surface Tokens
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {surfaceColors.map((surface) => (
            <div
              key={surface.name}
              className={`rounded border border-[#1f2937] p-4 ${surface.bgClass} flex h-24 flex-col justify-between`}
            >
              <div>
                <p className="font-mono text-sm font-semibold text-[#f8fafc]">{surface.name}</p>
                <p className="font-mono text-xs text-[#9ca3af]">{surface.hex}</p>
              </div>
              <p className="text-xs text-[#9ca3af]">{surface.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Typography Verification */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-mono text-xl font-bold text-[#22c55e]">
          <span>03.</span> Typography Stacks (English &amp; Hindi)
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2 rounded border border-[#1f2937] bg-[#111827] p-4">
            <h3 className="font-mono text-xs font-bold text-[#facc15] uppercase">
              Monospace Teletext Stack (Noto Sans Mono)
            </h3>
            <p className="font-mono text-lg text-[#f8fafc]">
              ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789
            </p>
            <p className="font-mono text-sm text-[#06b6d4]">
              abcdefghijklmnopqrstuvwxyz !@#$%^&amp;*()_+-=
            </p>
            <p className="font-mono text-xs text-[#9ca3af]">
              Tabular Numerals: 001 002 003 | PagePack V1 Layout Engine
            </p>
          </div>

          <div className="space-y-2 rounded border border-[#1f2937] bg-[#111827] p-4">
            <h3 className="font-mono text-xs font-bold text-[#facc15] uppercase">
              Devanagari Hindi Stack (Noto Sans Devanagari)
            </h3>
            <p className="text-lg text-[#f8fafc]" style={{ fontFamily: "var(--font-hindi)" }}>
              पेजकास्ट: कम बैंडविड्थ वाला टेलीटेक्स्ट समाचार मंच।
            </p>
            <p className="text-sm text-[#06b6d4]" style={{ fontFamily: "var(--font-hindi)" }}>
              संयुक्त अक्षर व मात्रा परीक्षण: क्ति, त्र, ज्ञ, ॐ, दृष्टि, श्रृंखला, १२३४५६७८९०
            </p>
            <p className="text-xs text-[#9ca3af]">
              Grapheme clusters preserved using Intl.Segmenter in Domain Layer.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Interactive Component & State Preview */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-mono text-xl font-bold text-[#e11d48]">
          <span>04.</span> Form Controls, States &amp; Focus Indicators
        </h2>
        <div className="space-y-6 rounded border border-[#1f2937] bg-[#111827] p-6">
          <div className="flex flex-wrap items-center gap-4">
            <button className="rounded bg-[#facc15] px-4 py-2 text-sm font-bold text-[#0a0a0c] transition-colors hover:bg-[#eab308] focus-visible:outline-2 focus-visible:outline-white">
              Primary Action (Save)
            </button>
            <button className="rounded bg-[#06b6d4] px-4 py-2 text-sm font-bold text-[#0a0a0c] transition-colors hover:bg-[#0891b2]">
              Secondary Action (QR)
            </button>
            <button className="rounded border border-[#374151] bg-[#1f2937] px-4 py-2 text-sm font-medium text-[#f8fafc] transition-colors hover:bg-[#374151]">
              Tertiary Button
            </button>
            <button
              disabled
              className="cursor-not-allowed rounded bg-[#1f2937] px-4 py-2 text-sm font-medium text-[#6b7280] opacity-60"
            >
              Disabled Action
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block font-mono text-xs text-[#9ca3af]">
                PAGE NUMBER INPUT
              </label>
              <input
                type="text"
                defaultValue="100"
                className="w-full rounded border border-[#1f2937] bg-[#0a0a0c] px-3 py-2 font-mono text-sm text-[#facc15] focus:border-[#facc15] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs text-[#9ca3af]">
                ARTICLE SOURCE URL
              </label>
              <input
                type="text"
                placeholder="https://example.org/article"
                className="w-full rounded border border-[#1f2937] bg-[#0a0a0c] px-3 py-2 text-sm text-[#f8fafc] focus:border-[#06b6d4] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs text-[#9ca3af]">
                BYTE BUDGET METER
              </label>
              <div className="flex w-full items-center justify-between rounded border border-[#1f2937] bg-[#0a0a0c] p-2">
                <span className="font-mono text-xs text-[#22c55e]">7,420 / 10,240 B</span>
                <span className="rounded bg-[#22c55e]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#22c55e]">
                  VALID (72%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Sample 40x25 Teletext Terminal */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-mono text-xl font-bold text-[#f8fafc]">
          <span>05.</span> Sample 40&times;25 Teletext Logical Terminal Mockup
        </h2>
        <div className="overflow-x-auto rounded-xl border border-[#1f2937] bg-[#0b0f19] p-4 shadow-2xl md:p-6">
          <div className="inline-block max-w-full min-w-[360px] rounded border-2 border-[#1f2937] bg-[#0a0a0c] p-3">
            <pre className="font-mono text-xs leading-[1.25] tracking-normal text-[#f8fafc] select-none sm:text-sm">
              {terminalLines.map((line, index) => {
                let colorClass = "text-[#f8fafc]";
                if (index === 0) colorClass = "text-[#facc15] font-bold";
                else if (index === 2) colorClass = "text-[#06b6d4] font-bold";
                else if (index >= 5 && index <= 8) colorClass = "text-[#facc15]";
                else if (index >= 11 && index <= 14) colorClass = "text-[#22c55e]";
                else if (index === 24) colorClass = "text-[#06b6d4] font-bold";
                return (
                  <div key={index} className={colorClass}>
                    {line}
                  </div>
                );
              })}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
