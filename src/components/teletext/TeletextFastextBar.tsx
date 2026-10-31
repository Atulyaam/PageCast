"use client";

import React from "react";
import type { FastextLinks } from "@/domain/teletext/types";

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
      bgClass: "bg-red-600 hover:bg-red-500 text-white border-red-700",
    },
    {
      color: "green",
      key: "2",
      page: fastext.green,
      label: labels?.green ?? `P${fastext.green}`,
      bgClass: "bg-green-600 hover:bg-green-500 text-black font-semibold border-green-700",
    },
    {
      color: "yellow",
      key: "3",
      page: fastext.yellow,
      label: labels?.yellow ?? `P${fastext.yellow}`,
      bgClass: "bg-yellow-500 hover:bg-yellow-400 text-black font-semibold border-yellow-600",
    },
    {
      color: "cyan",
      key: "4",
      page: fastext.cyan,
      label: labels?.cyan ?? `P${fastext.cyan}`,
      bgClass: "bg-cyan-500 hover:bg-cyan-400 text-black font-semibold border-cyan-600",
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
          onClick={() => onNavigate(item.page)}
          className={`flex items-center justify-between rounded border px-3 py-2 font-mono text-sm font-semibold shadow-md transition-all active:scale-95 sm:text-base ${item.bgClass}`}
          title={`Shortcut key [${item.key}]: Navigate to Page ${item.page}`}
        >
          <span className="truncate">{item.label}</span>
          <span className="ml-1 rounded bg-black/30 px-1.5 py-0.5 text-[11px] font-bold uppercase">
            [{item.key}]
          </span>
        </button>
      ))}
    </nav>
  );
};
