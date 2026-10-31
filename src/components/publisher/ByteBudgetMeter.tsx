"use client";

import React from "react";
import type { PagePackV1 } from "@/domain/page-pack/types";
import { measurePagePack } from "@/domain/page-pack/codec";
import { PAGECAST_MAX_PACK_BYTES } from "@/domain/byte-budget/measure";

export interface ByteBudgetMeterProps {
  pack: PagePackV1 | null;
  className?: string;
}

export const ByteBudgetMeter: React.FC<ByteBudgetMeterProps> = ({ pack, className = "" }) => {
  if (!pack) {
    return (
      <div
        className={`flex items-center justify-between rounded border border-[#222222] bg-[#111111] p-3 font-mono text-xs text-[#888888] ${className}`.trim()}
      >
        <span>Payload Byte Budget:</span>
        <span>0 / {PAGECAST_MAX_PACK_BYTES.toLocaleString()} B (0%)</span>
      </div>
    );
  }

  const budget = measurePagePack(pack);
  const { bytesUsed, maxBytes, bytesRemaining, percentageUsed, isOverBudget } = budget;

  // Determine meter color state
  let barColorClass = "bg-[#00ff00]"; // Green
  let textColorClass = "text-[#00ff00]";
  let statusBadge = "COMPLIANT";

  if (isOverBudget) {
    barColorClass = "bg-[#ff0000]"; // Red
    textColorClass = "text-[#ff0000]";
    statusBadge = "OVER BUDGET";
  } else if (percentageUsed >= 80) {
    barColorClass = "bg-[#ffff00]"; // Yellow
    textColorClass = "text-[#ffff00]";
    statusBadge = "NEAR LIMIT";
  }

  return (
    <div
      role="region"
      aria-label="Teletext Payload Byte Budget Meter"
      className={`flex flex-col gap-2 rounded-md border border-[#262626] bg-[#0d0d0d] p-3 font-mono ${className}`.trim()}
    >
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] tracking-wider text-[#888888] uppercase">
            Payload Budget (10 KiB Ceiling):
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
              isOverBudget
                ? "border border-red-800 bg-red-950 text-red-400"
                : percentageUsed >= 80
                  ? "border border-yellow-800 bg-yellow-950 text-yellow-400"
                  : "border border-green-800 bg-green-950 text-green-400"
            }`}
          >
            {statusBadge}
          </span>
        </div>

        <div className="text-right">
          <span className={`text-sm font-bold ${textColorClass}`}>
            {bytesUsed.toLocaleString()}
          </span>
          <span className="text-[#666666]"> / {maxBytes.toLocaleString()} B</span>
          <span className="ml-1.5 text-[#888888]">({percentageUsed}%)</span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div
        className="h-2.5 w-full overflow-hidden rounded-full border border-[#333333] bg-[#1a1a1a]"
        role="progressbar"
        aria-valuenow={bytesUsed}
        aria-valuemin={0}
        aria-valuemax={maxBytes}
        aria-valuetext={`${bytesUsed} of ${maxBytes} bytes (${percentageUsed}%)`}
      >
        <div
          className={`h-full transition-all duration-300 ${barColorClass}`}
          style={{ width: `${Math.min(100, percentageUsed)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#666666]">
        <span>
          Remaining:{" "}
          <strong className={isOverBudget ? "text-red-400" : "text-white"}>
            {isOverBudget
              ? `-${(bytesUsed - maxBytes).toLocaleString()}`
              : bytesRemaining.toLocaleString()}{" "}
            B
          </strong>
        </span>
        <span className="text-[10px] text-[#555555]">Canonical UTF-8 (TextEncoder)</span>
      </div>
    </div>
  );
};
