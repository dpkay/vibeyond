/**
 * @file PianoKeyboard.tsx
 *
 * Renders an interactive piano keyboard at the bottom of the session screen.
 * The child taps a key to answer "which note is on the staff?". The keyboard
 * range is parent-configurable via Settings and always renders full octaves.
 *
 * **Design decisions:**
 * - Inline styles are used for all key styling (gradients, shadows, positioning)
 *   because each key's position and width are computed dynamically from the
 *   total white-key count. Tailwind's utility classes cannot express
 *   percentage-based `left`/`width` that depend on runtime data.
 * - Keys intentionally have NO labels -- this is a music-education app where
 *   the child should learn to associate staff positions with key positions
 *   without textual crutches.
 * - Pressed keys flash warm gold (#FBBF24) for 200 ms to give immediate
 *   tactile feedback. Framer Motion spring animations on `whileTap` provide
 *   a subtle "push down" effect.
 * - The three decorative layers above the keys (fog gradient, ledge, shelf)
 *   create the visual impression of a physical piano sitting at the bottom
 *   of the space-themed scene, matching the "cozy & warm" Pixar La Luna mood.
 * - Black keys are positioned at +0.65 of their parent white key's width and
 *   are 65% as wide as a white key -- a close approximation of real piano
 *   proportions that works well at varying screen widths.
 */

import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import type { Note } from "../types";
import { useSettingsStore } from "../store/settingsStore";

/**
 * Props for the {@link PianoKeyboard} component.
 *
 * @property onKeyPress - Called when the user taps a key, with the
 *   corresponding {@link Note} value. The parent (SessionScreen) uses this
 *   to evaluate the answer.
 * @property disabled - When `true`, key taps are ignored and the press
 *   animation is suppressed. Used while feedback overlays are shown.
 * @property playNote - Plays a note via Tone.js (lifted from useAudio).
 * @property externalPressedKey - Key ID to highlight externally (e.g. from MIDI input).
 */
interface PianoKeyboardProps {
  onKeyPress: (note: Note) => void;
  disabled?: boolean;
  playNote: (noteName: string) => void;
  externalPressedKey?: string | null;
}

/** The seven natural pitch names in ascending order within a single octave. */
const PITCHES = ["C", "D", "E", "F", "G", "A", "B"] as const;
type Pitch = (typeof PITCHES)[number];

/**
 * Maps white-key pitch names that have a sharp (black key) to their right.
 * E and B are excluded because E#=F and B#=C (no black key between them on
 * a standard piano).
 */
const BLACK_KEY_MAP: Record<string, Pitch> = {
  C: "C",
  D: "D",
  F: "F",
  G: "G",
  A: "A",
};

/**
 * Internal representation of a single piano key (white or black).
 *
 * @property pitch       - The natural pitch name (e.g. "C", "F").
 * @property accidental  - `"natural"` for white keys, `"sharp"` for black keys.
 * @property octave      - The MIDI-style octave number (e.g. 4 for middle C).
 * @property isBlack     - Convenience flag: `true` for sharp/black keys.
 * @property whiteIndex  - The 0-based index among all white keys, used to
 *   compute horizontal position. For black keys this is the index of the
 *   white key directly to the left.
 */
interface KeyDef {
  pitch: Pitch;
  accidental: "natural" | "sharp";
  octave: number;
  isBlack: boolean;
  whiteIndex?: number;
}

/**
 * Builds the full list of {@link KeyDef} entries for the given note range.
 *
 * Always renders complete octaves from `minNote.octave` to `maxNote.octave`.
 * White and black keys are interleaved in the returned array so that black
 * keys immediately follow their parent white key -- callers typically filter
 * by `isBlack` to render the two layers separately (white underneath, black
 * on top).
 *
 * @param minNote - The lowest note in the range (only `octave` is used).
 * @param maxNote - The highest note in the range (only `octave` is used).
 * @returns An array of KeyDef objects covering all keys in the range.
 */
