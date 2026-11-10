"use client";

/**
 * PageCast Data Efficiency Lab (TASK-ENH-02 / ENH-02)
 *
 * Interactive empirical laboratory demonstrating comparative payload reduction,
 * network transfer latency across standard connection profiles, and storage density.
 * Now rendered inside the unified PT-4025 device shell.
 */

import React, { useState } from "react";
import Link from "next/link";
import { PageCastDeviceShell } from "@/components/device/PageCastDeviceShell";
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
    <PageCastDeviceShell mode="lab">
      <div className="space-y-4 font-mono text-[#b8d1a2]">
        {/* Lab Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#253328] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="rounded-xs border border-[#236b40] bg-[#143320] px-2 py-0.5 text-[10px] font-bold text-[#22c55e]">
              EMPIRICAL BENCHMARKS
            </span>
            <h1 className="text-sm font-bold tracking-wider text-[#f6dfa9] uppercase sm:text-base">
              PAGECAST DATA EFFICIENCY LAB
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/terminal"
              className="rounded-xs border border-[#253328] bg-[#0d140f] px-2.5 py-1 text-xs font-bold text-[#b8d1a2] transition-colors hover:border-[#54b77a] hover:text-[#54b77a]"
            >
              ← TERMINAL
            </Link>
            <Link
              href="/about"
              className="text-xs text-[#879b83] transition-colors hover:text-[#b8d1a2]"
            >
              About
            </Link>
          </div>
        </div>

        {/* Case Selector Banner */}
        <section
          aria-labelledby="case-select-title"
          className="space-y-3 rounded border border-[#253328] bg-[#0d140f] p-3 sm:p-4"
        >
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2
                id="case-select-title"
                className="text-xs font-bold tracking-wider text-[#f6dfa9] uppercase"
              >
                Select Benchmark Dataset
              </h2>
              <p className="text-xs text-[#879b83]">
                Empirical payload comparisons between modern web articles and 40×25 PagePacks
              </p>
            </div>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="rounded-xs border border-[#253328] bg-[#080d0a] px-3 py-1.5 font-mono text-xs font-bold text-[#b8d1a2] focus:border-[#54b77a] focus:outline-hidden"
              aria-label="Select benchmark case"
            >
              {EFFICIENCY_BENCHMARKS.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#080d0a] text-[#b8d1a2]">
                  P{b.pageNumber} — {b.title} ({b.language.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-4 border-t border-[#253328] pt-2 text-xs text-[#879b83]">
            <span>
              Publisher: <strong className="text-[#b8d1a2]">{activeCase.publisherName}</strong>
            </span>
            <span>
              Category: <strong className="text-[#b8d1a2]">{activeCase.category}</strong>
            </span>
            <span>
              Language: <strong className="text-[#b8d1a2] uppercase">{activeCase.language}</strong>
            </span>
            <span className="max-w-xs truncate">
              Source:{" "}
              <a
                href={activeCase.originalSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#54b77a] underline hover:text-[#b8d1a2]"
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
            className="text-xs font-bold tracking-wider text-[#f6dfa9] uppercase"
          >
            Payload Weight Breakdown
          </h2>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* 1. Original Web Article */}
            <div className="space-y-2 rounded border border-[#40201c] bg-[#140b0a] p-3 sm:p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#f87171] uppercase">1. Web Original</span>
                <span className="rounded-xs bg-[#7f1d1d] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  HTTP Payload
                </span>
              </div>
              <div className="text-2xl font-bold text-[#fca5a5]">
                {formatBytes(activeCase.originalArticleBytes)}
              </div>
              <p className="text-[11px] leading-relaxed text-[#9ca3af]">
                Includes HTML document, JavaScript application bundles, web fonts, tracking pixels,
                and ads.
              </p>
            </div>

            {/* 2. Extracted Article Text */}
            <div className="space-y-2 rounded border border-[#253328] bg-[#0d140f] p-3 sm:p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#f6dfa9] uppercase">2. Extracted Text</span>
                <span className="rounded-xs bg-[#253328] px-1.5 py-0.5 text-[10px] font-bold text-[#f6dfa9]">
                  Readability Clean
                </span>
              </div>
              <div className="text-2xl font-bold text-[#e5e7eb]">
                {formatBytes(activeCase.extractedTextBytes)}
              </div>
              <p className="text-[11px] leading-relaxed text-[#879b83]">
                Clean article text extracted via Readability parser with all scripts and styles
                stripped.
              </p>
            </div>

            {/* 3. Published PagePack */}
            <div className="space-y-2 rounded border border-[#1b3d27] bg-[#091a10] p-3 sm:p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#54b77a] uppercase">3. PagePack V1</span>
                <span className="rounded-xs bg-[#185633] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  40×25 Teletext
                </span>
              </div>
              <div className="text-2xl font-bold text-[#22c55e]">
                {formatBytes(activeCase.pagePackBytes)}
              </div>
              {/* Byte Budget Meter */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] text-[#879b83]">
                  <span>Ceiling: 10,240 B</span>
                  <span>
                    {((activeCase.pagePackBytes / PAGECAST_MAX_PACK_BYTES) * 100).toFixed(1)}% Used
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-xs bg-[#253328]">
                  <div
                    className="h-full bg-[#22c55e] transition-all"
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
        <section
          aria-labelledby="kpi-title"
          className="rounded border border-[#253328] bg-[#0d140f] p-3 sm:p-4"
        >
          <h2 id="kpi-title" className="sr-only">
            Efficiency Key Performance Indicators
          </h2>
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <div className="p-2">
              <span className="block text-[11px] font-bold text-[#879b83] uppercase">
                Data Reduction
              </span>
              <span className="text-2xl font-bold text-[#38bdf8]">{metrics.reductionPercent}%</span>
            </div>
            <div className="p-2">
              <span className="block text-[11px] font-bold text-[#879b83] uppercase">
                Scale Factor
              </span>
              <span className="text-2xl font-bold text-[#f6dfa9]">
                {metrics.reductionFactor}× Smaller
              </span>
            </div>
            <div className="p-2">
              <span className="block text-[11px] font-bold text-[#879b83] uppercase">
                5 MB Offline Quota
              </span>
              <span className="text-2xl font-bold text-[#54b77a]">
                ~{storage.capacityPages.toLocaleString()} Pages
              </span>
            </div>
            <div className="p-2">
              <span className="block text-[11px] font-bold text-[#879b83] uppercase">
                Budget Margin
              </span>
              <span className="text-2xl font-bold text-[#e5e7eb]">
                {metrics.budgetRemainingBytes.toLocaleString()} B Free
              </span>
            </div>
          </div>
        </section>

        {/* Network Transfer Simulation Table */}
        <section
          aria-labelledby="network-simulation-title"
          className="space-y-3 rounded border border-[#253328] bg-[#0d140f] p-3 sm:p-4"
        >
          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
            <h2
              id="network-simulation-title"
              className="text-xs font-bold tracking-wider text-[#f6dfa9] uppercase"
            >
              Estimated Transfer Time Across Network Profiles
            </h2>
            <span className="text-[10px] text-[#879b83] italic">
              Simulated theoretical estimates (Formula: Bytes / Bandwidth + RTT Latency)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-[#253328] text-left text-xs">
              <thead className="bg-[#080d0a] text-[10px] tracking-wider text-[#879b83] uppercase">
                <tr>
                  <th className="px-3 py-2">Profile</th>
                  <th className="px-3 py-2">Bandwidth / RTT</th>
                  <th className="px-3 py-2 text-[#f87171]">Web Original</th>
                  <th className="px-3 py-2 text-[#54b77a]">PagePack</th>
                  <th className="px-3 py-2 text-[#38bdf8]">Speedup</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#17221b] text-[11px]">
                {latencies.map((lat) => (
                  <tr key={lat.profileId} className="hover:bg-[#121c15]">
                    <td className="px-3 py-2 font-bold text-[#e5e7eb]">{lat.profileName}</td>
                    <td className="px-3 py-2 text-[#879b83]">
                      {lat.profileId === "2g" && "150 kbps • 400ms RTT"}
                      {lat.profileId === "3g" && "1.5 Mbps • 150ms RTT"}
                      {lat.profileId === "4g" && "15 Mbps • 50ms RTT"}
                      {lat.profileId === "sat" && "2 Mbps • 600ms RTT"}
                    </td>
                    <td className="px-3 py-2 font-mono text-[#f87171]">
                      {formatMs(lat.originalTransferMs)}
                    </td>
                    <td className="px-3 py-2 font-mono font-bold text-[#22c55e]">
                      {formatMs(lat.pagePackTransferMs)}
                    </td>
                    <td className="px-3 py-2 font-bold text-[#38bdf8]">
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
          className="space-y-2 rounded border border-[#253328] bg-[#0d140f] p-3 text-xs leading-relaxed text-[#879b83] sm:p-4"
        >
          <h2 id="methodology-title" className="font-bold tracking-wide text-[#f6dfa9] uppercase">
            Measurement Methodology & Technical Integrity
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-[11px]">
            <li>
              <strong className="text-[#b8d1a2]">Exact Measured Bytes:</strong> PagePack byte weight
              is measured via UTF-8 serialization with{" "}
              <code className="rounded bg-[#080d0a] px-1 py-0.5 text-[#38bdf8]">
                TextEncoder().encode().byteLength
              </code>
              , adhering strictly to the 10,240-byte ceiling.
            </li>
            <li>
              <strong className="text-[#b8d1a2]">Not Lossless Compression:</strong> PageCast does
              not claim lossless compression. It performs semantic summarization and structured
              Teletext formatting, producing an information-dense micro-bulletin.
            </li>
            <li>
              <strong className="text-[#b8d1a2]">Simulated Network Profiles:</strong> Transfer
              latencies are calculated from standard cellular/satellite channel models and serve as
              educational comparative estimates, not live packet capture logs.
            </li>
          </ul>
        </section>
      </div>
    </PageCastDeviceShell>
  );
}
