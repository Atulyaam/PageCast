"use client";

/**
 * PageCast Publisher Dashboard (TASK-S3-09)
 *
 * Central management console for bulletin drafts, active Teletext publications,
 * magazine allocation, and rapid ingestion workflows.
 * Now rendered inside the unified PT-4025 device shell.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Tv, FileText, QrCode, Eye, Trash2 } from "lucide-react";
import { PageCastDeviceShell } from "@/components/device/PageCastDeviceShell";
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
    <PageCastDeviceShell mode="publisher">
      <div className="space-y-4 font-mono text-[#b8d1a2]">
        {/* In-Screen Control Desk Header */}
        <div className="flex flex-col gap-3 border-b border-[#253328] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-xs bg-[#226f43] px-2 py-0.5 text-[10px] font-black text-white uppercase">
                CONSOLE
              </span>
              <h1 className="text-base font-bold tracking-wider text-[#f6dfa9] uppercase sm:text-lg">
                Publisher Transmission Control Desk
              </h1>
            </div>
            <p className="mt-1 text-xs text-[#879b83]">
              Manage Teletext news bulletins, drafts, 40×25 CRT layouts, and distribution packages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/publisher/ingest"
              className="inline-flex items-center gap-1.5 rounded-xs border border-[#236b40] bg-[#143320] px-3 py-1.5 text-xs font-bold tracking-wider text-[#22c55e] uppercase transition-colors hover:bg-[#1a4028]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Ingest New Article</span>
            </Link>
            <Link
              href="/terminal"
              className="inline-flex items-center gap-1.5 rounded-xs border border-[#253328] bg-[#0d140f] px-3 py-1.5 text-xs font-bold tracking-wider text-[#b8d1a2] uppercase transition-colors hover:border-[#54b77a] hover:text-[#54b77a]"
            >
              <Tv className="h-3.5 w-3.5 text-[#54b77a]" />
              <span>Open Terminal</span>
            </Link>
          </div>
        </div>

        {/* System Metric Cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded border border-[#253328] bg-[#0d140f] p-3 shadow-xs">
            <div className="text-[10px] font-bold tracking-widest text-[#879b83] uppercase">
              Active Drafts
            </div>
            <div className="mt-1 text-2xl font-black text-[#54b77a]">{drafts.length}</div>
            <div className="mt-0.5 text-[10px] text-[#6b7c68]">Pending Review</div>
          </div>

          <div className="rounded border border-[#253328] bg-[#0d140f] p-3 shadow-xs">
            <div className="text-[10px] font-bold tracking-widest text-[#879b83] uppercase">
              Published Bulletins
            </div>
            <div className="mt-1 text-2xl font-black text-[#38bdf8]">{published.length}</div>
            <div className="mt-0.5 text-[10px] text-[#6b7c68]">Live in Terminal</div>
          </div>

          <div className="rounded border border-[#253328] bg-[#0d140f] p-3 shadow-xs">
            <div className="text-[10px] font-bold tracking-widest text-[#879b83] uppercase">
              Active Magazines
            </div>
            <div className="mt-1 text-2xl font-black text-[#f6dfa9]">
              {new Set(published.map((p) => p.magazineNumber)).size || 1} / 8
            </div>
            <div className="mt-0.5 text-[10px] text-[#6b7c68]">Ranges P100 - P899</div>
          </div>

          <div className="rounded border border-[#253328] bg-[#0d140f] p-3 shadow-xs">
            <div className="text-[10px] font-bold tracking-widest text-[#879b83] uppercase">
              Payload Ceiling
            </div>
            <div className="mt-1 text-2xl font-black text-[#e5e7eb]">10,240 B</div>
            <div className="mt-0.5 text-[10px] font-bold text-[#54b77a]">Strict Limit</div>
          </div>
        </div>

        {/* Section 1: In-Progress Drafts */}
        <section aria-labelledby="drafts-heading" className="space-y-2">
          <div className="flex items-center justify-between border-b border-[#253328] pb-1.5">
            <h2
              id="drafts-heading"
              className="text-xs font-bold tracking-wider text-[#f6dfa9] uppercase"
            >
              In-Progress Drafts ({drafts.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="rounded border border-[#253328] bg-[#0d140f] p-6 text-center text-xs text-[#879b83]">
              Loading drafts...
            </div>
          ) : drafts.length === 0 ? (
            <div className="rounded border border-[#253328] bg-[#0d140f] p-6 text-center text-xs text-[#879b83]">
              No active drafts found. Ingest an article to compose your first Teletext bulletin.
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-[#253328]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#253328] bg-[#080d0a] text-[10px] tracking-wider text-[#879b83] uppercase">
                  <tr>
                    <th className="px-3 py-2">Page</th>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Lang</th>
                    <th className="px-3 py-2">Subpages</th>
                    <th className="px-3 py-2">Last Updated</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#17221b] bg-[#0d140f]">
                  {drafts.map((draft) => (
                    <tr key={draft.id} className="transition-colors hover:bg-[#121c15]">
                      <td className="px-3 py-2 font-bold text-[#b8d1a2]">P{draft.pageNumber}</td>
                      <td className="max-w-xs truncate px-3 py-2 font-medium text-[#f6dfa9]">
                        {draft.title}
                      </td>
                      <td className="px-3 py-2 text-[#879b83] uppercase">{draft.language}</td>
                      <td className="px-3 py-2 text-[#879b83]">{draft.subPages}</td>
                      <td className="px-3 py-2 text-[11px] text-[#6b7c68]">
                        {new Date(draft.updatedAt).toLocaleTimeString()}
                      </td>
                      <td className="space-x-2 px-3 py-2 text-right">
                        <Link
                          href={`/publisher/editor/${draft.id}`}
                          className="inline-flex items-center gap-1 rounded-xs border border-[#253328] bg-[#080d0a] px-2.5 py-1 text-[11px] font-bold text-[#b8d1a2] uppercase transition-colors hover:border-[#54b77a] hover:text-[#54b77a]"
                        >
                          <FileText className="h-3 w-3 text-[#54b77a]" />
                          <span>Edit 40×25 Grid</span>
                        </Link>
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="inline-flex cursor-pointer items-center gap-0.5 px-2 py-1 text-[11px] font-semibold text-[#f87171] hover:text-[#ef4444]"
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
        <section aria-labelledby="published-heading" className="space-y-2">
          <div className="flex items-center justify-between border-b border-[#253328] pb-1.5">
            <h2
              id="published-heading"
              className="text-xs font-bold tracking-wider text-[#f6dfa9] uppercase"
            >
              Live Published Bulletins ({published.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="rounded border border-[#253328] bg-[#0d140f] p-6 text-center text-xs text-[#879b83]">
              Loading published catalogue...
            </div>
          ) : published.length === 0 ? (
            <div className="rounded border border-[#253328] bg-[#0d140f] p-6 text-center text-xs text-[#879b83]">
              No bulletins published yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-[#253328]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#253328] bg-[#080d0a] text-[10px] tracking-wider text-[#879b83] uppercase">
                  <tr>
                    <th className="px-3 py-2">Page</th>
                    <th className="px-3 py-2">Magazine</th>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Lang</th>
                    <th className="px-3 py-2">Rev</th>
                    <th className="px-3 py-2 text-right">Distribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#17221b] bg-[#0d140f]">
                  {published.map((pub) => {
                    const mag = getMagazineDefinition(pub.pageNumber);
                    return (
                      <tr key={pub.pageNumber} className="transition-colors hover:bg-[#121c15]">
                        <td className="px-3 py-2 font-bold text-[#f6dfa9]">P{pub.pageNumber}</td>
                        <td className="px-3 py-2 text-[11px] text-[#879b83]">
                          Mag {mag.number}: {mag.name}
                        </td>
                        <td className="max-w-xs truncate px-3 py-2 font-medium text-[#b8d1a2]">
                          {pub.title}
                        </td>
                        <td className="px-3 py-2 text-[#879b83] uppercase">{pub.language}</td>
                        <td className="px-3 py-2 text-[#6b7c68]">r{pub.revision}</td>
                        <td className="space-x-2 px-3 py-2 text-right">
                          <Link
                            href={`/terminal?page=${pub.pageNumber}`}
                            className="inline-flex items-center gap-1 rounded-xs border border-[#253328] bg-[#080d0a] px-2.5 py-1 text-[11px] font-bold text-[#b8d1a2] uppercase transition-colors hover:border-[#54b77a] hover:text-[#54b77a]"
                          >
                            <Eye className="h-3 w-3 text-[#54b77a]" />
                            <span>View Live</span>
                          </Link>
                          <button
                            onClick={() => setExportPageNumber(pub.pageNumber)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-xs border border-[#253328] bg-[#080d0a] px-2.5 py-1 text-[11px] font-bold text-[#f6dfa9] uppercase transition-colors hover:border-[#c69b5b]"
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
      </div>

      {/* Export Dialog Modal */}
      {exportPageNumber && (
        <ExportDialog
          isOpen={true}
          onClose={() => setExportPageNumber(null)}
          pageNumber={exportPageNumber}
        />
      )}
    </PageCastDeviceShell>
  );
}
