/**
 * PageCast Retro Teletext Web Audio Synthesizer (TASK-S4-06)
 *
 * Implements an isolated, user-activated Web Audio engine providing:
 * - Teletext carrier raster tuning frequency sweeps
 * - Page dial chirps and tactile navigation clicks
 * - Fastext color harmonic cues (Red, Green, Yellow, Cyan)
 *
 * INVARIANTS:
 * - NEVER auto-plays without explicit user activation gesture.
 * - Zero CPU/audio usage when muted or idle.
 * - Full resource cleanup and node disconnection on dispose.
 * - Graceful fallback in environments lacking Web Audio API.
 */

export type FastextToneColor = "red" | "green" | "yellow" | "cyan";

export interface SynthesizerOptions {
  initialVolume?: number; // 0.0 to 1.0
  initialMuted?: boolean;
}

export class TeletextSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean;
  private volume: number;

  constructor(options: SynthesizerOptions = {}) {
    this.volume = Math.max(0, Math.min(1, options.initialVolume ?? 0.3));
    this.isMuted = options.initialMuted ?? false;
  }

  /**
   * Initializes the AudioContext after an explicit user interaction.
   * Safe to call multiple times; reuses existing context.
   */
  public initialize(): boolean {
    if (this.ctx) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }

    try {
      const AudioCtxClass =
        typeof window !== "undefined"
          ? window.AudioContext || (window as any).webkitAudioContext
          : null;

      if (!AudioCtxClass) {
        return false;
      }

      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  public get isInitialized(): boolean {
    return this.ctx !== null;
  }

  public get muted(): boolean {
    return this.isMuted;
  }

  public get currentVolume(): number {
    return this.volume;
  }

  /**
   * Sets master mute state.
   */
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  /**
   * Sets volume clamped to [0.0, 1.0].
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  /**
   * Plays a vintage Teletext carrier sweep/chirp when tuning into a page.
   * Frequency sweep: 600 Hz -> 1400 Hz over 100ms.
   */
  public playTuningChirp(pageNumber: number): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Slightly modulate base frequency based on page magazine (1-8)
      const mag = Math.floor(pageNumber / 100);
      const startFreq = 600 + (mag - 1) * 40;
      const endFreq = 1400 + (mag - 1) * 60;

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.1);

      // Envelope: quick attack, fast decay
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.11);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {
      // Audio execution failure is non-fatal
    }
  }

  /**
   * Plays a subtle navigation blip/tick (25ms) on row or page change.
   */
  public playNavigationTick(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(980, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.03);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {
      // Non-fatal
    }
  }

  /**
   * Plays a harmonized Teletext musical chime for Fastext color selections.
   */
  public playFastextTone(color: FastextToneColor): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const frequencies: Record<FastextToneColor, number> = {
      red: 440.0, // A4
      green: 554.37, // C#5
      yellow: 659.25, // E5
      cyan: 880.0, // A5
    };

    const freq = frequencies[color] || 440.0;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.3, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.13);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {
      // Non-fatal
    }
  }

  /**
   * Disposes all audio nodes and closes the audio context cleanly.
   */
  public dispose(): void {
    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {}
      this.masterGain = null;
    }

    if (this.ctx) {
      try {
        this.ctx.close().catch(() => {});
      } catch {}
      this.ctx = null;
    }
  }
}

let defaultSynthesizer: TeletextSynthesizer | null = null;

export function getTeletextSynthesizer(): TeletextSynthesizer {
  if (!defaultSynthesizer) {
    defaultSynthesizer = new TeletextSynthesizer();
  }
  return defaultSynthesizer;
}
