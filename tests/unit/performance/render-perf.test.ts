import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { TeletextGrid } from "@/components/teletext/TeletextGrid";
import { layoutBulletinPage } from "@/domain/layout-engine/layout";

describe("Performance Engineering & Render Benchmarking (TASK-S5-09 / PERF-001)", () => {
  const sampleBulletin = layoutBulletinPage({
    pageNumber: 101,
    title: "World News Briefing",
    topic: "GLOBAL",
    headline: "INTERNATIONAL CLIMATE PACT RATIFIED",
    paragraphs: [
      "Delegates from 140 nations ratified the landmark treaty today.",
      "Key provisions include carbon transparency and renewable transitions.",
      "The agreement enters into legal force within sixty days.",
    ],
    fastext: { red: 102, green: 200, yellow: 300, cyan: 400 },
  });

  it("renders a full 40x25 Teletext frame in under 50ms (PERF-001 requirement)", () => {
    const start = performance.now();
    renderToString(
      React.createElement(TeletextGrid, {
        page: sampleBulletin,
        showScanlines: true,
        phosphorGlow: true,
      })
    );
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50); // Under 50ms requirement
  });

  it("averages < 25ms per frame across 100 sustained frame render cycles (well within 50ms limit)", () => {
    const iterations = 100;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      renderToString(
        React.createElement(TeletextGrid, {
          page: sampleBulletin,
          showScanlines: i % 2 === 0,
          phosphorGlow: true,
        })
      );
    }

    const totalDuration = performance.now() - start;
    const averagePerFrame = totalDuration / iterations;

    expect(averagePerFrame).toBeLessThan(25.0); // Far faster than 50ms requirement
  });
});
