"use client";

/**
 * PageCast Keyboard Shortcuts Reference Modal (TASK-S4-04)
 *
 * Displays an authentic Teletext-styled reference legend explaining
 * all keyboard-first navigation shortcuts and accessibility toggles.
 */

import React from "react";

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
      <div className="w-full max-w-lg border-2 border-emerald-500 bg-zinc-950 p-6 font-mono text-zinc-100 shadow-[0_0_30px_rgba(0,255,102,0.3)]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 px-1.5 py-0.5 text-xs font-black text-black">HELP</span>
            <h2
              id="shortcuts-title"
              className="text-sm font-bold tracking-wider text-emerald-400 uppercase"
            >
              Teletext Remote Control Keys
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            className="cursor-pointer border border-zinc-800 px-2 py-1 text-sm text-zinc-400 hover:border-zinc-600 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Shortcuts Table */}
        <div className="mb-4 overflow-x-auto">
          <table className="w-full divide-y divide-zinc-800 border border-zinc-800 text-left text-xs">
            <thead className="bg-zinc-900 text-[10px] tracking-wider text-zinc-400 uppercase">
              <tr>
                <th className="w-28 px-3 py-2">Key</th>
                <th className="px-3 py-2">Function</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {shortcuts.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/40">
                  <td className="px-3 py-1.5 font-bold whitespace-nowrap text-yellow-400">
                    <kbd className="rounded-xs border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-[11px]">
                      {item.key}
                    </kbd>
                  </td>
                  <td className="px-3 py-1.5 text-zinc-300">{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dismiss Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-[11px] text-zinc-500">
          <span>
            Press <kbd className="text-zinc-300">Esc</kbd> or <kbd className="text-zinc-300">?</kbd>{" "}
            anytime to dismiss
          </span>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer bg-emerald-500 px-4 py-1.5 text-xs font-bold tracking-wider text-black uppercase hover:bg-emerald-400"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
