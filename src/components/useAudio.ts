import { useCallback, useRef } from "react";
import * as Tone from "tone";

/**
 * Hook for playing piano key sounds using Tone.js.
 * Uses a simple synth for MVP — can swap for sampled piano later.
 */
export function useAudio() {
  const synthRef = useRef<Tone.PolySynth | null>(null);

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

  const playNote = useCallback(
    async (noteName: string) => {
      // Ensure audio context is started (requires user gesture)
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
