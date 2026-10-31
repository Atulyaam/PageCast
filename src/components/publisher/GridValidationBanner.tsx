"use client";

import React from "react";
import type { TeletextPage } from "@/domain/teletext/types";
import type { PagePackV1 } from "@/domain/page-pack/types";
import { validateGrid } from "@/domain/validation/validate-grid";
import { isValidPageNumber } from "@/domain/validation/page-number";
import { measurePagePack } from "@/domain/page-pack/codec";

export interface GridValidationBannerProps {
  page: TeletextPage | null;
  pack: PagePackV1 | null;
  className?: string;
}

export const GridValidationBanner: React.FC<GridValidationBannerProps> = ({
  page,
  pack,
  className = "",
}) => {
  if (!page && !pack) {
    return null;
  }

  const gridResult = page ? validateGrid(page) : { valid: false, errors: ["No page provided"] };
  const validPageNum = page
    ? isValidPageNumber(page.pageNumber)
    : pack
      ? isValidPageNumber(pack.primaryPageNumber)
      : false;
  const budget = pack ? measurePagePack(pack) : { isOverBudget: false, bytesUsed: 0 };
  const hasSource = Boolean(pack?.metadata?.sourceName);

  const allValid = gridResult.valid && validPageNum && !budget.isOverBudget && hasSource;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col gap-2 rounded-md border p-3 font-mono text-xs ${
        allValid
          ? "border-green-800 bg-[#0d1a0d] text-green-300"
          : "border-red-800 bg-[#1a0d0d] text-red-300"
      } ${className}`.trim()}
    >
      <div className="flex items-center justify-between font-bold">
        <span>Publishing Invariants Gate:</span>
        <span
          className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
            allValid ? "bg-green-900 text-green-200" : "bg-red-900 text-red-200"
          }`}
        >
          {allValid ? "READY TO PUBLISH" : "ACTION REQUIRED"}
        </span>
      </div>

      <div className="mt-1 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2 md:grid-cols-4">
        <div className="flex items-center gap-1.5">
          <span>{gridResult.valid ? "✓" : "✗"}</span>
          <span>40×25 Grid Geometry</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>{validPageNum ? "✓" : "✗"}</span>
          <span>Page 100–899 Range</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>{!budget.isOverBudget ? "✓" : "✗"}</span>
          <span>≤ 10,240 Byte Budget</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>{hasSource ? "✓" : "✗"}</span>
          <span>Source Attribution</span>
        </div>
      </div>

      {!gridResult.valid && gridResult.errors.length > 0 && (
        <div className="mt-2 border-t border-red-900/60 pt-2 text-[11px] text-red-400">
          <strong>Grid Errors:</strong>
          <ul className="mt-0.5 list-inside list-disc space-y-0.5">
            {gridResult.errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
