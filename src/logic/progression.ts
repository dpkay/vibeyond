/**
 * Calculate Buzz's position (0–1) given session progress.
 * Net correct / sessionLength, clamped to [0, 1].
 * Incorrect answers move Buzz backward (reduce net correct).
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

/** Check if the session is complete (Buzz reached the Moon). */
export function isSessionComplete(
  correct: number,
  sessionLength: number,
): boolean {
  return correct >= sessionLength;
}
