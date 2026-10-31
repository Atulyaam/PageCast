/**
 * PageCast — Source Provenance & Bulletin Composition Domain Types
 *
 * Defines pure TypeScript contracts for extracted sources, sentence-level
 * attribution, and AI-composed bulletin drafts.
 *
 * Strict Domain Layer Invariant: 0 dependencies on React, Next.js, or external AI SDKs.
 */

export interface SourceSentence {
  readonly id: string;
  readonly index: number;
  readonly text: string;
  readonly hash: string;
}

export interface ExtractedSource {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly siteName?: string;
  readonly byline?: string;
  readonly publishedTime?: string;
  readonly fetchedAt: string;
  readonly content: string;
  readonly sentences: readonly SourceSentence[];
  readonly language?: "en" | "hi";
}

export interface BulletinKeyPoint {
  readonly text: string;
  readonly sourceSentenceIds: readonly string[];
}

export interface BulletinSection {
  readonly heading?: string;
  readonly points: readonly BulletinKeyPoint[];
}

export interface BulletinMetadata {
  readonly provider: string;
  readonly model: string;
  readonly promptVersion: string;
  readonly generatedAt: string;
  readonly humanReviewed?: boolean;
  readonly reviewedAt?: string;
}

export interface BulletinDraft {
  readonly sourceId: string;
  readonly pageNumber: number;
  readonly title: string;
  readonly topic?: string;
  readonly headline?: string;
  readonly summary: string;
  readonly sections: readonly BulletinSection[];
  readonly language: "en" | "hi";
  readonly warnings?: readonly string[];
  readonly metadata: BulletinMetadata;
}
