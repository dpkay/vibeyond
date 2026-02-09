import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { StarField } from "../components/StarField";

/** Crescent moon SVG — larger version for home screen. */
function MoonIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1 }}
    >
      <svg
        viewBox="0 0 96 96"
        width="96"
        height="96"
        style={{ filter: "drop-shadow(0 0 24px rgba(251,191,36,0.45))" }}
      >
        <circle cx="48" cy="48" r="36" fill="#FBBF24" opacity="0.9" />
        <circle cx="38" cy="48" r="32" fill="#1A2140" />
      </svg>
    </motion.div>
  );
}

/** Buzz Lightyear illustration. */
function BuzzIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <img src="/buzz.png" alt="Buzz Lightyear" width="80" height="80" style={{ objectFit: "contain" }} />
      </motion.div>
    </motion.div>
  );
}

export function HomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="relative h-full flex flex-col items-center justify-center">
      <StarField />

      {/* Settings gear — top right */}
      <motion.button
        className="absolute top-6 right-8 z-20 flex items-center justify-center rounded-full cursor-pointer"
        style={{
          width: 44,
          height: 44,
          background: "rgba(42,48,80,0.6)",
        }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate("/settings")}
        aria-label="Settings"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </motion.button>

      {/* Main content — vertically distributed */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Moon */}
        <MoonIllustration />

        {/* Title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="font-display font-extrabold text-white text-5xl md:text-6xl mb-2">
            Vibeyond
          </h1>
          <p className="text-muted text-xl md:text-2xl">
            Fly to the Moon, one note at a time!
          </p>
        </motion.div>

        {/* Rocket */}
        <BuzzIllustration />

        {/* Play button */}
        <motion.button
          className="font-display font-extrabold text-white text-2xl md:text-3xl rounded-2xl cursor-pointer"
          style={{
            minWidth: 280,
            padding: "20px 48px",
            background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
            boxShadow: "0 0 40px rgba(251,191,36,0.3), 0 4px 16px rgba(0,0,0,0.2)",
          }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          onClick={() => navigate("/play")}
        >
          Play!
        </motion.button>
      </motion.div>
    </div>
  );
}
