"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tv, Terminal, Radio, HardDrive, Sliders, Cpu } from "lucide-react";

export interface DeviceBrandPlateProps {
  readonly isLive?: boolean;
  readonly carrierLocked?: boolean;
}

export const DeviceBrandPlate: React.FC<DeviceBrandPlateProps> = ({
  isLive = true,
  carrierLocked = true,
}) => {
  const pathname = usePathname() || "/";

  const navItems = [
    { label: "READER", href: "/", icon: Tv },
    { label: "TERMINAL", href: "/terminal", icon: Terminal },
    { label: "CATALOGUE", href: "/catalogue", icon: Radio },
    { label: "SAVED", href: "/saved", icon: HardDrive },
    { label: "PUBLISHER", href: "/publisher", icon: Sliders },
    { label: "LAB", href: "/lab", icon: Cpu },
  ];

  return (
    <div className="device-brand-plate flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 font-mono select-none">
      {/* Brand & Model Identity */}
      <div className="flex items-center gap-3">
        <Link href="/" className="group flex items-center gap-2">
          <span className="text-base font-black tracking-wider text-[#f6dfa9] transition-opacity group-hover:opacity-90 sm:text-lg">
            PAGECAST
          </span>
          <span className="rounded-xs border border-[#424a44] bg-[#121614] px-2 py-0.5 text-[10px] font-extrabold tracking-widest text-[#b8d1a2] shadow-inner">
            PT-4025
          </span>
        </Link>

        {/* Silkscreen Hardware Type */}
        <span className="hidden border-l border-[#3a443c] pl-2.5 text-[9px] font-bold tracking-widest text-[#71826f] uppercase xl:inline">
          Personal Information Terminal
        </span>

        {/* Hardware Status Indicators */}
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex items-center gap-1.5 rounded-xs border border-[#2a322c] bg-[#101412] px-2 py-0.5 text-[10px] text-[#829a76]">
            <span
              className={`h-2 w-2 rounded-full ${
                carrierLocked ? "bg-[#54b77a] shadow-[0_0_6px_#54b77a]" : "bg-[#ef4444]"
              }`}
            />
            <span className="font-bold tracking-wider">CARRIER LOCK</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xs border border-[#2a322c] bg-[#101412] px-2 py-0.5 text-[10px] text-[#829a76]">
            <span
              className={`h-2 w-2 rounded-full ${
                isLive ? "animate-pulse bg-[#d1a15d] shadow-[0_0_6px_#d1a15d]" : "bg-zinc-600"
              }`}
            />
            <span className="font-bold tracking-wider">DATA RX</span>
          </div>
        </div>
      </div>

      {/* Function Station Selector (Rackmount Navigation) */}
      <nav aria-label="Device function selector" className="flex items-center gap-1 sm:gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/" || pathname?.startsWith("/pages/")
              : pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-bold transition-all active:scale-95 sm:gap-1.5 sm:px-2.5 ${
                isActive
                  ? "border border-[#556358] bg-[#2e3731] text-[#f6dfa9] shadow-inner"
                  : "border border-transparent text-[#879b83] hover:border-[#38423b] hover:text-[#b7c9a8]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
