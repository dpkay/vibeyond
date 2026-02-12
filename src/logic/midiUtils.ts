/**
 * @file midiUtils.ts
 *
 * Pure conversion functions from MIDI note numbers to the app's Note type
 * and Tone.js note name strings. Used by the MIDI bridge WebSocket client
 * to translate incoming MIDI events into app-level actions.
 *
 * MIDI note 60 = Middle C (C4). Sharps are used for black keys (no flats),
 * matching PianoKeyboard's BLACK_KEY_MAP convention.
 */

import type { Note } from "../types";

/** The 12 chromatic pitch classes starting from C, using sharps for black keys. */
const CHROMATIC: Array<{ pitch: Note["pitch"]; accidental: Note["accidental"] }> = [
  { pitch: "C", accidental: "natural" },
  { pitch: "C", accidental: "sharp" },
  { pitch: "D", accidental: "natural" },
  { pitch: "D", accidental: "sharp" },
  { pitch: "E", accidental: "natural" },
  { pitch: "F", accidental: "natural" },
  { pitch: "F", accidental: "sharp" },
  { pitch: "G", accidental: "natural" },
  { pitch: "G", accidental: "sharp" },
  { pitch: "A", accidental: "natural" },
  { pitch: "A", accidental: "sharp" },
  { pitch: "B", accidental: "natural" },
];

/**
 * Convert a MIDI note number to a Note.
 *
 * Uses sharps for black keys (C#, D#, F#, G#, A#) to match the keyboard's
 * internal representation. Clef is set to "treble" as a default — the
 * session evaluator compares by semitone, not by clef.
 *
 * @param midiNumber - MIDI note number (0–127). Middle C = 60.
 * @returns The corresponding Note object.
 */
export function midiNoteToNote(midiNumber: number): Note {
  const octave = Math.floor(midiNumber / 12) - 1;
  const pitchClass = midiNumber % 12;
  const { pitch, accidental } = CHROMATIC[pitchClass];
  return { pitch, accidental, octave, clef: "treble" };
}

/**
 * Convert a MIDI note number to a Tone.js note name string.
 *
 * @param midiNumber - MIDI note number (0–127).
 * @returns A Tone.js-compatible string like "C4", "C#4", "F#5".
 */
export function midiNoteToToneName(midiNumber: number): string {
  const octave = Math.floor(midiNumber / 12) - 1;
  const pitchClass = midiNumber % 12;
  const { pitch, accidental } = CHROMATIC[pitchClass];
  const acc = accidental === "sharp" ? "#" : "";
  return `${pitch}${acc}${octave}`;
}

/**
 * Convert a MIDI note number to a key ID string matching PianoKeyboard's format.
 *
 * @param midiNumber - MIDI note number (0–127).
 * @returns A string like "C4", "C#4", "F#5" (same format as PianoKeyboard's keyId).
 */
export function midiNoteToKeyId(midiNumber: number): string {
  return midiNoteToToneName(midiNumber);
}
