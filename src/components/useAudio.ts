/**
 * @file useAudio.ts
 *
 * Custom React hook that provides a `playNote` function for triggering piano
 * key sounds using Tone.js. This is the app's audio engine -- every key press
 * on the {@link PianoKeyboard} component goes through this hook.
 *
 * **Design decisions:**
 * - A `Tone.Sampler` loads real Salamander Grand Piano samples from the
 *   official Tone.js CDN (`tonejs.github.io/audio/salamander/`). Only a
 *   sparse set of notes is fetched (~12 samples); Tone.Sampler automatically
 *   pitch-shifts to cover all intermediate notes.
 * - While the sampler loads asynchronously (~500 KB), a lightweight `PolySynth`
 *   fallback plays immediately so the app is never silent on first interaction.
 *   Once samples finish loading, all subsequent notes use the sampler.
 * - The sampler and fallback synth are lazily initialized on first use and
 *   stored in `useRef`s so a single instance is shared across all key presses.
 * - `Tone.start()` is called on every `playNote` invocation if the AudioContext
 *   is not yet running. This is required because iOS and modern browsers block
 *   audio playback until a user gesture triggers `AudioContext.resume()`.
 */

import { useCallback, useRef, useState, useEffect } from "react";
import * as Tone from "tone";

/**
 * Base URL for Salamander Grand Piano MP3 samples, hosted on the official
 * Tone.js GitHub Pages CDN. Files are named like `C4.mp3`, `Fs4.mp3` (sharps
 * use `s` suffix, e.g. `Fs4` for F#4).
 */
const SAMPLE_BASE_URL =
  "https://tonejs.github.io/audio/salamander/";

/**
 * Sparse set of notes to load. Tone.Sampler pitch-shifts between these to
 * cover all keys on the keyboard. We load every C and every F# across
 * octaves 1–7 for smooth coverage of the C2–B5 default range.
 *
 * Keys = Tone.js note names (e.g. "F#3").
 * Values = filenames on the CDN (e.g. "Fs3.mp3").
 */
const SAMPLE_URLS: Record<string, string> = {
  A0: "A0.mp3",
  C1: "C1.mp3",
  "F#1": "Fs1.mp3",
  C2: "C2.mp3",
  "F#2": "Fs2.mp3",
  C3: "C3.mp3",
  "F#3": "Fs3.mp3",
  C4: "C4.mp3",
  "F#4": "Fs4.mp3",
  C5: "C5.mp3",
  "F#5": "Fs5.mp3",
  C6: "C6.mp3",
  "F#6": "Fs6.mp3",
  C7: "C7.mp3",
};

/**
 * Hook that provides piano note playback via Tone.js.
 *
 * Uses real Salamander Grand Piano samples loaded from a CDN.
 * While samples are loading, a lightweight PolySynth fallback plays
 * immediately. Once loading completes, all playback uses the sampler.
 *
 * @returns An object containing:
 *   - `playNote(noteName)` -- Plays the given note as a quarter-note duration.
 *     The `noteName` should be a Tone.js-compatible string like `"C4"`,
 *     `"F#5"`, etc.
 *   - `isLoaded` -- `true` once the piano samples have finished loading.
 *
 * @example
 * ```tsx
 * const { playNote, isLoaded } = useAudio();
 * // In a click handler:
 * playNote("C4");
 * ```
 */
export function useAudio() {
  /** Whether the sampler has finished loading all samples. */
  const [isLoaded, setIsLoaded] = useState(false);

  /** Lazily initialized Sampler instance (real piano samples). */
  const samplerRef = useRef<Tone.Sampler | null>(null);

  /** Fallback PolySynth used while samples are still loading. */
  const fallbackRef = useRef<Tone.PolySynth | null>(null);

  /**
   * Ensures the fallback PolySynth exists. The envelope approximates a
   * piano: near-instant attack, moderate decay, low sustain, natural release.
   */
  const ensureFallback = useCallback(() => {
    if (!fallbackRef.current) {
      fallbackRef.current = new Tone.PolySynth(Tone.Synth, {
        envelope: {
          attack: 0.01,
          decay: 0.3,
          sustain: 0.2,
          release: 0.8,
        },
      }).toDestination();
    }
    return fallbackRef.current;
  }, []);

  /**
   * Initialize the sampler on mount. It loads samples asynchronously from the
   * Tone.js Salamander CDN; once ready, `isLoaded` flips to true and playNote
   * switches from the fallback synth to the sampler.
   */
  useEffect(() => {
    const sampler = new Tone.Sampler({
      urls: SAMPLE_URLS,
      baseUrl: SAMPLE_BASE_URL,
      release: 1,
      onload: () => {
        setIsLoaded(true);
      },
    }).toDestination();

    samplerRef.current = sampler;

    return () => {
      sampler.dispose();
      samplerRef.current = null;
    };
  }, []);

  /**
   * Plays a single note with quarter-note duration.
   *
   * Uses the real piano sampler if samples have loaded, otherwise falls
   * back to the PolySynth. Automatically resumes the AudioContext if it
   * is suspended (required on iOS where audio cannot start without a
   * user gesture).
   *
   * @param noteName - A Tone.js note string, e.g. `"C4"`, `"F#5"`, `"Bb3"`.
   */
  const playNote = useCallback(
    async (noteName: string) => {
      // Ensure audio context is started (requires user gesture on iOS/Safari)
      if (Tone.getContext().state !== "running") {
        await Tone.start();
      }

      if (isLoaded && samplerRef.current) {
        samplerRef.current.triggerAttackRelease(noteName, 0.8);
      } else {
        const fallback = ensureFallback();
        fallback.triggerAttackRelease(noteName, 0.8);
      }
    },
    [isLoaded, ensureFallback],
  );

  return { playNote, isLoaded };
}
