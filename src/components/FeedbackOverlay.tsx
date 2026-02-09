import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface FeedbackOverlayProps {
  correct: boolean | null;
  onComplete: () => void;
}

/** Generate random gold star burst particles. */
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

/** CSS-based gold star burst particle. */
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

/** Full-screen feedback flash for correct/incorrect answers. */
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
          {/* Background tint */}
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

          {/* Correct: Gold star burst */}
          {correct && (
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              {/* Central gold star SVG */}
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

          {/* Incorrect: subtle shake indicator */}
          {!correct && (
            <motion.div
              className="relative"
              initial={{ x: 0 }}
              animate={{ x: [0, -12, 12, -8, 8, -4, 4, 0] }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {/* X mark */}
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
