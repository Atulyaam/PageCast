"use client";

/**
 * PageCast PagePack JSON File Import Dialog (TASK-S4-OFF-09 / FR-081, FR-084, FR-085)
 *
 * Provides a client-side interface for dragging-and-dropping or uploading
 * .json PagePack files, verifying schema, geometry, and 10 KiB ceiling,
 * and saving valid bulletins into local IndexedDB for offline reading.
 */

import React, { useState, useEffect, useRef } from "react";
import type { PagePackV1 } from "@/domain/page-pack/types";
import { importPagePackFromJson } from "@/lib/export/pack-export";
import { savePageLocally } from "@/lib/storage/saved-pages";
import { measurePagePack } from "@/domain/page-pack/codec";
import { FocusTrap } from "@/components/common/FocusTrap";

export interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (pack: PagePackV1) => void;
}

function ImportDialogModal({
  onClose,
  onImportSuccess,
}: {
  onClose: () => void;
  onImportSuccess?: (pack: PagePackV1) => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [candidatePack, setCandidatePack] = useState<PagePackV1 | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [manualText, setManualText] = useState("");
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const processJsonString = (jsonString: string) => {
    setErrorMessages([]);
    setSaveSuccess(false);

    // Initial size check
    const byteLength = new TextEncoder().encode(jsonString).length;
    if (byteLength > 15360) {
      // 15 KiB hard reject before parsing
      setErrorMessages([`File payload too large: ${byteLength} bytes (max 10,240 bytes).`]);
      setCandidatePack(null);
      return;
    }

    const validation = importPagePackFromJson(jsonString);
    if (!validation.valid || !validation.pack) {
      setErrorMessages(validation.errors);
      setCandidatePack(null);
      return;
    }

    setCandidatePack(validation.pack);
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".json") && file.type !== "application/json" && file.type !== "") {
      setErrorMessages(["Invalid file type. Please select a .json PagePack file."]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        processJsonString(text);
      } else {
        setErrorMessages(["Failed to read file contents."]);
      }
    };
    reader.onerror = () => {
      setErrorMessages(["Error reading file."]);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSaveToVault = async () => {
    if (!candidatePack) return;

    setIsSaving(true);
    setErrorMessages([]);

    try {
      const res = await savePageLocally(candidatePack);
      if (res.success) {
        setSaveSuccess(true);
        onImportSuccess?.(candidatePack);
      } else {
        setErrorMessages([res.error || "Failed to save bulletin to local storage."]);
      }
    } catch (err: any) {
      setErrorMessages([err?.message || "An unexpected storage error occurred."]);
    } finally {
      setIsSaving(false);
    }
  };

  const budgetResult = candidatePack ? measurePagePack(candidatePack) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 font-mono backdrop-blur-xs"
    >
      <FocusTrap onClose={onClose} className="w-full max-w-lg">
        <div className="flex w-full flex-col gap-4 rounded-xl border border-[#3A453F] bg-[#141B17] p-6 text-[#D1DCD0] shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#2A352F] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="rounded border border-[#3A453F] bg-[#222924] px-2 py-0.5 text-xs font-bold text-[#879B83]">
                IMPORT
              </span>
              <h2
                id="import-dialog-title"
                className="text-sm font-bold tracking-wider text-[#B7C9A8] uppercase"
              >
                PAGEPACK INGESTION
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-keycap-light cursor-pointer rounded border border-[#3A453F] bg-[#222924] px-2.5 py-1 text-xs text-[#A8B7A4] transition-all hover:border-[#4E5C54] hover:text-[#E8ECE6] active:scale-95"
              aria-label="Close import dialog"
            >
              ESC [✕]
            </button>
          </div>

          {/* Tab switch: File drop vs Paste */}
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setInputMode("file")}
              className={`rounded px-3 py-1 font-semibold transition-colors ${
                inputMode === "file"
                  ? "border border-[#3A453F] bg-[#2E3B33] font-bold text-[#B7C9A8]"
                  : "border border-[#2A352F] bg-[#18211D] text-[#879B83] hover:text-[#D1DCD0]"
              }`}
            >
              SELECT FILE (.JSON)
            </button>
            <button
              type="button"
              onClick={() => setInputMode("paste")}
              className={`rounded px-3 py-1 font-semibold transition-colors ${
                inputMode === "paste"
                  ? "border border-[#3A453F] bg-[#2E3B33] font-bold text-[#B7C9A8]"
                  : "border border-[#2A352F] bg-[#18211D] text-[#879B83] hover:text-[#D1DCD0]"
              }`}
            >
              PASTE JSON TEXT
            </button>
          </div>

          {/* File Dropzone or Paste Input */}
          {inputMode === "file" ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                dragActive
                  ? "border-[#C69B5B] bg-[#C69B5B]/10"
                  : "border-[#3A453F] bg-[#0D1410] hover:border-[#4E5C54]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
                data-testid="pagepack-file-input"
              />
              <p className="mb-2 text-xs text-[#879B83]">
                DRAG &amp; DROP A PAGEPACK JSON FILE HERE
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-keycap-light cursor-pointer rounded border border-[#3A453F] bg-[#222924] px-3 py-1.5 text-xs font-bold text-[#B7C9A8] transition-all hover:border-[#4E5C54] hover:text-white"
              >
                CHOOSE FILE
              </button>
              <p className="mt-2 text-[10px] text-[#6F7E6D]">
                Max byte ceiling: 10,240 bytes (10 KiB)
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Paste PagePack JSON string here..."
                rows={5}
                className="w-full resize-none rounded border border-[#2A352F] bg-[#0D1410] p-2.5 font-mono text-xs text-[#D1DCD0] placeholder:text-[#6F7E6D] focus:border-[#4E5C54] focus:outline-hidden"
                data-testid="pagepack-paste-textarea"
              />
              <button
                type="button"
                disabled={!manualText.trim()}
                onClick={() => processJsonString(manualText)}
                className="btn-keycap cursor-pointer rounded border border-[#3A453F] bg-[#2E3B33] px-3 py-1.5 text-xs font-bold text-[#B7C9A8] transition-all disabled:opacity-40"
              >
                VALIDATE &amp; PREVIEW
              </button>
            </div>
          )}

          {/* Validation Errors */}
          {errorMessages.length > 0 && (
            <div
              role="alert"
              className="rounded-lg border border-[#DE5B5B]/40 bg-[#DE5B5B]/10 p-3 text-xs text-[#DE5B5B]"
            >
              <p className="font-bold">❌ INGESTION REJECTED ({errorMessages.length} ERRORS):</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px]">
                {errorMessages.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Valid Candidate Preview */}
          {candidatePack && (
            <div className="rounded-lg border border-[#3A453F] bg-[#161E1A] p-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-[#2A352F] pb-2">
                <span className="font-bold text-[#B7C9A8]">✓ VALID PAGEPACK VERIFIED</span>
                <span className="rounded border border-[#3A453F] bg-[#222924] px-1.5 py-0.5 text-[10px] font-bold text-[#879B83]">
                  P{candidatePack.primaryPageNumber}
                </span>
              </div>

              <div className="mt-2 space-y-1 text-[11px] text-[#879B83]">
                <div>
                  <span className="text-[#6F7E6D]">TITLE: </span>
                  <span className="font-semibold text-[#E8ECE6]">{candidatePack.title}</span>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="text-[#6F7E6D]">MAGAZINE: </span>
                    <span className="text-[#C69B5B]">{candidatePack.magazine}</span>
                  </div>
                  <div>
                    <span className="text-[#6F7E6D]">PAGES: </span>
                    <span className="text-[#D1DCD0]">{candidatePack.pages.length}</span>
                  </div>
                  <div>
                    <span className="text-[#6F7E6D]">SOURCE: </span>
                    <span className="text-[#D1DCD0]">
                      {candidatePack.metadata?.sourceName || "Independent"}
                    </span>
                  </div>
                </div>
                {budgetResult && (
                  <div>
                    <span className="text-[#6F7E6D]">BUDGET: </span>
                    <span
                      className={
                        budgetResult.isOverBudget ? "font-bold text-[#DE5B5B]" : "text-[#B7C9A8]"
                      }
                    >
                      {budgetResult.bytesUsed} / {budgetResult.maxBytes} bytes (
                      {budgetResult.percentageUsed}%)
                    </span>
                  </div>
                )}
              </div>

              {saveSuccess ? (
                <div className="mt-3 flex items-center justify-between border-t border-[#2A352F] pt-2 text-xs">
                  <span className="font-bold text-[#B7C9A8]">★ SAVED TO LOCAL OFFLINE VAULT!</span>
                  <a
                    href={`/terminal?page=${candidatePack.primaryPageNumber}`}
                    className="btn-keycap-light cursor-pointer rounded border border-[#3A453F] bg-[#2E3B33] px-2.5 py-1 text-xs font-bold text-[#B7C9A8] transition-colors hover:text-white"
                  >
                    VIEW BULLETIN P{candidatePack.primaryPageNumber} →
                  </a>
                </div>
              ) : (
                <div className="mt-3 border-t border-[#2A352F] pt-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveToVault}
                    className="btn-keycap flex w-full cursor-pointer items-center justify-center gap-1.5 rounded border border-[#3A453F] bg-[#2E3B33] py-2 text-xs font-bold text-[#B7C9A8] transition-colors hover:bg-[#38483E] disabled:opacity-50"
                    data-testid="save-to-vault-btn"
                  >
                    {isSaving ? "SAVING TO INDEXEDDB..." : "★ SAVE TO LOCAL OFFLINE VAULT"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between border-t border-[#2A352F] pt-2 text-[10px] text-[#6F7E6D]">
            <span>Format: PagePack v1 Canonical JSON</span>
            <span>Security: Client-side sandboxed validation</span>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}

export function ImportDialog({ isOpen, onClose, onImportSuccess }: ImportDialogProps) {
  if (!isOpen) return null;

  return <ImportDialogModal onClose={onClose} onImportSuccess={onImportSuccess} />;
}