function buildKeyboard(minNote: Note, maxNote: Note): KeyDef[] {
  const startOctave = minNote.octave;
  const endOctave = maxNote.octave;

  const keys: KeyDef[] = [];
  let whiteIdx = 0;

  for (let oct = startOctave; oct <= endOctave; oct++) {
    for (const pitch of PITCHES) {
      keys.push({
        pitch,
        accidental: "natural",
        octave: oct,
        isBlack: false,
        whiteIndex: whiteIdx,
      });
      whiteIdx++;

      if (pitch in BLACK_KEY_MAP) {
        keys.push({
          pitch,
          accidental: "sharp",
          octave: oct,
          isBlack: true,
          whiteIndex: whiteIdx - 1,
        });
      }
    }
  }

  return keys;
}

/**
 * Converts a key definition into a Tone.js note name string.
 *
 * Tone.js expects note names like `"C4"`, `"F#5"`, etc.
 *
 * @param pitch      - The pitch letter (e.g. `"C"`).
 * @param accidental - `"sharp"` or `"natural"`.
 * @param octave     - The octave number.
 * @returns A Tone.js-compatible note name string.
 */
function toToneName(pitch: string, accidental: string, octave: number): string {
  const acc = accidental === "sharp" ? "#" : "";
  return `${pitch}${acc}${octave}`;
}

/**
 * Interactive piano keyboard rendered at the bottom of the session screen.
 *
 * The keyboard adapts its range to the parent-configured `noteRange` setting,
 * always rendering full octaves. Each key plays its corresponding tone via
 * Tone.js ({@link useAudio}) and emits the note through `onKeyPress`.
 *
 * Visual structure (top to bottom):
 * 1. **Fog gradient** -- a subtle transparent-to-dark gradient that blends the
 *    starfield background into the piano area.
 * 2. **Piano ledge** -- a narrow dark strip mimicking a real piano's fallboard,
 *    with a subtle top highlight and drop shadow.
 * 3. **Keyboard shelf** -- a frosted-glass container (backdrop-blur) holding
 *    the white and black keys. Uses negative bottom margin to extend beyond the
 *    viewport and avoid a gap on over-scroll.
 *
 * @param props - See {@link PianoKeyboardProps}.
 */
