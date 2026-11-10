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
    <header className="border-surface-border bg-surface-panel/85 border-b px-4 py-2.5 font-mono backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Brand & Studio Tag */}
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-2">
            <span className="text-teletext-yellow font-mono text-lg font-bold tracking-tight transition-opacity group-hover:opacity-80 sm:text-xl">
              PAGECAST
            </span>
            <span className="bg-surface-border text-teletext-green rounded px-2 py-0.5 font-mono text-[11px] sm:text-xs">
              STUDIO
            </span>
          </Link>
          <span className="text-surface-border-subtle hidden sm:inline">/</span>
          <span className="text-text-muted hidden text-xs tracking-wider uppercase sm:inline">
            {activeTitle || "Publisher Workspace"}
          </span>
        </div>

        {/* Navigation & System Status */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <nav className="no-scrollbar flex items-center gap-2 overflow-x-auto">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`btn-tactile border px-2.5 py-1 transition-colors ${
                    isActive
                      ? "border-teletext-green/50 bg-teletext-green/10 text-teletext-green font-bold"
                      : "text-text-muted hover:border-surface-border hover:text-teletext-white border-transparent"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-surface-border text-text-muted hidden items-center gap-1.5 border-l pl-4 text-[11px] sm:flex">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span>STANDBY</span>
          </div>
        </div>
      </div>
    </header>
  );
};
