"use client";

/**
 * PageCast Optical QR Scanner & Air-Gap Receiver Modal (TASK-S4-OFF-10 / TR-009)
 *
 * Implements camera-based QR code scanning with optical detection, video viewfinder,
 * permission handling, fallback manual input, and continuous multi-frame air-gap packet
 * reassembly with cryptographic SHA-256 integrity verification.
 */

import React, { useState, useEffect, useRef, useCallback, useTransition } from "react";
import {
  MultiFrameReassembler,
  classifyScannedQr,
  type ReassemblyProgress,
} from "@/lib/qr/multi-frame-codec";
import type { PagePackV1 } from "@/domain/page-pack/types";
import { savePageLocally } from "@/lib/storage/saved-pages";
import { measurePagePack } from "@/domain/page-pack/codec";
import { FocusTrap } from "@/components/common/FocusTrap";

export interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPage?: (pageNumber: number) => void;
  onPackIngested?: (pack: PagePackV1) => void;
}

function QrScannerModalContent({
  onClose,
  onNavigateToPage,
  onPackIngested,
}: {
  onClose: () => void;
  onNavigateToPage?: (pageNumber: number) => void;
  onPackIngested?: (pack: PagePackV1) => void;
}) {
  const [cameraState, setCameraState] = useState<"idle" | "scanning" | "denied" | "unsupported">(
    "idle"
  );
  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");
  const [manualText, setManualText] = useState<string>("");

  const [reassemblyProgress, setReassemblyProgress] = useState<ReassemblyProgress | null>(null);
  const [completedPack, setCompletedPack] = useState<PagePackV1 | null>(null);
  const [detectedUrl, setDetectedUrl] = useState<{ url: string; pageNumber?: number } | null>(null);
  const [corruptedError, setCorruptedError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [reassembler] = useState(() => new MultiFrameReassembler());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [, startTransition] = useTransition();

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Handle QR string ingestion
  const processQrPayload = useCallback(
    async (rawText: string) => {
      if (!rawText.trim()) return;

      setCorruptedError(null);
      const classified = classifyScannedQr(rawText);

      if (classified.type === "multiframe") {
        const result = await reassembler.feedFrame(rawText);

        if (result.status === "progress") {
          startTransition(() => {
            setReassemblyProgress(result.progress);
          });
        } else if (result.status === "complete") {
          startTransition(() => {
            setReassemblyProgress(null);
            setCompletedPack(result.pack);
          });
          onPackIngested?.(result.pack);
        } else if (result.status === "corrupted") {
          startTransition(() => {
            setCorruptedError(result.error);
          });
        }
      } else if (classified.type === "url") {
        startTransition(() => {
          setDetectedUrl({ url: classified.url, pageNumber: classified.pageNumber });
        });
      } else if (classified.type === "json") {
        startTransition(() => {
          setCompletedPack(classified.pack);
        });
        onPackIngested?.(classified.pack);
      } else {
        setCorruptedError(`Unrecognized QR payload: "${rawText.slice(0, 40)}..."`);
      }
    },
    [reassembler, onPackIngested]
  );

  // Camera stream lifecycle
  useEffect(() => {
    if (activeTab !== "camera") return;

    let isCancelled = false;

    async function startCamera() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        if (!isCancelled) setCameraState("unsupported");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraState("scanning");

        // Optical detector loop if supported in browser
        if (typeof window !== "undefined" && "BarcodeDetector" in window) {
          const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });

          intervalRef.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0) {
                  const rawVal = barcodes[0].rawValue;
                  if (rawVal) {
                    processQrPayload(rawVal);
                  }
                }
              } catch {
                // Video frame not ready
              }
            }
          }, 150);
        }
      } catch (err: any) {
        if (isCancelled) return;
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setCameraState("denied");
        } else {
          setCameraState("unsupported");
        }
      }
    }

    startCamera();

    return () => {
      isCancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [activeTab, processQrPayload]);

  const handleSaveToVault = async () => {
    if (!completedPack) return;
    setIsSaving(true);
    try {
      const res = await savePageLocally(completedPack);
      if (res.success) {
        setIsSaved(true);
      } else {
        setCorruptedError(res.error || "Failed to persist to IndexedDB.");
      }
    } catch (err: any) {
      setCorruptedError(err?.message || "Storage error.");
    } finally {
      setIsSaving(false);
    }
  };

  const budget = completedPack ? measurePagePack(completedPack) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 font-mono backdrop-blur-xs"
    >
      <FocusTrap onClose={onClose} className="w-full max-w-lg">
        <div className="flex w-full flex-col gap-4 rounded-xl border border-[#3A453F] bg-[#141B17] p-6 text-[#D1DCD0] shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#2A352F] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="rounded border border-[#3A453F] bg-[#222924] px-2 py-0.5 text-xs font-bold text-[#879B83]">
                SCANNER
              </span>
              <h2
                id="qr-scanner-title"
                className="text-sm font-bold tracking-wider text-[#B7C9A8] uppercase"
              >
                OPTICAL QR &amp; AIR-GAP RECEIVER
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-keycap-light cursor-pointer rounded border border-[#3A453F] bg-[#222924] px-2.5 py-1 text-xs text-[#A8B7A4] transition-all hover:border-[#4E5C54] hover:text-[#E8ECE6] active:scale-95"
              aria-label="Close scanner dialog"
            >
              ESC [✕]
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("camera")}
              className={`rounded px-3 py-1 font-semibold transition-colors ${
                activeTab === "camera"
                  ? "border border-[#3A453F] bg-[#2E3B33] font-bold text-[#B7C9A8]"
                  : "border border-[#2A352F] bg-[#18211D] text-[#879B83] hover:text-[#D1DCD0]"
              }`}
            >
              CAMERA SCANNER
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`rounded px-3 py-1 font-semibold transition-colors ${
                activeTab === "manual"
                  ? "border border-[#3A453F] bg-[#2E3B33] font-bold text-[#B7C9A8]"
                  : "border border-[#2A352F] bg-[#18211D] text-[#879B83] hover:text-[#D1DCD0]"
              }`}
            >
              MANUAL CODE INPUT
            </button>
          </div>

          {/* Camera Viewfinder */}
          {activeTab === "camera" && (
            <div className="relative flex h-60 w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-[#2A352F] bg-[#0D1410]">
              {cameraState === "scanning" && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                  {/* Retro CRT viewfinder overlay */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-36 w-36 animate-pulse border-2 border-dashed border-[#B7C9A8]/80 shadow-[0_0_15px_rgba(183,201,168,0.25)]" />
                  </div>
                  <div className="absolute bottom-2 rounded bg-black/75 px-2 py-0.5 text-[10px] tracking-widest text-[#B7C9A8] uppercase">
                    SCANNING OPTICAL CODE...
                  </div>
                </>
              )}

              {cameraState === "denied" && (
                <div className="p-4 text-center text-xs">
                  <p className="font-bold text-[#DE5B5B]">CAMERA PERMISSION DENIED</p>
                  <p className="mt-1 text-[11px] text-[#879B83]">
                    Please allow camera access in your browser, or switch to the manual code input
                    tab.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("manual")}
                    className="btn-keycap-light mt-3 rounded border border-[#3A453F] bg-[#222924] px-3 py-1 text-xs font-bold text-[#C69B5B] transition-colors hover:text-white"
                  >
                    SWITCH TO MANUAL INPUT
                  </button>
                </div>
              )}

              {cameraState === "unsupported" && (
                <div className="p-4 text-center text-xs">
                  <p className="font-bold text-[#C69B5B]">CAMERA NOT ACCESSIBLE</p>
                  <p className="mt-1 text-[11px] text-[#879B83]">
                    Camera hardware or API is unavailable in this environment. Use manual input
                    below.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("manual")}
                    className="btn-keycap-light mt-3 rounded border border-[#3A453F] bg-[#222924] px-3 py-1 text-xs font-bold text-[#B7C9A8] transition-colors hover:text-white"
                  >
                    SWITCH TO MANUAL INPUT
                  </button>
                </div>
              )}

              {cameraState === "idle" && (
                <div className="text-xs text-[#879B83]">INITIALIZING CAMERA HARDWARE...</div>
              )}
            </div>
          )}

          {/* Manual Input Fallback */}
          {activeTab === "manual" && (
            <div className="flex flex-col gap-2">
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Paste scanned QR string, PAGECAST:v1: frame, or terminal URL..."
                rows={4}
                className="w-full resize-none rounded border border-[#2A352F] bg-[#0D1410] p-2.5 font-mono text-xs text-[#D1DCD0] placeholder:text-[#6F7E6D] focus:border-[#4E5C54] focus:outline-hidden"
                data-testid="manual-qr-input"
              />
              <button
                type="button"
                disabled={!manualText.trim()}
                onClick={() => processQrPayload(manualText)}
                className="btn-keycap cursor-pointer rounded border border-[#3A453F] bg-[#2E3B33] px-3 py-1.5 text-xs font-bold text-[#B7C9A8] transition-all disabled:opacity-40"
              >
                PROCESS SCANNED PAYLOAD
              </button>
            </div>
          )}

          {/* Reassembly Progress Bar (FR-082) */}
          {reassemblyProgress && (
            <div className="rounded-lg border border-[#C69B5B]/40 bg-[#C69B5B]/10 p-3 text-xs text-[#C69B5B]">
              <div className="flex items-center justify-between pb-1 font-bold">
                <span>RECEIVING AIR-GAP BURST...</span>
                <span>
                  {reassemblyProgress.receivedCount} / {reassemblyProgress.total} FRAMES (
                  {reassemblyProgress.percentage}%)
                </span>
              </div>
              {/* Meter Bar */}
              <div className="h-2 w-full overflow-hidden rounded bg-[#18211D]">
                <div
                  className="h-full bg-[#C69B5B] transition-all duration-200"
                  style={{ width: `${reassemblyProgress.percentage}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-[#879B83]">
                Session Bundle: {reassemblyProgress.bundleId} &bull; Keep camera pointed at
                animating code
              </p>
            </div>
          )}

          {/* Corrupted / Integrity Error (FR-083) */}
          {corruptedError && (
            <div
              role="alert"
              className="rounded-lg border border-[#DE5B5B]/40 bg-[#DE5B5B]/10 p-3 text-xs text-[#DE5B5B]"
            >
              <p className="font-bold">❌ SCAN INGESTION REJECTED</p>
              <p className="mt-1 text-[11px]">{corruptedError}</p>
            </div>
          )}

          {/* Detected Public URL Navigation */}
          {detectedUrl && (
            <div className="rounded-lg border border-[#3A453F] bg-[#161E1A] p-3 text-xs">
              <p className="font-bold text-[#B7C9A8]">✓ SCANNED TERMINAL LINK DETECTED</p>
              <p className="mt-1 truncate text-[11px] text-[#879B83]">{detectedUrl.url}</p>
              {detectedUrl.pageNumber && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[#D1DCD0]">Target: Page P{detectedUrl.pageNumber}</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToPage?.(detectedUrl.pageNumber!);
                    }}
                    className="btn-keycap-light cursor-pointer rounded border border-[#3A453F] bg-[#2E3B33] px-2.5 py-1 text-xs font-bold text-[#B7C9A8] transition-colors hover:text-white"
                  >
                    OPEN BULLETIN P{detectedUrl.pageNumber} →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Completed Ingested PagePack */}
          {completedPack && (
            <div className="rounded-lg border border-[#3A453F] bg-[#161E1A] p-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#2A352F] pb-1.5">
                <span className="font-bold text-[#B7C9A8]">
                  ✓ AIR-GAP TRANSFER VERIFIED (SHA-256 OK)
                </span>
                <span className="rounded border border-[#3A453F] bg-[#222924] px-1.5 py-0.5 text-[10px] font-bold text-[#879B83]">
                  P{completedPack.primaryPageNumber}
                </span>
              </div>

              <div className="mt-2 space-y-1 text-[11px]">
                <div>
                  <span className="text-[#879B83]">TITLE: </span>
                  <span className="font-semibold text-[#E8ECE6]">{completedPack.title}</span>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="text-[#879B83]">PAGES: </span>
                    <span className="text-[#D1DCD0]">{completedPack.pages.length}</span>
                  </div>
                  {budget && (
                    <div>
                      <span className="text-[#879B83]">PAYLOAD: </span>
                      <span className="text-[#B7C9A8]">
                        {budget.bytesUsed} B ({budget.percentageUsed}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-[#2A352F] pt-2">
                {isSaved ? (
                  <span className="font-bold text-[#B7C9A8]">★ SAVED TO OFFLINE VAULT!</span>
                ) : (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveToVault}
                    className="btn-keycap cursor-pointer rounded border border-[#3A453F] bg-[#2E3B33] px-2.5 py-1 text-xs font-bold text-[#B7C9A8] transition-colors disabled:opacity-50"
                    data-testid="scanner-save-vault-btn"
                  >
                    {isSaving ? "SAVING..." : "★ SAVE TO VAULT"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToPage?.(completedPack.primaryPageNumber);
                  }}
                  className="btn-keycap-light cursor-pointer rounded border border-[#3A453F] bg-[#222924] px-2.5 py-1 text-xs font-bold text-[#B7C9A8] transition-colors hover:text-white"
                >
                  OPEN BULLETIN →
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between border-t border-[#2A352F] pt-2 text-[10px] text-[#6F7E6D]">
            <span>Optical Barcode &amp; Multi-Frame Air-Gap Transfer</span>
            <span>Zero Network Overhead</span>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}

export function QrScannerModal({
  isOpen,
  onClose,
  onNavigateToPage,
  onPackIngested,
}: QrScannerModalProps) {
  if (!isOpen) return null;

  return (
    <QrScannerModalContent
      onClose={onClose}
      onNavigateToPage={onNavigateToPage}
      onPackIngested={onPackIngested}
    />
  );
}
