/**
 * @file FeedbackOverlay.tsx
 *
 * Full-screen overlay that displays immediate visual feedback after the child
 * taps a piano key. For correct answers, a gold star bursts into view with
 * radiating particles. For incorrect answers, a red X shakes briefly.
 *
 * The overlay is non-interactive (`pointer-events-none`) and renders at z-50
 * so it appears above all other content. It auto-dismisses via `onComplete`
 * after a short delay (1000 ms for correct, 1200 ms for incorrect -- the
 * extra time for incorrect answers lets the child register the mistake
 * without rushing them).
 *
 * **Design decisions:**
 * - Inline styles are used for particle positioning because each particle's
 *   final (x, y) offset is computed from trigonometry at runtime based on
 *   randomized angle/distance values. Tailwind cannot express these.
 * - SVG is used for the star and X icons (rather than emoji) because emoji
 *   render as blank rectangles in headless Chrome / some WebView contexts.
 * - The star particles are memoized via `useStarParticles` so they stay
 *   consistent across re-renders while feedback is visible, avoiding
 *   flickering mid-animation.
 * - AnimatePresence wraps the overlay so Framer Motion can run exit
 *   animations when `correct` transitions back to `null`.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

/**
 * Props for the {@link FeedbackOverlay} component.
 *
 * @property correct - `true` for a correct answer (gold star burst),
 *   `false` for incorrect (red X shake), or `null` when no feedback
 *   should be displayed.
 * @property onComplete - Callback invoked after the feedback animation
 *   finishes and the auto-dismiss delay elapses. The parent typically
 *   uses this to advance to the next challenge or clear the feedback state.
 */
interface FeedbackOverlayProps {
  correct: boolean | null;
  onComplete: () => void;
}

/**
 * Generates an array of randomized star-burst particle descriptors.
 *
 * Particles are evenly spaced around a full circle (by angle) with randomized
 * distance, size, and stagger delay. Memoized on `count` so the same set of
 * particles is reused across re-renders.
 *
 * @param count - Number of particles to generate.
 * @returns An array of particle descriptors with `angle`, `distance`, `size`,
 *   and `delay` properties.
 */
function useStarParticles(count: number) {
  return useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 360;
      const distance = 40 + Math.random() * 60;
      const size = 4 + Math.random() * 6;
      const delay = Math.random() * 0.1;
      return { angle, distance, size, delay };
    });
  }, [count]);
}

/**
 * A single gold particle that radiates outward from the center during the
 * correct-answer star burst animation.
 *
 * The particle starts at the center (x=0, y=0), expands to full size, then
 * fades out as it reaches its final radial position. The warm gold color and
 * glow box-shadow match the app's hero accent color.
 *
 * @param props.angle    - Direction of travel in degrees (0 = right, 90 = down).
 * @param props.distance - How far the particle travels from center, in pixels.
 * @param props.size     - Diameter of the particle in pixels.
 * @param props.delay    - Stagger delay in seconds before this particle starts.
 */
function GoldParticle({
  angle,
  distance,
  size,
  delay,
}: {
  angle: number;
  distance: number;
  size: number;
  delay: number;
}) {
  const rad = (angle * Math.PI) / 180;
  const tx = Math.cos(rad) * distance;
  const ty = Math.sin(rad) * distance;

  return (
    <motion.div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#FBBF24",
        boxShadow: `0 0 ${size * 2}px ${size}px rgba(251,191,36,0.4)`,
      }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 0.3 }}
      animate={{
        x: tx,
        y: ty,
        opacity: [1, 1, 0],
        scale: [0.3, 1.2, 0.6],
      }}
      transition={{
        duration: 0.7,
        delay,
        ease: "easeOut",
      }}
    />
  );
}

/**
 * Full-screen feedback overlay for correct/incorrect answer animations.
 *
 * When `correct` is non-null, the overlay fades in with a subtle background
 * tint (green for correct, red for incorrect) and displays the appropriate
 * animation:
 *
 * - **Correct:** A gold five-pointed star SVG springs into view with a spin,
 *   accompanied by 12 radiating gold particles. A green tint washes the screen.
 * - **Incorrect:** A red circle-X SVG appears and shakes side-to-side using
 *   keyframe x-offsets `[0, -12, 12, -8, 8, -4, 4, 0]` for a decaying
 *   oscillation effect. A red tint washes the screen.
 *
 * After the enter animation completes, a `setTimeout` fires `onComplete`
 * (1000 ms for correct, 1200 ms for incorrect).
 *
 * @param props - See {@link FeedbackOverlayProps}.
 */
export function FeedbackOverlay({ correct, onComplete }: FeedbackOverlayProps) {
  const particles = useStarParticles(12);

  return (
    <AnimatePresence>
      {correct !== null && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onAnimationComplete={() => {
            // Correct: 1000ms, Incorrect: 1200ms
            setTimeout(onComplete, correct ? 1000 : 1200);
          }}
        >
          {/* Background tint -- green for correct, red for incorrect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: correct
                ? "rgba(34,197,94,0.18)"
                : "rgba(239,68,68,0.15)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Correct: Gold star burst with radiating particles */}
          {correct && (
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              {/* Central gold star SVG -- springs in with rotation */}
              <motion.svg
                viewBox="0 0 64 64"
                width="80"
                height="80"
                initial={{ rotate: -30, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 12,
                }}
                style={{
                  filter: "drop-shadow(0 0 20px rgba(251,191,36,0.6))",
                }}
              >
                <path
                  d="M32 4l7.5 17.5H58l-14 11 5.5 18L32 40l-17.5 10.5 5.5-18-14-11h18.5z"
                  fill="#FBBF24"
                />
              </motion.svg>

              {/* Radiating gold particles */}
              {particles.map((p, i) => (
                <GoldParticle key={i} {...p} />
              ))}
            </motion.div>
          )}

          {/* Incorrect: subtle shake indicator with red X */}
          {!correct && (
            <motion.div
              className="relative"
              initial={{ x: 0 }}
              animate={{ x: [0, -12, 12, -8, 8, -4, 4, 0] }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {/* X mark -- circle with crossed lines, all in translucent red */}
              <svg
                viewBox="0 0 64 64"
                width="72"
                height="72"
                style={{
                  filter: "drop-shadow(0 0 16px rgba(239,68,68,0.4))",
                }}
              >
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="rgba(239,68,68,0.6)"
                  strokeWidth="3"
                />
                <line
                  x1="22"
                  y1="22"
                  x2="42"
                  y2="42"
                  stroke="rgba(239,68,68,0.7)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <line
                  x1="42"
                  y1="22"
                  x2="22"
                  y2="42"
                  stroke="rgba(239,68,68,0.7)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
