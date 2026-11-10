"use client";

import React from "react";
import { motion } from "motion/react";
import {
  FileText,
  Sliders,
  Bookmark,
  ShieldCheck,
  Share2,
  Download,
  Scan,
  HelpCircle,
} from "lucide-react";

export interface DeviceAuxDeckProps {
  readonly viewMode: "crt" | "accessible";
  readonly isDataSaver: boolean;
  readonly isSaved: boolean;
  readonly isSaveDisabled: boolean;
  readonly onToggleViewMode: () => void;
  readonly onToggleDataSaver: () => void;
  readonly onToggleSave: () => void;
  readonly onOpenEvidence: () => void;
  readonly onOpenExport: () => void;
  readonly onOpenImport: () => void;
  readonly onOpenScanner: () => void;
  readonly onOpenShortcuts: () => void;
  readonly className?: string;
}

export const DeviceAuxDeck: React.FC<DeviceAuxDeckProps> = ({
  viewMode,
  isDataSaver,
  isSaved,
  isSaveDisabled,
  onToggleViewMode,
  onToggleDataSaver,
  onToggleSave,
  onOpenEvidence,
  onOpenExport,
  onOpenImport,
  onOpenScanner,
  onOpenShortcuts,
  className = "",
}) => {
  return (
    <div
      className={`mt-4 flex flex-col justify-between gap-3 border-t border-[#74766d] pt-3 font-mono text-xs text-[#282c27] sm:flex-row sm:items-center ${className}`.trim()}
    >
      {/* Mode & Data Saver Toggles */}
      <div className="flex flex-wrap items-center gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={onToggleViewMode}
          className={`btn-keycap-light flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all ${
            viewMode === "accessible"
              ? "!border-[#226f43] !bg-[#2f8c56] !text-white shadow-[0_0_8px_rgba(47,140,86,0.4)]"
              : ""
          }`}
          aria-label={
            viewMode === "crt"
              ? "Switch to text-only accessible view"
              : "Switch to CRT visual grid view"
          }
        >
          <FileText className="h-3.5 w-3.5" />
          <span className="sm:hidden">{viewMode === "crt" ? "ACCESSIBLE" : "CRT MODE"}</span>
          <span className="hidden sm:inline">
            {viewMode === "crt" ? "ACCESSIBLE TEXT MODE [M]" : "CRT DISPLAY MODE [M]"}
          </span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={onToggleDataSaver}
          className={`btn-keycap-light flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all ${
            isDataSaver
              ? "!border-[#c69b5b] !bg-[#b58742] !text-black shadow-[0_0_8px_rgba(181,135,66,0.4)]"
              : ""
          }`}
          aria-label="Enable Low-Bandwidth Data Saver Mode"
        >
          <Sliders className="h-3.5 w-3.5" />
          <span className="sm:hidden">SAVER</span>
          <span className="hidden sm:inline">DATA SAVER [D]</span>
        </motion.button>
      </div>

      {/* Auxiliary Hardware Actions */}
      <div className="no-scrollbar flex flex-wrap items-center gap-1.5 overflow-x-auto sm:overflow-visible">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          disabled={isSaveDisabled}
          onClick={onToggleSave}
          className={`btn-keycap-light flex cursor-pointer items-center gap-1.5 px-2.5 py-1 text-xs font-bold transition-all ${
            isSaveDisabled ? "cursor-not-allowed opacity-50" : ""
          } ${isSaved ? "!border-[#226f43] !bg-[#2f8c56] !text-white shadow-xs" : ""}`}
          aria-label="Save bulletin locally for offline reading"
        >
          <Bookmark className="h-3.5 w-3.5" />
          <span className="sm:hidden">{isSaved ? "SAVED" : "SAVE"}</span>
          <span className="hidden sm:inline">{isSaved ? "SAVED VAULT" : "SAVE OFFLINE"}</span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={onOpenEvidence}
          className="btn-keycap-light flex cursor-pointer items-center gap-1 px-2.5 py-1 text-xs font-bold transition-all"
          aria-label="Inspect source sentence evidence and attribution"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="sm:hidden">EVID</span>
          <span className="hidden sm:inline">EVIDENCE [E]</span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={onOpenExport}
          className="btn-keycap-light flex cursor-pointer items-center gap-1 px-2.5 py-1 text-xs font-bold transition-all"
          aria-label="Share bulletin or export PagePack QR code"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>SHARE / QR</span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={onOpenImport}
          className="btn-keycap-light flex cursor-pointer items-center gap-1 px-2 py-1 text-xs font-bold transition-all"
          aria-label="Import PagePack JSON file"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="sm:hidden">IMPORT</span>
          <span className="hidden sm:inline">IMPORT JSON</span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={onOpenScanner}
          className="btn-keycap-light flex cursor-pointer items-center gap-1 px-2 py-1 text-xs font-bold transition-all"
          aria-label="Scan optical QR code or air-gap burst"
        >
          <Scan className="h-3.5 w-3.5" />
          <span className="sm:hidden">SCAN</span>
          <span className="hidden sm:inline">SCAN QR</span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={onOpenShortcuts}
          className="btn-keycap-light flex cursor-pointer items-center gap-1 px-2.5 py-1 text-xs font-bold transition-all"
          aria-label="Open keyboard shortcuts help modal"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>KEYS (?)</span>
        </motion.button>
      </div>
    </div>
  );
};
