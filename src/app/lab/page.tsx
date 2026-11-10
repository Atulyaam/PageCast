"use client";

/**
 * PageCast Data Efficiency Lab (TASK-ENH-02 / ENH-02)
 *
 * Interactive empirical laboratory demonstrating comparative payload reduction,
 * network transfer latency across standard connection profiles, and storage density.
 */

import React, { useState } from "react";
import Link from "next/link";
import { EFFICIENCY_BENCHMARKS, type BenchmarkCase } from "@/data/efficiency-benchmarks";
import {
  calculateEfficiencyMetrics,
  estimateComparativeNetworkLatencies,
  calculateStorageCapacity,
} from "@/domain/efficiency-lab/calculator";
import { PAGECAST_MAX_PACK_BYTES } from "@/domain/byte-budget/measure";

export default function DataEfficiencyLabPage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(EFFICIENCY_BENCHMARKS[0].id);

  const activeCase: BenchmarkCase =
    EFFICIENCY_BENCHMARKS.find((b) => b.id === selectedCaseId) ?? EFFICIENCY_BENCHMARKS[0];

  const metrics = calculateEfficiencyMetrics(
    activeCase.originalArticleBytes,
    activeCase.extractedTextBytes,
    activeCase.pagePackBytes,
    PAGECAST_MAX_PACK_BYTES
  );

  const latencies = estimateComparativeNetworkLatencies(
    activeCase.originalArticleBytes,
    activeCase.pagePackBytes
  );

  const storage = calculateStorageCapacity(activeCase.pagePackBytes, 5);

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${bytes.toLocaleString()} B`;
  };

  const formatMs = (ms: number) => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${ms}ms`;
  };

  return (
    <div className="flex min-h-screen flex-col font-mono">
      {/* Precision Instrument Rail Header */}
      <header className="sticky top-0 z-30 border-b border-[#1b201c] bg-[#222723] px-3 py-2 text-[#b7c9a8] shadow-md sm:px-5 sm:py-2.5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/terminal"
              className="btn-keycap-light px-2.5 py-1 text-xs font-bold transition-all"
            >
              ← TERMINAL
            </Link>
            <h1 className="text-sm font-bold tracking-wider text-[#f6dfa9] uppercase sm:text-base">
              PAGECAST DATA EFFICIENCY LAB
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-xs border border-[#236b40] bg-[#143320] px-2 py-0.5 text-[10px] font-bold text-[#22c55e]">
              EMPIRICAL BENCHMARKS
            </span>
            <Link
              href="/about"
              className="text-xs text-[#879b83] transition-colors hover:text-[#b7c9a8]"
            >
              About
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        {/* Case Selector Banner */}
        <section aria-labelledby="case-select-title" className="chassis-body space-y-3 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2
                id="case-select-title"
                className="text-xs font-bold tracking-wider text-[#2f342d] uppercase"
              >
                Select Benchmark Dataset
              </h2>
              <p className="text-xs text-[#5e645a]">
                Empirical payload comparisons between modern web articles and 40×25 PagePacks
              </p>
            </div>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="led-window px-3 py-1.5 font-mono text-xs font-bold text-[#b7c9a8] focus:border-[#c69b5b] focus:outline-hidden"
              aria-label="Select benchmark case"
            >
              {EFFICIENCY_BENCHMARKS.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#0d1410] text-[#b7c9a8]">
                  P{b.pageNumber} — {b.title} ({b.language.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-4 border-t border-[#777970] pt-2 text-xs text-[#5e645a]">
            <span>
              Publisher: <strong className="text-[#2f342d]">{activeCase.publisherName}</strong>
            </span>
            <span>
              Category: <strong className="text-[#2f342d]">{activeCase.category}</strong>
            </span>
            <span>
              Language: <strong className="text-[#2f342d] uppercase">{activeCase.language}</strong>
            </span>
            <span className="max-w-xs truncate">
              Source:{" "}
              <a
                href={activeCase.originalSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1b676e] underline hover:text-[#258189]"
              >
                {activeCase.originalSourceUrl}
              </a>
            </span>
          </div>
        </section>

        {/* 3-Way Payload Comparison Cards */}
        <section aria-labelledby="payload-comparison-title" className="space-y-3">
          <h2
            id="payload-comparison-title"
            className="text-xs font-bold tracking-wider text-[#4b5249] uppercase"
          >
            Payload Weight Breakdown
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* 1. Original Web Article */}
            <div className="chassis-body space-y-2 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#9e2b20] uppercase">1. Web Original</span>
                <span className="rounded-xs bg-[#801d14] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  HTTP Payload
                </span>
              </div>
              <div className="text-2xl font-bold text-[#2f342d]">
                {formatBytes(activeCase.originalArticleBytes)}
              </div>
              <p className="text-[11px] leading-relaxed text-[#5e645a]">
                Includes HTML document, JavaScript application bundles, web fonts, tracking pixels,
                and ads.
              </p>
            </div>

            {/* 2. Extracted Article Text */}
            <div className="chassis-body space-y-2 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#4b5249] uppercase">2. Extracted Text</span>
                <span className="rounded-xs bg-[#777970] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Readability Clean
                </span>
              </div>
              <div className="text-2xl font-bold text-[#2f342d]">
                {formatBytes(activeCase.extractedTextBytes)}
              </div>
              <p className="text-[11px] leading-relaxed text-[#5e645a]">
                Clean article text extracted via Readability parser with all scripts and styles
                stripped.
              </p>
            </div>

            {/* 3. Published PagePack */}
            <div className="chassis-body space-y-2 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#226f43] uppercase">3. PagePack V1</span>
                <span className="rounded-xs bg-[#185633] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  40×25 Teletext
                </span>
              </div>
              <div className="text-2xl font-bold text-[#226f43]">
                {formatBytes(activeCase.pagePackBytes)}
              </div>
              {/* Byte Budget Meter */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] text-[#5e645a]">
                  <span>Ceiling: 10,240 B</span>
                  <span>
                    {((activeCase.pagePackBytes / PAGECAST_MAX_PACK_BYTES) * 100).toFixed(1)}% Used
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-xs bg-[#777970]">
                  <div
                    className="h-full bg-[#226f43] transition-all"
                    style={{
                      width: `${Math.min(100, (activeCase.pagePackBytes / PAGECAST_MAX_PACK_BYTES) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Efficiency KPI Summary Banner */}
        <section aria-labelledby="kpi-title" className="chassis-body p-4 sm:p-5">
          <h2 id="kpi-title" className="sr-only">
            Efficiency Key Performance Indicators
          </h2>
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
            <div className="p-2">
              <span className="block text-[11px] font-bold text-[#5e645a] uppercase">
                Data Reduction
              </span>
              <span className="text-2xl font-bold text-[#1b676e]">{metrics.reductionPercent}%</span>
            </div>
            <div className="p-2">
              <span className="block text-[11px] font-bold text-[#5e645a] uppercase">
                Scale Factor
              </span>
              <span className="text-2xl font-bold text-[#c69b5b]">
                {metrics.reductionFactor}× Smaller
              </span>
            </div>
            <div className="p-2">
              <span className="block text-[11px] font-bold text-[#5e645a] uppercase">
                5 MB Offline Quota
              </span>
              <span className="text-2xl font-bold text-[#226f43]">
                ~{storage.capacityPages.toLocaleString()} Pages
              </span>
            </div>
            <div className="p-2">
              <span className="block text-[11px] font-bold text-[#5e645a] uppercase">
                Budget Margin
              </span>
              <span className="text-2xl font-bold text-[#2f342d]">
                {metrics.budgetRemainingBytes.toLocaleString()} B Free
              </span>
            </div>
          </div>
        </section>

        {/* Network Transfer Simulation Table */}
        <section aria-labelledby="network-simulation-title" className="chassis-body space-y-3 p-4">
          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
            <h2
              id="network-simulation-title"
              className="text-xs font-bold tracking-wider text-[#2f342d] uppercase"
            >
              Estimated Transfer Time Across Network Profiles
            </h2>
            <span className="text-[10px] text-zinc-500 italic">
              Simulated theoretical estimates (Formula: Bytes / Bandwidth + RTT Latency)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-zinc-800 text-left text-xs">
              <thead className="bg-zinc-900/80 text-[10px] tracking-wider text-zinc-400 uppercase">
                <tr>
                  <th className="px-3 py-2">Profile</th>
                  <th className="px-3 py-2">Bandwidth / RTT</th>
                  <th className="px-3 py-2">Web Original</th>
                  <th className="px-3 py-2 text-emerald-400">PagePack</th>
                  <th className="px-3 py-2 text-cyan-400">Speedup</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-[11px]">
                {latencies.map((lat) => (
                  <tr key={lat.profileId} className="hover:bg-zinc-900/40">
                    <td className="px-3 py-2 font-bold text-zinc-200">{lat.profileName}</td>
                    <td className="px-3 py-2 text-zinc-500">
                      {lat.profileId === "2g" && "150 kbps • 400ms RTT"}
                      {lat.profileId === "3g" && "1.5 Mbps • 150ms RTT"}
                      {lat.profileId === "4g" && "15 Mbps • 50ms RTT"}
                      {lat.profileId === "sat" && "2 Mbps • 600ms RTT"}
                    </td>
                    <td className="px-3 py-2 font-mono text-red-400">
                      {formatMs(lat.originalTransferMs)}
                    </td>
                    <td className="px-3 py-2 font-mono font-bold text-emerald-400">
                      {formatMs(lat.pagePackTransferMs)}
                    </td>
                    <td className="px-3 py-2 font-bold text-cyan-400">
                      {lat.speedupFactor}× Faster
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Scientific Methodology & Caveats */}
        <section
          aria-labelledby="methodology-title"
          className="space-y-2 rounded border border-zinc-800 bg-zinc-900/40 p-4 text-xs leading-relaxed text-zinc-400"
        >
          <h2 id="methodology-title" className="font-bold tracking-wide text-zinc-200 uppercase">
            Measurement Methodology & Technical Integrity
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-[11px]">
            <li>
              <strong className="text-zinc-300">Exact Measured Bytes:</strong> PagePack byte weight
              is measured via UTF-8 serialization with{" "}
              <code className="rounded bg-zinc-900 px-1 py-0.5 text-cyan-400">
                TextEncoder().encode().byteLength
              </code>
              , adhering strictly to the 10,240-byte ceiling.
            </li>
            <li>
              <strong className="text-zinc-300">Not Lossless Compression:</strong> PageCast does not
              claim lossless compression. It performs semantic summarization and structured Teletext
              formatting, producing an information-dense micro-bulletin.
            </li>
            <li>
              <strong className="text-zinc-300">Simulated Network Profiles:</strong> Transfer
              latencies are calculated from standard cellular/satellite channel models and serve as
              educational comparative estimates, not live packet capture logs.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
