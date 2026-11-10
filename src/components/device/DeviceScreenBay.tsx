"use client";

import React, { useRef, useEffect } from "react";
import type { TeletextPage } from "@/domain/teletext/types";
import { DeviceStatusBar } from "./DeviceStatusBar";
import { DeviceFastextControls } from "./DeviceFastextControls";
import { TeletextGrid } from "../teletext/TeletextGrid";
import { TerminalLoading } from "../teletext/TerminalLoading";
import { TerminalNotFound } from "../teletext/TerminalNotFound";
import { SubPageCarousel } from "../teletext/SubPageCarousel";

export interface DeviceScreenBayProps {
  readonly pageNumber: number;
  readonly activePage: TeletextPage;
  readonly currentSubIndex: number;
  readonly subPageCount: number;
  readonly isLoading?: boolean;
  readonly isNotFound?: boolean;
  readonly isOffline?: boolean;
  readonly showScanlines: boolean;
  readonly phosphorGlow: boolean;
  readonly isDataSaver: boolean;
  readonly onToggleScanlines: () => void;
  readonly onTogglePhosphorGlow: () => void;
  readonly onNavigate: (pageNumber: number) => void;
  readonly onSubPageChange: (index: number) => void;
  readonly className?: string;
  readonly children?: React.ReactNode;
}

export const DeviceScreenBay: React.FC<DeviceScreenBayProps> = ({
  pageNumber,
  activePage,
  currentSubIndex,
  subPageCount,
  isLoading = false,
  isNotFound = false,
  isOffline = false,
  showScanlines,
  phosphorGlow,
  isDataSaver,
  onToggleScanlines,
  onTogglePhosphorGlow,
  onNavigate,
  onSubPageChange,
  className = "",
  children,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset internal scroll when route/page/subpage changes (Section 9 invariant)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [children, pageNumber, currentSubIndex]);

  return (
    <div
      className={`device-bezel-outer flex h-full min-h-0 flex-col overflow-hidden shadow-2xl ${className}`.trim()}
    >
      {/* Integrated CRT Bezel Status Bar */}
      <DeviceStatusBar
        pageNumber={pageNumber}
        showScanlines={showScanlines}
        phosphorGlow={phosphorGlow}
        onToggleScanlines={onToggleScanlines}
        onTogglePhosphorGlow={onTogglePhosphorGlow}
        isOffline={isOffline}
      />

      {/* Subpage Carousel Navigation (When multiple frames exist and in Teletext mode) */}
      {!children && subPageCount > 1 && (
        <SubPageCarousel
          pageNumber={pageNumber}
          currentSubIndex={currentSubIndex}
          subPageCount={subPageCount}
          onSubPageChange={onSubPageChange}
        />
      )}

      {/* CRT Screen Display Viewport with Internal Scrolling Only (Section 9) */}
      <div
        ref={scrollContainerRef}
        className={`device-screen-viewport relative min-h-0 w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#080d0a] p-2 focus:outline-none sm:p-2.5 ${
          showScanlines ? "crt-scanlines" : ""
        } ${phosphorGlow ? "crt-glow" : ""}`}
        tabIndex={0}
        role="region"
        aria-label="PT-4025 CRT Display Screen"
      >
        {children ? (
          <div className="min-h-full w-full font-mono text-[#b8d1a2]">{children}</div>
        ) : isLoading ? (
          <TerminalLoading pageNumber={pageNumber} />
        ) : isNotFound ? (
          <TerminalNotFound
            pageNumber={pageNumber}
            showScanlines={showScanlines}
            phosphorGlow={phosphorGlow}
          />
        ) : (
          <TeletextGrid
            page={activePage}
            showScanlines={showScanlines}
            phosphorGlow={phosphorGlow}
            useSystemFont={isDataSaver}
            className="!rounded-none !border-0 !bg-transparent !p-0 !shadow-none"
          />
        )}
      </div>

      {/* Integrated Lower Bezel Fastext Rockers (Fixed hardware presence) */}
      <DeviceFastextControls
        fastext={activePage.fastext ?? { red: 100, green: 101, yellow: 102, cyan: 103 }}
        onNavigate={onNavigate}
      />
    </div>
  );
};
