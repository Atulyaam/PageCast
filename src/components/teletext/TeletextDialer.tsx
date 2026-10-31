"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  isValidPageNumber,
  getNextPageNumber,
  getPreviousPageNumber,
} from "@/domain/validation/page-number";
import type { FastextLinks } from "@/domain/teletext/types";

export interface TeletextDialerProps {
  readonly currentPage: number;
  readonly catalogue: readonly number[];
  readonly fastext?: FastextLinks;
  readonly onNavigate: (pageNumber: number) => void;
  readonly className?: string;
}

export const TeletextDialer: React.FC<TeletextDialerProps> = ({
  currentPage,
  catalogue,
  fastext,
  onNavigate,
  className = "",
}) => {
  const [dialBuffer, setDialBuffer] = useState<string>("");

  const handleDigit = useCallback(
    (digit: string) => {
      const nextBuffer = dialBuffer + digit;
      if (nextBuffer.length === 3) {
        const pageNum = parseInt(nextBuffer, 10);
        if (isValidPageNumber(pageNum)) {
          onNavigate(pageNum);
        }
        setDialBuffer("");
      } else {
        setDialBuffer(nextBuffer);
      }
    },
    [dialBuffer, onNavigate]
  );

  const handleClear = useCallback(() => {
    setDialBuffer("");
  }, []);

  const handlePrev = useCallback(() => {
    const prev = getPreviousPageNumber(currentPage, catalogue);
    onNavigate(prev);
    setDialBuffer("");
  }, [currentPage, catalogue, onNavigate]);

  const handleNext = useCallback(() => {
    const next = getNextPageNumber(currentPage, catalogue);
    onNavigate(next);
    setDialBuffer("");
  }, [currentPage, catalogue, onNavigate]);

  // Global Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }

      // 0-9 digits
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        // If buffer is empty and key is 1-4, check if Fastext should trigger or digit entry
        // In Teletext remote, digits dial. Let's dial digits!
        handleDigit(e.key);
        return;
      }

      // Escape -> Go to Page 100 or clear buffer
      if (e.key === "Escape") {
        e.preventDefault();
        if (dialBuffer) {
          handleClear();
        } else {
          onNavigate(100);
        }
        return;
      }

      // Backspace -> delete last dialed digit
      if (e.key === "Backspace") {
        e.preventDefault();
        setDialBuffer((prev) => prev.slice(0, -1));
        return;
      }

      // Arrow navigation
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        handlePrev();
        return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        handleNext();
        return;
      }

      // Function keys F1-F4 for Fastext
      if (fastext) {
        if (e.key === "F1") {
          e.preventDefault();
          onNavigate(fastext.red);
        } else if (e.key === "F2") {
          e.preventDefault();
          onNavigate(fastext.green);
        } else if (e.key === "F3") {
          e.preventDefault();
          onNavigate(fastext.yellow);
        } else if (e.key === "F4") {
          e.preventDefault();
          onNavigate(fastext.cyan);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialBuffer, handleDigit, handleClear, handlePrev, handleNext, fastext, onNavigate]);

  // Display buffer formatted as P1__ or P100
  const displayBuffer = dialBuffer ? `P${dialBuffer.padEnd(3, "_")}` : `P${currentPage}`;

  return (
    <div
      className={`bg-surface-panel border-surface-border rounded-terminal flex flex-col items-center border p-3 select-none sm:p-4 ${className}`.trim()}
    >
      {/* Dial Screen & Prev/Next Toolbar */}
      <div className="mb-3 flex w-full items-center justify-between gap-2">
        <button
          type="button"
          onClick={handlePrev}
          className="bg-surface-terminal border-surface-border hover:border-teletext-yellow text-teletext-white rounded border px-3 py-1.5 font-mono text-xs transition-all active:scale-95"
          title="Previous Page (Arrow Left/Up)"
        >
          ▲ PREV
        </button>

        <div className="bg-teletext-black border-surface-border-subtle text-teletext-yellow flex items-center rounded border px-4 py-1.5 font-mono text-base font-bold tracking-widest shadow-inner">
          {displayBuffer}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="bg-surface-terminal border-surface-border hover:border-teletext-yellow text-teletext-white rounded border px-3 py-1.5 font-mono text-xs transition-all active:scale-95"
          title="Next Page (Arrow Right/Down)"
        >
          NEXT ▼
        </button>
      </div>

      {/* Numeric Keypad */}
      <div className="grid w-full max-w-[200px] grid-cols-3 gap-1.5">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="bg-surface-terminal border-surface-border hover:bg-surface-border hover:text-teletext-yellow text-teletext-white rounded border py-2 font-mono text-sm font-bold transition-all active:scale-95"
          >
            {digit}
          </button>
        ))}

        <button
          type="button"
          onClick={handleClear}
          className="bg-surface-terminal border-surface-border text-teletext-red rounded border py-2 font-mono text-xs font-bold transition-all hover:bg-red-950/40 active:scale-95"
          title="Clear Buffer"
        >
          CLR
        </button>

        <button
          type="button"
          onClick={() => handleDigit("0")}
          className="bg-surface-terminal border-surface-border hover:bg-surface-border hover:text-teletext-yellow text-teletext-white rounded border py-2 font-mono text-sm font-bold transition-all active:scale-95"
        >
          0
        </button>

        <button
          type="button"
          onClick={() => onNavigate(100)}
          className="bg-surface-terminal border-surface-border text-teletext-cyan rounded border py-2 font-mono text-xs font-bold transition-all hover:bg-cyan-950/40 active:scale-95"
          title="Index Page 100 (Esc)"
        >
          P100
        </button>
      </div>
    </div>
  );
};
