import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { BulletinSpeechReader } from "@/lib/audio/speech-reader";
import { AudioControls } from "@/components/teletext/AudioControls";
import { layoutBulletinPage } from "@/domain/layout-engine/layout";

describe("Bulletin Speech Reader & Audio Controls (TASK-S4-07)", () => {
  const originalWindow = globalThis.window;

  let mockSynth: any;

  class MockSpeechSynthesisUtterance {
    text: string;
    lang = "en-US";
    rate = 1.0;
    pitch = 1.0;
    onstart = null;
    onend = null;
    onerror = null;
    constructor(text: string) {
      this.text = text;
    }
  }

  beforeEach(() => {
    mockSynth = {
      speaking: false,
      paused: false,
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
    };

    (globalThis as any).window = {
      speechSynthesis: mockSynth,
      SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
    };
    (globalThis as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    delete (globalThis as any).SpeechSynthesisUtterance;
  });

  const testPage = layoutBulletinPage({
    pageNumber: 210,
    title: "Low Bandwidth Resilience",
    paragraphs: [
      "Offline first architectures ensure continuity during severe power disruptions.",
      "Teletext transmits compact data frames at 9600 baud.",
    ],
    fastext: { red: 100, green: 200, yellow: 300, cyan: 400 },
  });

  describe("BulletinSpeechReader Logic", () => {
    it("extracts clean speech script from TeletextPage without borders", () => {
      const reader = new BulletinSpeechReader();
      const script = reader.extractScriptFromPage(testPage);

      expect(script).toContain("PageCast broadcast. Page 210. Low Bandwidth Resilience.");
      expect(script).toContain("Offline first architectures ensure continuity");
      expect(script).not.toContain("---");
    });

    it("speaks English script with en-US language tag", () => {
      const reader = new BulletinSpeechReader();
      reader.speak(testPage, "en");

      expect(mockSynth.speak).toHaveBeenCalledTimes(1);
      const utterance = mockSynth.speak.mock.calls[0][0];
      expect(utterance.lang).toBe("en-US");
    });

    it("speaks Hindi script with hi-IN language tag", () => {
      const reader = new BulletinSpeechReader();
      reader.speak("पेजकास्ट आपातकालीन बुलेटिन", "hi");

      expect(mockSynth.speak).toHaveBeenCalledTimes(1);
      const utterance = mockSynth.speak.mock.calls[0][0];
      expect(utterance.lang).toBe("hi-IN");
    });

    it("controls playback lifecycle via pause, resume, and stop", () => {
      const reader = new BulletinSpeechReader();
      mockSynth.speaking = true;

      reader.pause();
      expect(mockSynth.pause).toHaveBeenCalledTimes(1);
      expect(reader.isPaused).toBe(true);

      reader.resume();
      expect(mockSynth.resume).toHaveBeenCalledTimes(1);
      expect(reader.isPaused).toBe(false);

      reader.stop();
      expect(mockSynth.cancel).toHaveBeenCalledTimes(1);
    });

    it("handles environments lacking SpeechSynthesis safely", () => {
      (globalThis as any).window = {};
      const reader = new BulletinSpeechReader();

      expect(reader.isSupported).toBe(false);
      reader.speak("Test"); // Does not throw
      reader.stop();
    });
  });

  describe("AudioControls Component", () => {
    it("renders sound FX toggle button and language badge", () => {
      const html = renderToString(
        React.createElement(AudioControls, {
          page: testPage,
        })
      );

      expect(html).toContain("SOUND FX: OFF");
      expect(html).toContain("ACOUSTIC CUES MUTED");
    });
  });
});
