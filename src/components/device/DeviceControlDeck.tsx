"use client";

import React from "react";
import {
  DeviceNavigationControls,
  type DeviceNavigationControlsProps,
} from "./DeviceNavigationControls";
import { DeviceNumericKeypad, type DeviceNumericKeypadProps } from "./DeviceNumericKeypad";

export interface DeviceControlDeckProps
  extends DeviceNavigationControlsProps, DeviceNumericKeypadProps {
  readonly className?: string;
}

export const DeviceControlDeck: React.FC<DeviceControlDeckProps> = ({
  bufferDisplay,
  isMuted,
  isSpeaking,
  ttsSupported,
  activePage,
  onPrevPage,
  onNextPage,
  onToggleMute,
  onToggleSpeech,
  onDigit,
  onClear,
  onIndex,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-[#585750] bg-[#8f8d83] p-3.5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.22)] select-none sm:p-4 ${className}`.trim()}
    >
      {/* Upper Navigation & Stepper Section */}
      <DeviceNavigationControls
        bufferDisplay={bufferDisplay}
        isMuted={isMuted}
        isSpeaking={isSpeaking}
        ttsSupported={ttsSupported}
        activePage={activePage}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
        onToggleMute={onToggleMute}
        onToggleSpeech={onToggleSpeech}
      />

      {/* Numeric Keycap Deck */}
      <div className="border-t border-[#74766d] pt-3">
        <DeviceNumericKeypad onDigit={onDigit} onClear={onClear} onIndex={onIndex} />
      </div>

      {/* Molded Thermal Ventilation Louvers */}
      <div
        className="hidden flex-col gap-1.5 rounded border border-[#6b6d65] bg-[#7e7c73] p-2.5 shadow-inner lg:flex"
        aria-hidden="true"
      >
        <div className="flex items-center justify-between font-mono text-[9px] font-bold tracking-widest text-[#282c27] uppercase">
          <span>VENTILATION // HEATSINK</span>
          <span>MODEL PT-4025</span>
        </div>
        <div className="chassis-louver" />
        <div className="chassis-louver" />
        <div className="chassis-louver" />
      </div>
    </div>
  );
};
