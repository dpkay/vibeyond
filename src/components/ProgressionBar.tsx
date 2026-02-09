import { motion } from "framer-motion";
import { useSettingsStore } from "../store/settingsStore";
import { useSessionStore } from "../store/sessionStore";

interface ProgressionBarProps {
  progress: number; // 0 to 1
}

/** Crescent moon SVG icon. */
function MoonIcon() {
  return (
    <svg viewBox="0 0 48 48" width="47" height="47" style={{ filter: "drop-shadow(0 0 10px rgba(251,191,36,0.5))" }}>
      <circle cx="24" cy="24" r="18" fill="#FBBF24" opacity="0.9" />
      <circle cx="18" cy="24" r="16" fill="#1A2140" />
    </svg>
  );
}

/** Buzz Lightyear icon in a dark circle. */
function BuzzIcon() {
  return (
    <img src="/buzz.png" alt="Buzz" width="68" height="68" style={{ objectFit: "contain" }} />
  );
}

/** Horizontal progression bar: Buzz flies left → right toward the Moon. */
export function ProgressionBar({ progress }: ProgressionBarProps) {
  const { settings } = useSettingsStore();
  const { session } = useSessionStore();
  const totalCorrect = session?.totalCorrect ?? 0;
  const totalIncorrect = session?.totalIncorrect ?? 0;
  const netScore = Math.max(0, totalCorrect - totalIncorrect);
  const sessionLength = settings.sessionLength;

  return (
    <div className="relative w-full" style={{ height: 90, padding: "0 32px" }}>
      {/* Track — inset from edges so Buzz/Moon don't clip */}
      <div
        className="absolute rounded-full"
        style={{
          top: 24,
          left: 32,
          right: 32,
          height: 8,
          background: "rgba(37,43,74,0.8)",
        }}
      >
        {/* Star dots at each intermediate step */}
        {Array.from({ length: sessionLength - 1 }, (_, i) => {
          const pos = ((i + 1) / sessionLength) * 100;
          const reached = totalCorrect > i;
          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2"
              style={{
                left: `${pos}%`,
                marginLeft: -3,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: reached ? "#FBBF24" : "rgba(255,255,255,0.2)",
                boxShadow: reached ? "0 0 6px rgba(251,191,36,0.5)" : "none",
                transition: "background 0.3s, box-shadow 0.3s",
              }}
            />
          );
        })}

        {/* Amber fill from left */}
        <motion.div
          className="absolute top-0 left-0 bottom-0 rounded-full"
          style={{
            background: "linear-gradient(to right, #F59E0B, #FBBF24)",
            boxShadow: "0 0 12px rgba(251,191,36,0.4)",
          }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      {/* Buzz — travels along the track */}
      <motion.div
        className="absolute"
        style={{ top: 0, marginLeft: 32 }}
        animate={{ left: `${progress * 100}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      >
        <div className="flex flex-col items-center" style={{ marginLeft: -34, width: 68 }}>
          <BuzzIcon />
          <span
            className="font-display font-bold text-sm leading-none"
            style={{ marginTop: 5, marginLeft: -45, color: "#a3b1bf" }}
          >
            {netScore}
          </span>
        </div>
      </motion.div>

      {/* Moon — sits at the right end of the track */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: 32, top: 0, marginRight: -23 }}
      >
        <MoonIcon />
        <span
          className="font-display font-bold text-gold-400 text-sm leading-none"
          style={{ marginTop: 8 }}
        >
          {sessionLength}
        </span>
      </div>
    </div>
  );
}
