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
    <div className="min-h-screen bg-black font-mono text-zinc-200">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-4 py-3">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/terminal"
              className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-bold text-yellow-400 hover:border-yellow-400 transition-colors"
            >
              ← TERMINAL
            </Link>
            <h1 className="text-sm font-bold tracking-wider text-cyan-400 uppercase">
              PAGECAST DATA EFFICIENCY LAB
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
              EMPIRICAL BENCHMARKS
            </span>
            <Link
              href="/about"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              About
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl p-4 sm:p-6 space-y-6">
        {/* Case Selector Banner */}
        <section aria-labelledby="case-select-title" className="rounded border border-zinc-800 bg-zinc-950 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 id="case-select-title" className="text-xs font-bold uppercase tracking-wider text-yellow-400">
                Select Benchmark Dataset
              </h2>
              <p className="text-xs text-zinc-400">
                Empirical payload comparisons between modern web articles and 40×25 PagePacks
              </p>
            </div>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
              aria-label="Select benchmark case"
            >
              {EFFICIENCY_BENCHMARKS.map((b) => (
                <option key={b.id} value={b.id}>
                  P{b.pageNumber} — {b.title} ({b.language.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-4 text-xs pt-1 border-t border-zinc-900 text-zinc-400">
            <span>
              Publisher: <strong className="text-zinc-200">{activeCase.publisherName}</strong>
            </span>
            <span>
              Category: <strong className="text-zinc-200">{activeCase.category}</strong>
            </span>
            <span>
              Language: <strong className="text-zinc-200 uppercase">{activeCase.language}</strong>
            </span>
            <span className="truncate max-w-xs">
              Source:{" "}
              <a
                href={activeCase.originalSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline hover:text-cyan-300"
              >
                {activeCase.originalSourceUrl}
              </a>
            </span>
          </div>
        </section>

        {/* 3-Way Payload Comparison Cards */}
        <section aria-labelledby="payload-comparison-title" className="space-y-3">
          <h2 id="payload-comparison-title" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Payload Weight Breakdown
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Original Web Article */}
            <div className="rounded border border-red-500/30 bg-zinc-950 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-red-400 uppercase">1. Web Original</span>
                <span className="rounded bg-red-950/60 px-1.5 py-0.5 text-[10px] text-red-300">
                  HTTP Payload
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatBytes(activeCase.originalArticleBytes)}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Includes HTML document, JavaScript application bundles, web fonts, tracking pixels, and ads.
              </p>
            </div>

            {/* 2. Extracted Article Text */}
            <div className="rounded border border-zinc-800 bg-zinc-950 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-400 uppercase">2. Extracted Text</span>
                <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-400">
                  Readability Clean
                </span>
              </div>
              <div className="text-2xl font-bold text-zinc-200">
                {formatBytes(activeCase.extractedTextBytes)}
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Clean article text extracted via Readability parser with all scripts and styles stripped.
              </p>
            </div>

            {/* 3. Published PagePack */}
            <div className="rounded border border-emerald-500/40 bg-zinc-950 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 uppercase">3. PagePack V1</span>
                <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-[10px] text-emerald-300">
                  40×25 Teletext
                </span>
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {formatBytes(activeCase.pagePackBytes)}
              </div>
              {/* Byte Budget Meter */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Ceiling: 10,240 B</span>
                  <span>{((activeCase.pagePackBytes / PAGECAST_MAX_PACK_BYTES) * 100).toFixed(1)}% Used</span>
                </div>
                <div className="h-1.5 w-full rounded bg-zinc-900 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all"
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
        <section aria-labelledby="kpi-title" className="rounded border border-zinc-800 bg-zinc-950 p-4">
          <h2 id="kpi-title" className="sr-only">Efficiency Key Performance Indicators</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-2">
              <span className="text-[11px] text-zinc-500 uppercase block">Data Reduction</span>
              <span className="text-2xl font-bold text-cyan-400">
                {metrics.reductionPercent}%
              </span>
            </div>
            <div className="p-2">
              <span className="text-[11px] text-zinc-500 uppercase block">Scale Factor</span>
              <span className="text-2xl font-bold text-yellow-400">
                {metrics.reductionFactor}× Smaller
              </span>
            </div>
            <div className="p-2">
              <span className="text-[11px] text-zinc-500 uppercase block">5 MB Offline Quota</span>
              <span className="text-2xl font-bold text-emerald-400">
                ~{storage.capacityPages.toLocaleString()} Pages
              </span>
            </div>
            <div className="p-2">
              <span className="text-[11px] text-zinc-500 uppercase block">Budget Margin</span>
              <span className="text-2xl font-bold text-zinc-200">
                {metrics.budgetRemainingBytes.toLocaleString()} B Free
              </span>
            </div>
          </div>
        </section>

        {/* Network Transfer Simulation Table */}
        <section aria-labelledby="network-simulation-title" className="rounded border border-zinc-800 bg-zinc-950 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h2 id="network-simulation-title" className="text-xs font-bold uppercase tracking-wider text-yellow-400">
              Estimated Transfer Time Across Network Profiles
            </h2>
            <span className="text-[10px] text-zinc-500 italic">
              Simulated theoretical estimates (Formula: Bytes / Bandwidth + RTT Latency)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-zinc-800">
              <thead className="bg-zinc-900/80 text-[10px] text-zinc-400 uppercase tracking-wider">
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
                    <td className="px-3 py-2 text-red-400 font-mono">
                      {formatMs(lat.originalTransferMs)}
                    </td>
                    <td className="px-3 py-2 text-emerald-400 font-mono font-bold">
                      {formatMs(lat.pagePackTransferMs)}
                    </td>
                    <td className="px-3 py-2 text-cyan-400 font-bold">
                      {lat.speedupFactor}× Faster
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Scientific Methodology & Caveats */}
        <section aria-labelledby="methodology-title" className="rounded border border-zinc-800 bg-zinc-900/40 p-4 space-y-2 text-xs text-zinc-400 leading-relaxed">
          <h2 id="methodology-title" className="font-bold text-zinc-200 uppercase tracking-wide">
            Measurement Methodology & Technical Integrity
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-[11px]">
            <li>
              <strong className="text-zinc-300">Exact Measured Bytes:</strong> PagePack byte weight is measured via UTF-8 serialization with{" "}
              <code className="text-cyan-400 bg-zinc-900 px-1 py-0.5 rounded">TextEncoder().encode().byteLength</code>, adhering strictly to the 10,240-byte ceiling.
            </li>
            <li>
              <strong className="text-zinc-300">Not Lossless Compression:</strong> PageCast does not claim lossless compression. It performs semantic summarization and structured Teletext formatting, producing an information-dense micro-bulletin.
            </li>
            <li>
              <strong className="text-zinc-300">Simulated Network Profiles:</strong> Transfer latencies are calculated from standard cellular/satellite channel models and serve as educational comparative estimates, not live packet capture logs.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
