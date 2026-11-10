"use client";

import React from "react";
import { motion } from "motion/react";
import type { FastextLinks } from "@/domain/teletext/types";

export interface DeviceFastextControlsProps {
  readonly fastext?: FastextLinks;
  readonly onNavigate: (pageNumber: number) => void;
  readonly className?: string;
}

export const DeviceFastextControls: React.FC<DeviceFastextControlsProps> = ({
  fastext,
  onNavigate,
  className = "",
}) => {
  const redPage = fastext?.red ?? 100;
  const greenPage = fastext?.green ?? 100;
  const yellowPage = fastext?.yellow ?? 100;
  const cyanPage = fastext?.cyan ?? 100;

  const links = [
    {
      page: redPage,
      label: `P${redPage}`,
      key: "1",
      buttonClass: "btn-rocker-red",
      colorTag: "RED",
    },
    {
      page: greenPage,
      label: `P${greenPage}`,
      key: "2",
      buttonClass: "btn-rocker-green",
      colorTag: "GREEN",
    },
    {
      page: yellowPage,
      label: `P${yellowPage}`,
      key: "3",
      buttonClass: "btn-rocker-yellow",
      colorTag: "YELLOW",
    },
    {
      page: cyanPage,
      label: `P${cyanPage}`,
      key: "4",
      buttonClass: "btn-rocker-cyan",
      colorTag: "CYAN",
    },
  ];

  return (
    <nav
      aria-label="Teletext Fastext Shortcuts"
      className={`grid w-full grid-cols-2 gap-2.5 border-t border-[#232e27] bg-[#141916] p-2 select-none sm:grid-cols-4 ${className}`.trim()}
    >
      {links.map((link) => (
        <motion.button
          key={link.colorTag}
          type="button"
          whileTap={{ scale: 0.98, y: 1 }}
          onClick={() => onNavigate(link.page)}
          className={`flex cursor-pointer items-center justify-between rounded border px-3 py-2 font-mono text-xs font-bold transition-all sm:text-sm ${link.buttonClass}`}
          title={`Shortcut key [${link.key}]: Navigate to Page ${link.page}`}
        >
          <span className="truncate">{link.label}</span>
          <span className="ml-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider uppercase">
            [{link.key}]
          </span>
        </motion.button>
      ))}
    </nav>
  );
};
