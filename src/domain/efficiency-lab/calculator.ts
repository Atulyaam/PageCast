/**
 * PageCast Data Efficiency Lab — Domain Calculation & Simulation Models
 *
 * Implements pure mathematical models for payload reduction, network transfer
 * latency estimation across standardized connection profiles, and local storage density.
 *
 * Strict Scientific Standards:
 * - Differentiates exact measured byte counts from theoretical simulation estimates.
 * - Explicitly rejects labeling semantic summarization as "lossless compression".
 */

export interface NetworkProfile {
  readonly id: string;
  readonly name: string;
  readonly bandwidthKbps: number;
  readonly latencyMs: number;
  readonly description: string;
}

export const NETWORK_PROFILES: readonly NetworkProfile[] = [
  {
    id: "2g",
    name: "2G Edge",
    bandwidthKbps: 150,
    latencyMs: 400,
    description: "Rural / low-reception cellular",
  },
  {
    id: "3g",
    name: "3G Standard",
    bandwidthKbps: 1500,
    latencyMs: 150,
    description: "Intermittent suburban mobile",
  },
  {
    id: "4g",
    name: "4G LTE",
    bandwidthKbps: 15000,
    latencyMs: 50,
    description: "Urban broadband",
  },
  {
    id: "sat",
    name: "Satellite Link",
    bandwidthKbps: 2000,
    latencyMs: 600,
    description: "Remote maritime / high RTT",
  },
];

export interface EfficiencyMetrics {
  readonly originalBytes: number;
  readonly extractedBytes: number;
  readonly pagePackBytes: number;
  readonly reductionPercent: number;
  readonly reductionFactor: number;
  readonly withinBudget: boolean;
  readonly budgetRemainingBytes: number;
}

export interface NetworkLatencyEstimate {
  readonly profileId: string;
  readonly profileName: string;
  readonly originalTransferMs: number;
  readonly pagePackTransferMs: number;
  readonly speedupFactor: number;
}

/**
 * Calculates payload reduction metrics between original web payloads and PagePack artifacts.
 */
export function calculateEfficiencyMetrics(
  originalBytes: number,
  extractedBytes: number,
  pagePackBytes: number,
  maxBudgetBytes = 10240
): EfficiencyMetrics {
  const safeOriginal = Math.max(0, originalBytes);
  const safeExtracted = Math.max(0, extractedBytes);
  const safePagePack = Math.max(0, pagePackBytes);

  let reductionPercent = 0;
  let reductionFactor = 1;

  if (safeOriginal > 0 && safePagePack > 0) {
    reductionPercent = Math.max(
      0,
      Math.min(100, ((safeOriginal - safePagePack) / safeOriginal) * 100)
    );
    reductionFactor = safeOriginal / safePagePack;
  }

  const budgetRemainingBytes = Math.max(0, maxBudgetBytes - safePagePack);
  const withinBudget = safePagePack <= maxBudgetBytes;

  return {
    originalBytes: safeOriginal,
    extractedBytes: safeExtracted,
    pagePackBytes: safePagePack,
    reductionPercent: Number(reductionPercent.toFixed(2)),
    reductionFactor: Number(reductionFactor.toFixed(1)),
    withinBudget,
    budgetRemainingBytes,
  };
}

/**
 * Calculates theoretical transfer time in milliseconds based on payload size and bandwidth.
 * Formula: (Bytes * 8 / (bandwidthKbps * 1000)) * 1000 + latencyMs
 */
export function calculateTransferTimeMs(payloadBytes: number, profile: NetworkProfile): number {
  if (payloadBytes <= 0) return 0;
  const bytesPerSecond = (profile.bandwidthKbps * 1000) / 8;
  const transferSeconds = payloadBytes / bytesPerSecond;
  const totalMs = transferSeconds * 1000 + profile.latencyMs;
  return Math.round(totalMs);
}

/**
 * Estimates comparative transfer times across all standardized network profiles.
 */
export function estimateComparativeNetworkLatencies(
  originalBytes: number,
  pagePackBytes: number,
  profiles: readonly NetworkProfile[] = NETWORK_PROFILES
): readonly NetworkLatencyEstimate[] {
  return profiles.map((p) => {
    const origMs = calculateTransferTimeMs(originalBytes, p);
    const packMs = calculateTransferTimeMs(pagePackBytes, p);
    const speedup = packMs > 0 ? Number((origMs / packMs).toFixed(1)) : 1;

    return {
      profileId: p.id,
      profileName: p.name,
      originalTransferMs: origMs,
      pagePackTransferMs: packMs,
      speedupFactor: speedup,
    };
  });
}

/**
 * Calculates local IndexedDB storage capacity for saved bulletins.
 * Example: 5 MB quota can store approximately ~1,600 PagePacks of 3.2 KB each.
 */
export function calculateStorageCapacity(
  averagePagePackBytes: number,
  storageQuotaMb = 5
): {
  readonly quotaBytes: number;
  readonly capacityPages: number;
} {
  const quotaBytes = storageQuotaMb * 1024 * 1024;
  const safeAvg = Math.max(1, averagePagePackBytes);
  const capacityPages = Math.floor(quotaBytes / safeAvg);

  return {
    quotaBytes,
    capacityPages,
  };
}
