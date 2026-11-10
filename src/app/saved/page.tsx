"use client";

/**
 * PageCast Saved Pages Library Screen (TASK-S4-OFF-05 / UXR-004)
 * /saved
 *
 * Dedicated screen for managing the local offline collection of Teletext bulletins
 * stored in IndexedDB via Dexie.js.
 * Rendered inside the PT-4025 CRT display with internal scrolling.
 */

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Download, Scan, Search, Trash2, BookOpen } from "lucide-react";
import { PageCastDeviceShell } from "@/components/device/PageCastDeviceShell";
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
    <PageCastDeviceShell mode="saved">
      <div className="space-y-4">
        {/* Top Header & Vault Status Badge */}
        <div className="border-b border-[#253328] pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-xs border border-[#236b40] bg-[#143320] px-2 py-0.5 text-[10px] font-bold tracking-widest text-[#22c55e] uppercase">
                OFFLINE VAULT
              </span>
              <h1 className="text-sm font-bold tracking-wider text-[#f6dfa9] uppercase sm:text-base">
                SAVED OFFLINE BULLETINS
              </h1>
            </div>
            <span className="text-[10px] text-[#829a76]">
              {savedPages.length} CARTRIDGE{savedPages.length === 1 ? "" : "S"} CACHED
            </span>
          </div>
          <p className="mt-1 text-xs text-[#829a76]">
            IndexedDB persistent local storage &bull; Zero network dependency &bull; Air-gap safe
          </p>
        </div>

        {/* Action Toolbar & Search */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xs border border-[#232e27] bg-[#101713] p-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-[#232e27] bg-[#0a0f0c] px-2.5 py-1 text-xs font-bold text-[#54b77a] transition-all hover:border-[#54b77a] hover:bg-[#1a3823]"
              aria-label="Import PagePack JSON file"
            >
              <Download className="h-3 w-3" />
              <span>+ IMPORT JSON</span>
            </button>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-[#232e27] bg-[#0a0f0c] px-2.5 py-1 text-xs font-bold text-[#d1a15d] transition-all hover:border-[#d1a15d] hover:bg-[#382c16]"
              aria-label="Scan optical QR code or air-gap burst"
            >
              <Scan className="h-3 w-3" />
              <span>SCAN QR</span>
            </button>
          </div>

          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute top-2 left-2.5 h-3 w-3 text-[#54b77a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by page or title..."
              className="w-full rounded border border-[#232e27] bg-[#0a0f0c] py-1.5 pr-2.5 pl-7 text-xs text-[#b8d1a2] placeholder:text-[#3d4f40] focus:border-[#54b77a] focus:outline-none"
              aria-label="Filter saved bulletins"
            />
          </div>
        </div>

        {/* Action notification message */}
        {actionMessage && (
          <div
            role="status"
            className="rounded-xs border border-[#236b40] bg-[#143320] px-3 py-1.5 text-xs text-[#b8d1a2]"
          >
            {actionMessage}
          </div>
        )}

        {/* Content States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-[#54b77a] border-t-transparent" />
            <p className="text-xs text-[#829a76]">SCANNING LOCAL INDEXEDDB STORAGE...</p>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="rounded border border-[#232e27] bg-[#101713] p-8 text-center">
            <p className="mb-1 text-xs font-bold text-[#d1a15d]">
              {searchQuery
                ? "NO SAVED BULLETINS MATCH YOUR FILTER"
                : "NO OFFLINE BULLETINS SAVED YET"}
            </p>
            <p className="mx-auto mb-4 max-w-sm text-[11px] text-[#6d826c]">
              When viewing any bulletin in the Reader or Terminal, click &ldquo;SAVE OFFLINE&rdquo;
              to keep a permanent local cartridge copy.
            </p>
            <Link
              href="/catalogue"
              className="inline-block rounded border border-[#232e27] bg-[#0a0f0c] px-3 py-1.5 text-xs font-bold text-[#54b77a] hover:border-[#54b77a] hover:bg-[#1a3823]"
            >
              EXPLORE BROADCAST CATALOGUE
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredPages.map((saved) => {
              const mag = getMagazineDefinition(saved.magazineNumber);
              const formattedDate = new Date(saved.savedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={saved.pageNumber}
                  className="flex flex-col justify-between rounded border border-[#232e27] bg-[#101713] p-3 transition-colors hover:border-[#384a3c]"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="mb-1.5 flex items-center justify-between gap-1 text-[10px]">
                      <span className="rounded-xs bg-[#c69b5b] px-1.5 py-0.5 font-bold text-[#0d1410]">
                        P{saved.pageNumber}
                      </span>
                      <span className="text-[#6d826c]">
                        Mag {mag.number}: {mag.name}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="mb-1 line-clamp-2 text-xs font-bold text-[#f6dfa9]">
                      {saved.title}
                    </h2>

                    {/* Meta */}
                    <div className="mb-3 space-y-0.5 text-[10px] text-[#6d826c]">
                      <div>Saved: {formattedDate}</div>
                      <div>
                        Size: {(saved.byteLength / 1024).toFixed(1)} KiB &bull;{" "}
                        {saved.pack.pages.length} frame
                        {saved.pack.pages.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 border-t border-[#1c261f] pt-2 text-xs">
                    <Link
                      href={`/terminal?page=${saved.pageNumber}`}
                      className="inline-flex items-center gap-1 rounded border border-[#232e27] bg-[#0a0f0c] px-2 py-1 text-[10px] font-bold text-[#54b77a] hover:border-[#54b77a] hover:bg-[#1a3823]"
                    >
                      <BookOpen className="h-3 w-3" />
                      <span>READ</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleRemove(saved.pageNumber)}
                      className="inline-flex cursor-pointer items-center gap-1 text-[10px] text-[#ef4444] hover:underline"
                      aria-label={`Remove saved page ${saved.pageNumber}`}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>REMOVE</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
    </PageCastDeviceShell>
  );
}
