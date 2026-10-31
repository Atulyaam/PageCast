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
import { getMagazineDefinition } from "@/domain/teletext/magazine";

export default function SavedPagesPage() {
  const [savedPages, setSavedPages] = useState<SavedPageRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<string>("");
  const [, startTransition] = useTransition();

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
    <div className="bg-surface-ground text-teletext-white flex min-h-screen flex-col font-sans">
      {/* Top Navigation Header */}
      <header className="border-surface-border bg-surface-panel/80 sticky top-0 z-30 border-b px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-teletext-yellow font-mono text-xl font-bold tracking-tight transition-opacity hover:opacity-80"
            >
              PAGECAST
            </Link>
            <span className="bg-teletext-green/20 border-teletext-green text-teletext-green rounded border px-2 py-0.5 font-mono text-[11px] font-bold">
              OFFLINE VAULT
            </span>
          </div>

          <nav className="flex items-center gap-4 font-mono text-xs">
            <Link href="/" className="text-text-muted hover:text-teletext-white transition-all">
              READER
            </Link>
            <Link
              href="/terminal"
              className="text-text-muted hover:text-teletext-white transition-all"
            >
              TERMINAL
            </Link>
            <Link
              href="/catalogue"
              className="text-text-muted hover:text-teletext-white transition-all"
            >
              CATALOGUE
            </Link>
            <Link href="/saved" className="text-teletext-green font-bold underline transition-all">
              SAVED
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col p-4 sm:p-6">
        {/* Title & Stats */}
        <div className="border-surface-border mb-6 flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-teletext-white font-mono text-2xl font-bold tracking-tight">
              SAVED OFFLINE BULLETINS
            </h1>
            <p className="text-text-muted mt-1 text-xs">
              IndexedDB persistent local storage &bull; {savedPages.length} bulletin
              {savedPages.length === 1 ? "" : "s"} stored
            </p>
          </div>

          {/* Quick Search Filter */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by page or title..."
              className="border-surface-border bg-surface-terminal text-text-primary placeholder:text-text-muted focus:border-teletext-yellow rounded border px-3 py-1.5 font-mono text-xs focus:outline-none"
              aria-label="Filter saved bulletins"
            />
          </div>
        </div>

        {/* Action notification message */}
        {actionMessage && (
          <div
            role="status"
            className="border-teletext-green bg-teletext-green/10 text-teletext-green mb-4 rounded border px-3 py-2 font-mono text-xs"
          >
            {actionMessage}
          </div>
        )}

        {/* Content States */}
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center font-mono">
            <div className="border-teletext-green mb-3 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
            <p className="text-text-muted text-xs tracking-wider">
              SCANNING LOCAL INDEXEDDB STORAGE...
            </p>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="border-surface-border bg-surface-panel rounded-lg border p-8 text-center font-mono">
            <p className="text-teletext-yellow mb-2 text-sm font-bold">
              {searchQuery
                ? "NO SAVED BULLETINS MATCH YOUR FILTER"
                : "NO OFFLINE BULLETINS SAVED YET"}
            </p>
            <p className="text-text-muted mx-auto mb-6 max-w-md text-xs">
              When viewing any bulletin in the Reader or Terminal, click the &ldquo;☆ SAVE
              OFFLINE&rdquo; button to keep a permanent offline copy on this device.
            </p>
            <Link
              href="/catalogue"
              className="border-teletext-yellow bg-teletext-yellow rounded border px-4 py-2 text-xs font-bold text-black transition-colors hover:bg-yellow-400"
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
                  className="border-surface-border bg-surface-panel hover:border-surface-border-subtle flex flex-col justify-between rounded-lg border p-4 shadow-sm transition-all"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="mb-2 flex items-center justify-between gap-2 font-mono text-[11px]">
                      <span className="bg-teletext-yellow rounded px-2 py-0.5 font-bold text-black">
                        P{saved.pageNumber}
                      </span>
                      <span className="text-teletext-cyan uppercase">
                        Mag {mag.number}: {mag.name}
                      </span>
                    </div>

                    {/* Bulletin Title */}
                    <h2 className="text-teletext-white mb-2 line-clamp-2 font-mono text-sm font-bold">
                      {saved.title}
                    </h2>

                    {/* Metadata Details */}
                    <div className="text-text-muted mb-4 space-y-0.5 font-mono text-[11px]">
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
                  <div className="border-surface-border flex items-center justify-between gap-2 border-t pt-3 font-mono text-xs">
                    <Link
                      href={`/terminal?page=${saved.pageNumber}`}
                      className="border-teletext-cyan bg-teletext-cyan/10 text-teletext-cyan hover:bg-teletext-cyan/20 rounded border px-3 py-1 font-semibold transition-colors"
                    >
                      READ OFFLINE
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleRemove(saved.pageNumber)}
                      className="rounded border border-red-900/50 px-2 py-1 text-red-400 transition-colors hover:bg-red-950/40"
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
      <footer className="border-surface-border text-text-muted border-t px-4 py-4 text-center font-mono text-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span>PAGECAST &bull; Offline PWA Storage</span>
          <span className="text-teletext-green">100% CLIENT PERSISTED</span>
        </div>
      </footer>
    </div>
  );
}
