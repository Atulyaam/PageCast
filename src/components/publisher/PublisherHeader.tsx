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
    <header className="border-b border-zinc-800 bg-zinc-950 px-4 py-3 font-mono sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Brand & Studio Tag */}
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-2">
            <span className="bg-emerald-500 px-2 py-0.5 text-xs font-black tracking-widest text-black uppercase">
              PAGECAST
            </span>
            <span className="text-sm font-bold tracking-wide text-zinc-100 transition-colors group-hover:text-emerald-400">
              STUDIO
            </span>
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-xs tracking-wider text-zinc-400 uppercase">
            {activeTitle || "Publisher Workspace"}
          </span>
        </div>

        {/* Navigation & System Status */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <nav className="flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`border px-2.5 py-1 transition-colors ${
                    isActive
                      ? "border-emerald-500/50 bg-emerald-950/40 font-bold text-emerald-400"
                      : "border-transparent text-zinc-400 hover:border-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-1.5 border-l border-zinc-800 pl-4 text-[11px] text-zinc-500 sm:flex">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span>STANDBY</span>
          </div>
        </div>
      </div>
    </header>
  );
};
