import type { Note } from "../types";
import { notesMatch, noteToString } from "./noteUtils";

interface EvalResult {
  correct: boolean;
  feedback?: { expected: string; actual: string };
}

/** Evaluate whether the pressed key matches the displayed note. */
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
