"use client";

import React, { useState, useTransition } from "react";
import type { TeletextPage } from "@/domain/teletext/types";
import { TeletextGrid } from "./TeletextGrid";
import { TeletextDialer } from "./TeletextDialer";
import { TeletextFastextBar } from "./TeletextFastextBar";
import { getSeedPage, getSeedPageCatalog, page100 } from "@/data/seed-pages";
import { getMagazineNumber, isValidPageNumber } from "@/domain/validation/page-number";

export interface WebTerminalProps {
  readonly initialPageNumber?: number;
  readonly className?: string;
}

export const WebTerminal: React.FC<WebTerminalProps> = ({
  initialPageNumber = 100,
  className = "",
}) => {
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(initialPageNumber);
  const [showScanlines, setShowScanlines] = useState<boolean>(false);
  const [phosphorGlow, setPhosphorGlow] = useState<boolean>(true);
  const [, startTransition] = useTransition();

  const catalog = getSeedPageCatalog();
  const activePage: TeletextPage = getSeedPage(currentPageNumber) ?? page100;
  const magazine = isValidPageNumber(currentPageNumber) ? getMagazineNumber(currentPageNumber) : 1;

  const handleNavigate = (pageNumber: number) => {
    startTransition(() => {
      if (isValidPageNumber(pageNumber)) {
        setCurrentPageNumber(pageNumber);
      }
    });
  };

  return (
    <div
      className={`mx-auto flex w-full max-w-4xl flex-col items-center gap-4 ${className}`.trim()}
    >
      {/* Terminal Control Bar */}
      <div className="bg-surface-panel border-surface-border text-text-muted flex w-full flex-wrap items-center justify-between rounded-lg border px-2 py-1.5 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="text-teletext-green flex items-center gap-1.5 font-semibold">
            <span className="bg-teletext-green h-2 w-2 animate-pulse rounded-full" />
            LIVE BROADCAST
          </span>
          <span className="text-surface-border-subtle hidden sm:inline">|</span>
          <span className="hidden sm:inline">MAGAZINE {magazine}</span>
        </div>

        {/* Display Toggles */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowScanlines((prev) => !prev)}
            className={`rounded border px-2 py-1 text-[11px] transition-all ${
              showScanlines
                ? "bg-teletext-yellow text-teletext-black border-teletext-yellow font-bold"
                : "bg-surface-terminal border-surface-border text-text-muted hover:text-teletext-white"
            }`}
          >
            SCANLINES: {showScanlines ? "ON" : "OFF"}
          </button>

          <button
            type="button"
            onClick={() => setPhosphorGlow((prev) => !prev)}
            className={`rounded border px-2 py-1 text-[11px] transition-all ${
              phosphorGlow
                ? "bg-teletext-cyan text-teletext-black border-teletext-cyan font-bold"
                : "bg-surface-terminal border-surface-border text-text-muted hover:text-teletext-white"
            }`}
          >
            GLOW: {phosphorGlow ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Main 40x25 Teletext CRT Screen */}
      <div className="w-full">
        <TeletextGrid page={activePage} showScanlines={showScanlines} phosphorGlow={phosphorGlow} />
      </div>

      {/* Fastext Navigation Bar */}
      <div className="w-full">
        <TeletextFastextBar fastext={activePage.fastext} onNavigate={handleNavigate} />
      </div>

      {/* Remote Control Keypad */}
      <div className="flex w-full justify-center">
        <TeletextDialer
          currentPage={currentPageNumber}
          catalogue={catalog}
          fastext={activePage.fastext}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );
};
