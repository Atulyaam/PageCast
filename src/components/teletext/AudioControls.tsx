"use client";

/**
 * PageCast Audio & Speech Controls Toolbar (TASK-S4-07)
 *
 * Provides accessible controls for:
 * - Web Audio Teletext Synthesizer (Carrier Chirp & Cues)
 * - Web Speech API Bulletin Narration (English & Hindi)
 */

import React, { useState, useEffect } from "react";
import type { TeletextPage } from "@/domain/teletext/types";
import { getTeletextSynthesizer } from "@/lib/audio/teletext-synthesizer";
import { getBulletinSpeechReader, type SpeechReaderState } from "@/lib/audio/speech-reader";

export interface AudioControlsProps {
  page: TeletextPage;
  className?: string;
}

export const AudioControls: React.FC<AudioControlsProps> = ({ page, className = "" }) => {
  const [speechState, setSpeechState] = useState<SpeechReaderState>({
    isSpeaking: false,
    isPaused: false,
    isSupported: false,
  });

  const [isSynthMuted, setIsSynthMuted] = useState<boolean>(true);

  useEffect(() => {
    const speechReader = getBulletinSpeechReader();

    const unsubscribe = speechReader.subscribe((state) => {
      setSpeechState(state);
    });

    return () => {
      unsubscribe();
      // Stop speech when unmounting or switching view
      speechReader.stop();
    };
  }, []);

  const handleToggleSoundFx = () => {
    const synth = getTeletextSynthesizer();
    if (!synth.isInitialized) {
      synth.initialize();
    }
    const nextMuted = !synth.muted;
    synth.setMuted(nextMuted);
    setIsSynthMuted(nextMuted);

    if (!nextMuted) {
      synth.playNavigationTick();
    }
  };

  const handleToggleSpeech = () => {
    const speechReader = getBulletinSpeechReader();
    if (!speechReader.isSupported) return;

    if (speechState.isSpeaking) {
      if (speechState.isPaused) {
        speechReader.resume();
      } else {
        speechReader.pause();
      }
    } else {
      speechReader.speak(page, page.language || "en");
    }
  };

  const handleStopSpeech = () => {
    const speechReader = getBulletinSpeechReader();
    speechReader.stop();
  };

  return (
    <div
      role="region"
      aria-label="Audio & Speech Synthesizer Controls"
      className={`flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-[#777970] bg-[#9e9d93] px-3 py-2 font-mono text-xs text-[#2b302a] shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] ${className}`.trim()}
    >
      {/* Sound FX Toggle (Teletext Carrier Tones) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleSoundFx}
          aria-pressed={!isSynthMuted}
          className={`btn-keycap-light cursor-pointer rounded-xs px-2.5 py-1 text-xs font-bold transition-all ${
            !isSynthMuted
              ? "!border-[#226f43] !bg-[#2f8c56] !text-white shadow-[0_0_8px_rgba(47,140,86,0.5)]"
              : ""
          }`}
        >
          {!isSynthMuted ? "🔊 SOUND FX: ON" : "🔇 SOUND FX: OFF"}
        </button>
        <span className="hidden text-[10px] font-semibold tracking-wider text-[#575d53] uppercase sm:inline">
          {!isSynthMuted ? "MODEM CARRIER ACTIVE" : "ACOUSTIC CUES MUTED"}
        </span>
      </div>

      {/* Speech Narration Controls (TTS) */}
      <div className="flex items-center gap-2">
        {speechState.isSupported ? (
          <>
            <button
              type="button"
              onClick={handleToggleSpeech}
              aria-label={
                speechState.isSpeaking
                  ? speechState.isPaused
                    ? "Resume speech narration"
                    : "Pause speech narration"
                  : "Read bulletin aloud using speech synthesizer"
              }
              className={`btn-keycap-light cursor-pointer rounded-xs px-3 py-1 text-xs font-bold transition-all ${
                speechState.isSpeaking && !speechState.isPaused
                  ? "!border-[#c69b5b] !bg-[#c69b5b] !text-[#0d1410] shadow-[0_0_8px_rgba(198,155,91,0.5)]"
                  : speechState.isPaused
                    ? "!border-[#c69b5b] !bg-[#c69b5b]/40 !text-[#2b302a]"
                    : ""
              }`}
            >
              {speechState.isSpeaking
                ? speechState.isPaused
                  ? "▶ RESUME"
                  : "⏸ PAUSE"
                : "🗣️ READ ALOUD"}
            </button>

            {speechState.isSpeaking && (
              <button
                type="button"
                onClick={handleStopSpeech}
                aria-label="Stop speech narration"
                className="btn-keycap-light cursor-pointer rounded-xs px-2.5 py-1 text-xs font-bold !text-[#9e2b20] transition-all"
              >
                ⏹ STOP
              </button>
            )}

            <span className="rounded-xs border border-[#777970] bg-[#8e8d83] px-1.5 py-0.5 text-[10px] font-bold text-[#2b302a] uppercase">
              {page.language === "hi" ? "HI (हिन्दी)" : "EN"}
            </span>
          </>
        ) : (
          <span className="text-[11px] text-[#70756a]">TTS UNAVAILABLE</span>
        )}
      </div>
    </div>
  );
};
