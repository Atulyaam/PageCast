"use client";

import React from "react";
import type { FastextLinks } from "@/domain/teletext/types";
import { getTeletextSynthesizer } from "@/lib/audio/teletext-synthesizer";

export interface TeletextFastextBarProps {
  readonly fastext: FastextLinks;
  readonly onNavigate: (pageNumber: number) => void;
  readonly labels?: {
    red?: string;
    green?: string;
    yellow?: string;
    cyan?: string;
  };
  readonly className?: string;
}

export const TeletextFastextBar: React.FC<TeletextFastextBarProps> = ({
  fastext,
  onNavigate,
  labels,
  className = "",
}) => {
  const items = [
    {
      color: "red",
      key: "1",
      page: fastext.red,
      label: labels?.red ?? `P${fastext.red}`,
      rockerClass: "btn-rocker-red",
    },
    {
      color: "green",
      key: "2",
      page: fastext.green,
      label: labels?.green ?? `P${fastext.green}`,
      rockerClass: "btn-rocker-green",
    },
    {
      color: "yellow",
      key: "3",
      page: fastext.yellow,
      label: labels?.yellow ?? `P${fastext.yellow}`,
      rockerClass: "btn-rocker-yellow",
    },
    {
      color: "cyan",
      key: "4",
      page: fastext.cyan,
      label: labels?.cyan ?? `P${fastext.cyan}`,
      rockerClass: "btn-rocker-cyan",
    },
  ] as const;

  return (
    <nav
      aria-label="Teletext Fastext Shortcuts"
      className={`grid w-full grid-cols-2 gap-2 select-none sm:grid-cols-4 ${className}`.trim()}
    >
      {items.map((item) => (
        <button
          key={item.color}
          type="button"
          onClick={() => {
            try {
              getTeletextSynthesizer().playFastextTone(item.color);
            } catch {
              // audio non-fatal
            }
            onNavigate(item.page);
          }}
          className={`flex cursor-pointer items-center justify-between rounded-xs border px-3 py-2 font-mono text-xs font-bold transition-all sm:text-sm ${item.rockerClass}`}
          title={`Shortcut key [${item.key}]: Navigate to Page ${item.page}`}
        >
          <span className="truncate">{item.label}</span>
          <span className="ml-1 rounded-xs bg-black/35 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider uppercase">
            [{item.key}]
          </span>
        </button>
      ))}
    </nav>
  );
};
