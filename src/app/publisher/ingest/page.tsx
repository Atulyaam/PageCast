"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SourceImport } from "@/components/publisher/SourceImport";
import { BulletinComposer } from "@/components/publisher/BulletinComposer";
import type { ExtractedSource } from "@/domain/source-provenance/types";

export default function PublisherIngestPage() {
  const [extractedSource, setExtractedSource] = useState<ExtractedSource | null>(null);

  return (
    <main className="min-h-screen p-3 sm:p-6 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Navigation Bar */}
        <header className="mb-6 flex flex-col justify-between gap-4 border-b border-[#777970] pb-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="rounded-xs bg-[#c69b5b] px-2 py-0.5 font-mono text-[10px] font-black text-[#0d1410] uppercase">
                STUDIO PIPELINE
              </span>
              <h1 className="font-mono text-lg font-bold tracking-wider text-[#2f342d] uppercase sm:text-xl">
                Article Ingestion & AI Conversion
              </h1>
            </div>
            <p className="mt-1 font-mono text-xs text-[#5e645a]">
              Convert web articles and raw notices into 40×25 Teletext bulletins in under 10 KiB.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="btn-keycap-light px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors"
            >
              ← Reader Terminal
            </Link>
            <Link
              href="/catalogue"
              className="btn-keycap-light px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors"
            >
              Catalogue
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
