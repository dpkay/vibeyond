/**
 * @file Answer evaluation logic for note-recognition challenges.
 *
 * Pure function that compares the prompted note (shown on the staff)
 * against the child's response (piano key pressed). Comparison is
 * enharmonic-aware — e.g. C# and Db are treated as the same pitch.
 *
 * This module intentionally has no side effects and no dependency on
 * stores or the database, making it trivially testable.
 */

import type { Note } from "../types";
import { notesMatch, noteToString } from "./noteUtils";

/**
 * The result of evaluating a single answer.
 */
interface EvalResult {
  /** Whether the child's response matched the prompt. */
  correct: boolean;

  /**
   * Present only on incorrect answers. Provides human-readable note names
   * for the expected and actual notes — useful for feedback UI and debugging.
   */
  feedback?: { expected: string; actual: string };
}

/**
 * Evaluate whether the pressed piano key matches the displayed staff note.
 *
 * Uses enharmonic comparison (semitone equality) so that, for example,
 * pressing the F# key when Gb is prompted counts as correct. On a wrong
 * answer, returns a `feedback` object with human-readable note strings
 * for the expected and actual notes.
 *
 * @param prompt - The note displayed on the staff (the "question").
 * @param response - The note corresponding to the piano key pressed (the "answer").
 * @returns An {@link EvalResult} indicating correctness and optional feedback.
 *
 * @example
 * ```ts
 * const result = evaluateAnswer(
 *   { pitch: "C", accidental: "natural", octave: 4, clef: "treble" },
 *   { pitch: "C", accidental: "natural", octave: 4, clef: "treble" },
 * );
 * // result.correct === true, result.feedback === undefined
 * ```
 */
export function evaluateAnswer(prompt: Note, response: Note): EvalResult {
  const correct = notesMatch(prompt, response);
  return {
    correct,
    feedback: correct
      ? undefined
      : {
          expected: noteToString(prompt),
          actual: noteToString(response),
        },
  };
}
