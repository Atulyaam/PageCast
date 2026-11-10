"use client";

/**
 * PageCast — Community Broadcast Kit: Printable QR Poster Generator (ENH-03)
 *
 * Produces an A4/Letter printable noticeboard poster with:
 * - High-contrast Teletext-formatted text content
 * - Bold P{pageNumber} bulletin identity
 * - High-contrast scannable QR code optimized for monochrome printing
 * - Explicit offline instructions ("Scan with any camera • Consumes < 5 KiB")
 * - Scoped @media print rules for paper printing without browser chrome
 */

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Printer, X } from "lucide-react";
import type { PagePackV1 } from "@/domain/page-pack/types";
import { getBulletinShareUrl } from "@/server/export/qr-distribution";
import { FocusTrap } from "@/components/common/FocusTrap";

export interface PosterModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly pageNumber: number;
  readonly title: string;
  readonly categoryName?: string;
  readonly pack?: PagePackV1 | null;
  readonly textContent?: string;
  readonly baseUrl?: string;
}

export const PosterModal: React.FC<PosterModalProps> = ({
  isOpen,
  onClose,
  pageNumber,
  title,
  categoryName = "COMMUNITY NOTICE",
  pack,
  textContent,
  baseUrl,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const shareUrl = getBulletinShareUrl(pageNumber, baseUrl);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    async function generatePrintQr() {
      try {
        const dataUrl = await QRCode.toDataURL(shareUrl, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 320,
          color: { dark: "#000000", light: "#ffffff" },
        });
        if (isMounted) {
          setQrDataUrl(dataUrl);
        }
      } catch (err) {
        console.error("Failed to generate print QR", err);
      }
    }

    generatePrintQr();
    return () => {
      isMounted = false;
    };
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Determine lines to display in the poster's bulletin preview area
  let displayLines: string[] = [];
  if (pack?.pages?.[0]?.rows) {
    displayLines = pack.pages[0].rows
      .slice(2, 22) // skip teletext header and footer
      .map((row) => row.spans.map((s) => s.text).join(""))
      .filter((line) => line.trim().length > 0);
  } else if (textContent) {
    displayLines = textContent
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .slice(0, 14);
  } else {
    displayLines = [
      title,
      "Official public notice and emergency broadcast.",
      "Access the live, offline-cached digital edition by scanning below.",
    ];
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="poster-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 font-mono backdrop-blur-xs"
    >
      <FocusTrap active={isOpen} onClose={onClose} className="w-full max-w-2xl">
        <div className="w-full rounded-xl border border-[#3A453F] bg-[#141B17] p-6 text-[#D1DCD0] shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
          {/* Action Bar (Hidden on print) */}
          <div className="mb-4 flex items-center justify-between border-b border-[#2A352F] pb-3 print:hidden">
            <div className="flex items-center gap-2.5">
              <span className="rounded border border-[#3A453F] bg-[#222924] px-2 py-0.5 text-xs font-bold text-[#879B83]">
                PRINT KIT
              </span>
              <h2
                id="poster-modal-title"
                className="text-sm font-bold tracking-wider text-[#B7C9A8] uppercase"
              >
                Community Bulletin Poster (A4 / Letter)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="btn-keycap inline-flex cursor-pointer items-center gap-1.5 rounded border border-[#3A453F] bg-[#2E3B33] px-3 py-1 text-xs font-bold text-[#B7C9A8] transition-colors hover:bg-[#38483E]"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Poster</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close poster preview"
                className="btn-keycap-light cursor-pointer rounded border border-[#3A453F] bg-[#222924] p-1 text-xs text-[#A8B7A4] hover:border-[#4E5C54] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Printable Poster Canvas */}
          <div
            id="pagecast-poster"
            className="pagecast-printable-poster border-4 border-black bg-white p-8 font-mono text-black shadow-md print:border-2 print:p-6 print:shadow-none"
          >
            {/* Poster Header */}
            <header className="mb-4 border-b-4 border-black pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-black px-2.5 py-1 text-sm font-black tracking-widest text-white uppercase">
                    PAGECAST P{pageNumber}
                  </span>
                  <span className="text-xs font-black tracking-wider text-zinc-800 uppercase">
                    {categoryName}
                  </span>
                </div>
                <span className="text-[11px] font-bold tracking-wider text-zinc-600 uppercase">
                  OFFLINE TELETEXT BROADCAST
                </span>
              </div>
              <h1 className="mt-3 text-xl leading-snug font-black tracking-tight text-black sm:text-2xl">
                {title}
              </h1>
              <p className="mt-1 text-xs font-bold text-zinc-600" suppressHydrationWarning>
                Issuing Date:{" "}
                {new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}{" "}
                • Verified Low-Bandwidth Bulletin
              </p>
            </header>

            {/* Notice Body */}
            <main className="mb-6 space-y-2 border-b-2 border-black pb-6">
              <div className="border border-zinc-400 bg-zinc-100 p-4">
                <div className="mb-2 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  OFFICIAL BULLETIN SUMMARY
                </div>
                <div className="space-y-1.5 text-xs leading-relaxed font-semibold text-zinc-900">
                  {displayLines.map((line, idx) => (
                    <p key={idx} className="font-mono">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </main>

            {/* QR Code and Mobile Scanner Instructions */}
            <footer className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-400 p-2">
                {qrDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrDataUrl}
                    alt={`Scannable QR code for PageCast Bulletin P${pageNumber}`}
                    className="h-44 w-44 object-contain"
                  />
                ) : (
                  <div className="flex h-44 w-44 items-center justify-center text-xs text-zinc-500">
                    Generating QR code...
                  </div>
                )}
                <span className="mt-1 text-[10px] font-black tracking-wider text-zinc-700 uppercase">
                  SCAN WITH ANY MOBILE CAMERA
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="inline-block bg-black px-2 py-0.5 text-[11px] font-black tracking-wide text-white">
                  NO INTERNET RE-DOWNLOAD NEEDED
                </div>
                <ol className="list-inside list-decimal space-y-1 text-[11px] leading-normal font-semibold text-zinc-800">
                  <li>
                    <strong>Aim camera:</strong> Open phone camera or any scanner.
                  </li>
                  <li>
                    <strong>Instant cache:</strong> Full bulletin loads in &lt; 50ms.
                  </li>
                  <li>
                    <strong>Micro-payload:</strong> Consumes &lt; 5 KiB data total.
                  </li>
                  <li>
                    <strong>Works offline:</strong> Saved locally for disconnected reading.
                  </li>
                </ol>
                <div className="border-t border-zinc-300 pt-2 font-mono text-[10px] text-zinc-600">
                  Direct Link: {shareUrl}
                </div>
              </div>
            </footer>
          </div>

          {/* Dialog Footer Notice (Hidden on print) */}
          <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-500 print:hidden">
            <span>
              Standard A4 / US Letter portrait layout with high-contrast monochrome printing.
            </span>
            <button
              type="button"
              onClick={handlePrint}
              className="font-bold text-emerald-400 hover:text-emerald-300"
            >
              Open Print Dialog →
            </button>
          </div>
        </div>
      </FocusTrap>

      {/* Scoped CSS for Pixel-Perfect Paper Printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .pagecast-printable-poster,
          .pagecast-printable-poster * {
            visibility: visible !important;
          }
          .pagecast-printable-poster {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-width: 2px !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
};
