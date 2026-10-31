"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SourceImport } from "@/components/publisher/SourceImport";
import { BulletinComposer } from "@/components/publisher/BulletinComposer";
import type { ExtractedSource } from "@/domain/source-provenance/types";

export default function PublisherIngestPage() {
  const [extractedSource, setExtractedSource] = useState<ExtractedSource | null>(null);

  return (
    <main className="bg-surface-ground min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Navigation Bar */}
        <header className="border-surface-border mb-8 flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-teletext-yellow text-teletext-black rounded px-2 py-0.5 font-mono text-xs font-black">
                PUBLISHER STUDIO
              </span>
              <h1 className="text-teletext-white font-mono text-xl font-bold tracking-wider sm:text-2xl">
                PAGECAST INGESTION PIPELINE
              </h1>
            </div>
            <p className="text-text-muted mt-1 text-xs sm:text-sm">
              Convert web articles and raw notices into 40×25 Teletext bulletins in under 10 KiB.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="border-surface-border text-text-muted hover:text-teletext-white hover:border-teletext-yellow rounded border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              ← Reader Terminal
            </Link>
            <Link
              href="/catalogue"
              className="border-surface-border text-text-muted hover:text-teletext-white hover:border-teletext-yellow rounded border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              Browse Catalogue
            </Link>
          </div>
        </header>

        {/* Ingestion & Composition Workflow */}
        <div className="space-y-8">
          {/* Step 1: Ingestion */}
          <section aria-labelledby="ingest-section">
            <h2 id="ingest-section" className="sr-only">
              Step 1: Ingest Source Article
            </h2>
            <SourceImport onSourceExtracted={(src) => setExtractedSource(src)} />
          </section>

          {/* Step 2: Composition & CRT Preview */}
          <section aria-labelledby="compose-section">
            <h2 id="compose-section" className="sr-only">
              Step 2: Compose and Preview Teletext Bulletin
            </h2>
            <BulletinComposer key={extractedSource?.id ?? "none"} initialSource={extractedSource} />
          </section>
        </div>
      </div>
    </main>
  );
}
