import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { handleTeletextKeyDown } from "@/hooks/useTeletextKeyboard";
import { KeyboardShortcutsModal } from "@/components/teletext/KeyboardShortcutsModal";

describe("Teletext Keyboard Navigation & Modal Suite (TASK-S4-04)", () => {
  describe("KeyboardShortcutsModal", () => {
    it("renders reference guide when isOpen is true", () => {
      const html = renderToString(
        React.createElement(KeyboardShortcutsModal, {
          isOpen: true,
          onClose: () => {},
        })
      );

      expect(html).toContain("Teletext Remote Control Keys");
      expect(html).toContain("0 – 9");
      expect(html).toContain("Dial 3-digit page number");
      expect(html).toContain("Follow RED Fastext shortcut");
      expect(html).toContain("Return immediately to Main Index (P100)");
    });

    it("renders nothing when isOpen is false", () => {
      const html = renderToString(
        React.createElement(KeyboardShortcutsModal, {
          isOpen: false,
          onClose: () => {},
        })
      );

      expect(html).toBe("");
    });
  });

  describe("handleTeletextKeyDown Key Handler", () => {
    function createBufferHarness(initial = "") {
      let current = initial;
      return {
        get current() {
          return current;
        },
        set: vi.fn((val: string) => {
          current = val;
        }),
        clear: vi.fn(() => {
          current = "";
        }),
      };
    }

    it("dials digits 0-9 into buffer and triggers page navigation on 3rd digit", () => {
      const onNavigate = vi.fn();
      const buffer = createBufferHarness();
      const options = { onNavigatePage: onNavigate };

      // Press '2'
      let handled = handleTeletextKeyDown({ key: "2" }, options, buffer);
      expect(handled).toBe(true);
      expect(buffer.set).toHaveBeenCalledWith("2");

      // Press '0'
      buffer.set.mockClear();
      handled = handleTeletextKeyDown({ key: "0" }, options, buffer);
      expect(handled).toBe(true);
      expect(buffer.set).toHaveBeenCalledWith("20");

      // Press '5' -> completes 3 digits
      buffer.set.mockClear();
      handled = handleTeletextKeyDown({ key: "5" }, options, buffer);
      expect(handled).toBe(true);
      expect(onNavigate).toHaveBeenCalledWith(205);
      expect(buffer.clear).toHaveBeenCalled();
    });

    it("navigates next and previous pages on ArrowUp and ArrowDown", () => {
      const onNext = vi.fn();
      const onPrev = vi.fn();
      const buffer = createBufferHarness();
      const options = { onNavigatePage: () => {}, onNextPage: onNext, onPrevPage: onPrev };

      handleTeletextKeyDown({ key: "ArrowUp" }, options, buffer);
      expect(onNext).toHaveBeenCalledTimes(1);

      handleTeletextKeyDown({ key: "ArrowDown" }, options, buffer);
      expect(onPrev).toHaveBeenCalledTimes(1);
    });

    it("navigates subpages on ArrowLeft and ArrowRight", () => {
      const onNextSub = vi.fn();
      const onPrevSub = vi.fn();
      const buffer = createBufferHarness();
      const options = {
        onNavigatePage: () => {},
        onNextSubPage: onNextSub,
        onPrevSubPage: onPrevSub,
      };

      handleTeletextKeyDown({ key: "ArrowRight" }, options, buffer);
      expect(onNextSub).toHaveBeenCalledTimes(1);

      handleTeletextKeyDown({ key: "ArrowLeft" }, options, buffer);
      expect(onPrevSub).toHaveBeenCalledTimes(1);
    });

    it("handles Fastext color hotkeys R, G, Y, C", () => {
      const onRed = vi.fn();
      const onGreen = vi.fn();
      const onYellow = vi.fn();
      const onCyan = vi.fn();
      const buffer = createBufferHarness();
      const options = {
        onNavigatePage: () => {},
        onFastextRed: onRed,
        onFastextGreen: onGreen,
        onFastextYellow: onYellow,
        onFastextCyan: onCyan,
      };

      handleTeletextKeyDown({ key: "r" }, options, buffer);
      expect(onRed).toHaveBeenCalledTimes(1);

      handleTeletextKeyDown({ key: "G" }, options, buffer);
      expect(onGreen).toHaveBeenCalledTimes(1);

      handleTeletextKeyDown({ key: "y" }, options, buffer);
      expect(onYellow).toHaveBeenCalledTimes(1);

      handleTeletextKeyDown({ key: "c" }, options, buffer);
      expect(onCyan).toHaveBeenCalledTimes(1);
    });

    it("jumps to P100 on Home key", () => {
      const onNavigate = vi.fn();
      const buffer = createBufferHarness();
      const options = { onNavigatePage: onNavigate };

      handleTeletextKeyDown({ key: "Home" }, options, buffer);
      expect(onNavigate).toHaveBeenCalledWith(100);
      expect(buffer.clear).toHaveBeenCalled();
    });

    it("ignores keystrokes when focus is inside an input or textarea", () => {
      const onNext = vi.fn();
      const onNavigate = vi.fn();
      const buffer = createBufferHarness();
      const options = { onNavigatePage: onNavigate, onNextPage: onNext };

      const handled1 = handleTeletextKeyDown(
        { key: "2", target: { tagName: "INPUT" } },
        options,
        buffer
      );
      expect(handled1).toBe(false);
      expect(buffer.set).not.toHaveBeenCalled();

      const handled2 = handleTeletextKeyDown(
        { key: "ArrowUp", target: { tagName: "TEXTAREA" } },
        options,
        buffer
      );
      expect(handled2).toBe(false);
      expect(onNext).not.toHaveBeenCalled();
    });

    it("triggers shortcuts, audio, and text mode toggles via ?, M, T", () => {
      const onShortcuts = vi.fn();
      const onAudio = vi.fn();
      const onText = vi.fn();
      const buffer = createBufferHarness();
      const options = {
        onNavigatePage: () => {},
        onToggleShortcuts: onShortcuts,
        onToggleAudio: onAudio,
        onToggleTextMode: onText,
      };

      handleTeletextKeyDown({ key: "?" }, options, buffer);
      expect(onShortcuts).toHaveBeenCalledTimes(1);

      handleTeletextKeyDown({ key: "m" }, options, buffer);
      expect(onAudio).toHaveBeenCalledTimes(1);

      handleTeletextKeyDown({ key: "t" }, options, buffer);
      expect(onText).toHaveBeenCalledTimes(1);
    });
  });
});
