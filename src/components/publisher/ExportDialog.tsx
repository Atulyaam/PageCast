"use client";

/**
 * PageCast Export & Distribution Dialog (TASK-S3-08 / TASK-S4-OFF-08 / TASK-S4-OFF-11)
 *
 * Provides a Teletext-styled modal for downloading raw PagePack JSON,
 * copying public terminal deep-links, scanning high-contrast URL QR codes,
 * and broadcasting animated multi-frame air-gap QR bursts (FR-082).
 */

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import type { PagePackV1 } from "@/domain/page-pack/types";
import { getBulletinShareUrl } from "@/server/export/qr-distribution";
import { measurePagePack } from "@/domain/page-pack/codec";
import { encodeMultiFramePack } from "@/lib/qr/multi-frame-codec";
import { FocusTrap } from "@/components/common/FocusTrap";
import { PosterModal } from "@/components/publisher/PosterModal";

export interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pageNumber: number;
  pack?: PagePackV1 | null;
  baseUrl?: string;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  pageNumber,
  pack,
  baseUrl,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"url" | "raw" | "burst">("url");
  const [isPosterOpen, setIsPosterOpen] = useState<boolean>(false);

  // Multi-frame animated burst state (FR-082)
  const [burstFrames, setBurstFrames] = useState<string[]>([]);
  const [burstQrMap, setBurstQrMap] = useState<Record<number, string>>({});
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [fps, setFps] = useState<number>(3); // 3 frames per second (~333ms)

  const shareUrl = getBulletinShareUrl(pageNumber, baseUrl);
  const budget = pack ? measurePagePack(pack) : null;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate QR for static tabs (url / raw)
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function generateCodes() {
      try {
        if (activeTab === "url") {
          const urlData = await QRCode.toDataURL(shareUrl, {
            errorCorrectionLevel: "M",
            margin: 2,
            width: 200,
            color: { dark: "#00ff66", light: "#000000" },
          });
          if (isMounted) setQrDataUrl(urlData);
        } else if (activeTab === "raw" && pack) {
          const rawStr = JSON.stringify(pack);
          if (rawStr.length <= 2500) {
            const rawData = await QRCode.toDataURL(rawStr, {
              errorCorrectionLevel: "L",
              margin: 2,
              width: 200,
              color: { dark: "#00ff66", light: "#000000" },
            });
            if (isMounted) setQrDataUrl(rawData);
          } else {
            if (isMounted) setQrDataUrl("");
          }
        }
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }
    }

    generateCodes();

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeTab, shareUrl, pack]);

  // Generate and cycle frames for multi-frame burst tab (FR-082)
  useEffect(() => {
    if (!isOpen || activeTab !== "burst" || !pack) return;
    const currentPack = pack;

    let isMounted = true;

    async function initBurst() {
      try {
        const frames = await encodeMultiFramePack(currentPack, 350);
        if (!isMounted) return;
        setBurstFrames(frames);
        setCurrentFrameIndex(0);

        // Pregenerate first frame QR immediately
        const firstQr = await QRCode.toDataURL(frames[0], {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 200,
          color: { dark: "#00ff66", light: "#000000" },
        });
        if (isMounted) {
          setBurstQrMap({ 0: firstQr });
        }

        // Generate remaining frames in background
        for (let i = 1; i < frames.length; i++) {
          const qr = await QRCode.toDataURL(frames[i], {
            errorCorrectionLevel: "M",
            margin: 2,
            width: 200,
            color: { dark: "#00ff66", light: "#000000" },
          });
          if (!isMounted) return;
          setBurstQrMap((prev) => ({ ...prev, [i]: qr }));
        }
      } catch (err) {
        console.error("Failed to initialize multi-frame QR burst", err);
      }
    }

    initBurst();

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeTab, pack]);

  // Animated frame cycling interval
  useEffect(() => {
    if (!isOpen || activeTab !== "burst" || burstFrames.length <= 1 || !isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.round(1000 / fps);
    timerRef.current = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % burstFrames.length);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, activeTab, burstFrames.length, isPlaying, fps]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadJson = () => {
    if (!pack) return;
    const content = JSON.stringify(pack, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pagecast-p${pageNumber}-${pack.slug || "bulletin"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentBurstQr = burstQrMap[currentFrameIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 font-mono backdrop-blur-xs"
    >
      <FocusTrap onClose={onClose} className="w-full max-w-md">
        <div className="w-full rounded-xl border border-[#3A453F] bg-[#141B17] p-6 font-mono text-[#D1DCD0] shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between border-b border-[#2A352F] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="rounded border border-[#3A453F] bg-[#222924] px-2 py-0.5 text-xs font-bold text-[#879B83]">
                P{pageNumber}
              </span>
              <h2
                id="export-dialog-title"
                className="text-sm font-bold tracking-wider text-[#B7C9A8] uppercase"
              >
                Export &amp; Distribute
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close export dialog"
              className="btn-keycap-light cursor-pointer rounded border border-[#3A453F] bg-[#222924] px-2.5 py-1 text-xs text-[#A8B7A4] transition-all hover:border-[#4E5C54] hover:text-[#E8ECE6] active:scale-95"
            >
              ✕
            </button>
          </div>

          {/* Tab Controls */}
          <div className="mb-4 flex gap-1.5 border-b border-[#2A352F] pb-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`cursor-pointer rounded px-2.5 py-1.5 font-bold transition-all active:scale-95 ${
                activeTab === "url"
                  ? "border border-[#3A453F] bg-[#222924] text-[#B7C9A8]"
                  : "border border-transparent text-[#879B83] hover:text-[#D1DCD0]"
              }`}
            >
              Terminal Link QR
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("burst")}
              className={`cursor-pointer rounded px-2.5 py-1.5 font-bold transition-all active:scale-95 ${
                activeTab === "burst"
                  ? "border border-[#3A453F] bg-[#222924] text-[#B7C9A8]"
                  : "border border-transparent text-[#879B83] hover:text-[#D1DCD0]"
              }`}
            >
              Air-Gap QR Burst
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("raw")}
              className={`cursor-pointer rounded px-2.5 py-1.5 font-bold transition-all active:scale-95 ${
                activeTab === "raw"
                  ? "border border-[#3A453F] bg-[#222924] text-[#B7C9A8]"
                  : "border border-transparent text-[#879B83] hover:text-[#D1DCD0]"
              }`}
            >
              Raw Optical QR
            </button>
          </div>

          {/* QR Presentation for URL & Raw tabs */}
          {activeTab !== "burst" && (
            <div className="mb-4 flex flex-col items-center justify-center rounded-lg border border-[#2A352F] bg-[#0D1410] p-4 shadow-inner">
              {qrDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrDataUrl}
                  alt={`QR code for Teletext page ${pageNumber}`}
                  className="h-48 w-48 rounded border border-[#3A453F] bg-[#0D1410] p-1.5"
                />
              ) : (
                <div className="flex h-48 w-48 flex-col items-center justify-center rounded border border-[#C69B5B]/40 bg-[#C69B5B]/10 p-3 text-center text-xs text-[#C69B5B]">
                  <span className="mb-1 font-bold">Payload Overflow</span>
                  <span>
                    Raw JSON exceeds optical QR capacity (&gt; 2.5 KiB). Distribute via URL QR,
                    Air-Gap Burst, or JSON export.
                  </span>
                </div>
              )}
              <span className="mt-2 text-[10px] tracking-widest text-[#6F7E6D] uppercase">
                {activeTab === "url"
                  ? "SCANS DIRECTLY TO TELETEXT VIEWER"
                  : "OPTICAL PAYLOAD DISTRIBUTION"}
              </span>
            </div>
          )}

          {/* Air-Gap Multi-Frame Animated Burst Presentation (FR-082) */}
          {activeTab === "burst" && (
            <div className="mb-4 flex flex-col items-center justify-center rounded-lg border border-[#2A352F] bg-[#0D1410] p-4 shadow-inner">
              {burstFrames.length > 0 && currentBurstQr ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentBurstQr}
                    alt={`Multi-frame QR packet ${currentFrameIndex + 1} of ${burstFrames.length}`}
                    className="h-48 w-48 rounded border border-[#3A453F] bg-[#0D1410] p-1.5"
                  />

                  {/* Burst Controls */}
                  <div className="mt-3 flex w-full items-center justify-between border-t border-[#2A352F] pt-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="rounded border border-[#3A453F] bg-[#222924] px-2 py-0.5 text-xs font-bold text-[#B7C9A8] hover:border-[#4E5C54] hover:text-white"
                      >
                        {isPlaying ? "❚❚ PAUSE" : "▶ PLAY"}
                      </button>
                      <span className="text-[11px] font-bold text-[#B7C9A8]">
                        FRAME {currentFrameIndex + 1} / {burstFrames.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-[#6F7E6D]">FPS:</span>
                      {[2, 3, 5].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setFps(rate)}
                          className={`rounded px-1.5 py-0.5 font-bold ${
                            fps === rate
                              ? "border border-[#3A453F] bg-[#2E3B33] text-[#B7C9A8]"
                              : "border border-[#2A352F] text-[#879B83] hover:text-white"
                          }`}
                        >
                          {rate}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 text-center text-[10px] text-[#6F7E6D]">
                    Aim PageCast QR Scanner at this animated code for air-gap ingestion.
                  </div>
                </>
              ) : (
                <div className="flex h-48 w-48 flex-col items-center justify-center p-3 text-center text-xs text-[#879B83]">
                  <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-[#B7C9A8] border-t-transparent" />
                  <span>Preparing animated frames...</span>
                </div>
              )}
            </div>
          )}

          {/* Share Link Field */}
          <div className="mb-4">
            <label className="mb-1 block text-[11px] tracking-wider text-[#879B83] uppercase">
              Reader Deep-Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full rounded border border-[#2A352F] bg-[#0D1410] px-2.5 py-1.5 text-xs text-[#D1DCD0] select-all focus:border-[#4E5C54] focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`btn-keycap-light cursor-pointer rounded border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                  copied
                    ? "border-[#3A453F] bg-[#2E3B33] text-[#B7C9A8]"
                    : "border-[#3A453F] bg-[#222924] text-[#A8B7A4] hover:text-[#E8ECE6]"
                }`}
              >
                {copied ? "COPIED" : "COPY"}
              </button>
            </div>
          </div>

          {/* Budget Status & Download */}
          <div className="flex items-center justify-between border-t border-[#2A352F] pt-3">
            <div className="text-[11px] text-[#879B83]">
              {budget && (
                <span>
                  Payload: <strong className="text-[#D1DCD0]">{budget.bytesUsed} B</strong> / 10,240
                  B
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPosterOpen(true)}
                className="btn-keycap-light cursor-pointer rounded border border-[#3A453F] bg-[#222924] px-3 py-1.5 text-xs font-bold tracking-wider text-[#B7C9A8] uppercase transition-all hover:border-[#4E5C54] hover:text-[#E8ECE6] active:scale-95"
              >
                🖨️ Poster
              </button>
              <button
                type="button"
                onClick={handleDownloadJson}
                disabled={!pack}
                className="btn-keycap cursor-pointer rounded border border-[#3A453F] bg-[#2E3B33] px-3 py-1.5 text-xs font-bold tracking-wider text-[#B7C9A8] uppercase transition-all hover:bg-[#38483E] active:scale-95 disabled:opacity-50"
              >
                Download .JSON
              </button>
            </div>
          </div>
        </div>
      </FocusTrap>

      {/* Poster Modal */}
      {isPosterOpen && (
        <PosterModal
          isOpen={true}
          onClose={() => setIsPosterOpen(false)}
          pageNumber={pageNumber}
          title={pack?.title || `Teletext Bulletin P${pageNumber}`}
          categoryName="TELETEXT BROADCAST"
          pack={pack}
          baseUrl={baseUrl}
        />
      )}
    </div>
  );
};
