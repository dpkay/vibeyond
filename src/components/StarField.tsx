/**
 * @file StarField.tsx
 *
 * Renders a 3-layer animated starfield background that covers the entire
 * viewport. Used on both the session screen and the celebration screen to
 * create the app's "cozy space" atmosphere (inspired by Pixar's La Luna).
 *
 * **Layer architecture:**
 * - **Layer 1 (distant, 45 stars):** Tiny (1-2px), dim, static dots. These
 *   provide depth without drawing attention.
 * - **Layer 2 (mid, 25 stars):** Medium (1.5-3px) dots that gently twinkle
 *   via CSS `@keyframes twinkle` animation.
 * - **Layer 3 (accent, 7 stars):** Larger (3.5-6px) dots with a box-shadow
 *   glow that pulse via CSS `@keyframes star-pulse`. These are the "bright
 *   stars" that catch the eye.
 *
 * **Design decisions:**
 * - A seeded PRNG (`seededRandom(42)`) is used instead of `Math.random()` so
 *   that star positions are deterministic across renders and sessions. This
 *   prevents the starfield from "shuffling" when the component remounts.
 * - CSS `@keyframes` animations (defined in the global stylesheet) are used
 *   for twinkling instead of Framer Motion because they are GPU-composited
 *   and more performant for 77 simultaneous infinite animations.
 * - CSS custom properties (`--star-opacity-min`, `--star-opacity-max`) are set
 *   per-star so the global keyframes can reference per-star opacity ranges.
 *   This is cast via `as string` to satisfy TypeScript's CSSProperties type.
 * - Parallax is implemented with Framer Motion's `useSpring` + `useTransform`
 *   so that layer shifts are smooth (spring physics) rather than jerky. Closer
 *   layers shift more (24px at offset=1) than distant ones (4px), creating a
 *   realistic depth illusion.
 * - The component is `pointer-events-none` and `z-0` so it sits behind all
 *   interactive content without blocking taps.
 */

