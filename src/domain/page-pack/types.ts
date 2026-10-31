import type { TeletextPage } from "../teletext/types";

export interface EvidenceReference {
  readonly pointId: string;
  readonly sourceSentenceId: string;
}

export interface PagePackMetadata {
  readonly originalUrl?: string;
  readonly sourceName: string;
  readonly author?: string;
  readonly language: "en" | "hi";
  readonly aiAssisted: boolean;
  readonly promptVersion?: string;
  readonly modelId?: string;
  readonly publisherId: string;
  readonly evidenceReferences?: readonly EvidenceReference[];
}

export interface PagePackV1 {
  readonly id: string; // UUID v4
  readonly version: 1; // Schema version
  readonly slug: string; // URL-safe slug
  readonly title: string;
  readonly magazine: number; // 1 - 8
  readonly primaryPageNumber: number; // 100 - 899
  readonly createdAt: string; // ISO 8601
  readonly metadata: PagePackMetadata;
  readonly pages: readonly TeletextPage[];
}
