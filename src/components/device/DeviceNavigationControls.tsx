"use client";

import React from "react";
import { motion } from "motion/react";
import { Volume2, VolumeX, Radio, ChevronUp, ChevronDown } from "lucide-react";
import type { TeletextPage } from "@/domain/teletext/types";

export interface DeviceNavigationControlsProps {
  readonly bufferDisplay: string;
  readonly isMuted: boolean;
  readonly isSpeaking: boolean;
  readonly ttsSupported: boolean;
  readonly activePage?: TeletextPage;
  readonly onPrevPage: () => void;
  readonly onNextPage: () => void;
  readonly onToggleMute: () => void;
  readonly onToggleSpeech: () => void;
  readonly className?: string;
}

export const DeviceNavigationControls: React.FC<DeviceNavigationControlsProps> = ({
  bufferDisplay,
  isMuted,
  isSpeaking,
  ttsSupported,
  onPrevPage,
  onNextPage,
  onToggleMute,
  onToggleSpeech,
  className = "",
}) => {
  return (
    <div className={`flex flex-col gap-3 font-mono ${className}`.trim()}>
      {/* Page Stepper & LED Buffer Display */}
      <div className="flex w-full items-center justify-between gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96, y: 1 }}
          onClick={onPrevPage}
          className="btn-keycap-light flex cursor-pointer items-center gap-1 rounded px-3 py-2 font-mono text-xs font-bold transition-all"
          title="Previous Page (Arrow Left/Up)"
        >
          <ChevronUp className="h-3.5 w-3.5" />
          <span>▲ PREV</span>
        </motion.button>

        {/* 3-Digit LED Buffer Window */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="led-window flex min-w-[80px] items-center justify-center border-[#1c221e] bg-[#070b08] px-4 py-1.5 font-mono text-base font-extrabold tracking-widest text-[#d1a15d] shadow-[inset_0_2px_8px_rgba(0,0,0,0.95),0_1px_0_rgba(255,255,255,0.25)]"
        >
          {bufferDisplay}
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96, y: 1 }}
          onClick={onNextPage}
          className="btn-keycap-light flex cursor-pointer items-center gap-1 rounded px-3 py-2 font-mono text-xs font-bold transition-all"
          title="Next Page (Arrow Right/Down)"
        >
          <span>NEXT ▼</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.button>
      </div>

      {/* Acoustic Synthesizer Deck (Carrier Chirps & Speech Narration) */}
      <div
        role="region"
        aria-label="Audio & Speech Synthesizer Controls"
        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#74766d] bg-[#97958b] p-2 text-xs text-[#2b302a] shadow-inner"
      >
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={onToggleMute}
            aria-pressed={!isMuted}
            className={`btn-keycap-light flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold transition-all ${
              !isMuted ? "!border-[#226f43] !bg-[#2f8c56] !text-white" : ""
            }`}
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-[#5e645a]" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
            <span>{isMuted ? "SOUND FX: OFF" : "SOUND FX: ON"}</span>
          </motion.button>
        </div>

        {ttsSupported ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={onToggleSpeech}
            aria-pressed={isSpeaking}
            className={`btn-keycap-light flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold transition-all ${
              isSpeaking
                ? "!border-[#c69b5b] !bg-[#b58742] !text-black shadow-[0_0_8px_rgba(181,135,66,0.5)]"
                : ""
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>{isSpeaking ? "TTS SPEAKING..." : "READ ALOUD"}</span>
          </motion.button>
        ) : (
          <span className="text-[11px] text-[#5e645a]">TTS UNAVAILABLE</span>
        )}
      </div>
    </div>
  );
};
