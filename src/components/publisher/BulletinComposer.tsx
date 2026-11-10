"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Printer, Tv, ArrowRight } from "lucide-react";
import type { ExtractedSource, BulletinDraft } from "@/domain/source-provenance/types";
import type { PagePackV1 } from "@/domain/page-pack/types";
import { TeletextGrid } from "@/components/teletext/TeletextGrid";
import { PAGECAST_MAX_PACK_BYTES } from "@/domain/byte-budget/measure";
import { PosterModal } from "@/components/publisher/PosterModal";

export interface BulletinComposerProps {
  readonly initialSource?: ExtractedSource | null;
  readonly onPagePackReady?: (pack: PagePackV1) => void;
  readonly className?: string;
}

export const BulletinComposer: React.FC<BulletinComposerProps> = ({
  initialSource = null,
  onPagePackReady,
  className = "",
}) => {
  const source = initialSource;
  const [mode, setMode] = useState<"ai" | "fallback">("ai");
  const [targetPageNumber, setTargetPageNumber] = useState<number>(201);
  const [language, setLanguage] = useState<"en" | "hi">(initialSource?.language ?? "en");
  const [isComposing, setIsComposing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [draft, setDraft] = useState<BulletinDraft | null>(null);
  const [packResult, setPackResult] = useState<{
    pack: PagePackV1;
    payloadBytes: number;
    withinBudget: boolean;
  } | null>(null);
  const [isPosterOpen, setIsPosterOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompose = async () => {
    if (!source) return;

    setIsComposing(true);
    setError(null);
    setPackResult(null);

    try {
      const res = await fetch("/api/v1/bulletins/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          language,
          targetPageNumber,
          forceExtractiveFallback: mode === "fallback",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Composition failed");
      }

      setDraft(data.draft);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsComposing(false);
    }
  };

  const handleConvert = async () => {
    if (!draft) return;

    setIsConverting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/bulletins/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft,
          source: source ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Conversion failed");
      }

      setPackResult({
        pack: data.pack,
        payloadBytes: data.payloadBytes,
        withinBudget: data.withinBudget,
      });

      if (onPagePackReady) {
        onPagePackReady(data.pack);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsConverting(false);
    }
  };

  if (!source) {
    return (
      <div
        className={`bg-surface-panel border-surface-border text-text-muted rounded-terminal border p-8 text-center shadow-xl ${className}`.trim()}
      >
        <p className="text-sm">
          Please import or paste a source article above to begin bulletin composition.
        </p>
      </div>
    );
  }

  const bytePercent = packResult
    ? Math.min(100, Math.round((packResult.payloadBytes / PAGECAST_MAX_PACK_BYTES) * 100))
    : 0;

  return (
    <div
      className={`bg-surface-panel border-surface-border rounded-terminal border p-4 shadow-xl sm:p-6 ${className}`.trim()}
    >
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-gray-800 pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-teletext-green text-lg font-bold tracking-wide sm:text-xl">
            BULLETIN COMPOSER & TELETEXT STUDIO
          </h2>
          <p className="text-text-muted text-xs sm:text-sm">
            Target Page P{targetPageNumber} • Source: {source.title.slice(0, 45)}...
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Page Number Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <label className="text-text-muted font-medium">Page:</label>
            <input
              type="number"
              min={100}
              max={899}
              value={targetPageNumber}
              onChange={(e) => setTargetPageNumber(Number.parseInt(e.target.value, 10) || 101)}
              className="bg-surface-terminal border-surface-border text-teletext-yellow w-16 rounded border px-2 py-1 text-center font-mono text-sm focus:outline-none"
            />
          </div>

          {/* Engine Selector */}
          <div className="bg-surface-terminal border-surface-border flex rounded border p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMode("ai")}
              className={`rounded px-2.5 py-1 ${
                mode === "ai"
                  ? "bg-teletext-green text-teletext-black font-bold"
                  : "text-text-muted hover:text-white"
              }`}
            >
              AI (Gemini)
            </button>
            <button
              type="button"
              onClick={() => setMode("fallback")}
              className={`rounded px-2.5 py-1 ${
                mode === "fallback"
                  ? "bg-teletext-green text-teletext-black font-bold"
                  : "text-text-muted hover:text-white"
              }`}
            >
              Deterministic
            </button>
          </div>

          <button
            type="button"
            onClick={handleCompose}
            disabled={isComposing}
            className="bg-teletext-yellow hover:bg-teletext-yellow/80 text-teletext-black cursor-pointer rounded-md px-3.5 py-1.5 text-xs font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isComposing ? "Composing..." : "1. Compose Draft"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-teletext-red/10 border-teletext-red/50 text-teletext-red mb-6 rounded border p-3 text-xs">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      {/* Draft Review Card */}
      {draft && (
        <div className="bg-surface-terminal border-surface-border mb-6 rounded-md border p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
            <div>
              <span className="text-teletext-yellow text-xs font-bold tracking-wider uppercase">
                Draft Review ({draft.metadata.provider})
              </span>
              <h3 className="text-teletext-white mt-1 text-base font-bold">{draft.title}</h3>
            </div>

            <button
              type="button"
              onClick={handleConvert}
              disabled={isConverting}
              className="bg-teletext-cyan hover:bg-teletext-cyan/80 text-teletext-black cursor-pointer rounded-md px-4 py-1.5 text-xs font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isConverting ? "Converting..." : "2. Convert to Teletext Grid"}
            </button>
          </div>

          {/* Warnings if any */}
          {draft.warnings && draft.warnings.length > 0 && (
            <div className="bg-teletext-yellow/10 border-teletext-yellow/30 text-teletext-yellow mb-4 rounded border p-2 text-xs">
              {draft.warnings.join("; ")}
            </div>
          )}

          <div className="space-y-3 text-xs text-gray-300">
            <div>
              <span className="text-text-muted block font-semibold uppercase">Summary:</span>
              <p className="mt-0.5 leading-relaxed">{draft.summary}</p>
            </div>

            {draft.sections.map((section, sIdx) => (
              <div key={`sec-${sIdx}`} className="pt-2">
                {section.heading && (
                  <span className="text-teletext-cyan font-bold tracking-wider uppercase">
                    {section.heading}
                  </span>
                )}
                <ul className="mt-1 list-disc space-y-1.5 pl-4">
                  {section.points.map((pt, pIdx) => (
                    <li key={`pt-${sIdx}-${pIdx}`} className="leading-relaxed">
                      {pt.text}
                      {pt.sourceSentenceIds.length > 0 && (
                        <span className="text-text-muted ml-2 font-mono text-[10px]">
                          [{pt.sourceSentenceIds.join(", ")}]
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Teletext Preview & Byte Budget Gauge */}
      {packResult && (
        <div className="mt-8 border-t border-gray-800 pt-6">
          <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="text-teletext-cyan text-xs font-bold tracking-wider uppercase">
                ✓ Live Teletext Canvas (40×25 CRT)
              </span>
              <p className="text-text-muted text-xs">
                Page P{packResult.pack.pages[0].pageNumber} • Created:{" "}
                {packResult.pack.createdAt.slice(0, 10)}
              </p>
            </div>

            {/* Exact Byte Budget Meter */}
            <div className="bg-surface-terminal border-surface-border flex flex-col rounded border p-2.5 sm:w-64">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-text-muted">Payload:</span>
                <span
                  className={
                    packResult.withinBudget
                      ? "text-teletext-green font-bold"
                      : "text-teletext-red font-bold"
                  }
                >
                  {packResult.payloadBytes.toLocaleString()} /{" "}
                  {PAGECAST_MAX_PACK_BYTES.toLocaleString()} B
                </span>
              </div>

              {/* Progress bar */}
              <div className="bg-surface-border mt-1.5 h-2 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full transition-all duration-300 ${
                    packResult.withinBudget ? "bg-teletext-green" : "bg-teletext-red"
                  }`}
                  style={{ width: `${bytePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* CRT Screen */}
          <div className="mx-auto max-w-2xl">
            <TeletextGrid
              page={packResult.pack.pages[0]}
              showScanlines={true}
              phosphorGlow={true}
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsPosterOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-bold text-black shadow-lg transition-transform hover:scale-105 hover:bg-emerald-400"
            >
              <Printer className="h-4 w-4" />
              <span>Print Community Poster (A4)</span>
            </button>
            <Link
              href={`/pages/${packResult.pack.pages[0].pageNumber}`}
              className="bg-teletext-yellow hover:bg-teletext-yellow/80 text-teletext-black inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-sm font-bold shadow-lg transition-transform hover:scale-105"
            >
              <Tv className="h-4 w-4" />
              <span>Open in Full-Screen Web Terminal</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Poster Modal */}
      {isPosterOpen && packResult && (
        <PosterModal
          isOpen={true}
          onClose={() => setIsPosterOpen(false)}
          pageNumber={packResult.pack.pages[0].pageNumber}
          title={packResult.pack.title}
          categoryName="COMMUNITY BROADCAST"
          pack={packResult.pack}
        />
      )}
    </div>
  );
};
