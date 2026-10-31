"use client";

import React, { useEffect, useRef } from "react";

export interface FocusTrapProps {
  readonly children: React.ReactNode;
  readonly active?: boolean;
  readonly onClose?: () => void;
  readonly autoFocusSelector?: string;
  readonly returnFocus?: boolean;
  readonly className?: string;
}

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  onClose,
  autoFocusSelector,
  returnFocus = true,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    if (typeof document !== "undefined") {
      triggerElementRef.current = document.activeElement as HTMLElement;
    }

    const container = containerRef.current;
    if (!container) return;

    // Focus target element
    const initialTarget = autoFocusSelector
      ? (container.querySelector(autoFocusSelector) as HTMLElement)
      : null;

    if (initialTarget && typeof initialTarget.focus === "function") {
      initialTarget.focus();
    } else {
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      );
      if (focusables.length > 0 && typeof focusables[0].focus === "function") {
        focusables[0].focus();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }

      if (e.key === "Tab") {
        const focusables = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (returnFocus && triggerElementRef.current && typeof triggerElementRef.current.focus === "function") {
        triggerElementRef.current.focus();
      }
    };
  }, [active, onClose, autoFocusSelector, returnFocus]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};
