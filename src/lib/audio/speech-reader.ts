/**
 * PageCast Assistive Speech Narration Engine (TASK-S4-07)
 *
 * Implements an accessible, user-controlled speech synthesizer utilizing the
 * Web Speech API (SpeechSynthesis) for reading Teletext bulletins in English & Hindi.
 *
 * INVARIANTS:
 * - NEVER auto-starts speech without explicit user activation.
 * - Cancels speech immediately on stop() or navigation away from page.
 * - Graceful fallback in environments lacking SpeechSynthesis.
 */

import type { TeletextPage } from "@/domain/teletext/types";
import { getTeletextSynthesizer } from "./teletext-synthesizer";

export interface SpeechReaderState {
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
}

export type SpeechStateListener = (state: SpeechReaderState) => void;

export class BulletinSpeechReader {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<SpeechStateListener> = new Set();
  private _isPaused = false;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public get isSupported(): boolean {
    return this.synth !== null;
  }

  public get isSpeaking(): boolean {
    return Boolean(this.synth?.speaking);
  }

  public get isPaused(): boolean {
    return this._isPaused;
  }

  public subscribe(listener: SpeechStateListener): () => void {
    this.listeners.add(listener);
    this.notify();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state: SpeechReaderState = {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      isSupported: this.isSupported,
    };
    this.listeners.forEach((l) => l(state));
  }

  /**
   * Extracts clean, readable speech sentences from a 40x25 TeletextPage,
   * skipping decorative borders, blank rows, and fastext keys.
   */
  public extractScriptFromPage(page: TeletextPage): string {
    const lines: string[] = [];

    // Header announcement
    lines.push(`PageCast broadcast. Page ${page.pageNumber}. ${page.title}.`);

    // Body rows (rows 1 to 23, skipping row 0 header and row 24 navigation)
    const contentRows = page.rows.slice(1, 24);
    for (const row of contentRows) {
      const text = row.spans
        .map((s) => s.text)
        .join("")
        .trim();
      if (text && !text.startsWith("---") && !text.startsWith("===")) {
        lines.push(text);
      }
    }

    return lines.join(" ");
  }

  /**
   * Narrates a bulletin page or raw script aloud after user click.
   */
  public speak(target: TeletextPage | string, language: "en" | "hi" = "en"): void {
    if (!this.synth) return;

    // Cancel any active utterance
    this.stop();

    const script = typeof target === "string" ? target : this.extractScriptFromPage(target);
    if (!script.trim()) return;

    // Play subtle audio carrier chirp before reading
    try {
      const audioSynth = getTeletextSynthesizer();
      if (audioSynth.isInitialized && !audioSynth.muted) {
        audioSynth.playNavigationTick();
      }
    } catch {}

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = language === "hi" ? "hi-IN" : "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this._isPaused = false;
      this.notify();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      this._isPaused = false;
      this.notify();
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
      this._isPaused = false;
      this.notify();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    this.notify();
  }

  public pause(): void {
    if (!this.synth || !this.isSpeaking) return;
    this.synth.pause();
    this._isPaused = true;
    this.notify();
  }

  public resume(): void {
    if (!this.synth || !this._isPaused) return;
    this.synth.resume();
    this._isPaused = false;
    this.notify();
  }

  public stop(): void {
    if (!this.synth) return;
    this.synth.cancel();
    this.currentUtterance = null;
    this._isPaused = false;
    this.notify();
  }
}

let defaultSpeechReader: BulletinSpeechReader | null = null;

export function getBulletinSpeechReader(): BulletinSpeechReader {
  if (!defaultSpeechReader) {
    defaultSpeechReader = new BulletinSpeechReader();
  }
  return defaultSpeechReader;
}
