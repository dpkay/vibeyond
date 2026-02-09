import { useMemo } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

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

interface StarFieldProps {
  /** 0-1 progress value for parallax. Stars drift as this changes. */
  parallaxOffset?: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

/** Parallax multipliers per layer (pixels of shift at offset=1). */
const PARALLAX = { 1: 4, 2: 12, 3: 24 } as const;

/** 3-layer animated starfield with optional parallax. */
export function StarField({ parallaxOffset = 0 }: StarFieldProps) {
  const stars = useMemo<Star[]>(() => {
    const rand = seededRandom(42);
    const result: Star[] = [];

    // Layer 1: distant
    for (let i = 0; i < 45; i++) {
      result.push({
        x: rand() * 100,
        y: rand() * 100,
        size: rand() * 1 + 1,
        opacityMin: rand() * 0.15 + 0.1,
        opacityMax: rand() * 0.15 + 0.1,
        animationDuration: "0s",
        animationDelay: "0s",
        layer: 1,
      });
    }

    // Layer 2: mid
    for (let i = 0; i < 25; i++) {
      result.push({
        x: rand() * 100,
        y: rand() * 100,
        size: rand() * 1.5 + 1.5,
        opacityMin: rand() * 0.2 + 0.15,
        opacityMax: rand() * 0.25 + 0.35,
        animationDuration: `${rand() * 3 + 4}s`,
        animationDelay: `${rand() * 5}s`,
        layer: 2,
      });
    }

    // Layer 3: bright accent
    for (let i = 0; i < 7; i++) {
      result.push({
        x: rand() * 100,
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

  // Smooth spring for parallax so it glides rather than snaps
  const springOffset = useSpring(parallaxOffset, {
    stiffness: 60,
    damping: 20,
  });

  // Per-layer y transforms
  const layer1Y = useTransform(springOffset, (v) => v * PARALLAX[1]);
  const layer2Y = useTransform(springOffset, (v) => v * PARALLAX[2]);
  const layer3Y = useTransform(springOffset, (v) => v * PARALLAX[3]);

  const layerY = { 1: layer1Y, 2: layer2Y, 3: layer3Y };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {[1, 2, 3].map((layer) => (
        <motion.div
          key={layer}
          className="absolute inset-0"
          style={{ y: layerY[layer as 1 | 2 | 3] }}
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
