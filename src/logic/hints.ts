import type { Note } from "../types";

// Staff line notes per clef (natural pitch + octave)
const TREBLE_LINES = new Set(["C4", "E4", "G4", "B4", "D5", "F5", "A5"]);
const BASS_LINES = new Set(["E2", "G2", "B2", "D3", "F3", "A3", "C4"]);

// Mnemonics — parenthesized words are for ledger line notes (dimmer display)
const MNEMONICS = {
  treble: {
    line: "Every Good Bird Deserves Fun (Always)",
    space: "(Dogs) FACE (Gorillas)",
  },
  bass: {
    line: "(Extra) Good Bagels Deserve Fresh Avocado",
    space: "(Funny!) All Cows Eat Grass (Burp!)",
  },
} as const;

type Position = "line" | "space";

function getPosition(note: Note): Position {
  const key = `${note.pitch}${note.octave}`;
  if (note.clef === "treble") {
    return TREBLE_LINES.has(key) ? "line" : "space";
  }
  return BASS_LINES.has(key) ? "line" : "space";
}

export interface Hint {
  label: string; // "Lines" or "Spaces"
  mnemonic: string;
  accidentalNote: string | null; // "with a sharp" / "with a flat" / null
}

export function getHint(note: Note): Hint {
  const position = getPosition(note);
  const mnemonic = MNEMONICS[note.clef][position];
  const label = position === "line" ? "Lines" : "Spaces";

  let accidentalNote: string | null = null;
  if (note.accidental === "sharp") accidentalNote = "with a sharp";
  if (note.accidental === "flat") accidentalNote = "with a flat";

  return { label, mnemonic, accidentalNote };
}
