/**
 * PageCast Authentic Teletext 40×25 Not Found Screen (TASK-S4-02)
 *
 * Generates an authentic retro Teletext 40x25 error display conforming
 * strictly to the logical grid geometry, with actionable Fastext navigation.
 */

import React from "react";
import type { TeletextPage } from "@/domain/teletext/types";
import { layoutBulletinPage } from "@/domain/layout-engine/layout";
import { TeletextGrid } from "./TeletextGrid";

export function createNotFoundPage(pageNumber: number): TeletextPage {
  const safePageNum = pageNumber >= 100 && pageNumber <= 899 ? pageNumber : 404;

  return layoutBulletinPage({
    pageNumber: safePageNum,
    title: "PAGE NOT FOUND",
    headline: "PAGE NOT TRANSMITTED",
    paragraphs: [
      `The requested page P${safePageNum} is not currently broadcasting in the PageCast stream.`,
      "",
      "CHECK TRANSMISSION DIRECTORY:",
      "- Main Index: Press RED (P100)",
      "- Technology: Press GREEN (P200)",
      "- Weather: Press YELLOW (P300)",
      "- Sports: Press CYAN (P400)",
      "",
      "Use remote dialer to enter any 3-digit page number between 100 and 899.",
    ],
    fastext: {
      red: 100,
      green: 200,
      yellow: 300,
      cyan: 400,
    },
    fastextLabels: {
      red: "Index",
      green: "Tech",
      yellow: "Weather",
      cyan: "Sport",
    },
    language: "en",
  });
}

export interface TerminalNotFoundProps {
  pageNumber: number;
  showScanlines?: boolean;
  phosphorGlow?: boolean;
}

export const TerminalNotFound: React.FC<TerminalNotFoundProps> = ({
  pageNumber,
  showScanlines = false,
  phosphorGlow = true,
}) => {
  const notFoundPage = createNotFoundPage(pageNumber);

  return (
    <div className="w-full">
      <TeletextGrid page={notFoundPage} showScanlines={showScanlines} phosphorGlow={phosphorGlow} />
    </div>
  );
};
