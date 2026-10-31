import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TeletextSynthesizer } from "@/lib/audio/teletext-synthesizer";

describe("Teletext Web Audio Synthesizer Unit Suite (TASK-S4-06)", () => {
  const originalWindow = globalThis.window;

  // Mock Web Audio API
  let mockOscillator: any;
  let mockGain: any;

  class MockAudioContext {
    currentTime = 10.0;
    state = "running";
    destination = {};
    createOscillator = vi.fn(() => mockOscillator);
    createGain = vi.fn(() => mockGain);
    resume = vi.fn().mockResolvedValue(undefined);
    close = vi.fn().mockResolvedValue(undefined);
  }

  beforeEach(() => {
    mockOscillator = {
      type: "sine",
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
      onended: null,
    };

    mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    (globalThis as any).window = {
      AudioContext: MockAudioContext,
    };
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
  });

  it("does not start audio or create context until explicit initialize() call", () => {
    const synth = new TeletextSynthesizer();
    expect(synth.isInitialized).toBe(false);

    // Calling play without init does nothing and does not throw
    synth.playTuningChirp(101);
    expect(mockOscillator.start).not.toHaveBeenCalled();

    // Explicit user activation
    const initialized = synth.initialize();
    expect(initialized).toBe(true);
    expect(synth.isInitialized).toBe(true);
  });

  it("clamps volume values strictly between 0.0 and 1.0", () => {
    const synth = new TeletextSynthesizer({ initialVolume: 0.5 });
    expect(synth.currentVolume).toBe(0.5);

    synth.setVolume(1.8);
    expect(synth.currentVolume).toBe(1.0);

    synth.setVolume(-0.4);
    expect(synth.currentVolume).toBe(0.0);
  });

  it("updates master gain when mute state is toggled", () => {
    const synth = new TeletextSynthesizer({ initialVolume: 0.8 });
    synth.initialize();

    expect(synth.muted).toBe(false);

    synth.setMuted(true);
    expect(synth.muted).toBe(true);
    expect(mockGain.gain.setValueAtTime).toHaveBeenCalledWith(0, 10.0);

    synth.setMuted(false);
    expect(synth.muted).toBe(false);
    expect(mockGain.gain.setValueAtTime).toHaveBeenCalledWith(0.8, 10.0);
  });

  it("synthesizes tuning frequency chirp with envelope on playTuningChirp", () => {
    const synth = new TeletextSynthesizer();
    synth.initialize();

    synth.playTuningChirp(205);
    expect(mockOscillator.type).toBe("sawtooth");
    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalled();
    expect(mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalled();
    expect(mockOscillator.start).toHaveBeenCalledWith(10.0);
  });

  it("synthesizes navigation tick on playNavigationTick", () => {
    const synth = new TeletextSynthesizer();
    synth.initialize();

    synth.playNavigationTick();
    expect(mockOscillator.type).toBe("sine");
    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(980, 10.0);
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it("synthesizes distinct harmonized chords for Fastext color cues", () => {
    const synth = new TeletextSynthesizer();
    synth.initialize();

    synth.playFastextTone("red");
    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(440.0, 10.0);

    synth.playFastextTone("green");
    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(554.37, 10.0);

    synth.playFastextTone("yellow");
    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(659.25, 10.0);

    synth.playFastextTone("cyan");
    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(880.0, 10.0);
  });

  it("suppresses all audio playback when muted", () => {
    const synth = new TeletextSynthesizer({ initialMuted: true });
    synth.initialize();

    synth.playTuningChirp(100);
    synth.playNavigationTick();
    synth.playFastextTone("red");

    // Oscillators are not started when muted
    expect(mockOscillator.start).not.toHaveBeenCalled();
  });

  it("cleans up resources and closes AudioContext upon dispose()", () => {
    const synth = new TeletextSynthesizer();
    synth.initialize();

    synth.dispose();
    expect(synth.isInitialized).toBe(false);
  });

  it("handles environments lacking Web Audio API gracefully without throwing", () => {
    (globalThis as any).window = {};
    const synth = new TeletextSynthesizer();

    const initialized = synth.initialize();
    expect(initialized).toBe(false);
    expect(synth.isInitialized).toBe(false);

    // Playing sounds does nothing
    synth.playTuningChirp(100);
  });
});
