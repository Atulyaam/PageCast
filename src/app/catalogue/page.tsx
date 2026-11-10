"use client";

/**
 * PageCast Dynamic Broadcast Catalogue (TASK-S4-05)
 * /catalogue
 *
 * Displays all 8 Teletext magazines with published bulletin discovery,
 * real-time keyword search, language filtering, and direct terminal tuning.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MAGAZINES } from "@/domain/teletext/magazine";
import type { CatalogItem } from "@/server/database/repository";
import type { GroupedMagazineCatalog } from "@/app/api/v1/catalog/route";
import { saveCatalogueSnapshot, getCatalogueSnapshot } from "@/lib/storage/catalogue-snapshot";

export default function BroadcastCataloguePage() {
  const [magazines, setMagazines] = useState<GroupedMagazineCatalog[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<"all" | "en" | "hi">("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [snapshotDate, setSnapshotDate] = useState<string | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch("/api/v1/catalog");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.magazines)) {
            setMagazines(json.magazines);
            setIsLoading(false);
            const allItems: CatalogItem[] = json.magazines.flatMap(
              (m: GroupedMagazineCatalog) => m.bulletins || []
            );
            saveCatalogueSnapshot(allItems);
            return;
          }
        }
      } catch {
        // Fallback to offline snapshot
      }

      try {
        const snapshot = await getCatalogueSnapshot();
        if (snapshot && snapshot.items.length > 0) {
          const grouped: GroupedMagazineCatalog[] = MAGAZINES.map((mag) => ({
            magazineNumber: mag.number,
            name: mag.name,
            description: mag.description,
            pageRange: mag.pageRange,
            defaultColor: mag.defaultColor,
            bulletins: (snapshot.items as CatalogItem[]).filter(
              (item) => item.magazineNumber === mag.number
            ),
          }));
          setMagazines(grouped);
          setSnapshotDate(new Date(snapshot.snapshotAt).toLocaleString());
          setIsLoading(false);
          return;
        }
      } catch {
        // Continue to empty fallback
      }

      // Fallback: Populate empty magazines structure
      const fallbackGrouped: GroupedMagazineCatalog[] = MAGAZINES.map((mag) => ({
        magazineNumber: mag.number,
        name: mag.name,
        description: mag.description,
        pageRange: mag.pageRange,
        defaultColor: mag.defaultColor,
        bulletins: [],
      }));
      setMagazines(fallbackGrouped);
      setIsLoading(false);
    }

    loadCatalog();
  }, []);

  // Filter bulletins within each magazine
  const filterBulletins = (bulletins: CatalogItem[]): CatalogItem[] => {
    return bulletins.filter((b) => {
      // Language match
      if (languageFilter !== "all" && b.language !== languageFilter) {
        return false;
      }
      // Query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = b.title.toLowerCase().includes(q);
        const matchesPage = String(b.pageNumber).includes(q) || `p${b.pageNumber}`.includes(q);
        const matchesSlug = b.slug.toLowerCase().includes(q);
        return matchesTitle || matchesPage || matchesSlug;
      }
      return true;
    });
  };

  const totalMatching = magazines.reduce(
    (acc, mag) => acc + filterBulletins(mag.bulletins).length,
    0
  );

  return (
    <div className="bg-surface-ground text-teletext-white min-h-screen font-mono">
      {/* Top Header — aligned with main app header style */}
      <header className="border-surface-border bg-surface-panel/85 sticky top-0 z-20 border-b px-4 py-2.5 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-2">
              <span className="text-teletext-yellow font-mono text-lg font-bold tracking-tight transition-opacity group-hover:opacity-80 sm:text-xl">
                PAGECAST
              </span>
              <span className="bg-surface-border text-teletext-cyan rounded px-2 py-0.5 font-mono text-[11px] sm:text-xs">
                CATALOGUE
              </span>
            </Link>
          </div>

          <nav className="no-scrollbar flex items-center gap-2 overflow-x-auto text-xs sm:gap-3 sm:text-sm">
            <Link
              href="/"
              className="btn-tactile text-text-muted hover:text-teletext-white rounded px-2 py-1 transition-all hover:bg-zinc-800/60"
            >
              READER
            </Link>
            <Link
              href="/terminal"
              className="btn-tactile text-text-muted hover:text-teletext-white rounded px-2 py-1 transition-all hover:bg-zinc-800/60"
            >
              TERMINAL
            </Link>
            <Link
              href="/catalogue"
              className="btn-tactile text-teletext-cyan rounded px-2 py-1 font-bold underline transition-all"
            >
              CATALOGUE
            </Link>
            <Link
              href="/saved"
              className="btn-tactile text-text-muted hover:text-teletext-white rounded px-2 py-1 transition-all hover:bg-zinc-800/60"
            >
              SAVED
            </Link>
            <Link
              href="/publisher/ingest"
              className="btn-tactile border-teletext-yellow/40 bg-teletext-yellow/10 text-teletext-yellow hover:bg-teletext-yellow/20 shrink-0 rounded border px-2.5 py-1 font-semibold transition-all"
            >
              PUBLISHER STUDIO
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Catalogue Area */}
      <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        {/* Title & Introduction */}
        <div className="border-surface-border mb-6 border-b pb-6">
          <div className="flex items-center gap-2">
            <span className="bg-teletext-cyan px-1.5 py-0.5 text-xs font-black text-black">
              INDEX
            </span>
            <h1 className="text-teletext-cyan text-xl font-bold tracking-wider uppercase sm:text-2xl">
              Teletext Broadcast Directory
            </h1>
          </div>
          <p className="text-text-muted mt-1 text-xs sm:text-sm">
            Browse published ultra-low bandwidth bulletins across all 8 standard Teletext magazines.
          </p>
        </div>

        {/* Offline Snapshot Stale-State Notice */}
        {snapshotDate && (
          <div
            role="status"
            className="mb-6 flex items-center justify-between rounded border border-amber-500/50 bg-amber-950/20 px-3 py-2 font-mono text-xs text-amber-300"
          >
            <span>
              ⚠️ OFFLINE CATALOGUE SNAPSHOT &bull; Stored {snapshotDate} &bull; Broadcast updates
              paused
            </span>
            <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
              OFFLINE CACHE
            </span>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="border-surface-border bg-surface-panel mb-8 flex flex-col justify-between gap-4 border p-4 md:flex-row md:items-center">
          {/* Keyword Search */}
          <div className="flex-1">
            <label
              htmlFor="catalogue-search"
              className="text-text-muted mb-1 block text-xs tracking-widest uppercase"
            >
              Search Bulletins (Page or Title)
            </label>
            <input
              id="catalogue-search"
              type="text"
              placeholder="e.g. 101, cyclone, technology..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-surface-border bg-surface-terminal text-teletext-white focus:border-teletext-cyan w-full border px-3 py-1.5 text-sm focus:outline-hidden"
            />
          </div>

          {/* Language Selector */}
          <div>
            <label className="text-text-muted mb-1 block text-xs tracking-widest uppercase">
              Language Filter
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLanguageFilter("all")}
                className={`btn-tactile cursor-pointer border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                  languageFilter === "all"
                    ? "border-teletext-cyan bg-teletext-cyan text-black shadow-[0_0_8px_rgba(0,255,255,0.3)]"
                    : "border-surface-border bg-surface-terminal text-text-muted hover:border-zinc-600"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setLanguageFilter("en")}
                className={`btn-tactile cursor-pointer border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                  languageFilter === "en"
                    ? "border-teletext-cyan bg-teletext-cyan text-black shadow-[0_0_8px_rgba(0,255,255,0.3)]"
                    : "border-surface-border bg-surface-terminal text-text-muted hover:border-zinc-600"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguageFilter("hi")}
                className={`btn-tactile cursor-pointer border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                  languageFilter === "hi"
                    ? "border-teletext-cyan bg-teletext-cyan text-black shadow-[0_0_8px_rgba(0,255,255,0.3)]"
                    : "border-surface-border bg-surface-terminal text-text-muted hover:border-zinc-600"
                }`}
              >
                Hindi (हिन्दी)
              </button>
            </div>
          </div>
        </div>

        {/* Quick Jump Bar to Magazines */}
        <div className="mb-8 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-text-muted mr-2 text-[10px] tracking-widest uppercase">
            Jump to:
          </span>
          {magazines.map((mag) => (
            <a
              key={mag.magazineNumber}
              href={`#mag-${mag.magazineNumber}`}
              className="border-surface-border bg-surface-panel text-text-muted hover:border-teletext-cyan hover:text-teletext-white border px-2 py-1 text-[11px] transition-colors"
            >
              Mag {mag.magazineNumber}
            </a>
          ))}
        </div>

        {/* Magazine Broadcast Sections */}
        {isLoading ? (
          <div className="border-surface-border bg-surface-panel border p-12 text-center text-xs text-zinc-500">
            Tuning broadcast raster... Loading catalogue...
          </div>
        ) : totalMatching === 0 ? (
          <div className="border-surface-border bg-surface-panel border p-12 text-center text-xs text-zinc-500">
            No bulletins found matching your filter criteria.
          </div>
        ) : (
          <div className="space-y-8">
            {magazines.map((mag) => {
              const matchingBulletins = filterBulletins(mag.bulletins);

              return (
                <section
                  key={mag.magazineNumber}
                  id={`mag-${mag.magazineNumber}`}
                  className="border-surface-border bg-surface-panel border p-4 sm:p-6"
                >
                  {/* Magazine Header */}
                  <div className="border-surface-border mb-4 flex flex-col justify-between gap-2 border-b pb-3 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-teletext-yellow px-1.5 py-0.5 text-xs font-black text-black">
                          MAG {mag.magazineNumber}
                        </span>
                        <h2 className="text-teletext-yellow text-sm font-bold tracking-wider uppercase sm:text-base">
                          {mag.name}
                        </h2>
                        <span className="text-text-muted text-xs">
                          (P{mag.pageRange[0]}–P{mag.pageRange[1]})
                        </span>
                      </div>
                      <p className="text-text-muted mt-1 text-xs">{mag.description}</p>
                    </div>

                    <span className="text-text-muted font-mono text-xs">
                      {matchingBulletins.length}{" "}
                      {matchingBulletins.length === 1 ? "Bulletin" : "Bulletins"}
                    </span>
                  </div>

                  {/* Bulletins Table / List */}
                  {matchingBulletins.length === 0 ? (
                    <div className="border-surface-border bg-surface-terminal border p-4 text-center text-xs text-zinc-600">
                      No bulletins currently transmitting in Magazine {mag.magazineNumber}.
                    </div>
                  ) : (
                    <div className="border-surface-border bg-surface-terminal overflow-x-auto border">
                      <table className="w-full text-left text-xs">
                        <thead className="border-surface-border bg-surface-panel text-text-muted border-b text-[10px] tracking-wider uppercase">
                          <tr>
                            <th className="w-20 px-4 py-2.5">Page</th>
                            <th className="px-4 py-2.5">Title</th>
                            <th className="w-20 px-4 py-2.5">Lang</th>
                            <th className="w-20 px-4 py-2.5">Revision</th>
                            <th className="w-32 px-4 py-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900">
                          {matchingBulletins.map((bulletin) => (
                            <tr
                              key={bulletin.pageNumber}
                              className="transition-colors hover:bg-zinc-900/40"
                            >
                              <td className="text-teletext-yellow px-4 py-2.5 font-bold whitespace-nowrap">
                                P{bulletin.pageNumber}
                              </td>
                              <td className="text-teletext-white max-w-sm truncate px-4 py-2.5 font-medium">
                                {bulletin.title}
                              </td>
                              <td className="text-text-muted px-4 py-2.5 uppercase">
                                {bulletin.language}
                              </td>
                              <td className="text-text-muted px-4 py-2.5">r{bulletin.revision}</td>
                              <td className="px-4 py-2.5 text-right">
                                <Link
                                  href={`/?page=${bulletin.pageNumber}`}
                                  className="bg-teletext-yellow hover:bg-teletext-yellow/80 inline-block px-3 py-1 text-xs font-bold tracking-wider text-black uppercase transition-colors"
                                >
                                  Tune In →
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-surface-border text-text-muted mt-12 border-t px-4 py-6 text-center font-mono text-xs">
        <p>PAGECAST &bull; AI-Powered Low-Bandwidth Teletext &bull; Kiroween 2026</p>
      </footer>
    </div>
  );
}
