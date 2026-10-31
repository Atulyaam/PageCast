"use client";

/**
 * PageCast Web Terminal Container (TASK-S4-09)
 *
 * Full-fidelity Teletext terminal integrating:
 * - Live bulletin retrieval with offline seed fallback
 * - CRT raster / Phosphor glow toggles
 * - Subpage carousel navigation with 15s auto-rotation
 * - Keyboard-first buffer dialing (0-9, Arrows, Fastext, Shortcuts)
 * - Text-Only accessible semantic alternative mode (FR-011)
 * - Web Audio carrier chirp & speech synthesizer narration (FR-011, UXR-014)
 * - PagePack JSON export & high-contrast QR code sharing dialog
 * - URL shallow synchronization and deep-linking support
 */

import React, { useState, useEffect, useCallback, useTransition } from "react";
import type { TeletextPage } from "@/domain/teletext/types";
import { getSeedPage, getSeedPageCatalog, page100 } from "@/data/seed-pages";
import { isValidPageNumber } from "@/domain/validation/page-number";
import { fetchPublishedPage, type PublishedPageResponse } from "@/lib/reader/reader-client";
import { getTeletextSynthesizer } from "@/lib/audio/teletext-synthesizer";
import { useTeletextKeyboard } from "@/hooks/useTeletextKeyboard";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { savePageLocally, removeSavedPage, isPageSaved } from "@/lib/storage/saved-pages";

import { TerminalHeader } from "./TerminalHeader";
import { TerminalLoading } from "./TerminalLoading";
import { TerminalNotFound } from "./TerminalNotFound";
import { SubPageCarousel } from "./SubPageCarousel";
import { TeletextGrid } from "./TeletextGrid";
import { TeletextFastextBar } from "./TeletextFastextBar";
import { TeletextDialer } from "./TeletextDialer";
import { AudioControls } from "./AudioControls";
import { AccessibleTextView } from "./AccessibleTextView";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { ExportDialog } from "@/components/publisher/ExportDialog";
import { ImportDialog } from "./ImportDialog";

export interface WebTerminalProps {
  readonly initialPageNumber?: number;
  readonly initialSubPage?: number;
  readonly className?: string;
}

