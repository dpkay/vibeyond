/**
 * @file Shared type definitions for the Vibeyond application.
 *
 * This module defines the core domain model: musical notes, FSRS-based
 * flashcards, practice session tracking, and parent-configurable settings.
 * All types here are pure data — no behavior. They are consumed by the
 * logic layer (`src/logic/`), the persistence layer (`src/db/`), and
 * the Zustand stores (`src/store/`).
 */

import type { Card as FSRSCard } from "ts-fsrs";

/**
 * A musical note identified by its pitch name, accidental, octave, and clef.
 *
 * This is the fundamental unit of the app's domain: every challenge prompt,
 * every keyboard key press, and every FSRS card maps to a Note.
 */
export interface Note {
  /** The letter name of the note (A through G). */
  pitch: "C" | "D" | "E" | "F" | "G" | "A" | "B";

  /**
   * The accidental applied to the pitch. "natural" means no accidental.
   * Sharp raises the pitch by one semitone; flat lowers it by one.
   */
  accidental: "sharp" | "flat" | "natural";

  /** The octave number (e.g. 4 for middle C, following scientific pitch notation). */
  octave: number;

  /** Which staff this note is displayed on. Determines ledger-line rendering. */
  clef: "treble" | "bass";
}

/**
 * A unique string key encoding a note's identity.
 *
 * Format: `"<clef>:<pitch>:<accidental>:<octave>"`, e.g. `"treble:C:natural:4"`.
 * Used as the primary key in the FSRS card database and for Map/Set lookups.
 * See `noteToId()` and `noteFromId()` in `noteUtils.ts` for serialization.
 */
export type NoteId = string;

/**
 * An FSRS flashcard for a single note.
 *
 * Extends the ts-fsrs `Card` type (which tracks scheduling state like
 * `due`, `stability`, `difficulty`, `state`, etc.) with our `noteId`
 * foreign key. Each note in the challenge range gets exactly one AppCard
 * stored in IndexedDB.
 */
export interface AppCard extends FSRSCard {
  /** Links this card back to the specific note it quizzes. Also the DB primary key. */
  noteId: NoteId;
}

/**
 * A single challenge within a practice session.
 *
 * Captures both the prompt (what was shown on the staff) and the child's
 * response (which piano key was pressed), along with correctness and timing.
 */
export interface Challenge {
  /** The note displayed on the staff that the child must identify. */
  promptNote: Note;

  /** The note corresponding to the piano key the child pressed, or null if unanswered. */
  responseNote: Note | null;

  /** Whether the response matched the prompt (enharmonic-aware), or null if unanswered. */
  correct: boolean | null;

  /** How long (ms) the child took to respond, or null if unanswered. */
  responseTimeMs: number | null;

  /** When this challenge was presented. */
  timestamp: Date;
}

/**
 * A complete play-through (practice session) from start to celebration or quit.
 *
 * In the space theme, a session represents one "flight" from the launch pad
 * to the Moon. The session ends when `totalCorrect` reaches `sessionLength`
 * (from Settings) or the child quits.
 */
export interface Session {
  /** UUID for this session. Also the DB primary key. */
  id: string;

  /** When the session began. */
  startedAt: Date;

  /** When the session ended, or null if still in progress. */
  completedAt: Date | null;

  /** Ordered list of every challenge presented during this session. */
  challenges: Challenge[];

  /** Running count of correct answers. */
  totalCorrect: number;

  /** Running count of incorrect answers. */
  totalIncorrect: number;

  /** Whether the session was finished (child reached the Moon). */
  completed: boolean;
}

/**
 * Parent-configurable settings that control the app's behavior.
 *
 * Persisted as JSON in IndexedDB via the settings store. Parents can
 * adjust these in the ParentSettingsScreen.
 */
export interface Settings {
  /**
   * Range of keys rendered on the on-screen piano keyboard.
   * Always renders full octaves. This is the visual range — it may be
   * wider than the challenge range so the child sees familiar context.
   */
  noteRange: {
    /** Lowest key shown on the keyboard (inclusive). */
    minNote: Note;
    /** Highest key shown on the keyboard (inclusive). */
    maxNote: Note;
  };

  /**
   * Range of notes that can appear as challenge prompts on the staff.
   * Must be a subset of (or equal to) `noteRange`. FSRS cards are
   * created for every note in this range.
   */
  challengeRange: {
    /** Lowest note that can be prompted (inclusive). */
    minNote: Note;
    /** Highest note that can be prompted (inclusive). */
    maxNote: Note;
  };

  /** Which clefs are enabled for challenges. At least one must be active. */
  enabledClefs: ("treble" | "bass")[];

  /**
   * Number of correct answers needed to complete a session (reach the Moon).
   * Incorrect answers do not increment this counter.
   */
  sessionLength: number;
}
