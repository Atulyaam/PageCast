"use client";

/**
 * PageCast Saved Pages Library Screen (TASK-S4-OFF-05 / UXR-004)
 *
 * Dedicated screen for managing the local offline collection of Teletext bulletins
 * stored in IndexedDB via Dexie.js.
 */

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { getAllSavedPages, removeSavedPage } from "@/lib/storage/saved-pages";
import type { SavedPageRecord } from "@/lib/storage/dexie-db";
import { ImportDialog } from "@/components/teletext/ImportDialog";
import { QrScannerModal } from "@/components/teletext/QrScannerModal";
import { getMagazineDefinition } from "@/domain/teletext/magazine";

export default function SavedPagesPage() {
  const [savedPages, setSavedPages] = useState<SavedPageRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<string>("");
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  const reloadPages = () => {
    getAllSavedPages()
      .then((pages) => {
        setSavedPages(pages);
      })
      .catch(() => {
        setSavedPages([]);
      });
  };

  useEffect(() => {
    let isCancelled = false;

    getAllSavedPages()
      .then((pages) => {
        if (!isCancelled) {
          setSavedPages(pages);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSavedPages([]);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleRemove = async (pageNumber: number) => {
    const success = await removeSavedPage(pageNumber);
    if (success) {
      setActionMessage(`Page P${pageNumber} removed from local storage.`);
      startTransition(() => {
        setSavedPages((prev) => prev.filter((p) => p.pageNumber !== pageNumber));
      });
      setTimeout(() => setActionMessage(""), 4000);
    }
  };

  const filteredPages = savedPages.filter((page) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      page.title.toLowerCase().includes(query) ||
      page.slug.toLowerCase().includes(query) ||
      String(page.pageNumber).includes(query)
    );
  });

  return (
    <div className="flex min-h-screen flex-col font-sans">
      {/* Top Precision Instrumentation Rail */}
      <header className="sticky top-0 z-30 border-b border-[#1b201c] bg-[#222723] px-3 py-2 text-[#b7c9a8] shadow-md sm:px-5 sm:py-2.5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="font-mono text-base font-black tracking-tight text-[#f6dfa9] transition-opacity hover:opacity-80 sm:text-lg"
            >
              PAGECAST
            </Link>
            <span className="rounded-xs border border-[#236b40] bg-[#143320] px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-[#22c55e] uppercase">
              OFFLINE VAULT
            </span>
          </div>

          <nav className="no-scrollbar flex items-center gap-1.5 overflow-x-auto font-mono text-xs sm:gap-2">
            <Link
              href="/"
              className="rounded-xs border border-transparent px-2.5 py-1 text-[#879b83] transition-all hover:border-[#3b453e] hover:text-[#b7c9a8]"
            >
              READER
            </Link>
            <Link
              href="/terminal"
              className="rounded-xs border border-transparent px-2.5 py-1 text-[#879b83] transition-all hover:border-[#3b453e] hover:text-[#b7c9a8]"
            >
              TERMINAL
            </Link>
            <Link
              href="/catalogue"
              className="rounded-xs border border-transparent px-2.5 py-1 text-[#879b83] transition-all hover:border-[#3b453e] hover:text-[#b7c9a8]"
            >
              CATALOGUE
            </Link>
            <Link
              href="/saved"
              className="rounded-xs border border-[#3d4b40] bg-[#2b352e] px-2.5 py-1 font-bold text-[#22c55e] shadow-inner transition-all"
            >
              SAVED
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col p-4 sm:p-6">
        {/* Title & Stats */}
        <div className="mb-6 flex flex-col justify-between gap-3 border-b border-[#777970] pb-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-mono text-xl font-bold tracking-tight text-[#2f342d] sm:text-2xl">
              SAVED OFFLINE BULLETINS
            </h1>
            <p className="mt-1 font-mono text-xs text-[#5e645a]">
              IndexedDB persistent local storage &bull; {savedPages.length} cartridge
              {savedPages.length === 1 ? "" : "s"} cached
            </p>
          </div>

          {/* Quick Search Filter & Import Button */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="btn-keycap-light cursor-pointer px-3 py-1.5 font-mono text-xs font-bold transition-all"
              aria-label="Import PagePack JSON file"
            >
              + IMPORT JSON
            </button>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="btn-keycap-light cursor-pointer px-3 py-1.5 font-mono text-xs font-bold transition-all"
              aria-label="Scan optical QR code or air-gap burst"
            >
              SCAN QR
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by page or title..."
              className="led-window px-3 py-1.5 font-mono text-xs text-[#b7c9a8] placeholder:text-[#506053] focus:border-[#c69b5b] focus:outline-hidden"
              aria-label="Filter saved bulletins"
            />
          </div>
        </div>

        {/* Action notification message */}
        {actionMessage && (
          <div
            role="status"
            className="mb-4 rounded-xs border border-[#236b40] bg-[#143320] px-3 py-2 font-mono text-xs text-[#b7c9a8]"
          >
            {actionMessage}
          </div>
        )}

        {/* Content States */}
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center font-mono">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#236b40] border-t-transparent" />
            <p className="text-xs tracking-wider text-[#5e645a]">
              SCANNING LOCAL INDEXEDDB STORAGE...
            </p>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="chassis-body p-8 text-center font-mono">
            <p className="mb-2 text-sm font-bold text-[#c69b5b]">
              {searchQuery
                ? "NO SAVED BULLETINS MATCH YOUR FILTER"
                : "NO OFFLINE BULLETINS SAVED YET"}
            </p>
            <p className="mx-auto mb-6 max-w-md text-xs text-[#5e645a]">
              When viewing any bulletin in the Reader or Terminal, click the &ldquo;☆ SAVE
              OFFLINE&rdquo; button to keep a permanent offline copy on this device.
            </p>
            <Link
              href="/catalogue"
              className="btn-keycap-light inline-block px-4 py-2 text-xs font-bold uppercase transition-colors"
            >
              EXPLORE BROADCAST CATALOGUE
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPages.map((saved) => {
              const mag = getMagazineDefinition(saved.magazineNumber);
              const formattedDate = new Date(saved.savedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={saved.pageNumber}
                  className="chassis-body flex flex-col justify-between p-4 shadow-md transition-all"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="mb-2 flex items-center justify-between gap-2 font-mono text-[11px]">
                      <span className="rounded-xs bg-[#c69b5b] px-2 py-0.5 font-bold text-[#0d1410]">
                        P{saved.pageNumber}
                      </span>
                      <span className="text-[10px] font-bold tracking-wider text-[#3d4b40] uppercase">
                        Mag {mag.number}: {mag.name}
                      </span>
                    </div>

                    {/* Bulletin Title */}
                    <h2 className="mb-2 line-clamp-2 font-mono text-sm font-bold text-[#2f342d]">
                      {saved.title}
                    </h2>

                    {/* Metadata Details */}
                    <div className="mb-4 space-y-0.5 font-mono text-[11px] text-[#5e645a]">
                      <div>Saved: {formattedDate}</div>
                      <div>
                        Size: {(saved.byteLength / 1024).toFixed(1)} KiB &bull;{" "}
                        {saved.pack.pages.length} frame
                        {saved.pack.pages.length === 1 ? "" : "s"}
                      </div>
                      {saved.sourceUrl && (
                        <div className="truncate">
                          Source: {saved.sourceDomain || saved.sourceUrl}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 border-t border-[#777970] pt-3 font-mono text-xs">
                    <Link
                      href={`/terminal?page=${saved.pageNumber}`}
                      className="btn-keycap-light px-3 py-1 text-xs font-bold uppercase"
                    >
                      READ OFFLINE
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleRemove(saved.pageNumber)}
                      className="cursor-pointer rounded-xs px-2 py-1 text-[11px] font-semibold text-[#801d14] transition-colors hover:text-[#b93529]"
                      aria-label={`Remove saved page ${saved.pageNumber}`}
                    >
                      REMOVE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#bfbcb2] px-4 py-4 text-center font-mono text-xs text-[#5e645a]">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span>PAGECAST &bull; Offline PWA Storage</span>
          <span className="font-bold text-[#2e5a38]">100% CLIENT PERSISTED</span>
        </div>
      </footer>
      {/* Import Dialog */}
      <ImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={() => {
          reloadPages();
          setActionMessage("PagePack imported and saved to offline vault successfully!");
          setTimeout(() => setActionMessage(""), 4000);
        }}
      />

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onPackIngested={() => {
          reloadPages();
          setActionMessage("Air-gap bulletin received and verified successfully!");
          setTimeout(() => setActionMessage(""), 4000);
        }}
      />
    </div>
  );
}
