"use client";

/**
 * PageCast Publisher Dashboard (TASK-S3-09)
 *
 * Central management console for bulletin drafts, active Teletext publications,
 * magazine allocation, and rapid ingestion workflows.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PublisherHeader } from "@/components/publisher/PublisherHeader";
import { ExportDialog } from "@/components/publisher/ExportDialog";
import { getMagazineDefinition } from "@/domain/teletext/magazine";

interface DraftSummary {
  id: string;
  pageNumber: number;
  slug: string;
  language: string;
  updatedAt: string;
  title: string;
  subPages: number;
}

interface PublishedSummary {
  pageNumber: number;
  slug: string;
  title: string;
  language: string;
  magazineNumber: number;
  publishedAt: string;
  revision: number;
}

export default function PublisherDashboardPage() {
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [published, setPublished] = useState<PublishedSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [exportPageNumber, setExportPageNumber] = useState<number | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch drafts
        const draftsRes = await fetch("/api/v1/drafts");
        if (draftsRes.ok) {
          const draftsData = await draftsRes.json();
          if (draftsData.success && Array.isArray(draftsData.data)) {
            const mapped: DraftSummary[] = draftsData.data.map((item: any) => ({
              id: item.page.id,
              pageNumber: item.page.page_number,
              slug: item.page.slug,
              language: item.page.language,
              updatedAt: item.page.updated_at,
              title: item.revision.page_pack_json.title,
              subPages: item.revision.page_pack_json.pages.length,
            }));
            setDrafts(mapped);
          }
        }

        // Fetch published catalog
        const catalogRes = await fetch("/api/v1/catalogue");
        if (catalogRes.ok) {
          const catalogData = await catalogRes.json();
          if (catalogData.success && Array.isArray(catalogData.data)) {
            setPublished(catalogData.data);
          }
        }
      } catch (err) {
        console.error("Failed to load publisher dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleDeleteDraft = async (id: string) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;

    try {
      const res = await fetch(`/api/v1/drafts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete draft", err);
    }
  };

  return (
    <div className="min-h-screen bg-black font-mono text-zinc-100">
      <PublisherHeader activeTitle="Publisher Dashboard" />

      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* Top Header & Actions */}
        <div className="mb-8 flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500 px-2 py-0.5 text-xs font-black text-black">
                CONSOLE
              </span>
              <h1 className="text-xl font-bold tracking-wider text-emerald-400 uppercase sm:text-2xl">
                Publisher Control Desk
              </h1>
            </div>
            <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
              Manage Teletext news bulletins, drafts, 40×25 CRT layouts, and distribution packages.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/publisher/ingest"
              className="cursor-pointer bg-emerald-500 px-4 py-2 text-xs font-bold tracking-wider text-black uppercase transition-colors hover:bg-emerald-400"
            >
              + Ingest New Article
            </Link>
            <Link
              href="/terminal"
              className="cursor-pointer border border-zinc-700 px-4 py-2 text-xs font-bold tracking-wider text-zinc-300 uppercase transition-colors hover:border-zinc-500"
            >
              📺 Open Terminal
            </Link>
          </div>
        </div>

        {/* System Metric Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[10px] tracking-widest text-zinc-500 uppercase">Active Drafts</div>
            <div className="mt-1 text-2xl font-black text-emerald-400">{drafts.length}</div>
            <div className="mt-1 text-[10px] text-zinc-500">Pending Editorial Review</div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[10px] tracking-widest text-zinc-500 uppercase">
              Published Bulletins
            </div>
            <div className="mt-1 text-2xl font-black text-cyan-400">{published.length}</div>
            <div className="mt-1 text-[10px] text-zinc-500">Live in Reader Terminal</div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[10px] tracking-widest text-zinc-500 uppercase">
              Active Magazines
            </div>
            <div className="mt-1 text-2xl font-black text-yellow-400">
              {new Set(published.map((p) => p.magazineNumber)).size || 1} / 8
            </div>
            <div className="mt-1 text-[10px] text-zinc-500">Ranges P100 - P899</div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[10px] tracking-widest text-zinc-500 uppercase">
              Payload Ceiling
            </div>
            <div className="mt-1 text-2xl font-black text-zinc-300">10,240 B</div>
            <div className="mt-1 text-[10px] text-emerald-400">Strict UTF-8 Compliance</div>
          </div>
        </div>

        {/* Section 1: In-Progress Drafts */}
        <section aria-labelledby="drafts-heading" className="mb-10">
          <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-2">
            <h2
              id="drafts-heading"
              className="text-sm font-bold tracking-wider text-emerald-400 uppercase"
            >
              In-Progress Drafts ({drafts.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="border border-zinc-900 bg-zinc-950 p-8 text-center text-xs text-zinc-500">
              Loading drafts...
            </div>
          ) : drafts.length === 0 ? (
            <div className="border border-zinc-900 bg-zinc-950 p-8 text-center text-xs text-zinc-500">
              No active drafts found. Ingest an article to compose your first Teletext bulletin.
            </div>
          ) : (
            <div className="overflow-x-auto border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 bg-zinc-900 text-[10px] tracking-wider text-zinc-400 uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Page</th>
                    <th className="px-4 py-2.5">Title</th>
                    <th className="px-4 py-2.5">Lang</th>
                    <th className="px-4 py-2.5">Subpages</th>
                    <th className="px-4 py-2.5">Last Updated</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {drafts.map((draft) => (
                    <tr key={draft.id} className="transition-colors hover:bg-zinc-900/40">
                      <td className="px-4 py-2.5 font-bold text-emerald-400">
                        P{draft.pageNumber}
                      </td>
                      <td className="max-w-xs truncate px-4 py-2.5 font-medium text-zinc-200">
                        {draft.title}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-400 uppercase">{draft.language}</td>
                      <td className="px-4 py-2.5 text-zinc-400">{draft.subPages}</td>
                      <td className="px-4 py-2.5 text-[11px] text-zinc-500">
                        {new Date(draft.updatedAt).toLocaleTimeString()}
                      </td>
                      <td className="space-x-2 px-4 py-2.5 text-right">
                        <Link
                          href={`/publisher/editor/${draft.id}`}
                          className="border border-emerald-800 bg-emerald-950 px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:border-emerald-500"
                        >
                          Edit 40×25 Grid
                        </Link>
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="cursor-pointer px-2 py-1 text-[11px] text-zinc-500 hover:text-red-400"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section 2: Published Teletext Catalog */}
        <section aria-labelledby="published-heading">
          <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-2">
            <h2
              id="published-heading"
              className="text-sm font-bold tracking-wider text-cyan-400 uppercase"
            >
              Live Published Bulletins ({published.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="border border-zinc-900 bg-zinc-950 p-8 text-center text-xs text-zinc-500">
              Loading published catalogue...
            </div>
          ) : published.length === 0 ? (
            <div className="border border-zinc-900 bg-zinc-950 p-8 text-center text-xs text-zinc-500">
              No bulletins published yet.
            </div>
          ) : (
            <div className="overflow-x-auto border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 bg-zinc-900 text-[10px] tracking-wider text-zinc-400 uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Page</th>
                    <th className="px-4 py-2.5">Magazine</th>
                    <th className="px-4 py-2.5">Title</th>
                    <th className="px-4 py-2.5">Lang</th>
                    <th className="px-4 py-2.5">Rev</th>
                    <th className="px-4 py-2.5 text-right">Distribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {published.map((pub) => {
                    const mag = getMagazineDefinition(pub.pageNumber);
                    return (
                      <tr key={pub.pageNumber} className="transition-colors hover:bg-zinc-900/40">
                        <td className="px-4 py-2.5 font-bold text-cyan-400">P{pub.pageNumber}</td>
                        <td className="px-4 py-2.5 text-[11px] text-zinc-400">
                          Mag {mag.number}: {mag.name}
                        </td>
                        <td className="max-w-xs truncate px-4 py-2.5 font-medium text-zinc-200">
                          {pub.title}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-400 uppercase">{pub.language}</td>
                        <td className="px-4 py-2.5 text-zinc-400">r{pub.revision}</td>
                        <td className="space-x-2 px-4 py-2.5 text-right">
                          <Link
                            href={`/terminal?page=${pub.pageNumber}`}
                            className="border border-zinc-800 px-2 py-1 text-[11px] text-zinc-300 hover:border-zinc-600 hover:text-white"
                          >
                            View Live
                          </Link>
                          <button
                            onClick={() => setExportPageNumber(pub.pageNumber)}
                            className="cursor-pointer border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] font-bold text-emerald-400 hover:bg-zinc-800"
                          >
                            QR / Poster
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Export Dialog Modal */}
      {exportPageNumber && (
        <ExportDialog
          isOpen={true}
          onClose={() => setExportPageNumber(null)}
          pageNumber={exportPageNumber}
        />
      )}
    </div>
  );
}
