"use client";

import React from "react";
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
}) => {
  return (
    <div
      className={`device-bezel-outer flex flex-col overflow-hidden shadow-2xl ${className}`.trim()}
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

      {/* Subpage Carousel Navigation (When multiple frames exist) */}
      {subPageCount > 1 && (
        <SubPageCarousel
          pageNumber={pageNumber}
          currentSubIndex={currentSubIndex}
          subPageCount={subPageCount}
          onSubPageChange={onSubPageChange}
        />
      )}

      {/* 40x25 Screen Content / Loading / 404 */}
      <div className="w-full bg-[#080d0a] p-2 sm:p-2.5">
        {isLoading ? (
          <TerminalLoading pageNumber={pageNumber} />
        ) : isNotFound ? (
          <>
            <TerminalNotFound
              pageNumber={pageNumber}
              showScanlines={showScanlines}
              phosphorGlow={phosphorGlow}
            />
          </>
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

      {/* Integrated Lower Bezel Fastext Rockers */}
      <DeviceFastextControls fastext={activePage.fastext} onNavigate={onNavigate} />
    </div>
  );
};
