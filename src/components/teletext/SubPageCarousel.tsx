"use client";

/**
 * PageCast Subpage Carousel Controls (TASK-S4-03)
 *
 * Provides subpage navigation, carousel rotation timer with pause/resume,
 * and direct subpage stepping for multi-page Teletext bulletins.
 */

import React, { useState, useEffect, useRef } from "react";
import { formatSubPageIndicator } from "@/domain/teletext/magazine";

export interface SubPageCarouselProps {
  pageNumber: number;
  currentSubIndex: number; // 0-based
  subPageCount: number;
  onSubPageChange: (index: number) => void;
  autoRotateIntervalMs?: number; // Default 15,000ms
  className?: string;
}

export const SubPageCarousel: React.FC<SubPageCarouselProps> = ({
  pageNumber,
  currentSubIndex,
  subPageCount,
  onSubPageChange,
  autoRotateIntervalMs = 15000,
  className = "",
}) => {
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // If bulletin has only 1 page, render minimal indicator without controls
  if (subPageCount <= 1) {
    return (
      <div
        role="region"
        aria-label="Subpage Indicator"
        className={`flex items-center justify-between border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-500 ${className}`.trim()}
      >
        <span>P{pageNumber} &bull; Single Frame Bulletin</span>
        <span className="text-[11px] text-zinc-600">STATIC BROADCAST</span>
      </div>
    );
  }

  // Handle Carousel Timer
  useEffect(() => {
    if (!isAutoRotating || subPageCount <= 1) {
      setProgress(0);
      return;
    }

    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      onSubPageChange((currentSubIndex + 1) % subPageCount);
      startTimeRef.current = Date.now();
    }, autoRotateIntervalMs);

    // Progress bar update
    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / autoRotateIntervalMs) * 100);
      setProgress(pct);
      if (isAutoRotating) {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      clearInterval(interval);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isAutoRotating, currentSubIndex, subPageCount, autoRotateIntervalMs, onSubPageChange]);

  const handlePrev = () => {
    const nextIdx = currentSubIndex === 0 ? subPageCount - 1 : currentSubIndex - 1;
    onSubPageChange(nextIdx);
    startTimeRef.current = Date.now();
  };

  const handleNext = () => {
    const nextIdx = (currentSubIndex + 1) % subPageCount;
    onSubPageChange(nextIdx);
    startTimeRef.current = Date.now();
  };

  const handleSelect = (idx: number) => {
    onSubPageChange(idx);
    startTimeRef.current = Date.now();
  };

  const togglePause = () => {
    setIsAutoRotating((prev) => !prev);
  };

  const indicatorText = formatSubPageIndicator(currentSubIndex + 1, subPageCount);

  return (
    <div
      role="region"
      aria-label="Subpage Carousel Navigation"
      className={`flex flex-col justify-between gap-3 border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-300 shadow-md sm:flex-row sm:items-center ${className}`.trim()}
    >
      {/* Subpage Index Display & Direct Jumps */}
      <div className="flex items-center gap-2">
        <span className="bg-emerald-500 px-1.5 py-0.5 text-xs font-bold text-black">
          {indicatorText}
        </span>
        <span className="hidden text-[11px] text-zinc-500 sm:inline">CAROUSEL FRAMES:</span>

        <div className="flex items-center gap-1">
          {Array.from({ length: subPageCount }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(idx)}
              aria-label={`Jump to subpage ${idx + 1}`}
              aria-current={currentSubIndex === idx ? "true" : undefined}
              className={`cursor-pointer border px-2 py-0.5 text-xs font-bold transition-colors ${
                currentSubIndex === idx
                  ? "border-emerald-400 bg-emerald-950/50 text-emerald-300"
                  : "border-zinc-800 bg-black text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Stepping Controls & Auto-Rotation Toggle */}
      <div className="flex items-center gap-2">
        {/* Progress Bar for Auto-Rotation */}
        {isAutoRotating && (
          <div
            className="h-1.5 w-16 overflow-hidden border border-zinc-800 bg-zinc-900"
            title="Time until next subpage rotation"
          >
            <div
              className="h-full bg-emerald-400 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={togglePause}
          aria-label={
            isAutoRotating ? "Pause subpage carousel rotation" : "Resume subpage carousel rotation"
          }
          className={`cursor-pointer border px-2 py-1 text-[11px] font-bold transition-colors ${
            isAutoRotating
              ? "border-zinc-800 bg-black text-zinc-400 hover:text-white"
              : "border-amber-400 bg-amber-400 text-black"
          }`}
        >
          {isAutoRotating ? "⏸ PAUSE" : "▶ RESUME"}
        </button>

        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous subpage"
          className="cursor-pointer border border-zinc-800 bg-black px-2.5 py-1 text-xs font-bold text-zinc-300 hover:border-zinc-600 hover:text-white"
        >
          ← PREV
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next subpage"
          className="cursor-pointer border border-zinc-800 bg-black px-2.5 py-1 text-xs font-bold text-zinc-300 hover:border-zinc-600 hover:text-white"
        >
          NEXT →
        </button>
      </div>
    </div>
  );
};
