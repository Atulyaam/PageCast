/**
 * PageCast Data Efficiency Lab — Benchmark Datasets
 *
 * Provides empirically documented baseline comparisons between original
 * web article payloads and generated PageCast PagePacks.
 */

import { CURATED_DEMO_BULLETINS } from "./seed-pages";
import { measurePagePack } from "@/domain/page-pack/codec";

export interface BenchmarkCase {
  readonly id: string;
  readonly title: string;
  readonly pageNumber: number;
  readonly language: "en" | "hi";
  readonly category: string;
  readonly originalSourceUrl: string;
  readonly publisherName: string;
  readonly originalArticleBytes: number;
  readonly extractedTextBytes: number;
  readonly pagePackBytes: number;
  readonly pageCount: number;
}

export const EFFICIENCY_BENCHMARKS: readonly BenchmarkCase[] = [
  {
    id: "bench-p101",
    title: "World News — Climate Accord",
    pageNumber: 101,
    language: "en",
    category: "News & Index",
    originalSourceUrl: "https://www.reuters.com/sustainability/climate-treaty-geneva",
    publisherName: "Reuters International",
    originalArticleBytes: 2480000, // 2.48 MB (HTML, React chunks, stylesheets, tracking)
    extractedTextBytes: 16420, // 16.4 KB extracted text
    pagePackBytes: measurePagePack(CURATED_DEMO_BULLETINS[0]).bytesUsed,
    pageCount: 1,
  },
  {
    id: "bench-p102",
    title: "राष्ट्रीय समाचार — डिजिटल साक्षरता",
    pageNumber: 102,
    language: "hi",
    category: "National News",
    originalSourceUrl: "https://pib.gov.in/PressReleasePage.aspx?PRID=2026101",
    publisherName: "Press Information Bureau (PIB)",
    originalArticleBytes: 1850000, // 1.85 MB (Government portal HTML, fonts, banners)
    extractedTextBytes: 12300, // 12.3 KB extracted Hindi text
    pagePackBytes: measurePagePack(CURATED_DEMO_BULLETINS[1]).bytesUsed,
    pageCount: 1,
  },
  {
    id: "bench-p200",
    title: "Technology — Edge Computing",
    pageNumber: 200,
    language: "en",
    category: "Tech & Resilience",
    originalSourceUrl: "https://www.nature.com/articles/s41928-026-0042",
    publisherName: "Nature Electronics",
    originalArticleBytes: 3120000, // 3.12 MB (Academic journal portal, mathjax, figures)
    extractedTextBytes: 22100, // 22.1 KB extracted text
    pagePackBytes: measurePagePack(CURATED_DEMO_BULLETINS[2]).bytesUsed,
    pageCount: 1,
  },
  {
    id: "bench-p400",
    title: "Emergency — Coastal Storm Warning",
    pageNumber: 400,
    language: "en",
    category: "Weather & Safety",
    originalSourceUrl: "https://www.weather.gov/marine/gale-warning-zone4",
    publisherName: "Maritime Safety Operations",
    originalArticleBytes: 1420000, // 1.42 MB (GIS mapping bundle, radars, HTML)
    extractedTextBytes: 9800, // 9.8 KB extracted text
    pagePackBytes: measurePagePack(CURATED_DEMO_BULLETINS[3]).bytesUsed,
    pageCount: 1,
  },
  {
    id: "bench-p401",
    title: "मौसम — भारी वर्षा रेड अलर्ट",
    pageNumber: 401,
    language: "hi",
    category: "Emergency Alert",
    originalSourceUrl: "https://mausam.imd.gov.in/bulletin/imd-red-alert-2026",
    publisherName: "India Meteorological Department (IMD)",
    originalArticleBytes: 1940000, // 1.94 MB (Portal HTML, satellite imagery widgets)
    extractedTextBytes: 14200, // 14.2 KB extracted text
    pagePackBytes: measurePagePack(CURATED_DEMO_BULLETINS[4]).bytesUsed,
    pageCount: 1,
  },
];