import { useEffect, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Descriptor for a single star in the field.
 *
 * @property x                 - Horizontal position as a percentage (0-100).
 * @property y                 - Vertical position as a percentage (0-100).
 * @property size              - Diameter in pixels.
 * @property opacityMin        - Minimum opacity during twinkle cycle.
 * @property opacityMax        - Maximum opacity during twinkle cycle.
 * @property animationDuration - CSS duration string for the twinkle animation,
 *   or `"0s"` for static (non-twinkling) stars.
 * @property animationDelay    - CSS delay string to stagger twinkle start times.
 * @property glow              - If `true`, the star gets a box-shadow glow and
 *   uses the `star-pulse` keyframes instead of `twinkle`.
 * @property layer             - Depth layer: 1 = far, 2 = mid, 3 = near.
 */
interface Star {
  x: number;
  y: number;
  size: number;
  opacityMin: number;
  opacityMax: number;
  animationDuration: string;
  animationDelay: string;
  glow?: boolean;
  layer: 1 | 2 | 3;
}

/**
 * Props for the {@link StarField} component.
 *
 * @property parallaxOffset - A 0-1 value that drives vertical parallax
 *   shifting of the star layers. As this increases, closer layers move
 *   downward more than distant layers. Defaults to `0` (no parallax).
 *   Typically driven by session progress so the stars subtly drift as
 *   the child advances.
 */
interface StarFieldProps {
  /** 0-1 progress value for parallax. Stars drift as this changes. */
  parallaxOffset?: number;
}

/**
 * Creates a seeded pseudo-random number generator using the Park-Miller LCG
 * algorithm. Returns a function that produces deterministic values in (0, 1)
 * on each call.
 *
 * Using a seeded PRNG ensures the starfield layout is identical across
 * renders and page reloads, preventing visual "shuffling".
 *
 * @param seed - The integer seed value.
 * @returns A function that returns the next pseudo-random number in (0, 1).
 */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

/**
 * Parallax shift multipliers per layer, in pixels of vertical displacement
 * when `parallaxOffset` equals 1. Higher values for closer (higher-numbered)
 * layers create the depth illusion.
 */
const PARALLAX_Y = { 1: 4, 2: 12, 3: 24 } as const;

/**
 * Horizontal parallax multipliers (negative = stars drift left as Buzz flies
 * right). These are large enough to create a visible "flying through space"
 * effect when progression changes. Star x-positions are widened to compensate
 * so stars don't run out at the edges.
 */
const PARALLAX_X = { 1: -600, 2: -1800, 3: -3600 } as const;

/**
 * Three-layer animated starfield with optional parallax scrolling.
 *
 * Renders 77 total stars (45 + 25 + 7) across three depth layers inside a
 * fixed full-viewport container. Stars are positioned using percentage-based
 * `left`/`top` values so they distribute evenly regardless of screen size.
 *
 * Twinkling is handled by CSS `@keyframes` animations (defined in the global
 * stylesheet) rather than Framer Motion, for GPU-composited performance.
 * Parallax shifting uses Framer Motion springs so the layers glide smoothly.
 *
 * @param props - See {@link StarFieldProps}.
 */
export function StarField({ parallaxOffset = 0 }: StarFieldProps) {
  const stars = useMemo<Star[]>(() => {
    const rand = seededRandom(42);
    const result: Star[] = [];

    // Layer 1: distant -- tiny, dim, no animation (static backdrop)
    for (let i = 0; i < 120; i++) {
      result.push({
        x: rand() * 200 - 50,
        y: rand() * 100,
        size: rand() * 1 + 1,
        opacityMin: rand() * 0.15 + 0.1,
        opacityMax: rand() * 0.15 + 0.1,
        animationDuration: "0s",
        animationDelay: "0s",
        layer: 1,
      });
    }

    // Layer 2: mid -- medium size, gentle twinkle (4-7s cycle)
    for (let i = 0; i < 60; i++) {
      result.push({
        x: rand() * 400 - 150,
        y: rand() * 100,
        size: rand() * 1.5 + 1.5,
        opacityMin: rand() * 0.2 + 0.15,
        opacityMax: rand() * 0.25 + 0.35,
        animationDuration: `${rand() * 3 + 4}s`,
        animationDelay: `${rand() * 5}s`,
        layer: 2,
      });
    }

    // Layer 3: bright accent -- larger, glowing, slow pulse (5-7s cycle)
    for (let i = 0; i < 15; i++) {
      result.push({
        x: rand() * 600 - 250,
        y: rand() * 100,
        size: rand() * 2.5 + 3.5,
        opacityMin: rand() * 0.2 + 0.35,
        opacityMax: rand() * 0.2 + 0.55,
        animationDuration: `${rand() * 2 + 5}s`,
        animationDelay: `${rand() * 4}s`,
        glow: true,
        layer: 3,
      });
    }

    return result;
  }, []);

  // Explicit MotionValue so we can imperatively .set() on prop changes,
  // then wrap it in a spring for smooth gliding.
  const rawOffset = useMotionValue(parallaxOffset);
  useEffect(() => {
    rawOffset.set(parallaxOffset);
  }, [parallaxOffset, rawOffset]);

  const springOffset = useSpring(rawOffset, {
    stiffness: 60,
    damping: 20,
  });

  // Per-layer transforms derived from the spring value
  const layer1Y = useTransform(springOffset, (v) => v * PARALLAX_Y[1]);
  const layer2Y = useTransform(springOffset, (v) => v * PARALLAX_Y[2]);
  const layer3Y = useTransform(springOffset, (v) => v * PARALLAX_Y[3]);
  const layer1X = useTransform(springOffset, (v) => v * PARALLAX_X[1]);
  const layer2X = useTransform(springOffset, (v) => v * PARALLAX_X[2]);
  const layer3X = useTransform(springOffset, (v) => v * PARALLAX_X[3]);

  const layerY = { 1: layer1Y, 2: layer2Y, 3: layer3Y };
  const layerX = { 1: layer1X, 2: layer2X, 3: layer3X };

  return (
    <div className="fixed inset-0 pointer-events-none z-0" style={{ overflow: "visible" }}>
      {[1, 2, 3].map((layer) => (
        <motion.div
          key={layer}
          className="absolute"
          style={{
            inset: "-10% -100%",
            x: layerX[layer as 1 | 2 | 3],
            y: layerY[layer as 1 | 2 | 3],
          }}
        >
          {stars
            .filter((s) => s.layer === layer)
            .map((star, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  opacity: star.opacityMin,
                  // CSS custom properties consumed by the global @keyframes
                  // rules to interpolate per-star opacity ranges. The `as string`
                  // cast is needed because React's CSSProperties type does not
                  // include custom property keys.
                  ["--star-opacity-min" as string]: star.opacityMin,
                  ["--star-opacity-max" as string]: star.opacityMax,
                  animation:
                    star.animationDuration === "0s"
                      ? "none"
                      : star.glow
                        ? `star-pulse ${star.animationDuration} ease-in-out ${star.animationDelay} infinite`
                        : `twinkle ${star.animationDuration} ease-in-out ${star.animationDelay} infinite`,
                  boxShadow: star.glow
                    ? `0 0 ${star.size * 2}px ${star.size}px rgba(255,255,255,0.15)`
                    : "none",
                }}
              />
            ))}
        </motion.div>
      ))}
    </div>
  );
}
