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
      className={`flex flex-col gap-3.5 rounded-xl border border-[#585750] bg-[#96948a] p-3.5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.22)] select-none sm:p-4.5 ${className}`.trim()}
    >
      {/* Deck Header Silkscreen */}
      <div className="flex items-center justify-between border-b border-[#77756c] pb-1.5 font-mono text-[9px] font-extrabold tracking-widest text-[#292c29] uppercase">
        <span>COMMAND DECK</span>
        <span>PT-4025 TUNER</span>
      </div>

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

      {/* Sunken Keycap Well */}
      <div className="rounded-lg border border-[#6b6960] bg-[#7d7b72] p-2 shadow-inner">
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
