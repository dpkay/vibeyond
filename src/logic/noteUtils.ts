/**
 * @file Utility functions for working with musical notes.
 *
 * Provides conversion, comparison, serialization, and range-generation
 * for the {@link Note} type. All functions are pure and side-effect-free.
 *
 * Key design decisions:
 * - **Enharmonic awareness**: Comparison uses semitone values, so C# === Db.
 * - **Clef-agnostic comparison**: `notesMatch` and `compareNotes` ignore
 *   the clef field — pitch identity is determined by semitone alone.
 * - **NoteId encoding**: The string format `"clef:pitch:accidental:octave"`
 *   is designed for human readability and use as a database primary key.
 */

import type { Note, NoteId } from "../types";

/** Ordered pitch names within a single octave (C through B). */
const PITCHES = ["C", "D", "E", "F", "G", "A", "B"] as const;

/**
 * Maps each natural pitch letter to its semitone offset within an octave.
 * C=0, D=2, E=4, F=5, G=7, A=9, B=11 (standard chromatic scale).
 */
const SEMITONES: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

/**
 * Convert a note to its absolute semitone value for enharmonic comparison.
 *
 * The formula is `octave * 12 + baseSemitone + accidentalOffset`.
 * This means C4 = 48, and enharmonic equivalents like C#4 (49) and Db4 (49)
 * produce the same value.
 *
 * @param note - The note to convert.
 * @returns An integer representing the note's absolute pitch in semitones.
 */
export function noteToSemitone(note: Note): number {
  let semi = note.octave * 12 + SEMITONES[note.pitch];
  if (note.accidental === "sharp") semi += 1;
  if (note.accidental === "flat") semi -= 1;
  return semi;
}

/**
 * Serialize a Note to its unique string ID for database storage and lookups.
 *
 * Format: `"<clef>:<pitch>:<accidental>:<octave>"`.
 *
 * @param note - The note to serialize.
 * @returns The NoteId string, e.g. `"treble:C:natural:4"` or `"bass:F:sharp:3"`.
 *
 * @see noteFromId — the inverse operation.
 */
export function noteToId(note: Note): NoteId {
  return `${note.clef}:${note.pitch}:${note.accidental}:${note.octave}`;
}

/**
 * Deserialize a NoteId string back into a Note object.
 *
 * Assumes the ID was produced by {@link noteToId} and is well-formed.
 * No validation is performed — malformed IDs will produce garbage.
 *
 * @param id - A NoteId string in the format `"clef:pitch:accidental:octave"`.
 * @returns The reconstructed {@link Note}.
 *
 * @see noteToId — the inverse operation.
 */
export function noteFromId(id: NoteId): Note {
  const [clef, pitch, accidental, octaveStr] = id.split(":");
  return {
    clef: clef as Note["clef"],
    pitch: pitch as Note["pitch"],
    accidental: accidental as Note["accidental"],
    octave: parseInt(octaveStr, 10),
  };
}

/**
 * Format a note as a concise human-readable string.
 *
 * Uses conventional music notation: `#` for sharp, `b` for flat,
 * nothing for natural. Examples: `"C4"`, `"F#5"`, `"Bb3"`.
 *
 * @param note - The note to format.
 * @returns A compact display string (no clef information included).
 */
export function noteToString(note: Note): string {
  const acc =
    note.accidental === "sharp"
      ? "#"
      : note.accidental === "flat"
        ? "b"
        : "";
  return `${note.pitch}${acc}${note.octave}`;
}

/**
 * Compare two notes by absolute pitch.
 *
 * Enharmonic-aware and clef-agnostic — only the semitone value matters.
 * Useful for sorting notes chromatically.
 *
 * @param a - First note.
 * @param b - Second note.
 * @returns Negative if `a` is lower than `b`, positive if higher, 0 if
 *   enharmonically equal.
 */
export function compareNotes(a: Note, b: Note): number {
  return noteToSemitone(a) - noteToSemitone(b);
}

