/**
 * @file Celebration.tsx
 *
 * Full-screen celebration overlay displayed when the child completes a session
 * (reaches the Moon). This is the big reward moment -- a large crescent moon
 * with Buzz arriving, gold confetti particles rising, and a congratulatory
 * message with score summary.
 *
 * **Animation choreography (delays are staggered for dramatic reveal):**
 * 1. `0.0s` -- Screen fades in, starfield visible.
 * 2. `0.1s` -- Moon springs into view (scale 0.5 -> 1).
 * 3. `0.3s` -- Main content container (title, score) springs in.
 * 4. `0.0s-0.2s+` -- Gold confetti particles begin rising (staggered).
 * 5. `0.6s` -- Buzz slides up into frame beside the moon.
 * 6. `0.8s` -- Score text fades in.
 * 7. `1.0s` -- "Amazing job!" text fades in.
 * 8. `2.5s` -- "Play Again!" button appears.
 *
 * **Design decisions:**
 * - Inline styles for confetti particles because each particle has unique
 *   randomized x, y, size, delay, and rotation values computed at runtime.
 * - The "Play Again!" button is intentionally delayed 2.5 seconds so the
 *   child has time to enjoy the celebration before being prompted to act.
 * - Three shades of gold are used for confetti particles (#FBBF24, #F59E0B,
 *   #FDE68A) to add visual variety while staying within the warm amber palette.
 * - Larger particles (> 8px) use a 2px border-radius (square-ish confetti),
 *   while smaller ones are fully round, mimicking real confetti variety.
 */

import { motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { StarField } from "./StarField";

/**
 * Props for the {@link Celebration} component.
 *
 * @property onDone        - Callback invoked when the child taps "Play Again!".
 *   The parent typically starts a new session or navigates to the home screen.
 * @property correctCount  - Number of correct answers in the completed session.
 *   Displayed in the score summary. Omit to hide the score line.
 * @property totalCount    - Total number of challenges in the completed session.
 *   Displayed alongside `correctCount`. Omit to hide the score line.
 */
interface CelebrationProps {
  onDone: () => void;
  correctCount?: number;
  totalCount?: number;
}

/**
 * Generates randomized gold confetti particle descriptors for the celebration.
 *
 * Each particle has a random horizontal offset, vertical start/end positions
 * (they rise upward), size, stagger delay, animation duration, and rotation.
 * Memoized on `count` to remain stable across re-renders.
 *
 * @param count - Number of confetti particles to generate.
 * @returns Array of particle descriptors.
 */
function useGoldParticles(count: number) {
  return useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const x = Math.random() * 300 - 150;
      const startY = 100 + Math.random() * 100;
      const endY = -(200 + Math.random() * 200);
      const size = 4 + Math.random() * 8;
      const delay = i * 0.08 + Math.random() * 0.2;
      const duration = 2 + Math.random() * 1;
      const rotation = Math.random() * 720 - 360;
      return { x, startY, endY, size, delay, duration, rotation };
    });
  }, [count]);
}

/**
 * Large crescent moon SVG displayed as the centerpiece of the celebration.
 *
 * Uses the same two-circle crescent technique as the ProgressionBar's MoonIcon
 * but at a larger scale (220x220) with a stronger glow. Springs in with a
 * 0.1s delay.
 */
function CelebrationMoon() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.1 }}
    >
      <svg
        viewBox="0 0 160 160"
        width="220"
        height="220"
        style={{
          filter: "drop-shadow(0 0 40px rgba(251,191,36,0.5))",
        }}
      >
        <circle cx="80" cy="80" r="60" fill="#FBBF24" opacity="0.9" />
        {/* Inner circle uses the celebration background color to carve the crescent */}
        <circle cx="65" cy="80" r="52" fill="#151b2e" />
      </svg>
    </motion.div>
  );
}

/**
 * Buzz character arriving at the Moon with a spring-up entrance animation.
 *
 * Positioned absolutely at the bottom-right of the moon container so it looks
 * like Buzz is landing beside the moon. Slides up from y=200 with a 0.6s delay
 * to appear after the moon has settled.
 */
function ArrivalBuzz() {
  return (
    <motion.div
      className="absolute"
      style={{ bottom: "-20px", right: "-60px" }}
      initial={{ y: 200, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 80,
        damping: 14,
        delay: 0.6,
      }}
    >
      <img src="/buzz.png" alt="Buzz" width="110" height="110" style={{ objectFit: "contain" }} />
    </motion.div>
  );
}

/**
 * Full-screen celebration overlay shown when the child completes a session.
 *
 * Renders a fixed overlay at z-50 with a dark space background, animated
 * starfield, rising gold confetti, a large crescent moon with Buzz, the
 * "You reached the Moon!" title, an optional score summary, and a delayed
 * "Play Again!" button.
 *
 * @param props - See {@link CelebrationProps}.
 */
export function Celebration({ onDone, correctCount, totalCount }: CelebrationProps) {
  const goldParticles = useGoldParticles(20);
  /** Controls delayed appearance of the "Play Again!" button (2.5s after mount). */
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "#151b2e" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <StarField />

      {/*
        Gold confetti particles -- rise from below center to above,
        spinning and fading as they go. Three gold shades cycle via i % 3.
      */}
      {goldParticles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            borderRadius: p.size > 8 ? "2px" : "50%",
            background: i % 3 === 0 ? "#FBBF24" : i % 3 === 1 ? "#F59E0B" : "#FDE68A",
            boxShadow: `0 0 ${p.size}px ${p.size / 2}px rgba(251,191,36,0.3)`,
          }}
          initial={{
            x: p.x,
            y: p.startY,
            opacity: 0,
            scale: 0.5,
            rotate: 0,
          }}
          animate={{
            y: p.endY,
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1.3, 1, 0.8],
            rotate: p.rotation,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Main content -- springs in as a group */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 12,
          delay: 0.3,
        }}
      >
        {/* Moon + Buzz grouped together for relative positioning */}
        <div className="relative" style={{ marginBottom: 32 }}>
          <CelebrationMoon />
          <ArrivalBuzz />
        </div>

        {/* Title */}
        <h1
          className="font-display font-extrabold text-gold-400"
          style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", marginBottom: 16 }}
        >
          You reached the Moon!
        </h1>

        {/* Score summary -- only shown when both counts are provided */}
        {correctCount != null && totalCount != null && (
          <motion.p
            className="text-muted text-xl md:text-2xl"
            style={{ marginBottom: 8 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            {correctCount} of {totalCount} correct
          </motion.p>
        )}

        <motion.p
          className="text-muted text-xl md:text-2xl"
          style={{ marginBottom: 40 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.4 }}
        >
          Amazing job!
        </motion.p>

        {/* "Play Again!" button -- intentionally delayed 2.5s so the child
            can enjoy the celebration before being prompted to take action */}
        {showButton && (
          <motion.button
            className="font-display font-extrabold text-white text-2xl md:text-3xl rounded-2xl cursor-pointer"
            style={{
              minWidth: 260,
              padding: "18px 44px",
              background:
                "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
              boxShadow:
                "0 0 40px rgba(251,191,36,0.3), 0 4px 16px rgba(0,0,0,0.2)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDone}
          >
            Play Again!
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
