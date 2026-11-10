"use client";

/**
 * PageCast Publisher Dashboard (TASK-S3-09)
 *
 * Central management console for bulletin drafts, active Teletext publications,
 * magazine allocation, and rapid ingestion workflows.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Tv, FileText, QrCode, Eye, Trash2, Cpu, Activity } from "lucide-react";
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
    <div className="flex min-h-screen flex-col font-mono">
      <PublisherHeader activeTitle="Publisher Dashboard" />

      <main className="mx-auto max-w-7xl p-3 sm:p-6 lg:p-8">
        {/* Top Header & Actions */}
        <div className="mb-6 flex flex-col gap-4 border-b border-[#777970] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-xs bg-[#226f43] px-2 py-0.5 text-[10px] font-black text-white uppercase">
                CONSOLE
              </span>
              <h1 className="text-lg font-bold tracking-wider text-[#2f342d] uppercase sm:text-xl">
                Publisher Transmission Control Desk
              </h1>
            </div>
            <p className="mt-1 text-xs text-[#5e645a]">
              Manage Teletext news bulletins, drafts, 40×25 CRT layouts, and distribution packages.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/publisher/ingest"
              className="btn-keycap-light inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider uppercase transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-[#22c55e]" />
              <span>Ingest New Article</span>
            </Link>
            <Link
              href="/terminal"
              className="btn-keycap-light inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider uppercase transition-colors"
            >
              <Tv className="h-3.5 w-3.5 text-[#22c55e]" />
              <span>Open Terminal</span>
            </Link>
          </div>
        </div>

        {/* System Metric Cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="chassis-body p-3.5 shadow-sm">
            <div className="text-[10px] font-bold tracking-widest text-[#4b5249] uppercase">
              Active Drafts
            </div>
            <div className="mt-1 text-2xl font-black text-[#2e8552]">{drafts.length}</div>
            <div className="mt-0.5 text-[10px] text-[#5e645a]">Pending Review</div>
          </div>

          <div className="chassis-body p-3.5 shadow-sm">
            <div className="text-[10px] font-bold tracking-widest text-[#4b5249] uppercase">
              Published Bulletins
            </div>
            <div className="mt-1 text-2xl font-black text-[#1b676e]">{published.length}</div>
            <div className="mt-0.5 text-[10px] text-[#5e645a]">Live in Terminal</div>
          </div>

          <div className="chassis-body p-3.5 shadow-sm">
            <div className="text-[10px] font-bold tracking-widest text-[#4b5249] uppercase">
              Active Magazines
            </div>
            <div className="mt-1 text-2xl font-black text-[#c69b5b]">
              {new Set(published.map((p) => p.magazineNumber)).size || 1} / 8
            </div>
            <div className="mt-0.5 text-[10px] text-[#5e645a]">Ranges P100 - P899</div>
          </div>

          <div className="chassis-body p-3.5 shadow-sm">
            <div className="text-[10px] font-bold tracking-widest text-[#4b5249] uppercase">
              Payload Ceiling
            </div>
            <div className="mt-1 text-2xl font-black text-[#2f342d]">10,240 B</div>
            <div className="mt-0.5 text-[10px] font-bold text-[#2e8552]">Strict Limit</div>
          </div>
        </div>

        {/* Section 1: In-Progress Drafts */}
        <section aria-labelledby="drafts-heading" className="mb-10">
          <div className="mb-3 flex items-center justify-between border-b border-[#777970] pb-2">
            <h2
              id="drafts-heading"
              className="text-xs font-bold tracking-wider text-[#2f342d] uppercase sm:text-sm"
            >
              In-Progress Drafts ({drafts.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="chassis-body p-8 text-center text-xs text-[#5e645a]">
              Loading drafts...
            </div>
          ) : drafts.length === 0 ? (
            <div className="chassis-body p-8 text-center text-xs text-[#5e645a]">
              No active drafts found. Ingest an article to compose your first Teletext bulletin.
            </div>
          ) : (
            <div className="screen-bay overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#232e27] bg-[#121915] text-[10px] tracking-wider text-[#879b83] uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Page</th>
                    <th className="px-4 py-2.5">Title</th>
                    <th className="px-4 py-2.5">Lang</th>
                    <th className="px-4 py-2.5">Subpages</th>
                    <th className="px-4 py-2.5">Last Updated</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b241e] bg-[#0d1410]">
                  {drafts.map((draft) => (
                    <tr key={draft.id} className="transition-colors hover:bg-[#16201a]">
                      <td className="px-4 py-2.5 font-bold text-[#b7c9a8]">P{draft.pageNumber}</td>
                      <td className="max-w-xs truncate px-4 py-2.5 font-medium text-[#f6dfa9]">
                        {draft.title}
                      </td>
                      <td className="px-4 py-2.5 text-[#879b83] uppercase">{draft.language}</td>
                      <td className="px-4 py-2.5 text-[#879b83]">{draft.subPages}</td>
                      <td className="px-4 py-2.5 text-[11px] text-[#6b7c68]">
                        {new Date(draft.updatedAt).toLocaleTimeString()}
                      </td>
                      <td className="space-x-2 px-4 py-2.5 text-right">
                        <Link
                          href={`/publisher/editor/${draft.id}`}
                          className="btn-keycap-light inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase"
                        >
                          <FileText className="h-3 w-3 text-[#22c55e]" />
                          <span>Edit 40×25 Grid</span>
                        </Link>
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="inline-flex cursor-pointer items-center gap-0.5 px-2 py-1 text-[11px] font-semibold text-[#801d14] hover:text-[#b93529]"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
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
          <div className="mb-3 flex items-center justify-between border-b border-[#777970] pb-2">
            <h2
              id="published-heading"
              className="text-xs font-bold tracking-wider text-[#2f342d] uppercase sm:text-sm"
            >
              Live Published Bulletins ({published.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="chassis-body p-8 text-center text-xs text-[#5e645a]">
              Loading published catalogue...
            </div>
          ) : published.length === 0 ? (
            <div className="chassis-body p-8 text-center text-xs text-[#5e645a]">
              No bulletins published yet.
            </div>
          ) : (
            <div className="screen-bay overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#232e27] bg-[#121915] text-[10px] tracking-wider text-[#879b83] uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Page</th>
                    <th className="px-4 py-2.5">Magazine</th>
                    <th className="px-4 py-2.5">Title</th>
                    <th className="px-4 py-2.5">Lang</th>
                    <th className="px-4 py-2.5">Rev</th>
                    <th className="px-4 py-2.5 text-right">Distribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b241e] bg-[#0d1410]">
                  {published.map((pub) => {
                    const mag = getMagazineDefinition(pub.pageNumber);
                    return (
                      <tr key={pub.pageNumber} className="transition-colors hover:bg-[#16201a]">
                        <td className="px-4 py-2.5 font-bold text-[#c69b5b]">P{pub.pageNumber}</td>
                        <td className="px-4 py-2.5 text-[11px] text-[#879b83]">
                          Mag {mag.number}: {mag.name}
                        </td>
                        <td className="max-w-xs truncate px-4 py-2.5 font-medium text-[#b7c9a8]">
                          {pub.title}
                        </td>
                        <td className="px-4 py-2.5 text-[#879b83] uppercase">{pub.language}</td>
                        <td className="px-4 py-2.5 text-[#6b7c68]">r{pub.revision}</td>
                        <td className="space-x-2 px-4 py-2.5 text-right">
                          <Link
                            href={`/terminal?page=${pub.pageNumber}`}
                            className="btn-keycap-light inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase"
                          >
                            <Eye className="h-3 w-3 text-[#22c55e]" />
                            <span>View Live</span>
                          </Link>
                          <button
                            onClick={() => setExportPageNumber(pub.pageNumber)}
                            className="btn-keycap-light inline-flex cursor-pointer items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase"
                          >
                            <QrCode className="h-3 w-3 text-[#c69b5b]" />
                            <span>QR / Poster</span>
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
