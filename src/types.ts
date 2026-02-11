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
 * Identifies a mission. Either "animal-octaves" or a derived string like
 * "notes:treble", "notes:treble+bass:acc", etc.
 */
export type MissionId = string;

/**
 * Configuration for the Animals mission.
 */
export interface AnimalsConfig {
  showIcons: boolean;
}

/**
 * Configuration for the Notes mission — which clefs and whether accidentals
 * are enabled. Each unique combination gets its own FSRS card pool.
 */
export interface NotesConfig {
  treble: boolean;
  bass: boolean;
  accidentals: boolean;
}

/**
 * How the challenge is presented to the child.
 * - `"staff"` — a note on a musical staff (uses StaffDisplay).
 * - `"animal"` — an animal picture representing an octave (uses AnimalPrompt).
 */
export type PromptType = "staff" | "animal";

/**
 * How the child responds to the challenge.
 * - `"piano"` — tap a key on the on-screen piano keyboard.
 * - `"octave-buttons"` — tap one of 4 large animal/octave buttons.
 */
export type InputType = "piano" | "octave-buttons";

/**
 * Static definition of a mission. These are code-only constants stored
 * in the {@link MISSIONS} registry — not persisted in the database.
 */
export interface MissionDefinition {
  id: MissionId;
  name: string;
  description: string;
  promptType: PromptType;
  inputType: InputType;
  enabledClefs: ("treble" | "bass")[];
  includeAccidentals: boolean;
  challengeRange: {
    minNote: Note;
    maxNote: Note;
  };
  defaultSessionLength: number;
}

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
  /** Compound primary key: `"${missionId}::${noteId}"`. */
  id: string;
  /** Links this card back to the specific note it quizzes. */
  noteId: NoteId;
  /** Which mission this card belongs to. Cards are scoped per-mission. */
  missionId: MissionId;
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

  /** Which mission was played in this session. */
  missionId: MissionId;

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

  /**
   * Running score with floor-at-zero semantics.
   * Correct: score + 1. Incorrect: max(0, score - 1).
   * Unlike `totalCorrect - totalIncorrect`, this never accumulates negative
   * debt — so the first success after a streak of mistakes always advances
   * the rocket. Session completes when score reaches sessionLength.
   */
  score: number;

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
   * Number of correct answers needed to complete a session (reach the Moon).
   * Missions define their own defaults; this is the global override.
   */
  sessionLength: number;

  /** Toggle configuration for the Animals mission. */
  animalsConfig: AnimalsConfig;

  /** Toggle configuration for the Notes mission. */
  notesConfig: NotesConfig;
}
