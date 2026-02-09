/**
 * @file useAudio.ts
 *
 * Custom React hook that provides a `playNote` function for triggering piano
 * key sounds using Tone.js. This is the app's audio engine -- every key press
 * on the {@link PianoKeyboard} component goes through this hook.
 *
 * **Design decisions:**
 * - A `PolySynth` wrapping `Tone.Synth` is used for the MVP rather than
 *   sampled piano audio. This keeps the bundle small and avoids loading large
 *   audio sample files. The envelope (fast attack, moderate decay/release)
 *   approximates a piano-like sound. A future enhancement could swap this for
 *   a sampled `Tone.Sampler` with real piano recordings.
 * - The synth is lazily initialized on first use via `ensureSynth()` and stored
 *   in a `useRef` so a single instance is shared across all key presses. This
 *   avoids creating a new audio graph on every call and prevents audio glitches.
 * - `Tone.start()` is called on every `playNote` invocation if the AudioContext
 *   is not yet running. This is required because iOS and modern browsers block
 *   audio playback until a user gesture triggers `AudioContext.resume()`. By
 *   calling it inside the click handler path, we satisfy this requirement
 *   transparently.
 */

import { useCallback, useRef } from "react";
import * as Tone from "tone";

/**
 * Hook that provides piano note playback via Tone.js.
 *
 * The synth is lazily created on first use and reused across all subsequent
 * calls. Handles AudioContext activation automatically (required for iOS).
 *
 * @returns An object containing:
 *   - `playNote(noteName)` -- Plays the given note as a quarter-note duration.
 *     The `noteName` should be a Tone.js-compatible string like `"C4"`,
 *     `"F#5"`, etc.
 *
 * @example
 * ```tsx
 * const { playNote } = useAudio();
 * // In a click handler:
 * playNote("C4");
 * ```
 */
export function useAudio() {
  /** Lazily initialized PolySynth instance, shared across all playNote calls. */
  const synthRef = useRef<Tone.PolySynth | null>(null);

  /**
   * Ensures the PolySynth exists, creating it on first call. The envelope
   * parameters approximate a piano: near-instant attack, moderate decay,
   * low sustain, and a natural-sounding release tail.
   *
   * @returns The shared PolySynth instance.
   */
  const ensureSynth = useCallback(() => {
    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        envelope: {
          attack: 0.01,
          decay: 0.3,
          sustain: 0.2,
          release: 0.8,
        },
      }).toDestination();
    }
    return synthRef.current;
  }, []);

  /**
   * Plays a single note with quarter-note duration.
   *
   * Automatically resumes the AudioContext if it is suspended (required on
   * iOS where audio cannot start without a user gesture). The async/await
   * ensures `Tone.start()` resolves before triggering the note.
   *
   * @param noteName - A Tone.js note string, e.g. `"C4"`, `"F#5"`, `"Bb3"`.
   */
  const playNote = useCallback(
    async (noteName: string) => {
      // Ensure audio context is started (requires user gesture on iOS/Safari)
      if (Tone.getContext().state !== "running") {
        await Tone.start();
      }
      const synth = ensureSynth();
      synth.triggerAttackRelease(noteName, "4n");
    },
    [ensureSynth],
  );

  return { playNote };
}