export function PianoKeyboard({ onKeyPress, disabled, playNote, externalPressedKey }: PianoKeyboardProps) {
  const { settings } = useSettingsStore();
  /** Tracks which key is currently in its 200 ms "pressed" highlight state. */
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const keys = useMemo(
    () => buildKeyboard(settings.noteRange.minNote, settings.noteRange.maxNote),
    [settings.noteRange.minNote, settings.noteRange.maxNote],
  );

  const whiteKeys = useMemo(() => keys.filter((k) => !k.isBlack), [keys]);
  const blackKeys = useMemo(() => keys.filter((k) => k.isBlack), [keys]);
  const whiteCount = whiteKeys.length;

  /**
   * Handles a key tap: plays the audio, triggers the 200 ms visual flash,
   * and notifies the parent via `onKeyPress`. No-ops when `disabled` is true.
   */
  const handlePress = useCallback(
    (key: KeyDef) => {
      if (disabled) return;

      const keyId = `${key.pitch}${key.accidental === "sharp" ? "#" : ""}${key.octave}`;
      setPressedKey(keyId);
      setTimeout(() => setPressedKey(null), 200);

      playNote(toToneName(key.pitch, key.accidental, key.octave));

      const note: Note = {
        pitch: key.pitch,
        accidental: key.accidental === "sharp" ? "sharp" : "natural",
        octave: key.octave,
        clef: "treble",
      };
      onKeyPress(note);
    },
    [disabled, playNote, onKeyPress],
  );

  /** Builds a unique string ID for a key, e.g. `"C#4"` or `"G5"`. */
  const keyId = (k: KeyDef) =>
    `${k.pitch}${k.accidental === "sharp" ? "#" : ""}${k.octave}`;

  return (
    <div className="w-full">
      {/* Atmospheric fog -- fades from transparent to warm dark above the ledge */}
      <div
        className="pointer-events-none"
        style={{
          height: 40,
          marginBottom: -1,
          background: `linear-gradient(
            180deg,
            transparent 0%,
            rgba(30, 25, 40, 0.3) 50%,
            rgba(40, 30, 35, 0.5) 100%
          )`,
        }}
      />

      {/* Piano ledge -- warm dark strip evoking a real piano's fallboard */}
      <div
        style={{
          height: 20,
          background: "linear-gradient(180deg, #2a2030 0%, #1f1828 40%, #1a1420 100%)",
          boxShadow: `
            inset 0 1px 0 0 rgba(255, 255, 255, 0.08),
            0 2px 8px rgba(0, 0, 0, 0.3)
          `,
        }}
      />

      {/*
        Keyboard shelf -- extends to screen bottom.
        Uses backdrop-blur for a frosted-glass effect. The negative marginBottom
        and extra paddingBottom ensure the shelf extends past the viewport edge
        so there is no visible gap when the user over-scrolls on iOS/iPad.
      */}
      <div
        className="relative pt-1"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          /* Extend below viewport to avoid bottom gap */
          paddingBottom: 20,
          marginBottom: -12,
        }}
      >
        {/*
          Key container -- height is responsive via clamp() to work across
          phones, tablets, and desktop. White keys fill 100% height; black
          keys are 62% height.
        */}
        <div
          className="relative"
          style={{ height: "clamp(130px, 22vh, 180px)" }}
        >
          {/* White keys -- rendered first (lower z-index) */}
          {whiteKeys.map((key) => {
            const id = keyId(key);
            const isPressed = pressedKey === id || externalPressedKey === id;
            return (
              <motion.button
                key={id}
                className="absolute top-0 bottom-0 cursor-pointer"
                style={{
                  left: `${((key.whiteIndex ?? 0) / whiteCount) * 100}%`,
                  width: `${(1 / whiteCount) * 100}%`,
                  background: isPressed
                    ? "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)"
                    : "linear-gradient(180deg, #f8f8f8 0%, #ececec 50%, #ddd 100%)",
                  borderRadius: "0 0 6px 6px",
                  zIndex: 1,
                  borderRight: "1px solid rgba(180,180,180,0.4)",
                  boxShadow: isPressed
                    ? "0 0 20px rgba(251,191,36,0.5), inset 0 -2px 4px rgba(0,0,0,0.1)"
                    : "inset 0 -4px 8px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.12)",
                }}
                whileTap={disabled ? {} : { y: 3 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                onClick={() => handlePress(key)}
                disabled={disabled}
              />
            );
          })}

          {/* Black keys -- rendered second (higher z-index) to overlay white keys */}
          {blackKeys.map((key) => {
            const id = keyId(key);
            const isPressed = pressedKey === id || externalPressedKey === id;
            // Black key is offset 0.65 white-key-widths from its parent white key
            const leftPercent =
              (((key.whiteIndex ?? 0) + 0.65) / whiteCount) * 100;
            const widthPercent = (0.65 / whiteCount) * 100;

            return (
              <motion.button
                key={id}
                className="absolute top-0 cursor-pointer"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  height: "62%",
                  background: isPressed
                    ? "linear-gradient(180deg, #fbbf24 0%, #d97706 100%)"
                    : "linear-gradient(180deg, #404040 0%, #1a1a1a 60%, #0a0a0a 100%)",
                  borderRadius: "0 0 5px 5px",
                  zIndex: 2,
                  boxShadow: isPressed
                    ? "0 0 16px rgba(251,191,36,0.4)"
                    : "0 4px 8px rgba(0,0,0,0.6), inset 0 -2px 4px rgba(255,255,255,0.06)",
                }}
                whileTap={disabled ? {} : { y: 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                onClick={() => handlePress(key)}
                disabled={disabled}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
