/**
 * PageCast Authentic Teletext 40×25 Carrier Tuning Loading Screen (TASK-S4-02)
 *
 * Generates an authentic retro Teletext 40x25 searching/tuning display conforming
 * strictly to the logical grid geometry while fetching published bulletins.
 */

import React from "react";
import type { TeletextPage } from "@/domain/teletext/types";
import { layoutBulletinPage } from "@/domain/layout-engine/layout";
import { TeletextGrid } from "./TeletextGrid";

export function createLoadingPage(pageNumber: number): TeletextPage {
  const safePageNum = pageNumber >= 100 && pageNumber <= 899 ? pageNumber : 100;

  return layoutBulletinPage({
    pageNumber: safePageNum,
    title: "TUNING CARRIER...",
    headline: "ACQUIRING TELETEXT BROADCAST",
    paragraphs: [
      `Searching VHF/UHF broadcast raster for Page P${safePageNum}...`,
      "",
      "SYNCHRONIZING TELETEXT FRAMES:",
      "[||||||||||||||||||||||||] 9600 BAUD",
      "",
      "DECODING 40x25 CHARACTER CELLS...",
      "VERIFYING 10 KiB PAYLOAD BUDGET...",
      "",
      "Please stand by for transmission.",
    ],
    fastext: {
      red: 100,
      green: 200,
      yellow: 300,
      cyan: 400,
    },
    language: "en",
  });
}

export interface TerminalLoadingProps {
  pageNumber: number;
  showScanlines?: boolean;
  phosphorGlow?: boolean;
}

export const TerminalLoading: React.FC<TerminalLoadingProps> = ({
  pageNumber,
  showScanlines = false,
  phosphorGlow = true,
}) => {
  const loadingPage = createLoadingPage(pageNumber);

  return (
    <div className="w-full">
      <TeletextGrid page={loadingPage} showScanlines={showScanlines} phosphorGlow={phosphorGlow} />
    </div>
  );
};
