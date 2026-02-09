import type { Note, NoteId } from "../types";

/** Ordered pitch names for comparison. */
const PITCHES = ["C", "D", "E", "F", "G", "A", "B"] as const;

/** Semitone value for each natural pitch. */
const SEMITONES: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

/** Convert a note to its absolute semitone value (for enharmonic comparison). */
export function noteToSemitone(note: Note): number {
  let semi = note.octave * 12 + SEMITONES[note.pitch];
  if (note.accidental === "sharp") semi += 1;
  if (note.accidental === "flat") semi -= 1;
  return semi;
}

/** Convert a Note to its unique string ID. */
export function noteToId(note: Note): NoteId {
  return `${note.clef}:${note.pitch}:${note.accidental}:${note.octave}`;
}

/** Parse a NoteId back into a Note. */
export function noteFromId(id: NoteId): Note {
  const [clef, pitch, accidental, octaveStr] = id.split(":");
  return {
    clef: clef as Note["clef"],
    pitch: pitch as Note["pitch"],
    accidental: accidental as Note["accidental"],
    octave: parseInt(octaveStr, 10),
  };
}

/** Human-readable string for a note, e.g. "C4", "F#5", "Bb3". */
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
 * Compare two notes by semitone value.
 * Returns negative if a < b, positive if a > b, 0 if enharmonically equal.
 */
export function compareNotes(a: Note, b: Note): number {
  return noteToSemitone(a) - noteToSemitone(b);
}

/**
 * Generate a range of notes between min and max (inclusive), including
 * all accidentals: each natural pitch gets a sharp and flat variant
 * (e.g. C, C#, Db, D, D#, Eb, E, E#, Fb, F, F#, Gb, G, G#, Ab, A, A#, Bb, B, B#, Cb).
 * Range bounds are compared by semitone value so accidentals at the edges are included.
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

/** Check if two notes represent the same pitch (enharmonic-aware, ignoring clef). */
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

export const DEFAULT_MAX_NOTE: Note = {
  pitch: "B",
  accidental: "natural",
  octave: 5,
  clef: "treble",
};

/** Default challenge range: C4 to A5 (treble clef comfort zone). */
export const DEFAULT_CHALLENGE_MIN: Note = {
  pitch: "C",
  accidental: "natural",
  octave: 4,
  clef: "treble",
};

export const DEFAULT_CHALLENGE_MAX: Note = {
  pitch: "A",
  accidental: "natural",
  octave: 5,
  clef: "treble",
};
