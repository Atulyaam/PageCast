"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  isValidPageNumber,
  getNextPageNumber,
  getPreviousPageNumber,
} from "@/domain/validation/page-number";
import type { FastextLinks } from "@/domain/teletext/types";
import { getTeletextSynthesizer } from "@/lib/audio/teletext-synthesizer";

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
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const flashKey = useCallback((key: string) => {
    setActiveKey(key);
    const timer = setTimeout(() => {
      setActiveKey((prev) => (prev === key ? null : prev));
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleDigit = useCallback(
    (digit: string) => {
      flashKey(digit);
      try {
        getTeletextSynthesizer().playNavigationTick();
      } catch {}
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
    [dialBuffer, onNavigate, flashKey]
  );

  const handleClear = useCallback(() => {
    flashKey("CLR");
    setDialBuffer("");
  }, [flashKey]);

  const handlePrev = useCallback(() => {
    flashKey("PREV");
    try {
      getTeletextSynthesizer().playNavigationTick();
    } catch {}
    const prev = getPreviousPageNumber(currentPage, catalogue);
    onNavigate(prev);
    setDialBuffer("");
  }, [currentPage, catalogue, onNavigate, flashKey]);

  const handleNext = useCallback(() => {
    flashKey("NEXT");
    try {
      getTeletextSynthesizer().playNavigationTick();
    } catch {}
    const next = getNextPageNumber(currentPage, catalogue);
    onNavigate(next);
    setDialBuffer("");
  }, [currentPage, catalogue, onNavigate, flashKey]);

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
          flashKey("100");
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
  }, [dialBuffer, handleDigit, handleClear, handlePrev, handleNext, fastext, onNavigate, flashKey]);

  // Display buffer formatted as P1__ or P100
  const displayBuffer = dialBuffer ? `P${dialBuffer.padEnd(3, "_")}` : `P${currentPage}`;

  return (
    <div
      className={`border-t border-[#777970] bg-[#9e9d93] p-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)] select-none sm:rounded-lg sm:border sm:border-[#777970] sm:p-4 ${className}`.trim()}
    >
      {/* Dial Screen & Prev/Next Toolbar */}
      <div className="mb-3 flex w-full items-center justify-between gap-2">
        <button
          type="button"
          onClick={handlePrev}
          className={`btn-keycap-light cursor-pointer rounded-xs px-3 py-1.5 font-mono text-xs font-bold transition-all ${
            activeKey === "PREV"
              ? "!border-[#c69b5b] !bg-[#c69b5b] !text-[#0d1410] shadow-[0_0_10px_rgba(198,155,91,0.6)]"
              : ""
          }`}
          title="Previous Page (Arrow Left/Up)"
        >
          ▲ PREV
        </button>

        <div className="led-window flex items-center px-4 py-1.5 font-mono text-base font-bold tracking-widest text-[#b7c9a8] shadow-[inset_0_2px_6px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.4)]">
          {displayBuffer}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className={`btn-keycap-light cursor-pointer rounded-xs px-3 py-1.5 font-mono text-xs font-bold transition-all ${
            activeKey === "NEXT"
              ? "!border-[#c69b5b] !bg-[#c69b5b] !text-[#0d1410] shadow-[0_0_10px_rgba(198,155,91,0.6)]"
              : ""
          }`}
          title="Next Page (Arrow Right/Down)"
        >
          NEXT ▼
        </button>
      </div>

      {/* Numeric Keypad */}
      <div className="mx-auto grid w-full max-w-[210px] grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className={`btn-keycap cursor-pointer py-2.5 font-mono text-sm font-bold ${
              activeKey === digit
                ? "!border-[#c69b5b] !text-[#f6dfa9] shadow-[0_0_12px_rgba(198,155,91,0.7)]"
                : ""
            }`}
          >
            {digit}
          </button>
        ))}

        <button
          type="button"
          onClick={handleClear}
          className={`btn-keycap cursor-pointer py-2.5 font-mono text-xs font-bold !text-[#e67064] hover:!text-[#ff8a7e] ${
            activeKey === "CLR"
              ? "!border-[#e67064] !bg-[#701e16] shadow-[0_0_10px_rgba(230,112,100,0.6)]"
              : ""
          }`}
          title="Clear Buffer"
        >
          CLR
        </button>

        <button
          type="button"
          onClick={() => handleDigit("0")}
          className={`btn-keycap cursor-pointer py-2.5 font-mono text-sm font-bold ${
            activeKey === "0"
              ? "!border-[#c69b5b] !text-[#f6dfa9] shadow-[0_0_12px_rgba(198,155,91,0.7)]"
              : ""
          }`}
        >
          0
        </button>

        <button
          type="button"
          onClick={() => {
            flashKey("100");
            try {
              getTeletextSynthesizer().playNavigationTick();
            } catch {}
            onNavigate(100);
          }}
          className={`btn-keycap cursor-pointer py-2.5 font-mono text-xs font-bold !text-[#76c7cd] hover:!text-[#9ce7ec] ${
            activeKey === "100"
              ? "!border-[#76c7cd] !bg-[#15464a] shadow-[0_0_10px_rgba(118,199,205,0.6)]"
              : ""
          }`}
          title="Index Page 100 (Esc)"
        >
          P100
        </button>
      </div>
    </div>
  );
};
