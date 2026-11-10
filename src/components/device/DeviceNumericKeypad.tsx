"use client";

import React from "react";
import { motion } from "motion/react";

export interface DeviceNumericKeypadProps {
  readonly onDigit: (digit: string) => void;
  readonly onClear: () => void;
  readonly onIndex: () => void;
  readonly className?: string;
}

export const DeviceNumericKeypad: React.FC<DeviceNumericKeypadProps> = ({
  onDigit,
  onClear,
  onIndex,
  className = "",
}) => {
  const keys = [
    { label: "1", type: "digit" as const, action: () => onDigit("1") },
    { label: "2", type: "digit" as const, action: () => onDigit("2") },
    { label: "3", type: "digit" as const, action: () => onDigit("3") },
    { label: "4", type: "digit" as const, action: () => onDigit("4") },
    { label: "5", type: "digit" as const, action: () => onDigit("5") },
    { label: "6", type: "digit" as const, action: () => onDigit("6") },
    { label: "7", type: "digit" as const, action: () => onDigit("7") },
    { label: "8", type: "digit" as const, action: () => onDigit("8") },
    { label: "9", type: "digit" as const, action: () => onDigit("9") },
    {
      label: "CLR",
      type: "action" as const,
      action: onClear,
      customClass: "!text-[#e67064] hover:!text-[#ff8a7e]",
      title: "Clear Buffer",
    },
    { label: "0", type: "digit" as const, action: () => onDigit("0") },
    {
      label: "P100",
      type: "action" as const,
      action: onIndex,
      customClass: "!text-[#76c7cd] hover:!text-[#9ce7ec]",
      title: "Index Page 100 (Esc)",
    },
  ];

  return (
    <div
      role="group"
      aria-label="Teletext Numeric Dialer Keypad"
      className={`mx-auto grid w-full max-w-[220px] grid-cols-3 gap-2 p-1 ${className}`.trim()}
    >
      {keys.map((k) => (
        <motion.button
          key={k.label}
          type="button"
          whileTap={{ scale: 0.95, y: 2 }}
          onClick={k.action}
          title={k.title}
          className={`btn-keycap flex h-11 cursor-pointer items-center justify-center font-mono text-sm font-bold tracking-wider ${
            k.customClass ?? ""
          }`}
        >
          {k.label}
        </motion.button>
      ))}
    </div>
  );
};
