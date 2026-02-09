import { motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { StarField } from "./StarField";

interface CelebrationProps {
  onDone: () => void;
  correctCount?: number;
  totalCount?: number;
}

/** Generate random gold star particles for confetti effect. */
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

/** Large crescent moon SVG. */
function CelebrationMoon() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.1 }}
    >
      <svg
        viewBox="0 0 160 160"
        width="160"
        height="160"
        style={{
          filter: "drop-shadow(0 0 40px rgba(251,191,36,0.5))",
        }}
      >
        <circle cx="80" cy="80" r="60" fill="#FBBF24" opacity="0.9" />
        <circle cx="65" cy="80" r="52" fill="#151b2e" />
      </svg>
    </motion.div>
  );
}

/** Buzz arriving at the moon. */
function ArrivalBuzz() {
  return (
    <motion.div
      className="absolute"
      style={{ bottom: "20%", left: "calc(50% + 55px)" }}
      initial={{ y: 200, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 80,
        damping: 14,
        delay: 0.6,
      }}
    >
      <img src="/buzz.png" alt="Buzz" width="72" height="72" style={{ objectFit: "contain" }} />
    </motion.div>
  );
}

/** Moon-reached celebration screen with SVG/CSS-based animations. */
export function Celebration({ onDone, correctCount, totalCount }: CelebrationProps) {
  const goldParticles = useGoldParticles(20);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(21,27,46,0.92)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <StarField />

      {/* Gold star particles — CSS-based confetti */}
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

      {/* Main content */}
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
        {/* Moon + Rocket */}
        <div className="relative mb-8">
          <CelebrationMoon />
          <ArrivalBuzz />
        </div>

        {/* Title */}
        <h1 className="font-display font-extrabold text-gold-400 text-4xl md:text-5xl mb-3">
          You reached the Moon!
        </h1>

        {/* Score summary */}
        {correctCount != null && totalCount != null && (
          <motion.p
            className="text-muted text-xl md:text-2xl mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            {correctCount} of {totalCount} correct
          </motion.p>
        )}

        <motion.p
          className="text-muted text-xl md:text-2xl mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.4 }}
        >
          Amazing job!
        </motion.p>

        {/* Play Again button — appears after 2.5s */}
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
