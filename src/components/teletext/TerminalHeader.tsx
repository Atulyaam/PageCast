"use client";

/**
 * PageCast Terminal Header Bar (TASK-S4-02)
 *
 * Displays live broadcast status, active magazine badge, formatted Teletext clock,
 * and CRT scanline / phosphor glow visual toggles.
 */

import React, { useState, useEffect } from "react";
import { getMagazineDefinition } from "@/domain/teletext/magazine";
import { formatRelativeFreshness } from "@/domain/freshness/freshness";

export interface TerminalHeaderProps {
  pageNumber: number;
  showScanlines: boolean;
  phosphorGlow: boolean;
  onToggleScanlines: () => void;
  onTogglePhosphorGlow: () => void;
  isOffline?: boolean;
  isSavedCopy?: boolean;
  revision?: number;
  updatedAt?: string;
  className?: string;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  pageNumber,
  showScanlines,
  phosphorGlow,
  onToggleScanlines,
  onTogglePhosphorGlow,
  isOffline = false,
  isSavedCopy = false,
  revision,
  updatedAt,
  className = "",
}) => {
  const [clockTime, setClockTime] = useState<string>("");

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const monthNames = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ];
      const month = monthNames[now.getMonth()];
      const hours = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      const secs = String(now.getSeconds()).padStart(2, "0");
      setClockTime(`${day} ${month} ${hours}:${mins}:${secs}`);
    }

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const magazine =
    pageNumber >= 100 && pageNumber <= 899 ? getMagazineDefinition(pageNumber) : null;

  return (
    <div
      role="region"
      aria-label="Teletext Broadcast Status Bar"
      className={`flex w-full flex-wrap items-center justify-between border-b border-[#232e27] bg-[#121915] px-3 py-1.5 font-mono text-xs text-[#879b83] shadow-inner sm:text-sm ${className}`.trim()}
    >
      {/* Broadcast Stream Status & Magazine Tag */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-bold">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOffline ? "animate-ping bg-[#c69b5b]" : "animate-ping bg-[#22c55e]"
              }`}
            />
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                isOffline
                  ? "bg-[#c69b5b] shadow-[0_0_6px_#c69b5b]"
                  : "bg-[#22c55e] shadow-[0_0_6px_#22c55e]"
              }`}
            />
          </span>
          <span className={isOffline ? "text-[#c69b5b]" : "text-[#b7c9a8]"}>
            {isOffline ? "CACHED / OFFLINE" : "LIVE BROADCAST"}
          </span>
        </div>

        <span className="hidden text-[#2d3830] sm:inline">|</span>

        {magazine && (
          <span className="hidden font-semibold tracking-wide text-[#879b83] sm:inline">
            {`MAG ${magazine.number}: ${magazine.name.toUpperCase()}`}
          </span>
        )}

        {isSavedCopy && (
          <span className="hidden rounded-xs border border-[#236b40] bg-[#143320] px-1.5 py-0.5 text-[11px] font-bold text-[#b7c9a8] sm:inline-block">
            ★ LOCAL COPY
          </span>
        )}

        {revision !== undefined && (
          <span className="hidden rounded-xs border border-[#1b676e] bg-[#0f2e32] px-1.5 py-0.5 text-[11px] font-bold text-[#76c7cd] sm:inline-block">
            Rev {revision}
          </span>
        )}

        {updatedAt && (
          <span className="hidden text-[11px] text-[#6b7c68] md:inline-block">
            • {formatRelativeFreshness(updatedAt)}
          </span>
        )}
      </div>

      {/* Teletext Clock & Visual Effects Toggles */}
      <div className="flex items-center gap-3">
        {clockTime && (
          <span className="hidden font-bold tracking-wider text-[#c69b5b] md:inline">
            {clockTime}
          </span>
        )}

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleScanlines}
            aria-pressed={showScanlines}
            className={`cursor-pointer rounded-xs border px-2 py-0.5 text-xs font-bold transition-all active:scale-95 ${
              showScanlines
                ? "border-[#c69b5b] bg-[#c69b5b] text-[#0d1410] shadow-[0_0_8px_rgba(198,155,91,0.5)]"
                : "border-[#2a362f] bg-[#0d1410] text-[#879b83] hover:border-[#425247] hover:text-[#b7c9a8]"
            }`}
          >
            {`CRT SCANLINES: ${showScanlines ? "ON" : "OFF"}`}
          </button>

          <button
            type="button"
            onClick={onTogglePhosphorGlow}
            aria-pressed={phosphorGlow}
            className={`cursor-pointer rounded-xs border px-2 py-0.5 text-xs font-bold transition-all active:scale-95 ${
              phosphorGlow
                ? "border-[#76c7cd] bg-[#268790] text-white shadow-[0_0_8px_rgba(38,135,144,0.5)]"
                : "border-[#2a362f] bg-[#0d1410] text-[#879b83] hover:border-[#425247] hover:text-[#b7c9a8]"
            }`}
          >
            {`GLOW: ${phosphorGlow ? "ON" : "OFF"}`}
          </button>
        </div>
      </div>
    </div>
  );
};
