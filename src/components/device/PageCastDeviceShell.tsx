"use client";

import React from "react";
import { PageCastDevice, type PageCastDeviceProps } from "./PageCastDevice";

export interface PageCastDeviceShellProps extends PageCastDeviceProps {
  readonly children?: React.ReactNode;
}

/**
 * PageCastDeviceShell
 *
 * Master physical enclosure for the PAGECAST PT-4025 terminal.
 * Houses the outer studio workbench, persistent hardware chassis,
 * and renders all operating modes inside the main CRT display viewport.
 */
export const PageCastDeviceShell: React.FC<PageCastDeviceShellProps> = ({
  children,
  ...deviceProps
}) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-2 font-sans sm:p-4 lg:p-6">
      {/* Subtle Technical Studio Worktop Identifier */}
      <div className="mb-2 hidden w-full max-w-6xl items-center justify-between px-2 font-mono text-[10px] text-[#71736b] select-none sm:flex">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#829a76]" />
          <span>STUDIO WORKBENCH // TERMINAL STATION 01</span>
        </div>
        <div className="flex items-center gap-3">
          <span>WST TELETEXT 625-LINE</span>
          <span>&bull;</span>
          <span>AIR-GAP BROADCAST RECEIVER</span>
        </div>
      </div>

      {/* Main Tabletop Device */}
      <main className="flex min-h-0 w-full max-w-6xl flex-1 flex-col items-center justify-center">
        <PageCastDevice {...deviceProps}>{children}</PageCastDevice>
      </main>

      {/* Subtle Studio Desk Stamp */}
      <footer className="mt-2 text-center font-mono text-[11px] text-[#71736b] select-none">
        <span>PAGECAST PT-4025 &bull; KIROWEEN 2026 PRECISION ELECTRONIC INFORMATION TERMINAL</span>
      </footer>
    </div>
  );
};
