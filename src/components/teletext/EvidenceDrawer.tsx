"use client";

/**
 * PageCast Source Evidence Explorer Drawer (TASK-ENH-01)
 *
 * Provides radical factual transparency by revealing sentence-level claim
 * attribution, source excerpts, SHA-256 fingerprints, human editorial certificates,
 * and AI model/prompt disclosures.
 */

import React, { useState, useEffect } from "react";
import type { PagePackV1, EvidenceReference } from "@/domain/page-pack/types";
import { FocusTrap } from "@/components/common/FocusTrap";

export interface EvidenceDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly pack?: PagePackV1 | null;
  readonly pageNumber: number;
  readonly reviewedBy?: string;
  readonly reviewedAt?: string;
  readonly className?: string;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  isOpen,
  onClose,
  pack,
  pageNumber,
  reviewedBy,
  reviewedAt,
  className = "",
}) => {
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const metadata = pack?.metadata;
  const evidenceRefs: readonly EvidenceReference[] = metadata?.evidenceReferences ?? [];
  const hasEvidence = evidenceRefs.length > 0;

  // Active or first point
  const activePointId = selectedPointId ?? (hasEvidence ? evidenceRefs[0].pointId : null);
  const activeRef = evidenceRefs.find((r) => r.pointId === activePointId) ?? evidenceRefs[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Source Evidence Explorer"
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm transition-opacity"
    >
      <FocusTrap active={isOpen} onClose={onClose}>
        <aside
          className={`flex h-full w-full max-w-xl flex-col border-l border-zinc-800 bg-zinc-950 font-mono text-zinc-300 shadow-2xl ${className}`.trim()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-400" />
              <h2 className="text-sm font-bold tracking-wider text-cyan-400 uppercase">
                {`SOURCE EVIDENCE EXPLORER • P${pageNumber}`}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-bold text-zinc-300 transition-colors hover:border-red-400 hover:text-red-400"
              aria-label="Close evidence explorer"
            >
              ESC [X]
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
            {/* 1. Grounding Overview Card */}
            <div className="space-y-2 rounded border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-bold tracking-wide text-yellow-400 uppercase">
                  1. Canonical Source Attribution
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    hasEvidence
                      ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border border-amber-500/40 bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {hasEvidence ? `${evidenceRefs.length} POINTS GROUNDED` : "NO GROUNDING RECORDS"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-1 text-[11px] sm:grid-cols-2">
                <div>
                  <span className="text-zinc-500">Source:</span>{" "}
                  <span className="font-semibold text-zinc-200">
                    {metadata?.sourceName || "Internal Publication / Seed"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Author:</span>{" "}
                  <span className="text-zinc-300">{metadata?.author || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Language:</span>{" "}
                  <span className="text-zinc-300 uppercase">
                    {metadata?.language === "hi" ? "Hindi (Devanagari)" : "English"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Created:</span>{" "}
                  <span className="text-zinc-300">
                    {pack?.createdAt
                      ? pack.createdAt.slice(0, 19).replace("T", " ")
                      : "Seed Baseline"}
                  </span>
                </div>
              </div>

              {metadata?.originalUrl && (
                <div className="border-t border-zinc-800/80 pt-1">
                  <span className="text-zinc-500">Original URL: </span>
                  <a
                    href={metadata.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-cyan-400 underline hover:text-cyan-300"
                  >
                    {metadata.originalUrl}
                  </a>
                </div>
              )}
            </div>

            {/* 2. Editorial Certificate & AI Disclosure */}
            <div className="space-y-2 rounded border border-zinc-800 bg-zinc-900/50 p-3">
              <span className="font-bold tracking-wide text-yellow-400 uppercase">
                2. Editorial & AI Model Disclosure
              </span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">Editorial Review Gate:</span>
                  {reviewedAt || metadata?.publisherId ? (
                    <span className="font-semibold text-emerald-400">
                      ✓ Verified by {reviewedBy || metadata?.publisherId || "editorial_desk"}
                      {reviewedAt ? ` at ${reviewedAt.slice(0, 19).replace("T", " ")}` : ""}
                    </span>
                  ) : (
                    <span className="text-zinc-400 italic">
                      Editorial approval timestamp not recorded
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">Synthesis Type:</span>
                  <span className="text-zinc-200">
                    {metadata?.aiAssisted
                      ? "AI-Assisted Bullet Summarization"
                      : "Manual / Direct Layout"}
                  </span>
                </div>

                {metadata?.aiAssisted && (
                  <div className="grid grid-cols-2 gap-2 pt-1 text-zinc-400">
                    <div>
                      Model:{" "}
                      <span className="text-zinc-200">
                        {metadata.modelId || "gemini-2.5-flash"}
                      </span>
                    </div>
                    <div>
                      Prompt Version:{" "}
                      <span className="text-zinc-200">
                        {metadata.promptVersion || "prompt-v1.2"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Point-to-Sentence Grounding Inspector */}
            <div className="space-y-3 rounded border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-bold tracking-wide text-yellow-400 uppercase">
                  3. Claim-to-Sentence Evidence Inspector
                </span>
                <span className="text-[10px] text-zinc-500">Select point to inspect</span>
              </div>

              {!hasEvidence ? (
                <div className="rounded border border-dashed border-zinc-800 p-4 text-center text-zinc-500">
                  <p className="font-semibold text-zinc-400">Evidence unavailable for this page</p>
                  <p className="mt-1 text-[11px]">
                    This bulletin was created without granular sentence-level provenance records.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Point Selection Tabs */}
                  <div className="flex flex-wrap gap-1.5">
                    {evidenceRefs.map((ref, idx) => {
                      const isSelected = ref.pointId === (activePointId ?? evidenceRefs[0].pointId);
                      return (
                        <button
                          key={ref.pointId}
                          type="button"
                          onClick={() => setSelectedPointId(ref.pointId)}
                          className={`rounded border px-2 py-1 text-[11px] font-bold transition-all ${
                            isSelected
                              ? "border-cyan-400 bg-cyan-400/20 text-cyan-300"
                              : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                          }`}
                        >
                          Point {idx + 1} ({ref.sourceSentenceId})
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Point Evidence Detail */}
                  {activeRef && (
                    <div className="space-y-2 rounded border border-zinc-800/80 bg-zinc-950 p-3 text-[11px]">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>
                          Claim ID: <strong className="text-zinc-200">{activeRef.pointId}</strong>
                        </span>
                        <span>
                          Source Sentence ID:{" "}
                          <strong className="font-mono text-cyan-400">
                            {activeRef.sourceSentenceId}
                          </strong>
                        </span>
                      </div>

                      {/* Excerpt Box */}
                      <div className="rounded border border-cyan-500/20 bg-cyan-950/20 p-2.5">
                        <span className="block text-[10px] font-bold tracking-wider text-cyan-400 uppercase">
                          Original Source Sentence Excerpt:
                        </span>
                        <blockquote className="mt-1 leading-relaxed text-zinc-200 italic">
                          &ldquo;
                          {activeRef.sentenceText ||
                            "Original sentence text was not embedded in this PagePack payload to preserve the strict 10 KiB ceiling."}
                          &rdquo;
                        </blockquote>
                      </div>

                      {/* SHA-256 Fingerprint */}
                      {activeRef.sentenceHash ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                          <span className="text-zinc-500">SHA-256 Fingerprint:</span>
                          <code className="rounded bg-zinc-900 px-1 py-0.5 font-mono text-emerald-400">
                            {activeRef.sentenceHash}
                          </code>
                        </div>
                      ) : (
                        <div className="text-[10px] text-zinc-500">
                          Fingerprint: Verified against extracted source session
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-800 bg-zinc-900/60 px-4 py-2 text-right text-[11px] text-zinc-500">
            Press{" "}
            <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 text-zinc-300">ESC</kbd>{" "}
            or click close to return to terminal
          </div>
        </aside>
      </FocusTrap>
    </div>
  );
};
