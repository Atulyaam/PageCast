"use client";

/**
 * PageCast Dedicated 40×25 Teletext Editor Page (TASK-S3-09)
 * /publisher/editor/[id]
 *
 * Integrates interactive grid canvas, real-time byte counters,
 * pre-flight validation gates, and multi-page publishing workflows.
 */

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PublisherHeader } from "@/components/publisher/PublisherHeader";
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
      <div className="min-h-screen bg-black font-mono text-zinc-100">
        <PublisherHeader activeTitle="Editor Loading" />
        <div className="flex h-96 items-center justify-center text-xs text-zinc-500">
          Loading Teletext editor workspace...
        </div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="min-h-screen bg-black font-mono text-zinc-100">
        <PublisherHeader activeTitle="Draft Missing" />
        <div className="mx-auto max-w-md p-8 text-center">
          <p className="mb-4 text-sm text-red-400">Draft not found or could not be loaded.</p>
          <Link
            href="/publisher"
            className="border border-zinc-700 px-4 py-2 text-xs font-bold text-emerald-400 hover:border-emerald-500"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const activePage = pack.pages[currentSubIndex] || pack.pages[0];

  return (
    <div className="flex min-h-screen flex-col font-mono">
      <PublisherHeader activeTitle={`Editing P${pack.primaryPageNumber}`} />

      {/* Editor Sub-Header Toolbar */}
      <div className="border-b border-[#777970] bg-[#a2a197] px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/publisher"
              className="btn-keycap-light px-2.5 py-1 text-xs font-bold transition-all"
            >
              ← Back
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-xs bg-[#c69b5b] px-1.5 py-0.5 text-xs font-black text-[#0d1410]">
                  P{pack.primaryPageNumber}
                </span>
                <h1 className="max-w-md truncate text-sm font-bold text-[#2f342d]">{pack.title}</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveMessage && (
              <span
                className={`px-2 py-1 text-xs font-bold ${
                  saveMessage.includes("success") ? "text-[#226f43]" : "text-[#9e2b20]"
                }`}
              >
                {saveMessage}
              </span>
            )}

            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="btn-keycap-light cursor-pointer px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors"
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="btn-keycap-light cursor-pointer px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors"
            >
              Export
            </button>

            <button
              onClick={() => setShowPublishModal(true)}
              className="btn-keycap-light cursor-pointer !border-[#114225] !bg-[#2f8c56] px-4 py-1.5 text-xs font-black tracking-wider !text-white uppercase transition-colors"
            >
              Publish Live...
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-12">
        {/* Main Canvas Column */}
        <div className="space-y-4 lg:col-span-8">
          {/* Subpage Tabs */}
          {pack.pages.length > 1 && (
            <div className="flex items-center gap-2 border-b border-[#777970] pb-2">
              <span className="text-xs font-bold tracking-wider text-[#4b5249] uppercase">
                Sub-pages:
              </span>
              {pack.pages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSubIndex(idx)}
                  className={`btn-keycap-light cursor-pointer px-2.5 py-1 text-xs font-bold ${
                    currentSubIndex === idx ? "!border-[#c69b5b] !bg-[#c69b5b] !text-[#0d1410]" : ""
                  }`}
                >
                  {pack.primaryPageNumber}/{idx + 1}
                </button>
              ))}
              <button
                onClick={handleAddSubPage}
                className="btn-keycap-light cursor-pointer !border-dashed px-2 py-1 text-xs font-bold"
              >
                + Add Subpage
              </button>
            </div>
          )}

          {/* 40x25 Teletext Grid Interactive Editor */}
          <div className="chassis-body p-3 sm:p-5">
            <TeletextEditor page={activePage} onChange={handlePageChange} />
          </div>
        </div>

        {/* Sidebar Diagnostics Column */}
        <div className="space-y-6 lg:col-span-4">
          {/* Real-time Byte Budget Meter */}
          <div className="chassis-body p-4">
            <h2 className="mb-2 text-xs font-bold tracking-wider text-[#4b5249] uppercase">
              Live Byte Budget
            </h2>
            <ByteBudgetMeter pack={pack} />
          </div>

          {/* Real-time Grid Validation Banner */}
          <div className="chassis-body p-4">
            <h2 className="mb-2 text-xs font-bold tracking-wider text-[#4b5249] uppercase">
              Compliance Checklist
            </h2>
            <GridValidationBanner pack={pack} />
          </div>

          {/* Quick Subpage Actions */}
          <div className="chassis-body p-4">
            <h2 className="mb-2 text-xs font-bold tracking-wider text-[#4b5249] uppercase">
              Multi-Page Tools
            </h2>
            <p className="mb-3 text-[11px] text-[#5e645a]">
              Total Sub-pages: <strong>{pack.pages.length}</strong>. Each subpage is transmitted
              sequentially in the Teletext carousel.
            </p>
            <button
              onClick={handleAddSubPage}
              className="btn-keycap-light w-full cursor-pointer py-2 text-xs font-bold tracking-wider uppercase"
            >
              + Append Subpage ({pack.primaryPageNumber}/{pack.pages.length + 1})
            </button>
          </div>
        </div>
      </main>

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
    </div>
  );
}
