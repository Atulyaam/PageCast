"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import { Zap, AlertTriangle, Clock } from "lucide-react";
import type { TeletextPage } from "@/domain/teletext/types";
import { getSeedPage, getSeedPageCatalog, page100 } from "@/data/seed-pages";
import { isValidPageNumber } from "@/domain/validation/page-number";
import { fetchPublishedPage, type PublishedPageResponse } from "@/lib/reader/reader-client";
import { getTeletextSynthesizer } from "@/lib/audio/teletext-synthesizer";
import { getBulletinSpeechReader } from "@/lib/audio/speech-reader";
import { useTeletextKeyboard } from "@/hooks/useTeletextKeyboard";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { savePageLocally, removeSavedPage, isPageSaved } from "@/lib/storage/saved-pages";
import {
  formatRelativeFreshness,
  isCopyStale,
  isNoticeExpired,
} from "@/domain/freshness/freshness";

import { DeviceChassis } from "./DeviceChassis";
import { DeviceScreenBay } from "./DeviceScreenBay";
import { DeviceControlDeck } from "./DeviceControlDeck";
import { DeviceAuxDeck } from "./DeviceAuxDeck";
import { AccessibleTextView } from "../teletext/AccessibleTextView";

// Code splitting & lazy loading for heavy dialogs
const KeyboardShortcutsModal = dynamic(
  () => import("../teletext/KeyboardShortcutsModal").then((mod) => mod.KeyboardShortcutsModal),
  { ssr: false }
);

const ExportDialog = dynamic(
  () => import("@/components/publisher/ExportDialog").then((mod) => mod.ExportDialog),
  { ssr: false }
);

const ImportDialog = dynamic(
  () => import("../teletext/ImportDialog").then((mod) => mod.ImportDialog),
  { ssr: false }
);

const QrScannerModal = dynamic(
  () => import("../teletext/QrScannerModal").then((mod) => mod.QrScannerModal),
  { ssr: false }
);

const EvidenceDrawer = dynamic(
  () => import("../teletext/EvidenceDrawer").then((mod) => mod.EvidenceDrawer),
  { ssr: false }
);

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

function subscribeTts(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  return getBulletinSpeechReader().subscribe(callback);
}

function getTtsSupportedSnapshot(): boolean {
  return getBulletinSpeechReader().isSupported;
}

function getServerTtsSupportedSnapshot(): boolean {
  return false;
}

function getTtsSpeakingSnapshot(): boolean {
  return getBulletinSpeechReader().isSpeaking;
}

function getServerTtsSpeakingSnapshot(): boolean {
  return false;
}

export interface PageCastDeviceProps {
  readonly initialPageNumber?: number;
  readonly initialSubPage?: number;
  readonly className?: string;
}

