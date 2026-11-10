"use client";

import React, { useState, useEffect } from "react";
import { Tv, Zap } from "lucide-react";
import { getMagazineDefinition } from "@/domain/teletext/magazine";

export interface DeviceStatusBarProps {
  readonly pageNumber: number;
  readonly showScanlines: boolean;
  readonly phosphorGlow: boolean;
  readonly onToggleScanlines: () => void;
  readonly onTogglePhosphorGlow: () => void;
  readonly isOffline?: boolean;
}

export const DeviceStatusBar: React.FC<DeviceStatusBarProps> = ({
  pageNumber,
  showScanlines,
  phosphorGlow,
  onToggleScanlines,
  onTogglePhosphorGlow,
  isOffline = false,
}) => {
  const [clockString, setClockString] = useState<string>("00:00:00");
  const magazine = getMagazineDefinition(pageNumber);

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setClockString(now.toTimeString().split(" ")[0]);
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      role="region"
      aria-label="Teletext Broadcast Status Bar"
      className="flex w-full flex-wrap items-center justify-between border-b border-[#232e27] bg-[#121915] px-3.5 py-2 font-mono text-xs text-[#879b83] shadow-inner select-none"
    >
      {/* Broadcast Stream Signal Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-bold">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                isOffline ? "bg-[#c69b5b]" : "bg-[#22c55e]"
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
          <span className="tracking-wide text-[#b7c9a8]">
            {isOffline ? "LOCAL VAULT CACHE" : "LIVE BROADCAST"}
          </span>
        </div>

        <span className="hidden text-[#2d3830] sm:inline">|</span>

        {/* Magazine Category Identification */}
        <span className="hidden font-semibold tracking-wide text-[#879b83] sm:inline">
          {`MAG ${magazine.number}: ${magazine.name.toUpperCase()}`}
        </span>
      </div>

      {/* Clock & Hardware Toggles */}
      <div className="flex items-center gap-3">
        <div className="hidden font-mono text-xs font-bold tracking-widest text-[#b7c9a8] sm:inline">
          {clockString}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleScanlines}
            aria-pressed={showScanlines}
            className={`flex cursor-pointer items-center gap-1 rounded border px-2 py-0.5 text-xs font-bold transition-all active:scale-95 ${
              showScanlines
                ? "border-[#76c7cd] bg-[#268790] text-white shadow-[0_0_8px_rgba(38,135,144,0.5)]"
                : "border-[#2a362f] bg-[#0d1410] text-[#879b83] hover:border-[#425247] hover:text-[#b7c9a8]"
            }`}
          >
            <Tv className="h-3 w-3" />
            <span>{showScanlines ? "SCANLINES: ON" : "CRT SCANLINES: OFF"}</span>
          </button>

          <button
            type="button"
            onClick={onTogglePhosphorGlow}
            aria-pressed={phosphorGlow}
            className={`flex cursor-pointer items-center gap-1 rounded border px-2 py-0.5 text-xs font-bold transition-all active:scale-95 ${
              phosphorGlow
                ? "border-[#76c7cd] bg-[#268790] text-white shadow-[0_0_8px_rgba(38,135,144,0.5)]"
                : "border-[#2a362f] bg-[#0d1410] text-[#879b83] hover:border-[#425247] hover:text-[#b7c9a8]"
            }`}
          >
            <Zap className="h-3 w-3" />
            <span>{phosphorGlow ? "GLOW: ON" : "GLOW: OFF"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
