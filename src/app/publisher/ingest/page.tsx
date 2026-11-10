"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageCastDeviceShell } from "@/components/device/PageCastDeviceShell";
import { SourceImport } from "@/components/publisher/SourceImport";
import { BulletinComposer } from "@/components/publisher/BulletinComposer";
import type { ExtractedSource } from "@/domain/source-provenance/types";

export default function PublisherIngestPage() {
  const [extractedSource, setExtractedSource] = useState<ExtractedSource | null>(null);

  return (
    <PageCastDeviceShell mode="ingest">
      <div className="space-y-4 font-mono text-[#b8d1a2]">
        {/* Navigation Bar */}
        <div className="flex flex-col justify-between gap-3 border-b border-[#253328] pb-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="rounded-xs bg-[#c69b5b] px-2 py-0.5 font-mono text-[10px] font-black text-[#0d1410] uppercase">
                STUDIO PIPELINE
              </span>
              <h1 className="font-mono text-base font-bold tracking-wider text-[#f6dfa9] uppercase sm:text-lg">
                Article Ingestion & AI Conversion
              </h1>
            </div>
            <p className="mt-1 font-mono text-xs text-[#879b83]">
              Convert web articles and raw notices into 40×25 Teletext bulletins in under 10 KiB.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/publisher"
              className="rounded-xs border border-[#253328] bg-[#0d140f] px-3 py-1.5 font-mono text-xs font-bold text-[#b8d1a2] uppercase transition-colors hover:border-[#54b77a] hover:text-[#54b77a]"
            >
              ← Publisher Desk
            </Link>
            <Link
              href="/terminal"
              className="rounded-xs border border-[#253328] bg-[#0d140f] px-3 py-1.5 font-mono text-xs font-bold text-[#b8d1a2] uppercase transition-colors hover:border-[#54b77a] hover:text-[#54b77a]"
            >
              Terminal
            </Link>
          </div>
        </div>

        {/* Ingestion & Composition Workflow */}
        <div className="space-y-6">
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
    </PageCastDeviceShell>
  );
}
