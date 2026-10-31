"use client";

import React, { useState } from "react";
import type { ExtractedSource } from "@/domain/source-provenance/types";
import {
  getCommunityTemplates,
  getCommunityTemplateById,
  instantiateCommunityTemplate,
} from "@/domain/templates/community-templates";

export interface SourceImportProps {
  readonly onSourceExtracted: (source: ExtractedSource) => void;
  readonly defaultMode?: "url" | "text" | "template";
  readonly className?: string;
}

export const SourceImport: React.FC<SourceImportProps> = ({
  onSourceExtracted,
  defaultMode = "url",
  className = "",
}) => {
  const [mode, setMode] = useState<"url" | "text" | "template">(defaultMode);
  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");
  const [byline, setByline] = useState("");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("academic-notice");
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [extractedPreview, setExtractedPreview] = useState<ExtractedSource | null>(null);

  const templates = getCommunityTemplates();
  const currentTemplate = getCommunityTemplateById(selectedTemplateId) || templates[0];

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

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingStep("Instantiating community template & generating provenance hashes...");
    setError(null);
    setExtractedPreview(null);

    try {
      const result = instantiateCommunityTemplate(selectedTemplateId, templateValues, language);

      const res = await fetch("/api/v1/sources/from-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: result.textContent,
          title: result.title,
          siteName: result.siteName,
          byline: result.byline,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to process template`);
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
            Fetch external articles, paste raw text, or select Community Broadcast templates.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="bg-surface-terminal border-surface-border flex rounded-lg border p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`rounded px-3 py-1.5 font-medium transition-colors ${
              mode === "url"
                ? "bg-teletext-yellow text-teletext-black font-bold shadow"
                : "text-text-muted hover:text-teletext-white"
            }`}
          >
            Import URL
          </button>
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`rounded px-3 py-1.5 font-medium transition-colors ${
              mode === "text"
                ? "bg-teletext-yellow text-teletext-black font-bold shadow"
                : "text-text-muted hover:text-teletext-white"
            }`}
          >
            Paste Text
          </button>
          <button
            type="button"
            onClick={() => setMode("template")}
            className={`rounded px-3 py-1.5 font-medium transition-colors ${
              mode === "template"
                ? "bg-teletext-yellow text-teletext-black font-bold shadow"
                : "text-text-muted hover:text-teletext-white"
            }`}
          >
            📢 Community Presets
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
      ) : mode === "text" ? (
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
      ) : (
        <form onSubmit={handleTemplateSubmit} className="space-y-4">
          <div>
            <label className="text-text-muted mb-1 block text-xs font-semibold uppercase">
              Select Community Template:
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplateId(tpl.id);
                    setTemplateValues({});
                  }}
                  className={`cursor-pointer rounded-md border p-3 text-left transition-colors ${
                    selectedTemplateId === tpl.id
                      ? "border-teletext-yellow bg-teletext-yellow/10 text-white"
                      : "border-surface-border bg-surface-terminal text-text-muted hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-teletext-yellow text-xs font-bold">{tpl.name}</span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                      P{tpl.recommendedPage}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed">{tpl.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="border-surface-border bg-surface-terminal space-y-3 rounded-md border p-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="text-teletext-cyan text-xs font-bold uppercase">
                {currentTemplate.name} Fields
              </span>
              <span className="text-text-muted text-[11px]">
                Language: {language === "hi" ? "हिंदी" : "English"}
              </span>
            </div>

            {currentTemplate.fields.map((field) => {
              const val =
                templateValues[field.key] !== undefined
                  ? templateValues[field.key]
                  : field.defaultValues[language];

              return (
                <div key={field.key}>
                  <label className="text-text-muted mb-1 block text-xs font-medium">
                    {field.label} {field.required && <span className="text-teletext-red">*</span>}
                  </label>
                  {field.multiline ? (
                    <textarea
                      rows={4}
                      value={val}
                      onChange={(e) =>
                        setTemplateValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      disabled={isLoading}
                      className="border-surface-border focus:border-teletext-yellow text-teletext-white w-full rounded border bg-black px-3 py-1.5 font-mono text-xs focus:outline-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={val}
                      onChange={(e) =>
                        setTemplateValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      disabled={isLoading}
                      className="border-surface-border focus:border-teletext-yellow text-teletext-white w-full rounded border bg-black px-3 py-1.5 font-mono text-xs focus:outline-none"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-teletext-yellow hover:bg-teletext-yellow/80 text-teletext-black cursor-pointer rounded-md px-4 py-2 text-sm font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Instantiating..." : "Use Template & Segment Notice"}
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
