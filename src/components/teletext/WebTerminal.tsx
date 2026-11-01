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

import React, {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useSyncExternalStore,
} from "react";
import type { TeletextPage } from "@/domain/teletext/types";
import { getSeedPage, getSeedPageCatalog, page100 } from "@/data/seed-pages";
import { isValidPageNumber } from "@/domain/validation/page-number";
import { fetchPublishedPage, type PublishedPageResponse } from "@/lib/reader/reader-client";
import { getTeletextSynthesizer } from "@/lib/audio/teletext-synthesizer";
import { useTeletextKeyboard } from "@/hooks/useTeletextKeyboard";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { savePageLocally, removeSavedPage, isPageSaved } from "@/lib/storage/saved-pages";
import {
  formatRelativeFreshness,
  isCopyStale,
  isNoticeExpired,
} from "@/domain/freshness/freshness";

import { TerminalHeader } from "./TerminalHeader";
import { TerminalLoading } from "./TerminalLoading";
import { TerminalNotFound } from "./TerminalNotFound";
import dynamic from "next/dynamic";
import { SubPageCarousel } from "./SubPageCarousel";
import { TeletextGrid } from "./TeletextGrid";
import { TeletextFastextBar } from "./TeletextFastextBar";
import { TeletextDialer } from "./TeletextDialer";
import { AudioControls } from "./AudioControls";
import { AccessibleTextView } from "./AccessibleTextView";

// Code splitting & lazy loading for heavy modals (TASK-S5-09 / PERF-001)
const KeyboardShortcutsModal = dynamic(
  () => import("./KeyboardShortcutsModal").then((mod) => mod.KeyboardShortcutsModal),
  { ssr: false }
);

const ExportDialog = dynamic(
  () => import("@/components/publisher/ExportDialog").then((mod) => mod.ExportDialog),
  { ssr: false }
);

const ImportDialog = dynamic(() => import("./ImportDialog").then((mod) => mod.ImportDialog), {
  ssr: false,
});

const QrScannerModal = dynamic(() => import("./QrScannerModal").then((mod) => mod.QrScannerModal), {
  ssr: false,
});

const EvidenceDrawer = dynamic(() => import("./EvidenceDrawer").then((mod) => mod.EvidenceDrawer), {
  ssr: false,
});

const DATA_SAVER_STORAGE_KEY = "pagecast_data_saver_mode";

function subscribeDataSaver(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("pagecast_data_saver_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("pagecast_data_saver_change", callback);
  };
}

function getDataSaverSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DATA_SAVER_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getDataSaverServerSnapshot(): boolean {
  return false;
}

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
  const isDataSaver = useSyncExternalStore(
    subscribeDataSaver,
    getDataSaverSnapshot,
    getDataSaverServerSnapshot
  );
  const [sessionBytes, setSessionBytes] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [pageData, setPageData] = useState<PublishedPageResponse | null>(null);

  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState<boolean>(false);
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

  const handleToggleDataSaver = useCallback(() => {
    const current = getDataSaverSnapshot();
    const next = !current;
    try {
      localStorage.setItem(DATA_SAVER_STORAGE_KEY, String(next));
    } catch {
      // Local storage unavailable
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pagecast_data_saver_change"));
    }
  }, []);

  // Fetch page data on currentPageNumber change
  useEffect(() => {
    let isCancelled = false;

    async function loadPage() {
      setIsLoading(true);
      setIsNotFound(false);

      const res = await fetchPublishedPage(currentPageNumber, fetch, isDataSaver);

      if (isCancelled) return;

      if (res.success && res.data) {
        setPageData(res.data);
        setIsNotFound(false);
        const synth = getTeletextSynthesizer();
        synth.playTuningChirp(currentPageNumber);

        // Record telemetry: add payload bytes if received from live network
        if (!res.data.isSavedCopy && !res.data.isFallback) {
          const payloadBytes = new TextEncoder().encode(JSON.stringify(res.data.pack)).byteLength;
          setSessionBytes((prev) => prev + payloadBytes);
        }
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
  }, [currentPageNumber, isDataSaver]);

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

  const handleRefreshLive = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchPublishedPage(currentPageNumber, fetch, false);
      if (res.success && res.data) {
        setPageData(res.data);
        if (res.data.pack) {
          await savePageLocally(res.data.pack);
          setIsSaved(true);
        }
      }
    } catch {
      // Keep existing local state on network error
    } finally {
      setIsLoading(false);
    }
  }, [currentPageNumber]);

  const isStaleCopy = isOnline && pageData?.isSavedCopy && isCopyStale(pageData.publishedAt);
  const isExpired = isNoticeExpired((pageData?.pack?.metadata as any)?.validUntil);

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
    onToggleEvidence: () => setIsEvidenceOpen((prev) => !prev),
    onToggleDataSaver: handleToggleDataSaver,
  });

  return (
    <div
      className={`mx-auto flex w-full max-w-4xl flex-col items-center gap-3 ${className}`.trim()}
    >
      {/* Top Utility & Mode Bar */}
      <div className="border-surface-border bg-surface-panel flex w-full flex-col justify-between gap-2 rounded border px-3 py-2 font-mono text-xs sm:flex-row sm:items-center sm:text-sm">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* View Mode Toggle */}
          <button
            type="button"
            onClick={() => setViewMode((prev) => (prev === "crt" ? "accessible" : "crt"))}
            className={`btn-tactile rounded border px-2.5 py-1 text-xs font-semibold transition-all active:scale-95 sm:text-sm ${
              viewMode === "accessible"
                ? "border-teletext-green bg-teletext-green text-teletext-black font-bold shadow-[0_0_8px_rgba(0,255,0,0.3)]"
                : "border-surface-border bg-surface-terminal text-text-primary hover:border-teletext-yellow hover:text-teletext-yellow"
            }`}
            aria-label={
              viewMode === "crt"
                ? "Switch to text-only accessible view"
                : "Switch to CRT visual grid view"
            }
          >
            <span className="sm:hidden">{viewMode === "crt" ? "ACCESSIBLE" : "CRT MODE"}</span>
            <span className="hidden sm:inline">
              {viewMode === "crt" ? "ACCESSIBLE TEXT MODE" : "CRT DISPLAY MODE"}
            </span>
          </button>

          {/* Data Saver Mode Toggle (ENH-05) */}
          <button
            type="button"
            onClick={handleToggleDataSaver}
            className={`btn-tactile rounded border px-2.5 py-1 text-xs font-semibold transition-all active:scale-95 sm:text-sm ${
              isDataSaver
                ? "border-cyan-400 bg-cyan-950/70 font-bold text-cyan-300 shadow-[0_0_8px_rgba(0,255,255,0.25)]"
                : "border-surface-border bg-surface-terminal text-text-primary hover:border-teletext-yellow hover:text-teletext-yellow"
            }`}
            aria-label={
              isDataSaver
                ? "Disable Low-Bandwidth Data Saver Mode"
                : "Enable Low-Bandwidth Data Saver Mode"
            }
          >
            <span className="sm:hidden">{isDataSaver ? "⚡ SAVER ON" : "SAVER"}</span>
            <span className="hidden sm:inline">
              {isDataSaver ? "⚡ DATA SAVER ON" : "DATA SAVER [D]"}
            </span>
          </button>

          {/* Buffer Dialing Indicator */}
          {dialBuffer && (
            <span className="border-teletext-yellow bg-teletext-yellow/20 text-teletext-yellow flex animate-pulse items-center gap-1 rounded border px-2 py-0.5 text-xs font-bold sm:text-sm">
              DIALING: P{dialBuffer}__
            </span>
          )}
        </div>

        {/* Action Buttons: Save, Shortcuts & Share */}
        <div className="no-scrollbar flex flex-wrap items-center gap-1.5 overflow-x-auto sm:gap-2 sm:overflow-visible">
          {/* Save / Remove Offline Page */}
          <button
            type="button"
            onClick={handleToggleSave}
            disabled={!pageData?.pack}
            className={`btn-tactile flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-semibold transition-all active:scale-95 sm:text-sm ${
              isSaved
                ? "border-teletext-green bg-teletext-green/20 text-teletext-green shadow-[0_0_8px_rgba(0,255,0,0.2)]"
                : "border-surface-border bg-surface-terminal text-text-primary hover:border-teletext-yellow hover:text-teletext-yellow"
            } ${!pageData?.pack ? "cursor-not-allowed opacity-50" : ""}`}
            aria-label={
              isSaved
                ? "Remove saved offline bulletin"
                : "Save bulletin locally for offline reading"
            }
          >
            <span className="sm:hidden">{isSaved ? "★ SAVED" : "☆ SAVE"}</span>
            <span className="hidden sm:inline">
              {isSaved ? "★ SAVED OFFLINE" : "☆ SAVE OFFLINE"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsEvidenceOpen(true)}
            className="btn-tactile border-surface-border bg-surface-terminal text-text-primary hover:border-teletext-cyan hover:text-teletext-cyan flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs transition-all active:scale-95 sm:text-sm"
            aria-label="Inspect source sentence evidence and attribution"
          >
            <span className="sm:hidden">EVID</span>
            <span className="hidden sm:inline">EVIDENCE [E]</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="btn-tactile border-surface-border bg-surface-terminal text-text-primary hover:border-teletext-cyan hover:text-teletext-cyan flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs transition-all active:scale-95 sm:text-sm"
            aria-label="Share bulletin or export PagePack QR code"
          >
            SHARE / QR
          </button>

          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="btn-tactile border-surface-border bg-surface-terminal text-text-primary hover:border-teletext-yellow hover:text-teletext-yellow flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs transition-all active:scale-95"
            aria-label="Import PagePack JSON file"
          >
            <span className="sm:hidden">IMPORT</span>
            <span className="hidden sm:inline">IMPORT JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="btn-tactile border-surface-border bg-surface-terminal text-text-primary hover:border-teletext-green hover:text-teletext-green flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs transition-all active:scale-95"
            aria-label="Scan optical QR code or air-gap burst"
          >
            <span className="sm:hidden">SCAN</span>
            <span className="hidden sm:inline">SCAN QR</span>
          </button>

          <button
            type="button"
            onClick={() => setIsShortcutsOpen(true)}
            className="btn-tactile border-surface-border bg-surface-terminal text-text-muted hover:text-teletext-white flex items-center gap-1 rounded border px-2 py-1 text-xs transition-all active:scale-95"
            aria-label="Open keyboard shortcuts help modal"
          >
            KEYS (?)
          </button>
        </div>
      </div>

      {/* Data Saver Mode Status Banner (ENH-05) */}
      {isDataSaver && (
        <div className="flex w-full items-center justify-between border border-cyan-800/60 bg-cyan-950/40 px-3 py-1 font-mono text-xs text-cyan-300">
          <span className="flex items-center gap-1.5 font-bold">
            <span>⚡ DATA SAVER ACTIVE</span>
            <span className="hidden font-normal text-zinc-400 sm:inline">
              • System Monospace Font • CRT Glow &amp; Scanlines Off • Cache-First Resolution
            </span>
          </span>
          <span className="font-bold text-emerald-400">
            Network: {(sessionBytes / 1024).toFixed(1)} KB
          </span>
        </div>
      )}

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
            revision={pageData?.revision}
            updatedAt={pageData?.publishedAt}
          />

          {/* Stale Local Copy Warning Banner (ENH-06) */}
          {isStaleCopy && (
            <div className="flex w-full flex-wrap items-center justify-between gap-2 border-2 border-amber-500 bg-amber-950/80 p-2.5 font-mono text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <div>
                  <strong className="text-amber-400">STALE LOCAL COPY:</strong> Revision{" "}
                  {pageData?.revision ?? 1} saved {formatRelativeFreshness(pageData?.publishedAt)}.
                  Newer broadcast updates may be available.
                </div>
              </div>
              <button
                type="button"
                onClick={handleRefreshLive}
                className="cursor-pointer border border-amber-400 bg-amber-500 px-2.5 py-1 text-xs font-bold text-black hover:bg-amber-400"
              >
                REFRESH LIVE
              </button>
            </div>
          )}

          {/* Time-Sensitive Notice Expired Banner (ENH-06) */}
          {isExpired && (
            <div className="flex w-full items-center gap-2 border-2 border-red-500/80 bg-red-950/80 p-2.5 font-mono text-xs text-red-200">
              <span className="text-base">⏳</span>
              <div>
                <strong className="text-red-400">NOTICE EXPIRED:</strong> This time-sensitive
                advisory has passed its valid window. Content preserved for offline reference.
              </div>
            </div>
          )}

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
                  showScanlines={isDataSaver ? false : showScanlines}
                  phosphorGlow={isDataSaver ? false : phosphorGlow}
                  useSystemFont={isDataSaver}
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

      {/* Optical QR & Air-Gap Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onNavigateToPage={(pageNum) => {
          setIsScannerOpen(false);
          handleNavigate(pageNum);
        }}
        onPackIngested={(pack) => {
          setIsScannerOpen(false);
          handleNavigate(pack.primaryPageNumber);
        }}
      />

      {/* Source Evidence Explorer Drawer (TASK-ENH-01) */}
      <EvidenceDrawer
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
        pack={pageData?.pack}
        pageNumber={currentPageNumber}
        reviewedBy={pageData?.pack?.metadata?.publisherId}
        reviewedAt={pageData?.publishedAt}
      />
    </div>
  );
};
