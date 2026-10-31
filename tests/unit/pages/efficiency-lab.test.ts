import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  calculateEfficiencyMetrics,
  calculateTransferTimeMs,
  estimateComparativeNetworkLatencies,
  calculateStorageCapacity,
  NETWORK_PROFILES,
} from "@/domain/efficiency-lab/calculator";
import { EFFICIENCY_BENCHMARKS } from "@/data/efficiency-benchmarks";
import DataEfficiencyLabPage from "@/app/lab/page";

describe("Data Efficiency Lab (TASK-ENH-02 / ENH-02)", () => {
  describe("Mathematical Domain Calculator", () => {
    it("calculates accurate payload reduction metrics for standard benchmarks", () => {
      const orig = 2480000; // 2.48 MB
      const clean = 16420; // 16.4 KB
      const pack = 3120; // 3.12 KB

      const metrics = calculateEfficiencyMetrics(orig, clean, pack, 10240);

      expect(metrics.reductionPercent).toBeGreaterThan(99.8);
      expect(metrics.reductionFactor).toBeGreaterThan(700);
      expect(metrics.withinBudget).toBe(true);
      expect(metrics.budgetRemainingBytes).toBe(10240 - 3120);
    });

    it("handles zero and negative boundary inputs safely", () => {
      const metricsZero = calculateEfficiencyMetrics(0, 0, 0);
      expect(metricsZero.reductionPercent).toBe(0);
      expect(metricsZero.reductionFactor).toBe(1);
      expect(metricsZero.withinBudget).toBe(true);

      const metricsNeg = calculateEfficiencyMetrics(-100, -50, -20);
      expect(metricsNeg.originalBytes).toBe(0);
      expect(metricsNeg.reductionPercent).toBe(0);
    });

    it("computes theoretical network transfer times across connection profiles", () => {
      const profile2G = NETWORK_PROFILES.find((p) => p.id === "2g")!;
      const profile4G = NETWORK_PROFILES.find((p) => p.id === "4g")!;

      // 150 kbps = 18,750 bytes/sec
      // 18,750 bytes on 2G = 1,000ms transfer + 400ms RTT = 1,400ms
      const ms2G = calculateTransferTimeMs(18750, profile2G);
      expect(ms2G).toBe(1400);

      // 0 bytes payload returns 0 ms
      expect(calculateTransferTimeMs(0, profile4G)).toBe(0);
    });

    it("produces comparative network latency estimates showing speedup factors", () => {
      const orig = 2000000; // 2 MB
      const pack = 3000; // 3 KB

      const latencies = estimateComparativeNetworkLatencies(orig, pack);
      expect(latencies.length).toBe(4);

      const edge2G = latencies.find((l) => l.profileId === "2g")!;
      expect(edge2G.speedupFactor).toBeGreaterThan(100);
      expect(edge2G.originalTransferMs).toBeGreaterThan(edge2G.pagePackTransferMs);
    });

    it("estimates local IndexedDB storage capacity accurately", () => {
      const avgPackBytes = 3200; // 3.2 KB
      const storage = calculateStorageCapacity(avgPackBytes, 5); // 5 MB

      expect(storage.quotaBytes).toBe(5 * 1024 * 1024);
      // (5 * 1024 * 1024) / 3200 = 1638 pages
      expect(storage.capacityPages).toBe(1638);
    });
  });

  describe("Benchmark Dataset Invariants", () => {
    it("contains at least 5 curated benchmark cases across English and Hindi", () => {
      expect(EFFICIENCY_BENCHMARKS.length).toBeGreaterThanOrEqual(5);

      const hasHindi = EFFICIENCY_BENCHMARKS.some((b) => b.language === "hi");
      const hasEnglish = EFFICIENCY_BENCHMARKS.some((b) => b.language === "en");

      expect(hasHindi).toBe(true);
      expect(hasEnglish).toBe(true);
    });

    it("verifies that all benchmark PagePacks comply strictly with the 10 KiB ceiling", () => {
      for (const bench of EFFICIENCY_BENCHMARKS) {
        expect(bench.pagePackBytes).toBeLessThanOrEqual(10240);
        expect(bench.pagePackBytes).toBeGreaterThan(0);
        expect(bench.originalArticleBytes).toBeGreaterThan(bench.pagePackBytes);
      }
    });
  });

  describe("Lab Dashboard UI Server Rendering", () => {
    it("renders the Data Efficiency Lab page with accessible landmarks and benchmark data", () => {
      const html = renderToString(React.createElement(DataEfficiencyLabPage));

      expect(html).toContain("PAGECAST DATA EFFICIENCY LAB");
      expect(html).toContain("Payload Weight Breakdown");
      expect(html).toContain("Estimated Transfer Time Across Network Profiles");
      expect(html).toContain("Measurement Methodology &amp; Technical Integrity");
      expect(html).toContain("Not Lossless Compression");
      expect(html).toContain("2G Edge");
      expect(html).toContain("4G LTE");
    });
  });
});

