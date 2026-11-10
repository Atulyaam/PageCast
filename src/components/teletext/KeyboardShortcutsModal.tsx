"use client";

/**
 * PageCast Keyboard Shortcuts Reference Modal (TASK-S4-04)
 *
 * Displays an authentic Teletext-styled reference legend explaining
 * all keyboard-first navigation shortcuts and accessibility toggles.
 */

import React from "react";
import { FocusTrap } from "@/components/common/FocusTrap";

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "0 – 9", desc: "Dial 3-digit page number (e.g. 1-0-1 for P101)" },
    { key: "↑ / PgUp", desc: "Navigate to next broadcast page" },
    { key: "↓ / PgDn", desc: "Navigate to previous broadcast page" },
    { key: "→", desc: "Step to next subpage (carousel frame)" },
    { key: "←", desc: "Step to previous subpage (carousel frame)" },
    { key: "R", desc: "Follow RED Fastext shortcut" },
    { key: "G", desc: "Follow GREEN Fastext shortcut" },
    { key: "Y", desc: "Follow YELLOW Fastext shortcut" },
    { key: "C / B", desc: "Follow CYAN / BLUE Fastext shortcut" },
    { key: "Home", desc: "Return immediately to Main Index (P100)" },
    { key: "T", desc: "Toggle between CRT Raster & Text-Only Accessible View" },
    { key: "E", desc: "Toggle Source Evidence & Provenance Explorer" },
    { key: "D", desc: "Toggle Low-Bandwidth Data Saver Mode (system font, no CRT glow)" },
    { key: "M", desc: "Toggle Teletext Audio Synthesizer (Mute / Sound)" },
    { key: "? / H", desc: "Open / close this keyboard reference" },
    { key: "Esc", desc: "Clear dialing buffer / dismiss overlays" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
    >
      <FocusTrap onClose={onClose} className="w-full max-w-lg">
        <div className="w-full rounded-xl border border-[#3A453F] bg-[#141B17] p-6 font-mono text-[#D1DCD0] shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between border-b border-[#2A352F] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="rounded border border-[#3A453F] bg-[#222924] px-2 py-0.5 text-[10px] font-bold tracking-widest text-[#879B83]">
                REF // 4025
              </span>
              <h2
                id="shortcuts-title"
                className="text-sm font-bold tracking-wider text-[#B7C9A8] uppercase"
              >
                Teletext Remote Control Keys
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close keyboard shortcuts"
              className="btn-keycap-light cursor-pointer rounded border border-[#3A453F] bg-[#222924] px-2.5 py-1 text-xs text-[#A8B7A4] transition-all hover:border-[#4E5C54] hover:text-[#E8ECE6] active:scale-95"
            >
              ESC [✕]
            </button>
          </div>

          {/* Shortcuts Table */}
          <div className="mb-4 max-h-[60vh] overflow-y-auto rounded-lg border border-[#2A352F] bg-[#0D1410]">
            <table className="w-full divide-y divide-[#2A352F] text-left text-xs">
              <thead className="sticky top-0 bg-[#18211D] text-[10px] tracking-wider text-[#879B83] uppercase">
                <tr>
                  <th className="w-32 px-3.5 py-2.5 font-bold">Key Control</th>
                  <th className="px-3.5 py-2.5 font-bold">Terminal Function</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D2520]">
                {shortcuts.map((item, idx) => (
                  <tr key={idx} className="transition-colors hover:bg-[#161E1A]">
                    <td className="px-3.5 py-2 font-bold whitespace-nowrap text-[#C69B5B]">
                      <kbd className="inline-block rounded border border-[#3A453F] bg-[#222924] px-2 py-0.5 text-[11px] font-bold text-[#E8ECE6] shadow-xs">
                        {item.key}
                      </kbd>
                    </td>
                    <td className="px-3.5 py-2 text-[#C8D4C5]">{item.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dismiss Footer */}
          <div className="flex items-center justify-between border-t border-[#2A352F] pt-3 text-[11px] text-[#6F7E6D]">
            <span>Model PC-4025 Teletext Terminal Deck</span>
            <button
              type="button"
              onClick={onClose}
              className="btn-keycap-light cursor-pointer rounded border border-[#3A453F] bg-[#222924] px-3 py-1 text-xs font-bold text-[#B7C9A8] transition-all hover:border-[#4E5C54] hover:text-[#E8ECE6] active:scale-95"
            >
              Close [ESC]
            </button>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
};
