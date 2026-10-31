"use client";

/**
 * PageCast Teletext Keyboard Navigation Hook & Key Handler (TASK-S4-04)
 *
 * Implements keyboard-first Teletext navigation:
 * - 3-digit buffer dialing (0-9)
 * - Arrow & Page keys for page/subpage navigation
 * - Fastext color hotkeys (R, G, Y, C)
 * - Accessibility toggles (T for text mode, M for audio mute, ? for help)
 * - Full input isolation (never intercepts typing in forms or inputs)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { isValidPageNumber } from "@/domain/validation/page-number";

export interface TeletextKeyboardOptions {
  onNavigatePage: (pageNumber: number) => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onNextSubPage?: () => void;
  onPrevSubPage?: () => void;
  onFastextRed?: () => void;
  onFastextGreen?: () => void;
  onFastextYellow?: () => void;
  onFastextCyan?: () => void;
  onToggleShortcuts?: () => void;
  onToggleAudio?: () => void;
  onToggleTextMode?: () => void;
  enabled?: boolean;
}

export interface KeydownEventLike {
  key: string;
  target?: any;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  preventDefault?: () => void;
}

/**
 * Pure handler function for processing Teletext keyboard events.
 * Decoupled from React lifecycle for reliable, isolated testing and execution.
 */
export function handleTeletextKeyDown(
  e: KeydownEventLike,
  options: TeletextKeyboardOptions,
  bufferState: {
    current: string;
    set: (val: string) => void;
    clear: () => void;
  }
): boolean {
  // 1. Never intercept when focus is in an input, textarea, select, or editable element
  const target = e.target as HTMLElement | null;
  if (
    target &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable)
  ) {
    return false;
  }

  // Do not intercept if Alt or Ctrl or Meta are pressed (browser hotkeys)
  if (e.altKey || e.ctrlKey || e.metaKey) {
    return false;
  }

  const key = e.key;

  // 2. Numeric Digit Entry (0-9)
  if (/^[0-9]$/.test(key)) {
    e.preventDefault?.();

    const next = bufferState.current + key;
    if (next.length === 3) {
      const num = parseInt(next, 10);
      if (isValidPageNumber(num)) {
        options.onNavigatePage(num);
      }
      bufferState.clear();
    } else {
      bufferState.set(next);
    }
    return true;
  }

  // 3. Backspace -> remove last dialed digit
  if (key === "Backspace") {
    if (bufferState.current.length > 0) {
      e.preventDefault?.();
      bufferState.set(bufferState.current.slice(0, -1));
      return true;
    }
    return false;
  }

  // 4. Escape -> clear buffer or jump to P100
  if (key === "Escape") {
    e.preventDefault?.();
    if (bufferState.current) {
      bufferState.clear();
    } else {
      options.onNavigatePage(100);
    }
    return true;
  }

  // 5. Home -> Jump to P100 Index
  if (key === "Home") {
    e.preventDefault?.();
    bufferState.clear();
    options.onNavigatePage(100);
    return true;
  }

  // 6. Arrow Up / Page Up -> Next Page
  if (key === "ArrowUp" || key === "PageUp") {
    e.preventDefault?.();
    bufferState.clear();
    options.onNextPage?.();
    return true;
  }

  // 7. Arrow Down / Page Down -> Previous Page
  if (key === "ArrowDown" || key === "PageDown") {
    e.preventDefault?.();
    bufferState.clear();
    options.onPrevPage?.();
    return true;
  }

  // 8. Arrow Right -> Next Subpage
  if (key === "ArrowRight") {
    e.preventDefault?.();
    bufferState.clear();
    options.onNextSubPage?.();
    return true;
  }

  // 9. Arrow Left -> Previous Subpage
  if (key === "ArrowLeft") {
    e.preventDefault?.();
    bufferState.clear();
    options.onPrevSubPage?.();
    return true;
  }

  // 10. Fastext Color Shortcuts: R, G, Y, C (or B)
  const lower = key.toLowerCase();
  if (lower === "r") {
    e.preventDefault?.();
    bufferState.clear();
    options.onFastextRed?.();
    return true;
  }
  if (lower === "g") {
    e.preventDefault?.();
    bufferState.clear();
    options.onFastextGreen?.();
    return true;
  }
  if (lower === "y") {
    e.preventDefault?.();
    bufferState.clear();
    options.onFastextYellow?.();
    return true;
  }
  if (lower === "c" || lower === "b") {
    e.preventDefault?.();
    bufferState.clear();
    options.onFastextCyan?.();
    return true;
  }

  // 11. Accessibility & Toggles: ?, M, T
  if (key === "?" || lower === "h") {
    e.preventDefault?.();
    options.onToggleShortcuts?.();
    return true;
  }
  if (lower === "m") {
    e.preventDefault?.();
    options.onToggleAudio?.();
    return true;
  }
  if (lower === "t") {
    e.preventDefault?.();
    options.onToggleTextMode?.();
    return true;
  }

  return false;
}

export interface TeletextKeyboardState {
  dialBuffer: string;
  clearBuffer: () => void;
}

export function useTeletextKeyboard(options: TeletextKeyboardOptions): TeletextKeyboardState {
  const [dialBuffer, setDialBuffer] = useState<string>("");
  const bufferTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabled = options.enabled ?? true;

  const clearBuffer = useCallback(() => {
    setDialBuffer("");
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
      bufferTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      handleTeletextKeyDown(e, options, {
        current: dialBuffer,
        set: (next) => {
          setDialBuffer(next);
          if (bufferTimeoutRef.current) {
            clearTimeout(bufferTimeoutRef.current);
          }
          bufferTimeoutRef.current = setTimeout(() => {
            setDialBuffer("");
          }, 4000);
        },
        clear: clearBuffer,
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }
    };
  }, [enabled, dialBuffer, clearBuffer, options]);

  return {
    dialBuffer,
    clearBuffer,
  };
}