/**
 * Generate all notes within a pitch range (inclusive) for a given clef.
 *
 * For each natural pitch in the range, three variants are produced:
 * natural, sharp, and flat. Range boundaries are compared using the
 * **natural** semitone value of each pitch (ignoring the accidental of
 * the boundary notes themselves). This prevents edge cases like B#3
 * leaking into a range that starts at C4.
 *
 * The returned array is sorted chromatically (by semitone), with ties
 * broken by accidental type: natural before sharp before flat.
 *
 * @param min - The lowest note in the range (inclusive, natural pitch used for boundary).
 * @param max - The highest note in the range (inclusive, natural pitch used for boundary).
 * @param clef - The clef to assign to all generated notes.
 * @returns An array of {@link Note} objects spanning the range, sorted chromatically.
 *
 * @example
 * ```ts
 * // Generates all notes from C4 to E4 on the treble clef:
 * // C4, C#4, Db4, D4, D#4, Eb4, E4, E#4, Fb4  (sorted by semitone)
 * noteRange(
 *   { pitch: "C", accidental: "natural", octave: 4, clef: "treble" },
 *   { pitch: "E", accidental: "natural", octave: 4, clef: "treble" },
 *   "treble",
 * );
 * ```
 */
export function noteRange(
  min: Note,
  max: Note,
  clef: "treble" | "bass",
): Note[] {
  // Use the natural note position (ignoring accidentals) to decide inclusion.
  // This prevents edge cases like B#3 leaking in when the range starts at C4.
  const minNatural = noteToSemitone({ ...min, accidental: "natural" });
  const maxNatural = noteToSemitone({ ...max, accidental: "natural" });
  const notes: Note[] = [];
  const accidentals: Note["accidental"][] = ["natural", "sharp", "flat"];

  for (let octave = min.octave; octave <= max.octave; octave++) {
    for (const pitch of PITCHES) {
      const naturalSemi = noteToSemitone({ pitch, accidental: "natural", octave, clef });
      if (naturalSemi < minNatural || naturalSemi > maxNatural) continue;
      for (const acc of accidentals) {
        notes.push({ pitch, accidental: acc, octave, clef });
      }
    }
  }

  // Sort by semitone, then natural before sharp before flat for same semitone
  const accOrder: Record<string, number> = { natural: 0, sharp: 1, flat: 2 };
  notes.sort((a, b) => {
    const semiDiff = noteToSemitone(a) - noteToSemitone(b);
    if (semiDiff !== 0) return semiDiff;
    return accOrder[a.accidental] - accOrder[b.accidental];
  });

  return notes;
}

/**
 * Check if two notes represent the same pitch (enharmonic-aware).
 *
 * Ignores clef — only the absolute semitone value is compared.
 * For example, `C#4` and `Db4` are considered matching, regardless
 * of whether one is treble and the other bass.
 *
 * @param a - First note.
 * @param b - Second note.
 * @returns `true` if both notes resolve to the same semitone value.
 */
export function notesMatch(a: Note, b: Note): boolean {
  return noteToSemitone(a) === noteToSemitone(b);
}

/** Default keyboard range: C2 to B5 (4 full octaves). */
export const DEFAULT_MIN_NOTE: Note = {
  pitch: "C",
  accidental: "natural",
  octave: 2,
  clef: "treble",
};

/** Default keyboard range upper bound: B5. */
export const DEFAULT_MAX_NOTE: Note = {
  pitch: "B",
  accidental: "natural",
  octave: 5,
  clef: "treble",
};

/**
 * Default challenge range lower bound: C4 (middle C).
 * This is the treble clef comfort zone — the range where a beginner
 * child is most likely to encounter notes in early piano lessons.
 */
export const DEFAULT_CHALLENGE_MIN: Note = {
  pitch: "C",
  accidental: "natural",
  octave: 4,
  clef: "treble",
};

/**
 * Default challenge range upper bound: A5.
 * Keeps the initial challenge set manageable (roughly one and a half
 * octaves) while covering the most common treble clef notes.
 */
export const DEFAULT_CHALLENGE_MAX: Note = {
  pitch: "A",
  accidental: "natural",
  octave: 5,
  clef: "treble",
};
