"use client";

/**
 * PageCast Dynamic Broadcast Catalogue (TASK-S4-05)
 * /catalogue
 *
 * Displays all 8 Teletext magazines with published bulletin discovery,
 * real-time keyword search, language filtering, and direct terminal tuning.
 * Rendered inside the PT-4025 CRT display with internal scrolling.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Radio, ArrowUpRight, AlertTriangle } from "lucide-react";
import { PageCastDeviceShell } from "@/components/device/PageCastDeviceShell";
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

  const filterBulletins = (bulletins: CatalogItem[]): CatalogItem[] => {
    return bulletins.filter((b) => {
      if (languageFilter !== "all" && b.language !== languageFilter) {
        return false;
      }
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
    <PageCastDeviceShell mode="catalogue">
      <div className="space-y-4">
        {/* CRT Directory Title & Technical Header */}
        <div className="border-b border-[#253328] pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-xs bg-[#135359] px-2 py-0.5 text-[10px] font-extrabold tracking-widest text-[#76c7cd] uppercase">
                DIRECTORY
              </span>
              <h1 className="text-sm font-bold tracking-wider text-[#f6dfa9] uppercase sm:text-base">
                Broadcast Frequency Directory
              </h1>
            </div>
            <span className="font-mono text-[10px] text-[#829a76]">
              {totalMatching} ACTIVE CHANNELS
            </span>
          </div>
          <p className="mt-1 text-xs text-[#829a76]">
            Browse active broadcast bulletins across all 8 standard Teletext frequency magazines.
          </p>
        </div>

        {/* Offline Snapshot Stale-State Notice */}
        {snapshotDate && (
          <div
            role="status"
            className="flex items-center justify-between rounded-xs border border-[#846114] bg-[#2d2208]/90 px-3 py-2 text-xs text-[#f6dfa9]"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#eab308]" />
              <span>OFFLINE SNAPSHOT: Stored {snapshotDate}</span>
            </div>
            <span className="rounded-xs bg-[#846114]/50 px-1.5 py-0.5 text-[9px] font-bold text-[#c69b5b] uppercase">
              LOCAL CACHE
            </span>
          </div>
        )}

        {/* Search & Filter CRT Bar */}
        <div className="flex flex-col gap-3 rounded-xs border border-[#232e27] bg-[#101713] p-3 md:flex-row md:items-center md:justify-between">
          {/* Keyword Search */}
          <div className="flex-1">
            <label
              htmlFor="catalogue-search"
              className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[#829a76] uppercase"
            >
              <Search className="h-3 w-3 text-[#54b77a]" />
              Search Bulletins (Page or Title)
            </label>
            <input
              id="catalogue-search"
              type="text"
              placeholder="e.g. 101, cyclone, technology..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-[#232e27] bg-[#0a0f0c] px-2.5 py-1.5 text-xs text-[#b8d1a2] placeholder:text-[#3d4f40] focus:border-[#54b77a] focus:outline-none"
            />
          </div>

          {/* Language Selector */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[#829a76] uppercase">
              <SlidersHorizontal className="h-3 w-3 text-[#54b77a]" />
              Language
            </label>
            <div className="flex items-center gap-1">
              {(["all", "en", "hi"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguageFilter(lang)}
                  className={`cursor-pointer rounded px-2.5 py-1 text-[11px] font-bold uppercase transition-all ${
                    languageFilter === lang
                      ? "border border-[#54b77a] bg-[#1a3823] text-[#54b77a] shadow-[0_0_6px_rgba(84,183,122,0.3)]"
                      : "border border-[#232e27] bg-[#0a0f0c] text-[#6d826c] hover:text-[#b8d1a2]"
                  }`}
                >
                  {lang === "all" ? "All" : lang === "en" ? "EN" : "हिन्दी"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Jump Bar to Magazines */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <span className="mr-1 flex items-center gap-1 text-[10px] font-bold tracking-widest text-[#6d826c] uppercase">
            <Radio className="h-3 w-3 text-[#d1a15d]" />
            MAG:
          </span>
          {magazines.map((mag) => (
            <a
              key={mag.magazineNumber}
              href={`#mag-${mag.magazineNumber}`}
              className="rounded border border-[#232e27] bg-[#101713] px-2 py-0.5 text-[10px] font-bold text-[#829a76] hover:border-[#54b77a] hover:text-[#b8d1a2]"
            >
              M{mag.magazineNumber}
            </a>
          ))}
        </div>

        {/* Magazine Broadcast Sections */}
        {isLoading ? (
          <div className="rounded border border-[#232e27] bg-[#101713] p-8 text-center text-xs text-[#829a76]">
            Tuning broadcast raster... Loading catalogue...
          </div>
        ) : totalMatching === 0 ? (
          <div className="rounded border border-[#232e27] bg-[#101713] p-8 text-center text-xs text-[#829a76]">
            No bulletins found matching your filter criteria.
          </div>
        ) : (
          <div className="space-y-4">
            {magazines.map((mag) => {
              const matchingBulletins = filterBulletins(mag.bulletins);

              return (
                <section
                  key={mag.magazineNumber}
                  id={`mag-${mag.magazineNumber}`}
                  className="rounded border border-[#232e27] bg-[#101713] p-3"
                >
                  {/* Magazine Header */}
                  <div className="mb-2.5 flex flex-wrap items-center justify-between gap-1 border-b border-[#1c261f] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-xs bg-[#c69b5b] px-1.5 py-0.5 text-[9px] font-black text-[#0d1410]">
                        MAG {mag.magazineNumber}
                      </span>
                      <h2 className="text-xs font-bold tracking-wider text-[#f6dfa9] uppercase sm:text-sm">
                        {mag.name}
                      </h2>
                      <span className="text-[10px] text-[#6d826c]">
                        (P{mag.pageRange[0]}–P{mag.pageRange[1]})
                      </span>
                    </div>

                    <span className="text-[10px] text-[#6d826c]">
                      {matchingBulletins.length} {matchingBulletins.length === 1 ? "page" : "pages"}
                    </span>
                  </div>

                  {/* Bulletins Table */}
                  {matchingBulletins.length === 0 ? (
                    <div className="p-3 text-center text-[11px] text-[#586957]">
                      No bulletins currently transmitting in Magazine {mag.magazineNumber}.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-[#1c261f] text-[9px] tracking-wider text-[#6d826c] uppercase">
                          <tr>
                            <th className="w-16 px-2.5 py-1.5">Page</th>
                            <th className="px-2.5 py-1.5">Title</th>
                            <th className="w-16 px-2.5 py-1.5">Lang</th>
                            <th className="w-16 px-2.5 py-1.5">Rev</th>
                            <th className="w-24 px-2.5 py-1.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#18211a]">
                          {matchingBulletins.map((bulletin) => (
                            <tr
                              key={bulletin.pageNumber}
                              className="transition-colors hover:bg-[#151f18]"
                            >
                              <td className="px-2.5 py-2 font-bold whitespace-nowrap text-[#d1a15d]">
                                P{bulletin.pageNumber}
                              </td>
                              <td className="max-w-xs truncate px-2.5 py-2 text-[#b8d1a2]">
                                {bulletin.title}
                              </td>
                              <td className="px-2.5 py-2 text-[10px] text-[#829a76] uppercase">
                                {bulletin.language}
                              </td>
                              <td className="px-2.5 py-2 text-[10px] text-[#6d826c]">
                                r{bulletin.revision}
                              </td>
                              <td className="px-2.5 py-2 text-right">
                                <Link
                                  href={`/?page=${bulletin.pageNumber}`}
                                  className="inline-flex items-center gap-1 rounded border border-[#232e27] bg-[#0a0f0c] px-2 py-1 text-[10px] font-bold text-[#54b77a] hover:border-[#54b77a] hover:bg-[#1a3823]"
                                >
                                  <span>TUNE</span>
                                  <ArrowUpRight className="h-3 w-3" />
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
      </div>
    </PageCastDeviceShell>
  );
}
