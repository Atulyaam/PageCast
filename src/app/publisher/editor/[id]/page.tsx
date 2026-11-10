"use client";

/**
 * PageCast Dedicated 40×25 Teletext Editor Page (TASK-S3-09)
 * /publisher/editor/[id]
 *
 * Integrates interactive grid canvas, real-time byte counters,
 * pre-flight validation gates, and multi-page publishing workflows.
 * Now rendered inside the unified PT-4025 device shell.
 */

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageCastDeviceShell } from "@/components/device/PageCastDeviceShell";
import { TeletextEditor } from "@/components/publisher/TeletextEditor";
import { ByteBudgetMeter } from "@/components/publisher/ByteBudgetMeter";
import { GridValidationBanner } from "@/components/publisher/GridValidationBanner";
import { PublishModal } from "@/components/publisher/PublishModal";
import { ExportDialog } from "@/components/publisher/ExportDialog";
import type { PagePackV1 } from "@/domain/page-pack/types";
import type { TeletextPage } from "@/domain/teletext/types";
import { layoutBulletinPage } from "@/domain/layout-engine/layout";

export default function PublisherEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [pack, setPack] = useState<PagePackV1 | null>(null);
  const [currentSubIndex, setCurrentSubIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;

    async function fetchDraft() {
      try {
        const res = await fetch(`/api/v1/drafts/${id}`);
        if (!res.ok) {
          throw new Error("Draft not found");
        }
        const data = await res.json();
        if (data.success && data.data) {
          const packData: PagePackV1 = data.data.revision.page_pack_json;
          setPack(packData);
        }
      } catch (err) {
        console.error("Failed to load draft for editing", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDraft();
  }, [id]);

  const handlePageChange = (updatedPage: TeletextPage) => {
    if (!pack) return;
    const newPages = [...pack.pages];
    newPages[currentSubIndex] = updatedPage;
    setPack({
      ...pack,
      pages: newPages,
    });
  };

  const handleSaveDraft = async () => {
    if (!pack || !id) return;
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch(`/api/v1/drafts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pack,
          pageNumber: pack.primaryPageNumber,
          slug: pack.slug,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save draft");
      }

      setSaveMessage("Saved successfully");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      setSaveMessage(err?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubPage = () => {
    if (!pack) return;
    const nextSubNum = pack.pages.length + 1;
    const newSubPage: TeletextPage = layoutBulletinPage({
      pageNumber: pack.primaryPageNumber,
      subPageNumber: nextSubNum,
      subPageCount: nextSubNum,
      title: `${pack.title} - Page ${nextSubNum}`,
      paragraphs: ["New subpage text. Edit in the 40x25 grid."],
      fastext: pack.pages[0]?.fastext || { red: 100, green: 200, yellow: 300, cyan: 400 },
    });

    const updatedPages: TeletextPage[] = [
      ...pack.pages.map((p) => ({
        ...p,
        subPageCount: nextSubNum,
      })),
      newSubPage,
    ];

    setPack({
      ...pack,
      pages: updatedPages,
    });
    setCurrentSubIndex(updatedPages.length - 1);
  };

  if (isLoading) {
    return (
      <PageCastDeviceShell mode="editor">
        <div className="flex h-64 items-center justify-center font-mono text-xs text-[#879b83]">
          Loading Teletext editor workspace...
        </div>
      </PageCastDeviceShell>
    );
  }

  if (!pack) {
    return (
      <PageCastDeviceShell mode="editor">
        <div className="mx-auto max-w-md p-8 text-center font-mono text-[#b8d1a2]">
          <p className="mb-4 text-sm text-[#f87171]">Draft not found or could not be loaded.</p>
          <Link
            href="/publisher"
            className="rounded-xs border border-[#253328] bg-[#0d140f] px-4 py-2 text-xs font-bold text-[#54b77a] hover:border-[#54b77a]"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </PageCastDeviceShell>
    );
  }

  const activePage = pack.pages[currentSubIndex] || pack.pages[0];

  return (
    <PageCastDeviceShell mode="editor">
      <div className="space-y-4 font-mono text-[#b8d1a2]">
        {/* Editor In-Screen Header & Toolbar */}
        <div className="flex flex-col gap-3 border-b border-[#253328] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/publisher"
              className="rounded-xs border border-[#253328] bg-[#0d140f] px-2.5 py-1 text-xs font-bold text-[#b8d1a2] transition-colors hover:border-[#54b77a] hover:text-[#54b77a]"
            >
              ← Back
            </Link>
            <div className="flex items-center gap-2">
              <span className="rounded-xs bg-[#c69b5b] px-1.5 py-0.5 text-xs font-black text-[#0d1410]">
                P{pack.primaryPageNumber}
              </span>
              <h1 className="max-w-md truncate text-sm font-bold text-[#f6dfa9]">{pack.title}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {saveMessage && (
              <span
                className={`px-2 py-1 text-xs font-bold ${
                  saveMessage.includes("success") ? "text-[#54b77a]" : "text-[#f87171]"
                }`}
              >
                {saveMessage}
              </span>
            )}

            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="cursor-pointer rounded-xs border border-[#253328] bg-[#0d140f] px-3 py-1.5 text-xs font-bold tracking-wider text-[#b8d1a2] uppercase transition-colors hover:border-[#54b77a] hover:text-[#54b77a]"
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="cursor-pointer rounded-xs border border-[#253328] bg-[#0d140f] px-3 py-1.5 text-xs font-bold tracking-wider text-[#f6dfa9] uppercase transition-colors hover:border-[#c69b5b]"
            >
              Export
            </button>

            <button
              onClick={() => setShowPublishModal(true)}
              className="cursor-pointer rounded-xs border border-[#236b40] bg-[#143320] px-4 py-1.5 text-xs font-black tracking-wider text-[#22c55e] uppercase transition-colors hover:bg-[#1a4028]"
            >
              Publish Live...
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Main Canvas Column */}
          <div className="space-y-4 lg:col-span-8">
            {/* Subpage Tabs */}
            {pack.pages.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 border-b border-[#253328] pb-2">
                <span className="text-xs font-bold tracking-wider text-[#879b83] uppercase">
                  Sub-pages:
                </span>
                {pack.pages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSubIndex(idx)}
                    className={`cursor-pointer rounded-xs border px-2.5 py-1 text-xs font-bold ${
                      currentSubIndex === idx
                        ? "border-[#c69b5b] bg-[#c69b5b] text-[#0d1410]"
                        : "border-[#253328] bg-[#0d140f] text-[#b8d1a2] hover:border-[#54b77a]"
                    }`}
                  >
                    {pack.primaryPageNumber}/{idx + 1}
                  </button>
                ))}
                <button
                  onClick={handleAddSubPage}
                  className="cursor-pointer rounded-xs border border-dashed border-[#253328] bg-[#0d140f] px-2 py-1 text-xs font-bold text-[#879b83] hover:border-[#54b77a] hover:text-[#54b77a]"
                >
                  + Add Subpage
                </button>
              </div>
            )}

            {/* 40x25 Teletext Grid Interactive Editor */}
            <div className="rounded border border-[#253328] bg-[#0d140f] p-3 sm:p-4">
              <TeletextEditor page={activePage} onChange={handlePageChange} />
            </div>
          </div>

          {/* Sidebar Diagnostics Column */}
          <div className="space-y-4 lg:col-span-4">
            {/* Real-time Byte Budget Meter */}
            <div className="rounded border border-[#253328] bg-[#0d140f] p-3 sm:p-4">
              <h2 className="mb-2 text-xs font-bold tracking-wider text-[#f6dfa9] uppercase">
                Live Byte Budget
              </h2>
              <ByteBudgetMeter pack={pack} />
            </div>

            {/* Real-time Grid Validation Banner */}
            <div className="rounded border border-[#253328] bg-[#0d140f] p-3 sm:p-4">
              <h2 className="mb-2 text-xs font-bold tracking-wider text-[#f6dfa9] uppercase">
                Compliance Checklist
              </h2>
              <GridValidationBanner pack={pack} />
            </div>

            {/* Quick Subpage Actions */}
            <div className="rounded border border-[#253328] bg-[#0d140f] p-3 sm:p-4">
              <h2 className="mb-2 text-xs font-bold tracking-wider text-[#f6dfa9] uppercase">
                Multi-Page Tools
              </h2>
              <p className="mb-3 text-[11px] text-[#879b83]">
                Total Sub-pages: <strong>{pack.pages.length}</strong>. Each subpage is transmitted
                sequentially in the Teletext carousel.
              </p>
              <button
                onClick={handleAddSubPage}
                className="w-full cursor-pointer rounded-xs border border-[#253328] bg-[#080d0a] py-2 text-xs font-bold tracking-wider text-[#b8d1a2] uppercase transition-colors hover:border-[#54b77a] hover:text-[#54b77a]"
              >
                + Append Subpage ({pack.primaryPageNumber}/{pack.pages.length + 1})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Publish Modal Gate */}
      {showPublishModal && (
        <PublishModal
          isOpen={true}
          onClose={() => setShowPublishModal(false)}
          onPublished={() => {
            router.push(`/terminal?page=${pack.primaryPageNumber}`);
          }}
          draftId={id}
          pack={pack}
        />
      )}

      {/* Export Dialog */}
      {showExportModal && (
        <ExportDialog
          isOpen={true}
          onClose={() => setShowExportModal(false)}
          pageNumber={pack.primaryPageNumber}
          pack={pack}
        />
      )}
    </PageCastDeviceShell>
  );
}
