import React from "react";
import type { TeletextPage } from "@/domain/teletext/types";
import { TeletextRow } from "./TeletextRow";
import { AccessibleAlternative } from "./AccessibleAlternative";

export interface TeletextGridProps {
  readonly page: TeletextPage;
  readonly showScanlines?: boolean;
  readonly phosphorGlow?: boolean;
  readonly useSystemFont?: boolean;
  readonly className?: string;
}

export const TeletextGrid: React.FC<TeletextGridProps> = ({
  page,
  showScanlines = false,
  phosphorGlow = true,
  useSystemFont = false,
  className = "",
}) => {
  return (
    <div
      className={`bg-surface-terminal border-surface-border rounded-terminal crt-bezel relative flex flex-col border p-2 shadow-2xl transition-all sm:p-4 ${className}`.trim()}
    >
      {/* Semantic Screen-Reader Transcription */}
      <AccessibleAlternative page={page} />

      {/* CRT Terminal Screen Canvas */}
      <div
        role="grid"
        aria-rowcount={25}
        aria-colcount={40}
        aria-label={`Teletext Screen Page ${page.pageNumber}`}
        className={`bg-teletext-black relative flex aspect-[40/25] flex-col justify-between overflow-hidden rounded p-2 select-none sm:p-3 ${
          phosphorGlow ? "crt-glow" : ""
        }`}
      >
        {/* Subtle Retro CRT Glass Glare Effect */}
        <div
          aria-hidden="true"
          className="crt-glass-glare pointer-events-none absolute inset-0 z-20"
        />

        {/* Optional CRT Scanline Overlay */}
        {showScanlines && (
          <div
            aria-hidden="true"
            className="crt-scanlines pointer-events-none absolute inset-0 z-10 opacity-40 transition-opacity duration-300"
          />
        )}

        {/* 25 Teletext Rows */}
        <div
          className={`${
            useSystemFont ? "font-mono" : "font-teletext"
          } flex h-full flex-col justify-between text-[11px] leading-none tracking-tight sm:text-xs sm:tracking-normal md:text-sm lg:text-base`}
        >
          {page.rows.map((row, rowIndex) => (
            <TeletextRow
              key={`row-${page.pageNumber}-${rowIndex}`}
              row={row}
              rowIndex={rowIndex}
              language={page.language}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
