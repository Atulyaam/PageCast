"use client";

/**
 * PageCast Publisher Studio Header (TASK-S3-09)
 *
 * Provides persistent navigation, environment status, and quick links
 * across all publisher studio views.
 */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface PublisherHeaderProps {
  activeTitle?: string;
}

export const PublisherHeader: React.FC<PublisherHeaderProps> = ({ activeTitle }) => {
  const pathname = usePathname();

  const navLinks = [
    { href: "/publisher", label: "Dashboard" },
    { href: "/publisher/ingest", label: "Ingest Article" },
    { href: "/terminal", label: "Terminal" },
    { href: "/catalogue", label: "Catalogue" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-[#1b201c] bg-[#222723] px-3 py-2 text-[#b7c9a8] shadow-md sm:px-5 sm:py-2.5">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Brand & Studio Tag */}
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-2">
            <span className="font-mono text-base font-black tracking-tight text-[#f6dfa9] transition-opacity group-hover:opacity-80 sm:text-lg">
              PAGECAST
            </span>
            <span className="rounded-xs border border-[#3b453e] bg-[#161a17] px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-[#22c55e] uppercase">
              STUDIO DESK
            </span>
          </Link>
          <span className="hidden text-[#3b453e] sm:inline">/</span>
          <span className="hidden text-xs font-semibold tracking-wider text-[#879b83] uppercase sm:inline">
            {activeTitle || "Transmission Control"}
          </span>
        </div>

        {/* Navigation & System Status */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <nav className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xs border px-2.5 py-1 transition-colors ${
                    isActive
                      ? "border-[#3d4b40] bg-[#2b352e] font-bold text-[#f6dfa9] shadow-inner"
                      : "border-transparent text-[#879b83] hover:border-[#3b453e] hover:text-[#b7c9a8]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-1.5 border-l border-[#333b35] pl-3 text-[11px] text-[#6b7c68] sm:flex">
            <span className="inline-block h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_6px_#22c55e]" />
            <span className="font-bold tracking-wider text-[#879b83]">TX READY</span>
          </div>
        </div>
      </div>
    </header>
  );
};
