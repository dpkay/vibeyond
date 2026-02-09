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
 * Uses **net correct** (`correct - incorrect`) as the numerator, meaning
 * each wrong answer costs one full step of progress. The result is clamped
 * to the [0, 1] range — the rocket can never go below the pad or past the Moon.
 *
 * @param correct - Number of correct answers so far in the session.
 * @param incorrect - Number of incorrect answers so far in the session.
 * @param sessionLength - Total correct answers required to reach the Moon
 *   (from {@link Settings.sessionLength}).
 * @returns A number in [0, 1] representing the rocket's vertical position.
 *
 * @example
 * ```ts
 * calculateProgression(3, 1, 10); // => 0.2  (net 2 out of 10)
 * calculateProgression(5, 0, 5);  // => 1.0  (Moon reached!)
 * calculateProgression(0, 3, 10); // => 0.0  (clamped, can't go negative)
 * ```
 */
export function calculateProgression(
  correct: number,
  incorrect: number,
  sessionLength: number,
): number {
  if (sessionLength <= 0) return 0;
  const net = correct - incorrect; // incorrect answers penalize one full step
  return Math.max(0, Math.min(1, net / sessionLength));
}

/**
 * Check whether the session is complete (the rocket has reached the Moon).
 *
 * Completion is based solely on `correct` count — incorrect answers slow
 * the rocket but never prevent completion. This ensures the child always
 * eventually succeeds, keeping the experience encouraging.
 *
 * @param correct - Number of correct answers so far in the session.
 * @param sessionLength - Total correct answers required to finish
 *   (from {@link Settings.sessionLength}).
 * @returns `true` if the child has answered enough correctly to trigger
 *   the celebration screen.
 */
export function isSessionComplete(
  correct: number,
  sessionLength: number,
): boolean {
  return correct >= sessionLength;
}
