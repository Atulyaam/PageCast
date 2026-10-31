"use client";

/**
 * PageCast Publication Confirmation Modal (TASK-S3-09)
 *
 * Implements strict pre-publication review verification, source attribution
 * audit, magazine routing display, and atomic publication gate.
 */

import React, { useState } from "react";
import type { PagePackV1 } from "@/domain/page-pack/types";
import { getMagazineDefinition } from "@/domain/teletext/magazine";
import { GridValidationBanner } from "./GridValidationBanner";
import { ByteBudgetMeter } from "./ByteBudgetMeter";
import { isValidPageNumber } from "@/domain/validation/page-number";
import { FocusTrap } from "@/components/common/FocusTrap";

export interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublished: (result: any) => void;
  draftId?: string;
  pack: PagePackV1;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  onPublished,
  draftId,
  pack,
}) => {
  const [pageNumber, setPageNumber] = useState<number>(pack.primaryPageNumber);
  const [checkedProvenance, setCheckedProvenance] = useState<boolean>(false);
  const [checkedGrid, setCheckedGrid] = useState<boolean>(false);
  const [checkedBudget, setCheckedBudget] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const validNum = isValidPageNumber(pageNumber);
  const magazine = validNum ? getMagazineDefinition(pageNumber) : null;
  const allChecked = checkedProvenance && checkedGrid && checkedBudget;

  const handlePublish = async () => {
    if (!allChecked || !validNum) return;

    setIsPublishing(true);
    setErrorMessage(null);

    try {
      const updatedPack: PagePackV1 = {
        ...pack,
        primaryPageNumber: pageNumber,
        magazine: magazine ? magazine.number : pack.magazine,
        pages: pack.pages.map((p) => ({
          ...p,
          pageNumber,
        })),
      };

      const res = await fetch("/api/v1/pages/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          pack: updatedPack,
          reviewedAt: new Date().toISOString(),
          reviewerId: "publisher-reviewer-01",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error(
            `Page P${pageNumber} is already occupied by an active publication. Choose a different page number or unpublish the active page.`
          );
        }
        throw new Error(data.message || data.error || "Failed to publish page.");
      }

      onPublished(data.page);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred during publication.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-xs"
    >
      <FocusTrap onClose={onClose} className="my-8 w-full max-w-lg">
        <div className="w-full border-2 border-emerald-500 bg-zinc-950 p-6 font-mono text-zinc-100 shadow-[0_0_30px_rgba(0,255,102,0.3)]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 px-1.5 py-0.5 text-xs font-black text-black">GATE</span>
            <h2
              id="publish-modal-title"
              className="text-sm font-bold tracking-wider text-emerald-400 uppercase"
            >
              Publish Teletext Bulletin
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="cursor-pointer border border-zinc-800 px-2 py-1 text-sm text-zinc-400 hover:border-zinc-600 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Target Page Number & Magazine Allocation */}
        <div className="mb-4 border border-zinc-800 bg-zinc-900/60 p-3">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <label className="mb-1 block text-[11px] tracking-wider text-zinc-400 uppercase">
                Target Page Number (100–899)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-emerald-400">P</span>
                <input
                  type="number"
                  min={100}
                  max={899}
                  value={pageNumber}
                  onChange={(e) => setPageNumber(parseInt(e.target.value, 10) || 100)}
                  className="w-24 border border-zinc-700 bg-black px-2 py-1 text-sm font-bold text-emerald-300 focus:border-emerald-400 focus:outline-hidden"
                />
              </div>
            </div>

            {magazine && (
              <div className="text-right">
                <div className="text-[10px] text-zinc-500 uppercase">Allocated Magazine</div>
                <div className="text-xs font-bold text-emerald-400">
                  Mag {magazine.number}: {magazine.name}
                </div>
                <div className="text-[10px] text-zinc-500">
                  Range: P{magazine.pageRange[0]}–P{magazine.pageRange[1]}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Source Attribution Info */}
        <div className="mb-4 border border-zinc-800 bg-black p-3 text-xs">
          <div className="mb-1 text-[10px] tracking-wider text-zinc-500 uppercase">
            Source Provenance
          </div>
          <div className="font-bold text-zinc-200">
            {pack.metadata.sourceName || "Manual Input"}
          </div>
          {pack.metadata.originalUrl && (
            <a
              href={pack.metadata.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 block text-[11px] break-all text-emerald-500 hover:underline"
            >
              {pack.metadata.originalUrl}
            </a>
          )}
          <div className="mt-1 text-[10px] text-zinc-500">
            Sub-pages: {pack.pages.length} • Language: {pack.metadata.language.toUpperCase()}
          </div>
        </div>

        {/* Live Byte Budget Status */}
        <div className="mb-4">
          <ByteBudgetMeter pack={pack} />
        </div>

        {/* Live Grid Validation Checklist */}
        <div className="mb-4">
          <GridValidationBanner pack={pack} />
        </div>

        {/* Human Editorial Audit Gate (Mandatory) */}
        <div className="mb-4 space-y-2 border border-emerald-900/60 bg-emerald-950/20 p-3">
          <div className="mb-1 text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
            Editorial Review & Verification Checklist
          </div>

          <label className="flex cursor-pointer items-start gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={checkedProvenance}
              onChange={(e) => setCheckedProvenance(e.target.checked)}
              className="mt-0.5 accent-emerald-500"
            />
            <span>I have verified factual accuracy against original source provenance.</span>
          </label>

          <label className="flex cursor-pointer items-start gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={checkedGrid}
              onChange={(e) => setCheckedGrid(e.target.checked)}
              className="mt-0.5 accent-emerald-500"
            />
            <span>I have verified 40×25 Teletext CRT screen layout and line breaks.</span>
          </label>

          <label className="flex cursor-pointer items-start gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={checkedBudget}
              onChange={(e) => setCheckedBudget(e.target.checked)}
              className="mt-0.5 accent-emerald-500"
            />
            <span>I confirm payload byte ceiling is compliant under 10,240 bytes.</span>
          </label>
        </div>

        {/* Error Callout */}
        {errorMessage && (
          <div className="mb-4 border border-red-500 bg-red-950/40 p-3 text-xs text-red-300">
            <strong className="mb-0.5 block font-bold">Publication Rejected:</strong>
            {errorMessage}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-3">
          <button
            onClick={onClose}
            disabled={isPublishing}
            className="cursor-pointer border border-zinc-700 px-4 py-2 text-xs font-bold tracking-wider text-zinc-300 uppercase hover:border-zinc-500"
          >
            Cancel
          </button>

          <button
            onClick={handlePublish}
            disabled={!allChecked || !validNum || isPublishing}
            className="cursor-pointer bg-emerald-500 px-5 py-2 text-xs font-black tracking-wider text-black uppercase transition-colors hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500"
          >
            {isPublishing ? "Publishing..." : "Confirm & Publish Live"}
          </button>
        </div>
      </div>
      </FocusTrap>
    </div>
  );
};