export const PageCastDevice: React.FC<PageCastDeviceProps> = ({
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

  // Audio synthesizer & speech state (hydration-safe external store subscriptions)
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const ttsSupported = useSyncExternalStore(
    subscribeTts,
    getTtsSupportedSnapshot,
    getServerTtsSupportedSnapshot
  );
  const isSpeaking = useSyncExternalStore(
    subscribeTts,
    getTtsSpeakingSnapshot,
    getServerTtsSpeakingSnapshot
  );

  // Stop speech synthesis on component unmount
  useEffect(() => {
    return () => {
      getBulletinSpeechReader().stop();
    };
  }, []);

  // Dialer input buffer state
  const [dialerBuffer, setDialerBuffer] = useState<string>("");

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

  const handleToggleMute = useCallback(() => {
    const synth = getTeletextSynthesizer();
    if (!synth.isInitialized) {
      synth.initialize();
    }
    const nextMuted = !synth.muted;
    synth.setMuted(nextMuted);
    setIsMuted(nextMuted);
  }, []);

  const handleToggleSpeech = useCallback(() => {
    const reader = getBulletinSpeechReader();
    if (!reader.isSupported) return;

    if (isSpeaking) {
      reader.stop();
    } else {
      reader.speak(activePage);
    }
  }, [activePage, isSpeaking]);

  // Navigate handler with carrier tone
  const handleNavigate = useCallback(
    (pageNumber: number) => {
      if (!isValidPageNumber(pageNumber)) return;

      const synth = getTeletextSynthesizer();
      synth.playTuningChirp(pageNumber);

      startTransition(() => {
        setCurrentPageNumber(pageNumber);
        setCurrentSubIndex(0);
        setDialerBuffer("");
        updateUrl(pageNumber);
      });
    },
    [updateUrl]
  );

  // Stepper handlers
  const handlePrevPage = useCallback(() => {
    const currentIndex = catalog.indexOf(currentPageNumber);
    const prevPage = currentIndex > 0 ? catalog[currentIndex - 1] : catalog[catalog.length - 1];
    handleNavigate(prevPage);
  }, [catalog, currentPageNumber, handleNavigate]);

  const handleNextPage = useCallback(() => {
    const currentIndex = catalog.indexOf(currentPageNumber);
    const nextPage =
      currentIndex >= 0 && currentIndex < catalog.length - 1
        ? catalog[currentIndex + 1]
        : catalog[0];
    handleNavigate(nextPage);
  }, [catalog, currentPageNumber, handleNavigate]);

  // Keypad buffer dialing
  const handleDigit = useCallback(
    (digit: string) => {
      const synth = getTeletextSynthesizer();
      synth.playNavigationTick();

      const next = dialerBuffer + digit;
      if (next.length === 3) {
        const target = parseInt(next, 10);
        if (isValidPageNumber(target)) {
          handleNavigate(target);
        } else {
          synth.playNavigationTick();
          setDialerBuffer("");
        }
      } else if (next.length < 3) {
        setDialerBuffer(next);
      }
    },
    [dialerBuffer, handleNavigate]
  );

  const handleClear = useCallback(() => {
    setDialerBuffer("");
  }, []);

  const handleIndex = useCallback(() => {
    handleNavigate(100);
  }, [handleNavigate]);

  // SubPage change handler
  const handleSubPageChange = useCallback((index: number) => {
    startTransition(() => {
      setCurrentSubIndex(index);
    });
  }, []);

  // Fetch page data
  useEffect(() => {
    let isCancelled = false;

    async function loadPage() {
      setIsLoading(true);
      setIsNotFound(false);

      try {
        const response = await fetchPublishedPage(currentPageNumber, fetch, isDataSaver);
        if (isCancelled) return;

        if (response.success && response.data) {
          setPageData(response.data);
          setIsNotFound(false);

          if (!response.data.isSavedCopy && !response.data.isFallback && response.data.pack) {
            const packBytes = new TextEncoder().encode(JSON.stringify(response.data.pack)).length;
            setSessionBytes((prev) => prev + packBytes);
          }
        } else if (response.notFound) {
          setIsNotFound(true);
          setPageData(null);
        } else {
          const fallback = getSeedPage(currentPageNumber);
          if (fallback) {
            setIsNotFound(false);
          } else {
            setIsNotFound(true);
          }
        }
      } catch {
        if (!isCancelled) {
          const fallback = getSeedPage(currentPageNumber);
          if (fallback) {
            setIsNotFound(false);
          } else {
            setIsNotFound(true);
          }
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

  // Offline save/remove handler
  const handleToggleSave = useCallback(async () => {
    if (!pageData?.pack) return;

    if (isSaved) {
      const removed = await removeSavedPage(currentPageNumber);
      if (removed) setIsSaved(false);
    } else {
      const result = await savePageLocally(pageData.pack);
      if (result.success) {
        setIsSaved(true);
        getTeletextSynthesizer().playFastextTone("green");
      }
    }
  }, [currentPageNumber, isSaved, pageData]);

  // Data saver toggle
  const handleToggleDataSaver = useCallback(() => {
    const nextState = !isDataSaver;
    try {
      localStorage.setItem(DATA_SAVER_STORAGE_KEY, String(nextState));
      window.dispatchEvent(new Event("pagecast_data_saver_change"));
    } catch (e) {
      console.warn("Failed to persist data saver state", e);
    }
  }, [isDataSaver]);

  // Refresh stale copy
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

  // Freshness indicators
  const isStaleCopy = isOnline && pageData?.isSavedCopy && isCopyStale(pageData?.publishedAt);
  const isExpired = isNoticeExpired((pageData?.pack?.metadata as any)?.validUntil);

  // Keyboard navigation hook
  const { dialBuffer } = useTeletextKeyboard({
    enabled:
      !isShortcutsOpen && !isExportOpen && !isImportOpen && !isScannerOpen && !isEvidenceOpen,
    onNavigatePage: handleNavigate,
    onNextPage: handleNextPage,
    onPrevPage: handlePrevPage,
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
    onToggleAudio: handleToggleMute,
    onToggleTextMode: () => setViewMode((prev) => (prev === "crt" ? "accessible" : "crt")),
    onToggleEvidence: () => setIsEvidenceOpen((prev) => !prev),
    onToggleDataSaver: handleToggleDataSaver,
  });

  const activeBuffer = dialBuffer || dialerBuffer;
  const bufferDisplay = activeBuffer ? `P${activeBuffer.padEnd(3, "_")}` : `P${currentPageNumber}`;

  return (
    <div
      className={`mx-auto flex w-full max-w-6xl flex-col items-center select-none ${className}`.trim()}
    >
      <DeviceChassis
        isLive={isOnline && !pageData?.isFallback && !pageData?.isSavedCopy}
        carrierLocked={isOnline}
      >
        {/* Data Saver Active Notification */}
        {isDataSaver && (
          <div className="mb-3 flex w-full items-center justify-between rounded border border-[#1b676e] bg-[#0c262a] px-3 py-1 font-mono text-xs text-[#76c7cd]">
            <span className="flex items-center gap-1.5 font-bold">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>LOW-BANDWIDTH DATA SAVER ACTIVE</span>
              <span className="hidden font-normal text-[#4e8d93] sm:inline">
                • Raw Monospace Font • Scanlines Disabled • Cache-First Mode
              </span>
            </span>
            <span className="font-bold text-[#b8d1a2]">
              RX: {(sessionBytes / 1024).toFixed(1)} KiB
            </span>
          </div>
        )}

        {/* Stale / Expired Bulletins */}
        {isStaleCopy && (
          <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-2 rounded border border-[#846114] bg-[#2d2208] p-2 font-mono text-xs text-[#f6dfa9]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#d1a15d]" />
              <div>
                <strong className="text-[#d1a15d]">STALE LOCAL COPY:</strong> Revision{" "}
                {pageData?.revision ?? 1} saved {formatRelativeFreshness(pageData?.publishedAt)}.
              </div>
            </div>
            <button
              type="button"
              onClick={handleRefreshLive}
              className="cursor-pointer rounded bg-[#d1a15d] px-2.5 py-0.5 text-xs font-bold text-[#0d1410] hover:bg-[#e0b475]"
            >
              REFRESH LIVE
            </button>
          </div>
        )}

        {isExpired && (
          <div className="mb-3 flex w-full items-center gap-2 rounded border border-[#801d14] bg-[#2a0e0b] p-2 font-mono text-xs text-[#ff9e94]">
            <Clock className="h-4 w-4 shrink-0 text-[#ef4444]" />
            <div>
              <strong className="text-[#ef4444]">NOTICE EXPIRED:</strong> Content preserved for
              offline reference.
            </div>
          </div>
        )}

        {/* Console Workspace: Screen Bay (Left) & Control Deck (Right) */}
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
              <DeviceScreenBay
                pageNumber={currentPageNumber}
                activePage={activePage}
                currentSubIndex={currentSubIndex}
                subPageCount={subPageCount}
                isLoading={isLoading}
                isNotFound={isNotFound}
                isOffline={!isOnline || pageData?.isFallback || pageData?.isSavedCopy}
                showScanlines={showScanlines}
                phosphorGlow={phosphorGlow}
                isDataSaver={isDataSaver}
                onToggleScanlines={() => setShowScanlines((prev) => !prev)}
                onTogglePhosphorGlow={() => setPhosphorGlow((prev) => !prev)}
                onNavigate={handleNavigate}
                onSubPageChange={handleSubPageChange}
              />
            )}
          </div>

          {/* Right Bay: Hardware Control Deck (lg:col-span-4) */}
          <div className="flex flex-col gap-3 lg:col-span-4">
            <DeviceControlDeck
              bufferDisplay={bufferDisplay}
              isMuted={isMuted}
              isSpeaking={isSpeaking}
              ttsSupported={ttsSupported}
              activePage={activePage}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
              onToggleMute={handleToggleMute}
              onToggleSpeech={handleToggleSpeech}
              onDigit={handleDigit}
              onClear={handleClear}
              onIndex={handleIndex}
            />
          </div>
        </div>

        {/* Lower Accessory Deck */}
        <DeviceAuxDeck
          viewMode={viewMode}
          isDataSaver={isDataSaver}
          isSaved={isSaved}
          isSaveDisabled={!pageData?.pack}
          onToggleViewMode={() => setViewMode((prev) => (prev === "crt" ? "accessible" : "crt"))}
          onToggleDataSaver={handleToggleDataSaver}
          onToggleSave={handleToggleSave}
          onOpenEvidence={() => setIsEvidenceOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenImport={() => setIsImportOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />
      </DeviceChassis>

      {/* Floating Dialogs and Modals */}
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        pageNumber={currentPageNumber}
        pack={pageData?.pack}
      />

      <ImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={(pack) => {
          setIsImportOpen(false);
          handleNavigate(pack.primaryPageNumber);
        }}
      />

      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onNavigateToPage={(num) => {
          setIsScannerOpen(false);
          handleNavigate(num);
        }}
        onPackIngested={(pack) => {
          setIsScannerOpen(false);
          handleNavigate(pack.primaryPageNumber);
        }}
      />

      <EvidenceDrawer
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
        pack={pageData?.pack}
        pageNumber={currentPageNumber}
        reviewedBy={pageData?.pack?.metadata?.publisherId || "editorial_desk"}
        reviewedAt={pageData?.publishedAt}
      />
    </div>
  );
};
