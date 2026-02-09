/**
 * @file ProgressionBar.tsx
 *
 * Renders a horizontal progress bar showing the child's journey through the
 * current session. A character icon (Buzz) starts at the left and flies
 * rightward toward a crescent moon as the child answers questions correctly.
 *
 * **Visual metaphor:** The bar represents a journey through space. Each correct
 * answer moves Buzz closer to the Moon. Small gold dots along the track
 * indicate intermediate milestones. The net score (correct - incorrect,
 * floored at 0) is displayed below Buzz.
 *
 * **Design decisions:**
 * - Inline styles are used for positioning because the track, Buzz, and Moon
 *   all require pixel-precise absolute placement that depends on runtime
 *   `progress` values. CSS-in-JS / Tailwind cannot express animated
 *   percentage-based `left` values driven by spring physics.
 * - Framer Motion spring animations (`stiffness: 120, damping: 20`) give the
 *   Buzz icon and amber fill bar a satisfying, bouncy feel that is playful
 *   without being jarring for a 5-year-old.
 * - SVG is used for the Moon icon (rather than emoji) because emoji render as
 *   blank rectangles in some headless / embedded browser contexts.
 */

import { motion } from "framer-motion";
import { useSettingsStore } from "../store/settingsStore";
import { useSessionStore } from "../store/sessionStore";

/**
 * Props for the {@link ProgressionBar} component.
 *
 * @property progress - A number from 0 to 1 representing how far through the
 *   session the child is. `0` = just started, `1` = session complete (moon
 *   reached). This drives both the amber fill width and Buzz's horizontal
 *   position.
 */
interface ProgressionBarProps {
  progress: number; // 0 to 1
}

/**
 * Crescent moon SVG icon displayed at the right end of the progression track.
 *
 * The crescent effect is created by overlapping two circles: a filled gold
 * circle and a slightly offset circle matching the dark background color.
 * A gold drop-shadow filter adds a warm glow.
 */
function MoonIcon() {
  return (
    <svg viewBox="0 0 48 48" width="47" height="47" style={{ filter: "drop-shadow(0 0 10px rgba(251,191,36,0.5))" }}>
      <circle cx="24" cy="24" r="18" fill="#FBBF24" opacity="0.9" />
      <circle cx="18" cy="24" r="16" fill="#1A2140" />
    </svg>
  );
}

/**
 * Buzz Lightyear character icon displayed on the progression track.
 *
 * Renders a PNG image from the public directory. The image is served at a fixed
 * 68x68 size, which is large enough to be tappable and recognizable for a
 * young child.
 */
function BuzzIcon() {
  return (
    <img src="/buzz.png" alt="Buzz" width="68" height="68" style={{ objectFit: "contain" }} />
  );
}

/**
 * Horizontal progression bar showing Buzz flying left-to-right toward the Moon.
 *
 * Layout (all absolutely positioned within a 90px-tall container):
 * - **Track:** A thin rounded bar spanning the width, with small gold dots at
 *   each intermediate step (one per correct answer needed).
 * - **Amber fill:** An animated bar that grows from the left edge to
 *   `progress * 100%`, using a warm gold gradient.
 * - **Buzz icon:** Positioned along the track at the current progress point,
 *   with the net score displayed below.
 * - **Moon icon:** Fixed at the right end, with the session length displayed
 *   below.
 *
 * The component reads `settings.sessionLength` and `session.totalCorrect` /
 * `session.totalIncorrect` from Zustand stores to determine milestone markers
 * and the net score.
 *
 * @param props - See {@link ProgressionBarProps}.
 */
export function ProgressionBar({ progress }: ProgressionBarProps) {
  const { settings } = useSettingsStore();
  const { session } = useSessionStore();
  const totalCorrect = session?.totalCorrect ?? 0;
  const totalIncorrect = session?.totalIncorrect ?? 0;
  /** Net score is floored at 0 so the child never sees a negative number. */
  const netScore = Math.max(0, totalCorrect - totalIncorrect);
  const sessionLength = settings.sessionLength;

  return (
    <div className="relative w-full" style={{ height: 90, padding: "0 32px" }}>
      {/* Track -- inset 32px from edges so Buzz/Moon icons don't clip */}
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
        {/*
          Star dots at each intermediate step (excluding first and last).
          Dots light up gold when the child has passed that milestone.
        */}
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

        {/* Amber fill -- grows from left to right with spring animation */}
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

      {/* Buzz -- travels along the track, centered over the progress point */}
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

      {/* Moon -- fixed at the right end of the track */}
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
