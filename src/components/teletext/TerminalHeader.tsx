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
      className={`flex w-full flex-wrap items-center justify-between border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-400 shadow-md sm:text-sm ${className}`.trim()}
    >
      {/* Broadcast Stream Status & Magazine Tag */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-bold">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOffline ? "animate-ping bg-amber-400" : "animate-ping bg-emerald-400"
              }`}
            />
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                isOffline ? "bg-amber-500" : "bg-emerald-400"
              }`}
            />
          </span>
          <span className={isOffline ? "text-amber-400" : "text-emerald-400"}>
            {isOffline ? "CACHED / OFFLINE" : "LIVE BROADCAST"}
          </span>
        </div>

        <span className="hidden text-zinc-700 sm:inline">|</span>

        {magazine && (
          <span className="hidden font-semibold tracking-wide text-zinc-300 sm:inline">
            {`MAG ${magazine.number}: ${magazine.name.toUpperCase()}`}
          </span>
        )}

        {isSavedCopy && (
          <span className="hidden rounded border border-emerald-500 bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-bold text-emerald-400 sm:inline-block">
            ★ LOCAL COPY
          </span>
        )}

        {revision !== undefined && (
          <span className="hidden rounded border border-cyan-800 bg-cyan-950/60 px-1.5 py-0.5 text-[11px] font-bold text-cyan-400 sm:inline-block">
            Rev {revision}
          </span>
        )}

        {updatedAt && (
          <span className="hidden text-[11px] text-zinc-500 md:inline-block">
            • {formatRelativeFreshness(updatedAt)}
          </span>
        )}
      </div>

      {/* Teletext Clock & Visual Effects Toggles */}
      <div className="flex items-center gap-3">
        {clockTime && (
          <span className="hidden font-bold tracking-wider text-yellow-400 md:inline">
            {clockTime}
          </span>
        )}

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleScanlines}
            aria-pressed={showScanlines}
            className={`btn-tactile cursor-pointer rounded-xs border px-2 py-0.5 text-xs font-bold transition-all active:scale-95 ${
              showScanlines
                ? "border-yellow-400 bg-yellow-400 text-black shadow-[0_0_8px_rgba(255,255,0,0.35)]"
                : "border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700 hover:text-white"
            }`}
          >
            {`CRT SCANLINES: ${showScanlines ? "ON" : "OFF"}`}
          </button>

          <button
            type="button"
            onClick={onTogglePhosphorGlow}
            aria-pressed={phosphorGlow}
            className={`btn-tactile cursor-pointer rounded-xs border px-2 py-0.5 text-xs font-bold transition-all active:scale-95 ${
              phosphorGlow
                ? "border-cyan-400 bg-cyan-400 text-black shadow-[0_0_8px_rgba(0,255,255,0.35)]"
                : "border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700 hover:text-white"
            }`}
          >
            {`GLOW: ${phosphorGlow ? "ON" : "OFF"}`}
          </button>
        </div>
      </div>
    </div>
  );
};
