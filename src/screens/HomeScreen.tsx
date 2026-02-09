/**
 * @file HomeScreen.tsx -- Landing / title screen for Vibeyond.
 *
 * This is the first screen the user sees when they open the app
 * (route `/`). It presents:
 *
 * - An animated star field background (`<StarField />`).
 * - A glowing crescent moon illustration (the session's destination).
 * - The app title "Vibeyond" with a tagline.
 * - A floating Buzz Lightyear character with a gentle hover animation.
 * - A prominent golden "Play!" button that navigates to `/play`
 *   (the `SessionScreen`).
 * - A gear icon in the top-right corner that navigates to `/settings`
 *   (the `ParentSettingsScreen`).
 *
 * All visual elements use staggered Framer Motion entrance animations
 * for a polished, sequential reveal.
 *
 * **Navigation:**
 * - "Play!" button  -->  `/play` (SessionScreen)
 * - Gear icon       -->  `/settings` (ParentSettingsScreen)
 */

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { StarField } from "../components/StarField";

/**
 * Crescent moon SVG illustration for the home screen.
 *
 * Renders a golden circle partially overlapped by a dark circle to
 * create a crescent shape. A CSS drop-shadow filter produces the
 * warm amber glow. Fades in and slides down on mount via Framer Motion.
 */
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
        {/* Overlapping dark circle creates the crescent cutout effect.
            Fill color matches the app background. */}
        <circle cx="38" cy="48" r="32" fill="#1A2140" />
      </svg>
    </motion.div>
  );
}

/**
 * Buzz Lightyear character illustration.
 *
 * Loads a static PNG from `/public/buzz.png`. The image fades in on
 * mount and then continuously bobs up and down (8px amplitude, 3s
 * cycle) using a looping Framer Motion animation to give a
 * "floating in space" effect.
 */
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

/**
 * Home / title screen component.
 *
 * Vertically centers the moon, title, Buzz character, and Play button.
 * No state management or data fetching happens here -- this screen is
 * purely presentational with navigation callbacks.
 */
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