export const WebTerminal: React.FC<WebTerminalProps> = ({
  initialPageNumber = 100,
  initialSubPage = 1,
  className = "",
}) => {
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(initialPageNumber);
  const [currentSubIndex, setCurrentSubIndex] = useState<number>(Math.max(0, initialSubPage - 1));
  const [showScanlines, setShowScanlines] = useState<boolean>(false);
  const [phosphorGlow, setPhosphorGlow] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"crt" | "accessible">("crt");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [pageData, setPageData] = useState<PublishedPageResponse | null>(null);

  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const isOnline = useOnlineStatus();

  const [, startTransition] = useTransition();
  const catalog = getSeedPageCatalog();

  // Determine active TeletextPage
  let activePage: TeletextPage;
  if (pageData?.pack?.pages && pageData.pack.pages[currentSubIndex]) {
    activePage = pageData.pack.pages[currentSubIndex];
  } else {
    activePage = getSeedPage(currentPageNumber) ?? page100;
  }

  const subPageCount = pageData?.pack?.pages?.length ?? 1;

  // Shallow URL synchronization
  const updateUrl = useCallback((pageNumber: number) => {
    if (typeof window === "undefined") return;

    const pathname = window.location.pathname;
    if (pathname.startsWith("/pages/")) {
      window.history.pushState({}, "", `/pages/${pageNumber}`);
    } else if (pathname.startsWith("/terminal")) {
      window.history.pushState({}, "", `/terminal?page=${pageNumber}`);
    } else {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set("page", String(pageNumber));
      window.history.pushState({}, "", `${pathname}?${searchParams.toString()}`);
    }
  }, []);

  // Page navigation handler
  const handleNavigate = useCallback(
    (pageNumber: number) => {
      if (!isValidPageNumber(pageNumber)) return;

      startTransition(() => {
        setCurrentPageNumber(pageNumber);
        setCurrentSubIndex(0);
        updateUrl(pageNumber);
      });
    },
    [updateUrl]
  );

  // Subpage change handler
  const handleSubPageChange = useCallback((index: number) => {
    startTransition(() => {
      setCurrentSubIndex(index);
    });
  }, []);

  // Fetch page data on currentPageNumber change
  useEffect(() => {
    let isCancelled = false;

    async function loadPage() {
      setIsLoading(true);
      setIsNotFound(false);

      const res = await fetchPublishedPage(currentPageNumber);

      if (isCancelled) return;

      if (res.success && res.data) {
        setPageData(res.data);
        setIsNotFound(false);
        const synth = getTeletextSynthesizer();
        synth.playTuningChirp(currentPageNumber);
      } else if (res.notFound) {
        setIsNotFound(true);
        setPageData(null);
      } else {
        // Fallback to seed if available
        const seed = getSeedPage(currentPageNumber);
        if (seed) {
          setIsNotFound(false);
        } else {
          setIsNotFound(true);
        }
      }

      setIsLoading(false);
    }

    loadPage();

    isPageSaved(currentPageNumber)
      .then((saved) => {
        if (!isCancelled) setIsSaved(saved);
      })
      .catch(() => {
        if (!isCancelled) setIsSaved(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [currentPageNumber]);

  const handleToggleSave = useCallback(async () => {
    if (!pageData?.pack) return;

    if (isSaved) {
      await removeSavedPage(currentPageNumber);
      setIsSaved(false);
    } else {
      const res = await savePageLocally(pageData.pack);
      if (res.success) {
        setIsSaved(true);
        getTeletextSynthesizer().playFastextTone("green");
      }
    }
  }, [currentPageNumber, isSaved, pageData]);

  // Handle browser popstate
  useEffect(() => {
    function handlePopState() {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      const queryPage = url.searchParams.get("page");
      if (queryPage) {
        const num = parseInt(queryPage, 10);
        if (isValidPageNumber(num)) {
          setCurrentPageNumber(num);
          return;
        }
      }
      const match = window.location.pathname.match(/\/pages\/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (isValidPageNumber(num)) {
          setCurrentPageNumber(num);
        }
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Keyboard navigation hook
  const { dialBuffer } = useTeletextKeyboard({
    enabled: !isShortcutsOpen && !isExportOpen,
    onNavigatePage: handleNavigate,
    onNextPage: () => handleNavigate(Math.min(899, currentPageNumber + 1)),
    onPrevPage: () => handleNavigate(Math.max(100, currentPageNumber - 1)),
    onNextSubPage: () => {
      if (subPageCount > 1) {
        handleSubPageChange((currentSubIndex + 1) % subPageCount);
      }
    },
    onPrevSubPage: () => {
      if (subPageCount > 1) {
        handleSubPageChange((currentSubIndex - 1 + subPageCount) % subPageCount);
      }
    },
    onFastextRed: () => {
      if (activePage?.fastext?.red) {
        getTeletextSynthesizer().playFastextTone("red");
        handleNavigate(activePage.fastext.red);
      }
    },
    onFastextGreen: () => {
      if (activePage?.fastext?.green) {
        getTeletextSynthesizer().playFastextTone("green");
        handleNavigate(activePage.fastext.green);
      }
    },
    onFastextYellow: () => {
      if (activePage?.fastext?.yellow) {
        getTeletextSynthesizer().playFastextTone("yellow");
        handleNavigate(activePage.fastext.yellow);
      }
    },
    onFastextCyan: () => {
      if (activePage?.fastext?.cyan) {
        getTeletextSynthesizer().playFastextTone("cyan");
        handleNavigate(activePage.fastext.cyan);
      }
    },
    onToggleShortcuts: () => setIsShortcutsOpen((prev) => !prev),
    onToggleTextMode: () => setViewMode((prev) => (prev === "crt" ? "accessible" : "crt")),
  });

  return (
    <div
      className={`mx-auto flex w-full max-w-4xl flex-col items-center gap-3 ${className}`.trim()}
    >
      {/* Top Utility & Mode Bar */}
      <div className="border-surface-border bg-surface-panel flex w-full flex-wrap items-center justify-between gap-2 rounded border px-3 py-1.5 font-mono text-xs">
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <button
            type="button"
            onClick={() => setViewMode((prev) => (prev === "crt" ? "accessible" : "crt"))}
            className={`rounded border px-2.5 py-1 text-xs font-semibold transition-all ${
              viewMode === "accessible"
                ? "border-teletext-green bg-teletext-green text-teletext-black font-bold"
                : "border-surface-border bg-surface-terminal text-text-primary hover:text-teletext-yellow"
            }`}
            aria-label={
              viewMode === "crt"
                ? "Switch to text-only accessible view"
                : "Switch to CRT visual grid view"
            }
          >
            {viewMode === "crt" ? "ACCESSIBLE TEXT MODE" : "CRT DISPLAY MODE"}
          </button>

          {/* Buffer Dialing Indicator */}
          {dialBuffer && (
            <span className="border-teletext-yellow bg-teletext-yellow/20 text-teletext-yellow flex animate-pulse items-center gap-1 rounded border px-2 py-0.5 text-xs font-bold">
              DIALING: P{dialBuffer}__
            </span>
          )}
        </div>

        {/* Action Buttons: Save, Shortcuts & Share */}
        <div className="flex items-center gap-2">
          {/* Save / Remove Offline Page */}
          <button
            type="button"
            onClick={handleToggleSave}
            disabled={!pageData?.pack}
            className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-semibold transition-all ${
              isSaved
                ? "border-teletext-green bg-teletext-green/20 text-teletext-green"
                : "border-surface-border bg-surface-terminal text-text-primary hover:border-teletext-yellow hover:text-teletext-yellow"
            } ${!pageData?.pack ? "cursor-not-allowed opacity-50" : ""}`}
            aria-label={
              isSaved
                ? "Remove saved offline bulletin"
                : "Save bulletin locally for offline reading"
            }
          >
            <span>{isSaved ? "★ SAVED OFFLINE" : "☆ SAVE OFFLINE"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="border-surface-border bg-surface-terminal text-text-primary hover:border-teletext-cyan hover:text-teletext-cyan flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs transition-colors"
            aria-label="Share bulletin or export PagePack QR code"
          >
            SHARE / QR
          </button>

          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="border-surface-border bg-surface-terminal text-text-primary hover:border-teletext-yellow hover:text-teletext-yellow flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs transition-colors"
            aria-label="Import PagePack JSON file"
          >
            IMPORT JSON
          </button>

          <button
            type="button"
            onClick={() => setIsShortcutsOpen(true)}
            className="border-surface-border bg-surface-terminal text-text-muted hover:text-teletext-white flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors"
            aria-label="Open keyboard shortcuts help modal"
          >
            KEYS (?)
          </button>
        </div>
      </div>

      {/* Main Terminal View Content */}
      {viewMode === "accessible" ? (
        <AccessibleTextView
          page={activePage}
          sourceUrl={pageData?.pack?.metadata?.sourceName}
          publishedAt={pageData?.publishedAt}
          onNavigate={handleNavigate}
          onToggleViewMode={() => setViewMode("crt")}
        />
      ) : (
        <>
          {/* CRT Terminal Header */}
          <TerminalHeader
            pageNumber={currentPageNumber}
            showScanlines={showScanlines}
            phosphorGlow={phosphorGlow}
            onToggleScanlines={() => setShowScanlines((prev) => !prev)}
            onTogglePhosphorGlow={() => setPhosphorGlow((prev) => !prev)}
            isOffline={!isOnline || pageData?.isFallback || pageData?.isSavedCopy}
            isSavedCopy={pageData?.isSavedCopy}
          />

          {/* Subpage Carousel Navigation */}
          {subPageCount > 1 && (
            <SubPageCarousel
              pageNumber={currentPageNumber}
              currentSubIndex={currentSubIndex}
              subPageCount={subPageCount}
              onSubPageChange={handleSubPageChange}
            />
          )}

          {/* 40x25 Screen Content / Loading / 404 */}
          <div className="w-full">
            {isLoading ? (
              <TerminalLoading pageNumber={currentPageNumber} />
            ) : isNotFound ? (
              <>
                <TerminalNotFound
                  pageNumber={currentPageNumber}
                  showScanlines={showScanlines}
                  phosphorGlow={phosphorGlow}
                />
                <TeletextFastextBar
                  fastext={{ red: 100, green: 200, yellow: 300, cyan: 400 }}
                  onNavigate={handleNavigate}
                />
              </>
            ) : (
              <>
                <TeletextGrid
                  page={activePage}
                  showScanlines={showScanlines}
                  phosphorGlow={phosphorGlow}
                />
                <TeletextFastextBar fastext={activePage.fastext} onNavigate={handleNavigate} />
              </>
            )}
          </div>
        </>
      )}

      {/* Audio Controls Toolbar */}
      <div className="w-full">
        <AudioControls page={activePage} />
      </div>

      {/* Remote Control Keypad */}
      <div className="flex w-full justify-center">
        <TeletextDialer
          currentPage={currentPageNumber}
          catalogue={catalog}
          fastext={activePage.fastext}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

      {/* Export & Distribution Dialog */}
      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        pageNumber={currentPageNumber}
        pack={pageData?.pack}
      />

      {/* PagePack Ingestion Dialog */}
      <ImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={(pack) => {
          setIsImportOpen(false);
          handleNavigate(pack.primaryPageNumber);
        }}
      />
    </div>
  );
};
