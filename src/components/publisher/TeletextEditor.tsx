"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { TeletextPage, TeletextRow, TeletextColor } from "@/domain/teletext/types";
import { TELETEXT_ROWS, TELETEXT_COLS } from "@/domain/layout-engine/layout";
import { getGraphemeCount, padToColumns } from "@/domain/layout-engine/graphemes";
import { ColorPalettePicker } from "./ColorPalettePicker";
import { TeletextGrid } from "@/components/teletext/TeletextGrid";

export interface TeletextEditorProps {
  initialPage: TeletextPage;
  onChange?: (updatedPage: TeletextPage) => void;
  readOnly?: boolean;
  className?: string;
}

export const TeletextEditor: React.FC<TeletextEditorProps> = ({
  initialPage,
  onChange,
  readOnly = false,
  className = "",
}) => {
  const language = initialPage.language || "en";
  const [rows, setRows] = useState<TeletextRow[]>(() => {
    return initialPage.rows && initialPage.rows.length === TELETEXT_ROWS
      ? [...initialPage.rows]
      : Array.from({ length: TELETEXT_ROWS }, () => ({
          spans: [{ text: " ".repeat(TELETEXT_COLS), color: "white" as TeletextColor }],
        }));
  });

  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(1); // Row 1 (first content row)
  const [selectedColor, setSelectedColor] = useState<TeletextColor>("yellow");
  const [history, setHistory] = useState<TeletextRow[][]>([]);

  // Extracts plain text from row spans
  const getRowText = useCallback((row: TeletextRow): string => {
    return row.spans.map((s) => s.text).join("");
  }, []);

  // Update row text while preserving 40 logical columns
  const handleRowTextChange = (text: string) => {
    if (readOnly) return;
    if (selectedRowIndex < 0 || selectedRowIndex >= TELETEXT_ROWS) return;

    setHistory((prev) => [...prev.slice(-10), rows]);

    const padded = padToColumns(text, TELETEXT_COLS, " ", language);
    const updatedRow: TeletextRow = {
      spans: [
        {
          text: padded,
          color: selectedColor,
        },
      ],
    };

    const newRows = [...rows];
    newRows[selectedRowIndex] = updatedRow;
    setRows(newRows);

    if (onChange) {
      onChange({
        ...initialPage,
        rows: newRows,
      });
    }
  };

  // Change color of currently selected row
  const handleApplyColor = (color: TeletextColor) => {
    if (readOnly) return;
    setSelectedColor(color);

    const currentRow = rows[selectedRowIndex];
    if (!currentRow) return;

    setHistory((prev) => [...prev.slice(-10), rows]);

    const updatedRow: TeletextRow = {
      spans: currentRow.spans.map((s) => ({
        ...s,
        color,
      })),
    };

    const newRows = [...rows];
    newRows[selectedRowIndex] = updatedRow;
    setRows(newRows);

    if (onChange) {
      onChange({
        ...initialPage,
        rows: newRows,
      });
    }
  };

  // Undo last change
  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setRows(previous);

    if (onChange) {
      onChange({
        ...initialPage,
        rows: previous,
      });
    }
  };

  // Clear current row
  const handleClearRow = () => {
    handleRowTextChange("");
  };

  const currentRow = rows[selectedRowIndex] || { spans: [] };
  const currentRowText = getRowText(currentRow);
  const currentGraphemeCount = getGraphemeCount(currentRowText.trimEnd(), language);

  return (
    <div
      className={`flex flex-col gap-4 rounded-lg border border-[#222222] bg-[#0a0a0a] p-4 ${className}`.trim()}
    >
      {/* Editor Controls & Color Palette */}
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <ColorPalettePicker
          selectedColor={selectedColor}
          onSelectColor={handleApplyColor}
          className="flex-1"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0 || readOnly}
            className="rounded border border-[#333333] bg-[#1a1a1a] px-3 py-1.5 font-mono text-xs font-bold text-[#cccccc] transition hover:bg-[#252525] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={handleClearRow}
            disabled={readOnly || selectedRowIndex === 0 || selectedRowIndex === 24}
            className="rounded border border-[#333333] bg-[#1a1a1a] px-3 py-1.5 font-mono text-xs font-bold text-[#ff6666] transition hover:bg-[#252525] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear Row
          </button>
        </div>
      </div>

      {/* Row Editor Inspector Bar */}
      <div className="flex flex-col items-stretch gap-3 rounded border border-[#222222] bg-[#111111] p-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="row-select" className="font-mono text-xs text-[#888888] uppercase">
            Row:
          </label>
          <select
            id="row-select"
            value={selectedRowIndex}
            onChange={(e) => setSelectedRowIndex(Number(e.target.value))}
            className="rounded border border-[#333333] bg-[#1a1a1a] px-2 py-1 font-mono text-xs text-white"
          >
            {rows.map((_, i) => (
              <option key={i} value={i}>
                {i === 0
                  ? "Row 1 (Header - Locked)"
                  : i === 24
                    ? "Row 25 (Fastext - Nav)"
                    : `Row ${i + 1}`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 items-center gap-2">
          <label htmlFor="row-input" className="sr-only">
            Edit Row Content
          </label>
          <input
            id="row-input"
            type="text"
            value={currentRowText.trimEnd()}
            onChange={(e) => handleRowTextChange(e.target.value)}
            disabled={readOnly || selectedRowIndex === 0 || selectedRowIndex === 24}
            placeholder={
              selectedRowIndex === 0 ? "Header is generated automatically" : "Type teletext text..."
            }
            className="w-full rounded border border-[#333333] bg-[#181818] px-3 py-1.5 font-mono text-sm text-white focus:border-yellow-400 focus:outline-none disabled:opacity-50"
            maxLength={TELETEXT_COLS}
          />
        </div>

        <div className="flex shrink-0 items-center gap-2 font-mono text-xs text-[#888888]">
          <span>
            Length: <strong className="text-white">{currentGraphemeCount}</strong> / {TELETEXT_COLS}
          </span>
        </div>
      </div>

      {/* Interactive CRT Grid Preview */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between font-mono text-xs text-[#888888]">
          <span>40×25 CRT Canvas Preview (Click any row to edit)</span>
          <span className="text-teletext-green">Active Page: P{initialPage.pageNumber}</span>
        </div>

        <div className="relative overflow-hidden rounded border border-[#333333] bg-black shadow-2xl">
          <TeletextGrid
            page={{
              ...initialPage,
              rows,
            }}
            showScanlines={true}
          />
        </div>
      </div>
    </div>
  );
};
