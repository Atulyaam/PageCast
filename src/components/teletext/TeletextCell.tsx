import React from "react";
import type { TeletextColor } from "@/domain/teletext/types";

export interface TeletextCellProps {
  readonly text: string;
  readonly color?: TeletextColor;
  readonly doubleHeight?: boolean;
  readonly mosaic?: boolean;
  readonly className?: string;
}

const COLOR_CLASS_MAP: Record<TeletextColor, string> = {
  black: "text-teletext-black",
  white: "text-teletext-white",
  yellow: "text-teletext-yellow",
  cyan: "text-teletext-cyan",
  green: "text-teletext-green",
  magenta: "text-teletext-magenta",
  red: "text-teletext-red",
  blue: "text-teletext-blue",
};

export const TeletextCell: React.FC<TeletextCellProps> = ({
  text,
  color = "white",
  doubleHeight = false,
  mosaic = false,
  className = "",
}) => {
  const colorClass = COLOR_CLASS_MAP[color] ?? "text-teletext-white";
  const heightClass = doubleHeight ? "scale-y-150 origin-top inline-block" : "";
  const mosaicClass = mosaic ? "font-mono tracking-tighter" : "";

  return (
    <span className={`${colorClass} ${heightClass} ${mosaicClass} ${className}`.trim()}>
      {text}
    </span>
  );
};
