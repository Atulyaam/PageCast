"use client";

import React from "react";
import { TELETEXT_COLORS, type TeletextColor } from "@/domain/teletext/types";

export interface ColorPalettePickerProps {
  selectedColor: TeletextColor;
  onSelectColor: (color: TeletextColor) => void;
  className?: string;
}

const COLOR_SWATCH_MAP: Record<TeletextColor, { bg: string; text: string; hex: string }> = {
  white: { bg: "bg-[#ffffff]", text: "text-black", hex: "#FFFFFF" },
  yellow: { bg: "bg-[#ffff00]", text: "text-black", hex: "#FFFF00" },
  cyan: { bg: "bg-[#00ffff]", text: "text-black", hex: "#00FFFF" },
  green: { bg: "bg-[#00ff00]", text: "text-black", hex: "#00FF00" },
  magenta: { bg: "bg-[#ff00ff]", text: "text-white", hex: "#FF00FF" },
  red: { bg: "bg-[#ff0000]", text: "text-white", hex: "#FF0000" },
  blue: { bg: "bg-[#0000ff]", text: "text-white", hex: "#0000FF" },
  black: { bg: "bg-[#000000]", text: "text-white", hex: "#000000" },
};

export const ColorPalettePicker: React.FC<ColorPalettePickerProps> = ({
  selectedColor,
  onSelectColor,
  className = "",
}) => {
  return (
    <div
      role="radiogroup"
      aria-label="Teletext Color Palette"
      className={`flex flex-wrap items-center gap-2 rounded border border-[#2a2a2a] bg-[#121212] p-2 ${className}`.trim()}
    >
      <span className="mr-2 font-mono text-xs text-[#888888] uppercase">Color:</span>
      {TELETEXT_COLORS.map((color) => {
        const swatch = COLOR_SWATCH_MAP[color];
        const isSelected = selectedColor === color;

        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`Teletext Color: ${color} (${swatch.hex})`}
            onClick={() => onSelectColor(color)}
            className={`flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-xs font-bold transition-all ${
              isSelected
                ? "scale-105 border-white shadow-md ring-2 ring-white/50"
                : "border-[#333333] opacity-75 hover:border-[#666666] hover:opacity-100"
            } ${swatch.bg} ${swatch.text}`}
          >
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full border border-black/40 ${swatch.bg}`}
            />
            <span className="uppercase">{color}</span>
          </button>
        );
      })}
    </div>
  );
};
