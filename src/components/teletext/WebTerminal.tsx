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
      className={`mx-auto flex w-full max-w-5xl flex-col items-center select-none ${className}`.trim()}
    >
      {/* Physical Terminal Chassis */}
      <div className="chassis-body relative flex w-full flex-col p-3 transition-all sm:p-5 lg:p-6">
        {/* Chassis Top Branding & Fasteners */}
        <div className="mb-3 flex items-center justify-between border-b border-[#777970] pb-2 font-mono text-[10px] text-[#4b5249]">
          <div className="flex items-center gap-2">
            <span className="chassis-screw" aria-hidden="true" />
            <span className="font-bold tracking-widest text-[#2f342d] uppercase">
              PAGECAST RECEIVER // SYSTEM PT-4025
            </span>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="tracking-wider text-[#575d53] uppercase">
              TELETEXT 625-LINE STANDARD
            </span>
            <span className="chassis-screw" aria-hidden="true" />
          </div>
        </div>

        {/* Data Saver Mode Status Banner */}
        {isDataSaver && (
          <div className="mb-3 flex w-full items-center justify-between rounded-xs border border-[#1b676e] bg-[#0c262a] px-3 py-1 font-mono text-xs text-[#76c7cd]">
            <span className="flex items-center gap-1.5 font-bold">
              <span>⚡ LOW-BANDWIDTH DATA SAVER ACTIVE</span>
              <span className="hidden font-normal text-[#4e8d93] sm:inline">
                • Raw Monospace Font • Scanlines Disabled • Cache-First Mode
              </span>
            </span>
            <span className="font-bold text-[#b7c9a8]">
              RX: {(sessionBytes / 1024).toFixed(1)} KiB
            </span>
          </div>
        )}

        {/* Physical Grid & Controls Layout */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
          {/* Main Left Bay: Recessed Screen Housing (lg:col-span-8) */}
          <div className="flex flex-col gap-2.5 lg:col-span-8">
            {viewMode === "accessible" ? (
              <AccessibleTextView
                page={activePage}
                sourceUrl={pageData?.pack?.metadata?.sourceName}
                publishedAt={pageData?.publishedAt}
                onNavigate={handleNavigate}
                onToggleViewMode={() => setViewMode("crt")}
              />
            ) : (
              <div className="screen-bay flex flex-col overflow-hidden p-1 sm:p-1.5">
                {/* Embedded Status Bar */}
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

                {/* Stale Local Copy Warning Banner */}
                {isStaleCopy && (
                  <div className="flex w-full flex-wrap items-center justify-between gap-2 border-b border-[#846114] bg-[#2d2208] p-2 font-mono text-xs text-[#f6dfa9]">
                    <div className="flex items-center gap-2">
                      <span>⚠️</span>
                      <div>
                        <strong className="text-[#c69b5b]">STALE LOCAL COPY:</strong> Revision{" "}
                        {pageData?.revision ?? 1} saved{" "}
                        {formatRelativeFreshness(pageData?.publishedAt)}.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRefreshLive}
                      className="cursor-pointer rounded-xs bg-[#c69b5b] px-2 py-0.5 text-xs font-bold text-[#0d1410] hover:bg-[#d6ab6b]"
                    >
                      REFRESH LIVE
                    </button>
                  </div>
                )}

                {/* Notice Expired Banner */}
                {isExpired && (
                  <div className="flex w-full items-center gap-2 border-b border-[#801d14] bg-[#2a0e0b] p-2 font-mono text-xs text-[#ff9e94]">
                    <span>⏳</span>
                    <div>
                      <strong className="text-[#ef4444]">NOTICE EXPIRED:</strong> Content preserved
                      for offline reference.
                    </div>
                  </div>
                )}

                {/* SubPage Carousel Bar */}
                {subPageCount > 1 && (
                  <SubPageCarousel
                    pageNumber={currentPageNumber}
                    currentSubIndex={currentSubIndex}
                    subPageCount={subPageCount}
                    onSubPageChange={handleSubPageChange}
                  />
                )}

                {/* 40x25 Screen Canvas */}
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
                      <div className="mt-1.5 p-0.5">
                        <TeletextFastextBar
                          fastext={activePage.fastext}
                          onNavigate={handleNavigate}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Bay: Hardware Tuning & Audio Console (lg:col-span-4) */}
          <div className="flex flex-col gap-3 lg:col-span-4">
            <TeletextDialer
              currentPage={currentPageNumber}
              catalogue={catalog}
              fastext={activePage.fastext}
              onNavigate={handleNavigate}
            />

            <AudioControls page={activePage} />

            {/* Ventilation micro-louvers decorative hardware detail */}
            <div
              className="hidden flex-col gap-1 rounded-sm border border-[#777970] bg-[#9e9d93] p-2.5 shadow-inner lg:flex"
              aria-hidden="true"
            >
              <div className="flex items-center justify-between font-mono text-[9px] font-bold tracking-widest text-[#474c44] uppercase">
                <span>VENTILATION // HEATSINK</span>
                <span>MODEL PT-4025</span>
              </div>
              <div className="chassis-louver" />
              <div className="chassis-louver" />
              <div className="chassis-louver" />
            </div>
          </div>
        </div>

        {/* Lower Accessory & Utility Deck */}
        <div className="mt-4 flex flex-col justify-between gap-3 border-t border-[#777970] pt-3 font-mono text-xs text-[#2f342d] sm:flex-row sm:items-center">
          {/* Mode & Data Saver Switches */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode((prev) => (prev === "crt" ? "accessible" : "crt"))}
              className={`btn-keycap-light cursor-pointer px-2.5 py-1 text-xs font-bold transition-all ${
                viewMode === "accessible"
                  ? "!border-[#226f43] !bg-[#2f8c56] !text-white shadow-[0_0_8px_rgba(47,140,86,0.4)]"
                  : ""
              }`}
              aria-label={
                viewMode === "crt"
                  ? "Switch to text-only accessible view"
                  : "Switch to CRT visual grid view"
              }
            >
              <span className="sm:hidden">{viewMode === "crt" ? "ACCESSIBLE" : "CRT MODE"}</span>
              <span className="hidden sm:inline">
                {viewMode === "crt" ? "ACCESSIBLE TEXT MODE [M]" : "CRT DISPLAY MODE [M]"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleToggleDataSaver}
              className={`btn-keycap-light cursor-pointer px-2.5 py-1 text-xs font-bold transition-all ${
                isDataSaver
                  ? "!border-[#1b676e] !bg-[#268790] !text-white shadow-[0_0_8px_rgba(38,135,144,0.4)]"
                  : ""
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

            {dialBuffer && (
              <span className="led-window animate-pulse px-2 py-0.5 text-xs font-bold text-[#c69b5b]">
                DIALING: P{dialBuffer}__
              </span>
            )}
          </div>

          {/* Action Buttons: Save, Evidence, Share, Import, Scan, Keys */}
          <div className="no-scrollbar flex flex-wrap items-center gap-1.5 overflow-x-auto sm:overflow-visible">
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={!pageData?.pack}
              className={`btn-keycap-light flex cursor-pointer items-center gap-1 px-2.5 py-1 text-xs font-bold transition-all ${
                isSaved
                  ? "!border-[#226f43] !bg-[#2f8c56] !text-white shadow-[0_0_8px_rgba(47,140,86,0.3)]"
                  : ""
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
              className="btn-keycap-light cursor-pointer px-2.5 py-1 text-xs font-bold transition-all"
              aria-label="Inspect source sentence evidence and attribution"
            >
              <span className="sm:hidden">EVID</span>
              <span className="hidden sm:inline">EVIDENCE [E]</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="btn-keycap-light cursor-pointer px-2.5 py-1 text-xs font-bold transition-all"
              aria-label="Share bulletin or export PagePack QR code"
            >
              SHARE / QR
            </button>

            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="btn-keycap-light cursor-pointer px-2 py-1 text-xs font-bold transition-all"
              aria-label="Import PagePack JSON file"
            >
              <span className="sm:hidden">IMPORT</span>
              <span className="hidden sm:inline">IMPORT JSON</span>
            </button>

            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="btn-keycap-light cursor-pointer px-2 py-1 text-xs font-bold transition-all"
              aria-label="Scan optical QR code or air-gap burst"
            >
              <span className="sm:hidden">SCAN</span>
              <span className="hidden sm:inline">SCAN QR</span>
            </button>

            <button
              type="button"
              onClick={() => setIsShortcutsOpen(true)}
              className="btn-keycap-light cursor-pointer px-2 py-1 text-xs font-bold transition-all"
              aria-label="Open keyboard shortcuts help modal"
            >
              KEYS (?)
            </button>
          </div>
        </div>

        {/* Bottom Fasteners */}
        <div
          className="mt-2 flex items-center justify-between border-t border-[#777970] pt-1.5"
          aria-hidden="true"
        >
          <span className="chassis-screw" />
          <span className="font-mono text-[9px] font-bold tracking-widest text-[#575d53] uppercase">
            KIROWEEN 2026 // HARDWARE SPEC V1.0
          </span>
          <span className="chassis-screw" />
        </div>
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
