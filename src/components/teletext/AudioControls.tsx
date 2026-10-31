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
      className={`flex flex-wrap items-center justify-between gap-3 border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-300 shadow-md ${className}`.trim()}
    >
      {/* Sound FX Toggle (Teletext Carrier Tones) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleSoundFx}
          aria-pressed={!isSynthMuted}
          className={`cursor-pointer border px-2.5 py-1 text-xs font-bold transition-colors ${
            !isSynthMuted
              ? "border-emerald-500 bg-emerald-500 text-black"
              : "border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700 hover:text-white"
          }`}
        >
          {!isSynthMuted ? "🔊 SOUND FX: ON" : "🔇 SOUND FX: OFF"}
        </button>
        <span className="hidden text-[11px] text-zinc-600 sm:inline">
          {!isSynthMuted ? "MODEM CARRIER TUNING ACTIVE" : "ACOUSTIC CUES MUTED"}
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
              className={`cursor-pointer border px-3 py-1 text-xs font-bold transition-colors ${
                speechState.isSpeaking && !speechState.isPaused
                  ? "animate-pulse border-yellow-400 bg-yellow-400 text-black"
                  : speechState.isPaused
                    ? "border-amber-500 bg-amber-500 text-black"
                    : "border-zinc-700 bg-zinc-900 text-yellow-400 hover:border-yellow-400"
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
                className="cursor-pointer border border-zinc-800 bg-black px-2.5 py-1 text-xs font-bold text-red-400 hover:border-red-500"
              >
                ⏹ STOP
              </button>
            )}

            <span className="border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500 uppercase">
              {page.language === "hi" ? "HI (हिन्दी)" : "EN"}
            </span>
          </>
        ) : (
          <span className="text-[11px] text-zinc-600">TTS UNAVAILABLE</span>
        )}
      </div>
    </div>
  );
};
