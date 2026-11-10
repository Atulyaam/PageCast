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
    <div className="flex min-h-screen flex-col font-mono">
      {/* Top Precision Instrumentation Rail */}
      <header className="sticky top-0 z-30 border-b border-[#1b201c] bg-[#222723] px-3 py-2 text-[#b7c9a8] shadow-md sm:px-5 sm:py-2.5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="group flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-[#f6dfa9] transition-opacity group-hover:opacity-80 sm:text-lg">
                PAGECAST
              </span>
              <span className="rounded-xs border border-[#3b453e] bg-[#161a17] px-2 py-0.5 text-[10px] font-bold tracking-widest text-[#76c7cd] uppercase">
                DIRECTORY CONSOLE
              </span>
            </Link>
          </div>

          <nav className="no-scrollbar flex items-center gap-1.5 overflow-x-auto text-xs sm:gap-2">
            <Link
              href="/"
              className="rounded-xs border border-transparent px-2.5 py-1 text-[#879b83] transition-all hover:border-[#3b453e] hover:text-[#b7c9a8]"
            >
              READER
            </Link>
            <Link
              href="/terminal"
              className="rounded-xs border border-transparent px-2.5 py-1 text-[#879b83] transition-all hover:border-[#3b453e] hover:text-[#b7c9a8]"
            >
              TERMINAL
            </Link>
            <Link
              href="/catalogue"
              className="rounded-xs border border-[#3d4b40] bg-[#2b352e] px-2.5 py-1 font-bold text-[#76c7cd] shadow-inner transition-all"
            >
              CATALOGUE
            </Link>
            <Link
              href="/saved"
              className="rounded-xs border border-transparent px-2.5 py-1 text-[#879b83] transition-all hover:border-[#3b453e] hover:text-[#b7c9a8]"
            >
              SAVED
            </Link>
            <Link
              href="/publisher/ingest"
              className="rounded-xs border border-[#74581a] bg-[#3a2e12] px-2.5 py-1 font-bold text-[#f6dfa9] transition-all hover:bg-[#4a3b16]"
            >
              PUBLISHER STUDIO
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Catalogue Area */}
      <main className="mx-auto max-w-5xl p-3 sm:p-6 lg:p-8">
        {/* Title & Introduction */}
        <div className="mb-6 border-b border-[#777970] pb-4">
          <div className="flex items-center gap-2">
            <span className="rounded-xs bg-[#135359] px-2 py-0.5 text-[10px] font-extrabold tracking-widest text-[#76c7cd] uppercase">
              INDEX
            </span>
            <h1 className="text-lg font-bold tracking-wider text-[#2f342d] uppercase sm:text-xl">
              Teletext Broadcast Frequency Directory
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#5e645a] sm:text-sm">
            Browse active broadcast bulletins across all 8 standard Teletext frequency magazines.
          </p>
        </div>

        {/* Offline Snapshot Stale-State Notice */}
        {snapshotDate && (
          <div
            role="status"
            className="mb-6 flex items-center justify-between rounded-xs border border-[#846114] bg-[#2d2208] px-3 py-2 text-xs text-[#f6dfa9]"
          >
            <span>
              ⚠️ OFFLINE CATALOGUE SNAPSHOT &bull; Stored {snapshotDate} &bull; Broadcast updates
              paused
            </span>
            <span className="text-[10px] font-bold tracking-widest text-[#c69b5b] uppercase">
              OFFLINE CACHE
            </span>
          </div>
        )}

        {/* Search & Filter Chassis Toolbar */}
        <div className="chassis-body mb-8 flex flex-col justify-between gap-4 p-4 md:flex-row md:items-center">
          {/* Keyword Search */}
          <div className="flex-1">
            <label
              htmlFor="catalogue-search"
              className="mb-1 block font-mono text-[10px] font-bold tracking-widest text-[#4b5249] uppercase"
            >
              Search Bulletins (Page or Title)
            </label>
            <input
              id="catalogue-search"
              type="text"
              placeholder="e.g. 101, cyclone, technology..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="led-window w-full px-3 py-1.5 text-sm text-[#b7c9a8] placeholder:text-[#506053] focus:border-[#c69b5b] focus:outline-hidden"
            />
          </div>

          {/* Language Selector */}
          <div>
            <label className="mb-1 block font-mono text-[10px] font-bold tracking-widest text-[#4b5249] uppercase">
              Language Filter
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLanguageFilter("all")}
                className={`btn-keycap-light cursor-pointer px-3 py-1 text-xs font-bold transition-all ${
                  languageFilter === "all"
                    ? "!border-[#1b676e] !bg-[#268790] !text-white shadow-[0_0_8px_rgba(38,135,144,0.4)]"
                    : ""
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setLanguageFilter("en")}
                className={`btn-keycap-light cursor-pointer px-3 py-1 text-xs font-bold transition-all ${
                  languageFilter === "en"
                    ? "!border-[#1b676e] !bg-[#268790] !text-white shadow-[0_0_8px_rgba(38,135,144,0.4)]"
                    : ""
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguageFilter("hi")}
                className={`btn-keycap-light cursor-pointer px-3 py-1 text-xs font-bold transition-all ${
                  languageFilter === "hi"
                    ? "!border-[#1b676e] !bg-[#268790] !text-white shadow-[0_0_8px_rgba(38,135,144,0.4)]"
                    : ""
                }`}
              >
                Hindi (हिन्दी)
              </button>
            </div>
          </div>
        </div>

        {/* Quick Jump Bar to Magazines */}
        <div className="mb-8 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="mr-2 font-mono text-[10px] font-bold tracking-widest text-[#5e645a] uppercase">
            Jump to:
          </span>
          {magazines.map((mag) => (
            <a
              key={mag.magazineNumber}
              href={`#mag-${mag.magazineNumber}`}
              className="btn-keycap-light border border-[#777970] px-2 py-0.5 text-[11px] font-semibold text-[#2f342d] transition-colors hover:border-[#1b676e] hover:text-black"
            >
              Mag {mag.magazineNumber}
            </a>
          ))}
        </div>

        {/* Magazine Broadcast Sections */}
        {isLoading ? (
          <div className="chassis-body p-12 text-center text-xs text-[#5e645a]">
            Tuning broadcast raster... Loading catalogue...
          </div>
        ) : totalMatching === 0 ? (
          <div className="chassis-body p-12 text-center text-xs text-[#5e645a]">
            No bulletins found matching your filter criteria.
          </div>
        ) : (
          <div className="space-y-6">
            {magazines.map((mag) => {
              const matchingBulletins = filterBulletins(mag.bulletins);

              return (
                <section
                  key={mag.magazineNumber}
                  id={`mag-${mag.magazineNumber}`}
                  className="chassis-body p-4 sm:p-5"
                >
                  {/* Magazine Header */}
                  <div className="mb-3 flex flex-col justify-between gap-2 border-b border-[#777970] pb-2.5 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-xs bg-[#c69b5b] px-1.5 py-0.5 text-[10px] font-black text-[#0d1410]">
                          MAG {mag.magazineNumber}
                        </span>
                        <h2 className="text-sm font-bold tracking-wider text-[#2f342d] uppercase sm:text-base">
                          {mag.name}
                        </h2>
                        <span className="text-xs text-[#5e645a]">
                          (P{mag.pageRange[0]}–P{mag.pageRange[1]})
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#5e645a]">{mag.description}</p>
                    </div>

                    <span className="font-mono text-xs text-[#4b5249]">
                      {matchingBulletins.length}{" "}
                      {matchingBulletins.length === 1 ? "Bulletin" : "Bulletins"}
                    </span>
                  </div>

                  {/* Bulletins Table / List */}
                  {matchingBulletins.length === 0 ? (
                    <div className="screen-bay p-4 text-center text-xs text-[#60715d]">
                      No bulletins currently transmitting in Magazine {mag.magazineNumber}.
                    </div>
                  ) : (
                    <div className="screen-bay overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-[#232e27] bg-[#121915] text-[10px] tracking-wider text-[#879b83] uppercase">
                          <tr>
                            <th className="w-20 px-4 py-2.5">Page</th>
                            <th className="px-4 py-2.5">Title</th>
                            <th className="w-20 px-4 py-2.5">Lang</th>
                            <th className="w-20 px-4 py-2.5">Revision</th>
                            <th className="w-32 px-4 py-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1b241e] bg-[#0d1410]">
                          {matchingBulletins.map((bulletin) => (
                            <tr
                              key={bulletin.pageNumber}
                              className="transition-colors hover:bg-[#16201a]"
                            >
                              <td className="px-4 py-2.5 font-bold whitespace-nowrap text-[#c69b5b]">
                                P{bulletin.pageNumber}
                              </td>
                              <td className="max-w-sm truncate px-4 py-2.5 font-medium text-[#b7c9a8]">
                                {bulletin.title}
                              </td>
                              <td className="px-4 py-2.5 text-[#879b83] uppercase">
                                {bulletin.language}
                              </td>
                              <td className="px-4 py-2.5 text-[#6b7c68]">r{bulletin.revision}</td>
                              <td className="px-4 py-2.5 text-right">
                                <Link
                                  href={`/?page=${bulletin.pageNumber}`}
                                  className="btn-keycap-light inline-block px-3 py-1 text-xs font-bold tracking-wider uppercase transition-colors"
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
      <footer className="mt-12 border-t border-[#bfbcb2] px-4 py-6 text-center font-mono text-xs text-[#5e645a]">
        <p>PAGECAST &bull; AI-Powered Physical Teletext Terminal &bull; Kiroween 2026</p>
      </footer>
    </div>
  );
}
