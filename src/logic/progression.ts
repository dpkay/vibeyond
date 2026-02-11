/**
 * @file Session progression logic — maps answer tallies to visual progress.
 *
 * In the space theme, the child's rocket flies from the launch pad (0)
 * to the Moon (1) over the course of a session. Correct answers advance
 * the rocket; incorrect answers push it backward. These pure functions
 * power the vertical progress sidebar and the session-complete celebration.
 */

/**
 * Calculate the rocket's position as a fraction from 0 (launch pad) to 1 (Moon).
 *
 * Takes the session's running `score` (which already has floor-at-zero
 * semantics applied on each answer) and divides by `sessionLength`.
 * The result is clamped to [0, 1].
 *
 * @param score - The session's running score (never negative).
 * @param sessionLength - Total score required to reach the Moon
 *   (from {@link Settings.sessionLength}).
 * @returns A number in [0, 1] representing the rocket's horizontal position.
 *
 * @example
 * ```ts
 * calculateProgression(2, 10);  // => 0.2
 * calculateProgression(5, 5);   // => 1.0  (Moon reached!)
 * calculateProgression(0, 10);  // => 0.0
 * ```
 */
export function calculateProgression(
  score: number,
  sessionLength: number,
): number {
  if (sessionLength <= 0) return 0;
  return Math.max(0, Math.min(1, score / sessionLength));
}

/**
 * Check whether the session is complete (the rocket has reached the Moon).
 *
 * Completion is based on the running `score` (which uses floor-at-zero
 * semantics). The child must accumulate a score equal to `sessionLength`.
 * Mistakes push the score back but never below zero, so the child always
 * makes progress and eventually succeeds.
 *
 * @param score - The session's running score (never negative).
 * @param sessionLength - Score required to finish
 *   (from {@link Settings.sessionLength}).
 * @returns `true` if the score has reached the session goal.
 */
export function isSessionComplete(
  score: number,
  sessionLength: number,
): boolean {
  return score >= sessionLength;
}
