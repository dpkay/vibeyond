import type { Card as FSRSCard } from "ts-fsrs";

/** A musical note identified by its pitch name, accidental, octave, and clef. */
export interface Note {
  pitch: "C" | "D" | "E" | "F" | "G" | "A" | "B";
  accidental: "sharp" | "flat" | "natural";
  octave: number;
  clef: "treble" | "bass";
}

/** Unique string key for a note, e.g. "treble:C:natural:4", "treble:B:flat:3" */
export type NoteId = string;

/**
 * An FSRS card wrapping a note. Extends the ts-fsrs Card type
 * with our noteId key.
 */
export interface AppCard extends FSRSCard {
  noteId: NoteId;
}

/** A single challenge within a session. */
export interface Challenge {
  promptNote: Note;
  responseNote: Note | null;
  correct: boolean | null;
  responseTimeMs: number | null;
  timestamp: Date;
}

/** A complete play-through from start to celebration (or quit). */
export interface Session {
  id: string;
  startedAt: Date;
  completedAt: Date | null;
  challenges: Challenge[];
  totalCorrect: number;
  totalIncorrect: number;
  completed: boolean;
}

/** Parent-configurable settings. */
export interface Settings {
  /** Range of keys shown on the keyboard. */
  noteRange: {
    minNote: Note;
    maxNote: Note;
  };
  /** Range of notes used in challenges (subset of noteRange). */
  challengeRange: {
    minNote: Note;
    maxNote: Note;
  };
  enabledClefs: ("treble" | "bass")[];
  sessionLength: number;
}
