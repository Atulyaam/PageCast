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
    <div className="min-h-screen bg-black font-mono text-zinc-100">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950 px-4 py-3 backdrop-blur-xs sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-2">
              <span className="bg-emerald-500 px-2 py-0.5 text-xs font-black tracking-widest text-black uppercase">
                PAGECAST
              </span>
              <span className="text-sm font-bold tracking-wide text-zinc-100 transition-colors group-hover:text-emerald-400">
                BROADCAST CATALOGUE
              </span>
            </Link>
          </div>

          <nav className="flex items-center gap-3 text-xs sm:text-sm">
            <Link
              href="/"
              className="border border-transparent px-2.5 py-1 text-zinc-400 hover:border-zinc-800 hover:text-white"
            >
              📺 Terminal (P100)
            </Link>
            <Link
              href="/saved"
              className="border border-transparent px-2.5 py-1 text-zinc-400 hover:border-zinc-800 hover:text-white"
            >
              💾 Saved
            </Link>
            <Link
              href="/publisher"
              className="border border-zinc-700 bg-zinc-900 px-2.5 py-1 font-bold text-emerald-400 hover:border-emerald-500"
            >
              Publisher Studio
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Catalogue Area */}
      <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        {/* Title & Introduction */}
        <div className="mb-6 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-2">
            <span className="bg-cyan-400 px-1.5 py-0.5 text-xs font-black text-black">INDEX</span>
            <h1 className="text-xl font-bold tracking-wider text-cyan-400 uppercase sm:text-2xl">
              Teletext Broadcast Directory
            </h1>
          </div>
          <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
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
        <div className="mb-8 flex flex-col justify-between gap-4 border border-zinc-800 bg-zinc-950 p-4 md:flex-row md:items-center">
          {/* Keyword Search */}
          <div className="flex-1">
            <label
              htmlFor="catalogue-search"
              className="mb-1 block text-xs tracking-widest text-zinc-400 uppercase"
            >
              Search Bulletins (Page or Title)
            </label>
            <input
              id="catalogue-search"
              type="text"
              placeholder="e.g. 101, cyclone, technology..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-zinc-700 bg-black px-3 py-1.5 text-sm text-zinc-200 focus:border-cyan-400 focus:outline-hidden"
            />
          </div>

          {/* Language Selector */}
          <div>
            <label className="mb-1 block text-xs tracking-widest text-zinc-400 uppercase">
              Language Filter
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLanguageFilter("all")}
                className={`cursor-pointer border px-3 py-1.5 text-xs font-bold transition-colors ${
                  languageFilter === "all"
                    ? "border-cyan-400 bg-cyan-400 text-black"
                    : "border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setLanguageFilter("en")}
                className={`cursor-pointer border px-3 py-1.5 text-xs font-bold transition-colors ${
                  languageFilter === "en"
                    ? "border-cyan-400 bg-cyan-400 text-black"
                    : "border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguageFilter("hi")}
                className={`cursor-pointer border px-3 py-1.5 text-xs font-bold transition-colors ${
                  languageFilter === "hi"
                    ? "border-cyan-400 bg-cyan-400 text-black"
                    : "border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700"
                }`}
              >
                Hindi (हिन्दी)
              </button>
            </div>
          </div>
        </div>

        {/* Quick Jump Bar to Magazines */}
        <div className="mb-8 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="mr-2 text-[10px] tracking-widest text-zinc-500 uppercase">Jump to:</span>
          {magazines.map((mag) => (
            <a
              key={mag.magazineNumber}
              href={`#mag-${mag.magazineNumber}`}
              className="border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:border-cyan-500 hover:text-white"
            >
              Mag {mag.magazineNumber}
            </a>
          ))}
        </div>

        {/* Magazine Broadcast Sections */}
        {isLoading ? (
          <div className="border border-zinc-900 bg-zinc-950 p-12 text-center text-xs text-zinc-500">
            Tuning broadcast raster... Loading catalogue...
          </div>
        ) : totalMatching === 0 ? (
          <div className="border border-zinc-900 bg-zinc-950 p-12 text-center text-xs text-zinc-500">
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
                  className="border border-zinc-800 bg-zinc-950 p-4 sm:p-6"
                >
                  {/* Magazine Header */}
                  <div className="mb-4 flex flex-col justify-between gap-2 border-b border-zinc-800 pb-3 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-yellow-400 px-1.5 py-0.5 text-xs font-black text-black">
                          MAG {mag.magazineNumber}
                        </span>
                        <h2 className="text-sm font-bold tracking-wider text-yellow-400 uppercase sm:text-base">
                          {mag.name}
                        </h2>
                        <span className="text-xs text-zinc-600">
                          (P{mag.pageRange[0]}–P{mag.pageRange[1]})
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">{mag.description}</p>
                    </div>

                    <span className="font-mono text-xs text-zinc-500">
                      {matchingBulletins.length}{" "}
                      {matchingBulletins.length === 1 ? "Bulletin" : "Bulletins"}
                    </span>
                  </div>

                  {/* Bulletins Table / List */}
                  {matchingBulletins.length === 0 ? (
                    <div className="border border-zinc-900 bg-black p-4 text-center text-xs text-zinc-600">
                      No bulletins currently transmitting in Magazine {mag.magazineNumber}.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-zinc-800 bg-black">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-zinc-800 bg-zinc-900 text-[10px] tracking-wider text-zinc-400 uppercase">
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
                              <td className="px-4 py-2.5 font-bold whitespace-nowrap text-yellow-400">
                                P{bulletin.pageNumber}
                              </td>
                              <td className="max-w-sm truncate px-4 py-2.5 font-medium text-zinc-200">
                                {bulletin.title}
                              </td>
                              <td className="px-4 py-2.5 text-zinc-400 uppercase">
                                {bulletin.language}
                              </td>
                              <td className="px-4 py-2.5 text-zinc-500">r{bulletin.revision}</td>
                              <td className="px-4 py-2.5 text-right">
                                <Link
                                  href={`/?page=${bulletin.pageNumber}`}
                                  className="inline-block bg-yellow-400 px-3 py-1 text-xs font-bold tracking-wider text-black uppercase transition-colors hover:bg-yellow-300"
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
      <footer className="mt-12 border-t border-zinc-800 px-4 py-6 text-center font-mono text-xs text-zinc-500">
        <p>PAGECAST &bull; AI-Powered Low-Bandwidth Teletext &bull; Kiroween 2026</p>
      </footer>
    </div>
  );
}
