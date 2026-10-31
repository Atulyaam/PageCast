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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono backdrop-blur-xs"
    >
      <div className="w-full max-w-md border-2 border-emerald-500 bg-zinc-950 p-6 font-mono text-zinc-100 shadow-[0_0_20px_rgba(0,255,102,0.25)]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 px-1.5 py-0.5 text-xs font-bold text-black">
              P{pageNumber}
            </span>
            <h2
              id="export-dialog-title"
              className="text-sm font-bold tracking-wider text-emerald-400 uppercase"
            >
              Export &amp; Distribute
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="cursor-pointer border border-zinc-800 px-2 py-1 text-sm text-zinc-400 hover:border-zinc-600 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Tab Controls */}
        <div className="mb-4 flex border-b border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`cursor-pointer border-b-2 px-3 py-1.5 font-bold transition-colors ${
              activeTab === "url"
                ? "border-emerald-400 bg-emerald-950/30 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Terminal Link QR
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("burst")}
            className={`cursor-pointer border-b-2 px-3 py-1.5 font-bold transition-colors ${
              activeTab === "burst"
                ? "border-emerald-400 bg-emerald-950/30 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Air-Gap QR Burst
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("raw")}
            className={`cursor-pointer border-b-2 px-3 py-1.5 font-bold transition-colors ${
              activeTab === "raw"
                ? "border-emerald-400 bg-emerald-950/30 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Raw Optical QR
          </button>
        </div>

        {/* QR Presentation for URL & Raw tabs */}
        {activeTab !== "burst" && (
          <div className="mb-4 flex flex-col items-center justify-center border border-zinc-800 bg-black p-4">
            {qrDataUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrDataUrl}
                alt={`QR code for Teletext page ${pageNumber}`}
                className="h-48 w-48 border border-emerald-900/60 bg-black p-1"
              />
            ) : (
              <div className="flex h-48 w-48 flex-col items-center justify-center border border-amber-800 bg-amber-950/20 p-3 text-center text-xs text-amber-400">
                <span className="mb-1 font-bold">Payload Overflow</span>
                <span>
                  Raw JSON exceeds optical QR capacity (&gt; 2.5 KiB). Distribute via URL QR,
                  Air-Gap Burst, or JSON export.
                </span>
              </div>
            )}
            <span className="mt-2 text-[10px] tracking-wide text-zinc-500">
              {activeTab === "url"
                ? "SCANS DIRECTLY TO TELETEXT VIEWER"
                : "OPTICAL PAYLOAD DISTRIBUTION"}
            </span>
          </div>
        )}

        {/* Air-Gap Multi-Frame Animated Burst Presentation (FR-082) */}
        {activeTab === "burst" && (
          <div className="mb-4 flex flex-col items-center justify-center border border-zinc-800 bg-black p-4">
            {burstFrames.length > 0 && currentBurstQr ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentBurstQr}
                  alt={`Multi-frame QR packet ${currentFrameIndex + 1} of ${burstFrames.length}`}
                  className="h-48 w-48 border border-emerald-500 bg-black p-1 shadow-[0_0_10px_rgba(0,255,102,0.3)]"
                />

                {/* Burst Controls */}
                <div className="mt-3 flex w-full items-center justify-between border-t border-zinc-800 pt-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="border border-emerald-500/50 bg-emerald-950/40 px-2 py-0.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-black"
                    >
                      {isPlaying ? "❚❚ PAUSE" : "▶ PLAY"}
                    </button>
                    <span className="text-[11px] font-bold text-emerald-400">
                      FRAME {currentFrameIndex + 1} / {burstFrames.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-zinc-500">FPS:</span>
                    {[2, 3, 5].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setFps(rate)}
                        className={`px-1.5 py-0.5 font-bold ${
                          fps === rate
                            ? "bg-emerald-500 text-black"
                            : "border border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {rate}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-2 text-center text-[10px] text-zinc-500">
                  Aim PageCast QR Scanner at this animated code for air-gap ingestion.
                </div>
              </>
            ) : (
              <div className="flex h-48 w-48 flex-col items-center justify-center p-3 text-center text-xs text-zinc-400">
                <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                <span>Preparing animated frames...</span>
              </div>
            )}
          </div>
        )}

        {/* Share Link Field */}
        <div className="mb-4">
          <label className="mb-1 block text-[11px] tracking-wider text-zinc-400 uppercase">
            Reader Deep-Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full border border-zinc-800 bg-black px-2 py-1.5 text-xs text-zinc-300 select-all focus:border-emerald-500 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`cursor-pointer border px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
                copied
                  ? "border-emerald-500 bg-emerald-500 text-black"
                  : "border-zinc-700 bg-zinc-900 text-emerald-400 hover:border-emerald-400"
              }`}
            >
              {copied ? "COPIED" : "COPY"}
            </button>
          </div>
        </div>

        {/* Budget Status & Download */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
          <div className="text-[11px] text-zinc-400">
            {budget && (
              <span>
                Payload: <strong className="text-zinc-200">{budget.bytesUsed} B</strong> / 10,240 B
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleDownloadJson}
            disabled={!pack}
            className="cursor-pointer bg-emerald-600 px-3 py-1.5 text-xs font-bold tracking-wider text-black uppercase hover:bg-emerald-500 disabled:opacity-50"
          >
            Download .JSON
          </button>
        </div>
      </div>
    </div>
  );
};
