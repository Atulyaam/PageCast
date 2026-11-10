"use client";

import React from "react";
import { DeviceBrandPlate } from "./DeviceBrandPlate";

export interface DeviceChassisProps {
  readonly children: React.ReactNode;
  readonly isLive?: boolean;
  readonly carrierLocked?: boolean;
  readonly className?: string;
}

export const DeviceChassis: React.FC<DeviceChassisProps> = ({
  children,
  isLive = true,
  carrierLocked = true,
  className = "",
}) => {
  return (
    <div
      className={`device-enclosure device-chassis relative flex w-full flex-col p-3.5 transition-all sm:p-6 lg:p-7 ${className}`.trim()}
    >
      {/* Top Brand Plate Header */}
      <div className="mb-3.5 overflow-hidden rounded-md border border-[#4a504b] shadow-xs">
        <DeviceBrandPlate isLive={isLive} carrierLocked={carrierLocked} />
      </div>

      {/* Hardware Chassis Top Seam & Torx Screws */}
      <div className="mb-3 flex items-center justify-between border-b border-[#6b6d65] pb-2 font-mono text-[10px] text-[#474c44]">
        <div className="flex items-center gap-2">
          <span className="chassis-screw" aria-hidden="true" />
          <span className="font-bold tracking-widest text-[#282c27] uppercase">
            PAGECAST RECEIVER // SYSTEM PT-4025
          </span>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <span className="tracking-wider text-[#474c44] uppercase">
            TELETEXT 625-LINE STANDARD
          </span>
          <span className="chassis-screw" aria-hidden="true" />
        </div>
      </div>

      {/* Main Terminal Interior (Screen Bay + Control Deck) */}
      {children}

      {/* Hardware Chassis Bottom Seam & Fasteners */}
      <div
        className="mt-3 flex items-center justify-between border-t border-[#6b6d65] pt-2"
        aria-hidden="true"
      >
        <span className="chassis-screw" />
        <span className="font-mono text-[9px] font-bold tracking-widest text-[#474c44] uppercase">
          KIROWEEN 2026 // HARDWARE SPEC V1.0
        </span>
        <span className="chassis-screw" />
      </div>
    </div>
  );
};
