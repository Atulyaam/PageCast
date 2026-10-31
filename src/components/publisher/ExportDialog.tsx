"use client";

/**
 * PageCast Export & Distribution Dialog (TASK-S3-08)
 *
 * Provides a Teletext-styled modal for downloading raw PagePack JSON,
 * copying public terminal deep-links, and scanning high-contrast QR codes.
 */

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import type { PagePackV1 } from "@/domain/page-pack/types";
import { getBulletinShareUrl } from "@/server/export/qr-distribution";
import { measurePagePack } from "@/domain/page-pack/codec";

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
  const [activeTab, setActiveTab] = useState<"url" | "raw">("url");

  const shareUrl = getBulletinShareUrl(pageNumber, baseUrl);
  const budget = pack ? measurePagePack(pack) : null;

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
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
              Export & Distribute
            </h2>
          </div>
          <button
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

        {/* QR Code Presentation */}
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
                Raw JSON exceeds optical QR capacity (&gt; 2.5 KiB). Distribute via URL QR or JSON
                export.
              </span>
            </div>
          )}
          <span className="mt-2 text-[10px] tracking-wide text-zinc-500">
            {activeTab === "url"
              ? "SCANS DIRECTLY TO TELETEXT VIEWER"
              : "OPTICAL PAYLOAD DISTRIBUTION"}
          </span>
        </div>

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
