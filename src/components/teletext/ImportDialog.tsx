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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono backdrop-blur-xs"
    >
      <div className="border-teletext-cyan bg-surface-terminal text-text-primary flex w-full max-w-lg flex-col gap-4 rounded border-2 p-6 shadow-2xl">
        {/* Header */}
        <div className="border-surface-border flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-teletext-cyan text-teletext-black px-1.5 py-0.5 text-xs font-bold">
              IMPORT
            </span>
            <h2 id="import-dialog-title" className="text-teletext-cyan text-base font-bold">
              PAGEPACK INGESTION
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-teletext-white font-mono text-xs transition-colors"
            aria-label="Close import dialog"
          >
            [CLOSE ✕]
          </button>
        </div>

        {/* Tab switch: File drop vs Paste */}
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setInputMode("file")}
            className={`border px-3 py-1 font-semibold transition-colors ${
              inputMode === "file"
                ? "border-teletext-yellow bg-teletext-yellow text-teletext-black"
                : "border-surface-border bg-surface-panel text-text-muted hover:text-text-primary"
            }`}
          >
            SELECT FILE (.JSON)
          </button>
          <button
            type="button"
            onClick={() => setInputMode("paste")}
            className={`border px-3 py-1 font-semibold transition-colors ${
              inputMode === "paste"
                ? "border-teletext-yellow bg-teletext-yellow text-teletext-black"
                : "border-surface-border bg-surface-panel text-text-muted hover:text-text-primary"
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
            className={`border-2 border-dashed p-6 text-center transition-colors ${
              dragActive
                ? "border-teletext-yellow bg-teletext-yellow/10"
                : "border-surface-border bg-surface-panel/40 hover:border-text-muted"
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
            <p className="text-text-secondary mb-2 text-xs">
              DRAG &amp; DROP A PAGEPACK JSON FILE HERE
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-teletext-cyan bg-teletext-cyan/10 text-teletext-cyan hover:bg-teletext-cyan hover:text-teletext-black border px-3 py-1.5 text-xs font-bold transition-all"
            >
              CHOOSE FILE
            </button>
            <p className="text-text-muted mt-2 text-[10px]">
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
              className="border-surface-border bg-surface-panel text-text-primary placeholder:text-text-muted focus:border-teletext-yellow w-full resize-none border p-2 font-mono text-xs focus:outline-hidden"
              data-testid="pagepack-paste-textarea"
            />
            <button
              type="button"
              disabled={!manualText.trim()}
              onClick={() => processJsonString(manualText)}
              className="border-teletext-cyan bg-teletext-cyan/20 text-teletext-cyan hover:bg-teletext-cyan hover:text-teletext-black border px-3 py-1 text-xs font-bold transition-all disabled:opacity-40"
            >
              VALIDATE &amp; PREVIEW
            </button>
          </div>
        )}

        {/* Validation Errors */}
        {errorMessages.length > 0 && (
          <div
            role="alert"
            className="border-teletext-red bg-teletext-red/10 text-teletext-red border p-3 text-xs"
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
          <div className="border-teletext-green bg-teletext-green/5 border p-3 text-xs">
            <div className="border-teletext-green/20 flex items-center justify-between border-b pb-2">
              <span className="text-teletext-green font-bold">✓ VALID PAGEPACK VERIFIED</span>
              <span className="border-teletext-green text-teletext-green py-0.2 border px-1.5 text-[10px] font-bold">
                P{candidatePack.primaryPageNumber}
              </span>
            </div>

            <div className="text-text-secondary mt-2 space-y-1 text-[11px]">
              <div>
                <span className="text-text-muted">TITLE: </span>
                <span className="text-text-primary font-semibold">{candidatePack.title}</span>
              </div>
              <div className="flex gap-4">
                <div>
                  <span className="text-text-muted">MAGAZINE: </span>
                  <span className="text-teletext-yellow">{candidatePack.magazine}</span>
                </div>
                <div>
                  <span className="text-text-muted">PAGES: </span>
                  <span className="text-text-primary">{candidatePack.pages.length}</span>
                </div>
                <div>
                  <span className="text-text-muted">SOURCE: </span>
                  <span className="text-text-primary">
                    {candidatePack.metadata?.sourceName || "Independent"}
                  </span>
                </div>
              </div>
              {budgetResult && (
                <div>
                  <span className="text-text-muted">BUDGET: </span>
                  <span
                    className={
                      budgetResult.isOverBudget
                        ? "text-teletext-red font-bold"
                        : "text-teletext-green"
                    }
                  >
                    {budgetResult.bytesUsed} / {budgetResult.maxBytes} bytes (
                    {budgetResult.percentageUsed}%)
                  </span>
                </div>
              )}
            </div>

            {saveSuccess ? (
              <div className="border-teletext-green/30 mt-3 flex items-center justify-between border-t pt-2 text-xs">
                <span className="text-teletext-green font-bold">
                  ★ SAVED TO LOCAL OFFLINE VAULT!
                </span>
                <a
                  href={`/terminal?page=${candidatePack.primaryPageNumber}`}
                  className="border-teletext-cyan bg-teletext-cyan text-teletext-black hover:bg-teletext-yellow px-2.5 py-1 font-bold transition-colors"
                >
                  VIEW BULLETIN P{candidatePack.primaryPageNumber} →
                </a>
              </div>
            ) : (
              <div className="border-teletext-green/30 mt-3 border-t pt-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveToVault}
                  className="border-teletext-green bg-teletext-green text-teletext-black hover:bg-teletext-yellow flex w-full items-center justify-center gap-1.5 border py-1.5 text-xs font-bold transition-colors disabled:opacity-50"
                  data-testid="save-to-vault-btn"
                >
                  {isSaving ? "SAVING TO INDEXEDDB..." : "★ SAVE TO LOCAL OFFLINE VAULT"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-surface-border text-text-muted flex justify-between border-t pt-2 text-[10px]">
          <span>Format: PagePack v1 Canonical JSON</span>
          <span>Security: Client-side sandboxed validation</span>
        </div>
      </div>
    </div>
  );
}

export function ImportDialog({ isOpen, onClose, onImportSuccess }: ImportDialogProps) {
  if (!isOpen) return null;

  return <ImportDialogModal onClose={onClose} onImportSuccess={onImportSuccess} />;
}
