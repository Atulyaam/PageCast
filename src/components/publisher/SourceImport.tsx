"use client";

import React, { useState } from "react";
import type { ExtractedSource } from "@/domain/source-provenance/types";

export interface SourceImportProps {
  readonly onSourceExtracted: (source: ExtractedSource) => void;
  readonly className?: string;
}

export const SourceImport: React.FC<SourceImportProps> = ({
  onSourceExtracted,
  className = "",
}) => {
  const [mode, setMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");
  const [byline, setByline] = useState("");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [extractedPreview, setExtractedPreview] = useState<ExtractedSource | null>(null);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setLoadingStep("Validating URL & checking SSRF safety...");
    setError(null);
    setExtractedPreview(null);

    try {
      setLoadingStep("Connecting via safe pinned transport...");
      const res = await fetch("/api/v1/sources/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), language }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to extract article`);
      }

      setExtractedPreview(data.source);
      onSourceExtracted(data.source);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setIsLoading(true);
    setLoadingStep("Segmenting sentences & generating provenance hashes...");
    setError(null);
    setExtractedPreview(null);

    try {
      const res = await fetch("/api/v1/sources/from-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: rawText.trim(),
          title: title.trim() || undefined,
          byline: byline.trim() || undefined,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to process text`);
      }

      setExtractedPreview(data.source);
      onSourceExtracted(data.source);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div
      className={`bg-surface-panel border-surface-border rounded-terminal border p-4 shadow-xl sm:p-6 ${className}`.trim()}
    >
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-teletext-yellow text-lg font-bold tracking-wide sm:text-xl">
            SOURCE ARTICLE INGESTION
          </h2>
          <p className="text-text-muted text-xs sm:text-sm">
            Fetch external news articles or paste raw text. Full SSRF & script execution protection.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="bg-surface-terminal border-surface-border flex rounded-lg border p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`rounded px-3 py-1.5 font-medium transition-colors ${
              mode === "url"
                ? "bg-teletext-yellow text-teletext-black shadow"
                : "text-text-muted hover:text-teletext-white"
            }`}
          >
            Import from URL
          </button>
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`rounded px-3 py-1.5 font-medium transition-colors ${
              mode === "text"
                ? "bg-teletext-yellow text-teletext-black shadow"
                : "text-text-muted hover:text-teletext-white"
            }`}
          >
            Paste Raw Text
          </button>
        </div>
      </div>

      {/* Language Selector */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-text-muted text-xs font-semibold uppercase">Target Language:</label>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`rounded border px-2.5 py-1 ${
              language === "en"
                ? "border-teletext-cyan bg-teletext-cyan/20 text-teletext-cyan font-bold"
                : "border-surface-border text-text-muted"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage("hi")}
            className={`rounded border px-2.5 py-1 ${
              language === "hi"
                ? "border-teletext-cyan bg-teletext-cyan/20 text-teletext-cyan font-bold"
                : "border-surface-border text-text-muted"
            }`}
          >
            हिंदी (Devanagari)
          </button>
        </div>
      </div>

      {mode === "url" ? (
        <form onSubmit={handleUrlSubmit} className="space-y-4">
          <div>
            <label htmlFor="url-input" className="text-text-muted mb-1 block text-xs font-medium">
              Public Article URL (HTTP / HTTPS)
            </label>
            <div className="flex gap-2">
              <input
                id="url-input"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article/world-news"
                disabled={isLoading}
                className="bg-surface-terminal border-surface-border focus:border-teletext-yellow text-teletext-white flex-1 rounded-md border px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="bg-teletext-cyan hover:bg-teletext-cyan/80 text-teletext-black cursor-pointer rounded-md px-4 py-2 text-sm font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Fetching..." : "Fetch & Extract"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="title-input"
                className="text-text-muted mb-1 block text-xs font-medium"
              >
                Title / Headline (Optional)
              </label>
              <input
                id="title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cyclone Recovery Operation"
                disabled={isLoading}
                className="bg-surface-terminal border-surface-border focus:border-teletext-yellow text-teletext-white w-full rounded-md border px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="byline-input"
                className="text-text-muted mb-1 block text-xs font-medium"
              >
                Author / Byline (Optional)
              </label>
              <input
                id="byline-input"
                type="text"
                value={byline}
                onChange={(e) => setByline(e.target.value)}
                placeholder="e.g. Operations Command"
                disabled={isLoading}
                className="bg-surface-terminal border-surface-border focus:border-teletext-yellow text-teletext-white w-full rounded-md border px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="text-input" className="text-text-muted mb-1 block text-xs font-medium">
              Article Body / Notice Text
            </label>
            <textarea
              id="text-input"
              required
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste article content or emergency notice here..."
              disabled={isLoading}
              className="bg-surface-terminal border-surface-border focus:border-teletext-yellow text-teletext-white w-full rounded-md border px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !rawText.trim()}
            className="bg-teletext-cyan hover:bg-teletext-cyan/80 text-teletext-black cursor-pointer rounded-md px-4 py-2 text-sm font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Parse & Segment Notice"}
          </button>
        </form>
      )}

      {/* Progress Feedback */}
      {isLoading && (
        <div className="bg-surface-terminal border-teletext-cyan/30 text-teletext-cyan mt-4 flex items-center gap-3 rounded border p-3 text-xs">
          <div className="border-teletext-cyan h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
          <span>{loadingStep || "Processing request..."}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-teletext-red/10 border-teletext-red/50 text-teletext-red mt-4 rounded border p-3 text-xs">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      {/* Extracted Preview Card */}
      {extractedPreview && (
        <div className="bg-surface-terminal border-teletext-green/40 mt-6 rounded-md border p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-teletext-green text-xs font-bold tracking-wider uppercase">
              ✓ Successfully Extracted
            </span>
            <span className="text-text-muted text-xs">
              {extractedPreview.sentences.length} sentences indexed
            </span>
          </div>

          <h3 className="text-teletext-white text-base font-bold">{extractedPreview.title}</h3>

          <div className="text-text-muted mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {extractedPreview.siteName && <span>Source: {extractedPreview.siteName}</span>}
            {extractedPreview.byline && <span>By: {extractedPreview.byline}</span>}
            <span>Language: {extractedPreview.language === "hi" ? "हिंदी" : "English"}</span>
          </div>

          <div className="mt-3 max-h-32 overflow-y-auto rounded bg-black/40 p-2 text-xs leading-relaxed text-gray-300">
            {extractedPreview.content.slice(0, 300)}...
          </div>
        </div>
      )}
    </div>
  );
};
