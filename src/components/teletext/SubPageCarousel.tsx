"use client";

/**
 * PageCast Subpage Carousel Controls (TASK-S4-03)
 *
 * Provides subpage navigation, carousel rotation timer with pause/resume,
 * and direct subpage stepping for multi-page Teletext bulletins.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Handle Carousel Timer
  useEffect(() => {
    if (!isAutoRotating || subPageCount <= 1) {
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

  const handlePrev = useCallback(() => {
    const nextIdx = currentSubIndex === 0 ? subPageCount - 1 : currentSubIndex - 1;
    onSubPageChange(nextIdx);
    startTimeRef.current = Date.now();
  }, [currentSubIndex, subPageCount, onSubPageChange]);

  const handleNext = useCallback(() => {
    const nextIdx = (currentSubIndex + 1) % subPageCount;
    onSubPageChange(nextIdx);
    startTimeRef.current = Date.now();
  }, [currentSubIndex, subPageCount, onSubPageChange]);

  const handleSelect = useCallback(
    (idx: number) => {
      onSubPageChange(idx);
      startTimeRef.current = Date.now();
    },
    [onSubPageChange]
  );

  const togglePause = useCallback(() => {
    setIsAutoRotating((prev) => !prev);
    setProgress(0);
  }, []);

  // If bulletin has only 1 page, render minimal indicator without controls
  if (subPageCount <= 1) {
    return (
      <div
        role="region"
        aria-label="Subpage Indicator"
        className={`flex items-center justify-between border-b border-[#232e27] bg-[#121915] px-3 py-1 font-mono text-xs text-[#5e6b5c] ${className}`.trim()}
      >
        <span>P{pageNumber} &bull; Single Frame Bulletin</span>
        <span className="text-[10px] tracking-wider text-[#475445] uppercase">
          STATIC BROADCAST
        </span>
      </div>
    );
  }

  const indicatorText = formatSubPageIndicator(currentSubIndex + 1, subPageCount);

  return (
    <div
      role="region"
      aria-label="Subpage Carousel Navigation"
      className={`flex flex-col justify-between gap-2.5 border-b border-[#232e27] bg-[#121915] px-3 py-1.5 font-mono text-xs text-[#879b83] shadow-inner sm:flex-row sm:items-center ${className}`.trim()}
    >
      {/* Subpage Index Display & Direct Jumps */}
      <div className="flex items-center gap-2">
        <span className="rounded-xs bg-[#226f43] px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
          CAROUSEL FRAMES:
        </span>
        <span className="font-bold tracking-wider text-[#b7c9a8]">{indicatorText}</span>

        {/* Direct Subpage Buttons */}
        <div className="ml-2 flex items-center gap-1">
          {Array.from({ length: subPageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              className={`h-5 w-5 cursor-pointer rounded-xs text-[11px] font-bold transition-all ${
                i === currentSubIndex
                  ? "bg-[#c69b5b] font-extrabold text-[#0d1410] shadow-[0_0_6px_rgba(198,155,91,0.5)]"
                  : "border border-[#2a362f] bg-[#0d1410] text-[#879b83] hover:border-[#425247] hover:text-[#b7c9a8]"
              }`}
              aria-label={`Jump to subpage ${i + 1}`}
              aria-current={i === currentSubIndex ? "true" : undefined}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation & Rotation Controls */}
      <div className="flex items-center gap-2.5">
        {/* Progress Bar for Auto-Rotation */}
        {isAutoRotating && (
          <div
            className="hidden items-center gap-1.5 sm:flex"
            title={`Auto-rotating every ${autoRotateIntervalMs / 1000}s`}
          >
            <div className="h-1.5 w-16 overflow-hidden rounded-xs border border-[#2a362f] bg-[#0d1410]">
              <div
                className="h-full bg-[#c69b5b] transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-[#6b7c68]">15s</span>
          </div>
        )}

        {/* Previous Subpage */}
        <button
          type="button"
          onClick={handlePrev}
          className="cursor-pointer rounded-xs border border-[#2a362f] bg-[#0d1410] px-2 py-0.5 text-xs text-[#879b83] transition-all hover:border-[#425247] hover:text-[#b7c9a8] active:scale-95"
          aria-label="Previous subpage"
        >
          &larr; PREV
        </button>

        {/* Auto-Rotation Pause/Play */}
        <button
          type="button"
          onClick={togglePause}
          className={`cursor-pointer rounded-xs border px-2 py-0.5 text-xs font-bold transition-all active:scale-95 ${
            isAutoRotating
              ? "border-[#2a362f] bg-[#0d1410] text-[#879b83] hover:border-[#425247] hover:text-[#b7c9a8]"
              : "border-[#c69b5b] bg-[#c69b5b]/20 text-[#c69b5b] shadow-[0_0_8px_rgba(198,155,91,0.3)]"
          }`}
          aria-label={isAutoRotating ? "Pause auto-rotation" : "Resume auto-rotation"}
        >
          {isAutoRotating ? "PAUSE" : "RESUME"}
        </button>

        {/* Next Subpage */}
        <button
          type="button"
          onClick={handleNext}
          className="cursor-pointer rounded-xs border border-[#2a362f] bg-[#0d1410] px-2 py-0.5 text-xs text-[#879b83] transition-all hover:border-[#425247] hover:text-[#b7c9a8] active:scale-95"
          aria-label="Next subpage"
        >
          NEXT &rarr;
        </button>
      </div>
    </div>
  );
};
