import { motion } from "framer-motion";
import type { Note } from "../types";

/** Maps octave number to an animal name and SVG children (not wrapped in <svg>). */
const ANIMALS: Record<number, { name: string; children: React.ReactNode }> = {
  2: {
    name: "Elephant",
    children: (
      <>
        {/* Body */}
        <ellipse cx="110" cy="120" rx="60" ry="45" fill="#8B9DC3" />
        {/* Head */}
        <circle cx="55" cy="100" r="38" fill="#9BAFD9" />
        {/* Ear */}
        <ellipse cx="30" cy="88" rx="22" ry="28" fill="#7B8EC8" />
        <ellipse cx="32" cy="88" rx="14" ry="20" fill="#B8C5E8" />
        {/* Eye */}
        <circle cx="62" cy="90" r="5" fill="#2A3050" />
        <circle cx="63" cy="88" r="2" fill="white" />
        {/* Trunk */}
        <path
          d="M 30 110 Q 15 130 20 155 Q 25 165 35 160 Q 30 145 40 125"
          fill="none"
          stroke="#8B9DC3"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Tusk */}
        <path
          d="M 50 115 Q 42 128 46 135"
          fill="none"
          stroke="#F5E6C8"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Legs */}
        <rect x="75" y="150" width="16" height="30" rx="8" fill="#8090B8" />
        <rect x="105" y="150" width="16" height="30" rx="8" fill="#8090B8" />
        <rect x="130" y="150" width="16" height="30" rx="8" fill="#8090B8" />
        <rect x="150" y="150" width="16" height="30" rx="8" fill="#8090B8" />
        {/* Tail */}
        <path
          d="M 168 115 Q 185 110 180 125"
          fill="none"
          stroke="#8B9DC3"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </>
    ),
  },
  3: {
    name: "Penguin",
    children: (
      <>
        {/* Body */}
        <ellipse cx="100" cy="120" rx="42" ry="55" fill="#2A3050" />
        {/* Belly */}
        <ellipse cx="100" cy="128" rx="28" ry="42" fill="#E8EAF0" />
        {/* Head */}
        <circle cx="100" cy="65" r="30" fill="#2A3050" />
        {/* Eyes */}
        <circle cx="88" cy="60" r="6" fill="white" />
        <circle cx="112" cy="60" r="6" fill="white" />
        <circle cx="89" cy="60" r="3.5" fill="#2A3050" />
        <circle cx="113" cy="60" r="3.5" fill="#2A3050" />
        <circle cx="90" cy="59" r="1.5" fill="white" />
        <circle cx="114" cy="59" r="1.5" fill="white" />
        {/* Beak */}
        <polygon points="96,70 104,70 100,80" fill="#FBBF24" />
        {/* Flippers */}
        <ellipse cx="55" cy="115" rx="10" ry="28" fill="#2A3050" transform="rotate(-15 55 115)" />
        <ellipse cx="145" cy="115" rx="10" ry="28" fill="#2A3050" transform="rotate(15 145 115)" />
        {/* Feet */}
        <ellipse cx="85" cy="175" rx="14" ry="6" fill="#FBBF24" />
        <ellipse cx="115" cy="175" rx="14" ry="6" fill="#FBBF24" />
        {/* Cheeks */}
        <circle cx="82" cy="68" r="5" fill="#FFB7C5" opacity="0.4" />
        <circle cx="118" cy="68" r="5" fill="#FFB7C5" opacity="0.4" />
      </>
    ),
  },
  4: {
    name: "Hedgehog",
    children: (
      <>
        {/* Spines (background) */}
        <ellipse cx="110" cy="105" rx="58" ry="48" fill="#A67C52" />
        {/* Spine details */}
        <path d="M 65 75 L 55 55 L 72 72" fill="#8B6340" />
        <path d="M 85 65 L 80 42 L 92 62" fill="#8B6340" />
        <path d="M 108 60 L 110 35 L 115 58" fill="#8B6340" />
        <path d="M 130 65 L 138 42 L 135 62" fill="#8B6340" />
        <path d="M 150 75 L 165 58 L 152 73" fill="#8B6340" />
        <path d="M 160 95 L 178 85 L 162 95" fill="#8B6340" />
        <path d="M 158 115 L 175 120 L 158 118" fill="#8B6340" />
        {/* Body */}
        <ellipse cx="100" cy="120" rx="52" ry="38" fill="#D4A574" />
        {/* Face */}
        <ellipse cx="60" cy="115" rx="28" ry="25" fill="#E8C9A0" />
        {/* Nose */}
        <circle cx="38" cy="115" r="6" fill="#2A3050" />
        <circle cx="39" cy="113" r="2" fill="rgba(255,255,255,0.3)" />
        {/* Eye */}
        <circle cx="55" cy="105" r="5" fill="#2A3050" />
        <circle cx="56" cy="104" r="2" fill="white" />
        {/* Cheek */}
        <circle cx="52" cy="118" r="5" fill="#FFB7C5" opacity="0.35" />
        {/* Legs */}
        <ellipse cx="75" cy="155" rx="10" ry="6" fill="#C49A6C" />
        <ellipse cx="115" cy="155" rx="10" ry="6" fill="#C49A6C" />
        <ellipse cx="140" cy="152" rx="10" ry="6" fill="#C49A6C" />
      </>
    ),
  },
  5: {
    name: "Mouse",
    children: (
      <>
        {/* Body */}
        <ellipse cx="105" cy="125" rx="40" ry="32" fill="#C8B8A8" />
        {/* Head */}
        <ellipse cx="65" cy="105" rx="30" ry="28" fill="#D4C8B8" />
        {/* Ears */}
        <ellipse cx="48" cy="76" rx="18" ry="20" fill="#D4C8B8" />
        <ellipse cx="50" cy="76" rx="12" ry="14" fill="#FFB7C5" opacity="0.5" />
        <ellipse cx="82" cy="76" rx="18" ry="20" fill="#D4C8B8" />
        <ellipse cx="84" cy="76" rx="12" ry="14" fill="#FFB7C5" opacity="0.5" />
        {/* Eyes */}
        <circle cx="55" cy="100" r="5" fill="#2A3050" />
        <circle cx="56" cy="99" r="2" fill="white" />
        <circle cx="75" cy="100" r="5" fill="#2A3050" />
        <circle cx="76" cy="99" r="2" fill="white" />
        {/* Nose */}
        <circle cx="60" cy="112" r="4" fill="#FFB7C5" />
        {/* Whiskers */}
        <line x1="40" y1="108" x2="20" y2="104" stroke="#A89888" strokeWidth="1.5" />
        <line x1="40" y1="112" x2="18" y2="114" stroke="#A89888" strokeWidth="1.5" />
        <line x1="40" y1="116" x2="20" y2="122" stroke="#A89888" strokeWidth="1.5" />
        <line x1="80" y1="108" x2="100" y2="102" stroke="#A89888" strokeWidth="1.5" />
        <line x1="80" y1="112" x2="102" y2="112" stroke="#A89888" strokeWidth="1.5" />
        <line x1="80" y1="116" x2="100" y2="120" stroke="#A89888" strokeWidth="1.5" />
        {/* Cheeks */}
        <circle cx="48" cy="110" r="5" fill="#FFB7C5" opacity="0.3" />
        <circle cx="82" cy="110" r="5" fill="#FFB7C5" opacity="0.3" />
        {/* Tail */}
        <path
          d="M 143 130 Q 170 115 175 140 Q 178 160 160 158"
          fill="none"
          stroke="#C8B8A8"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Feet */}
        <ellipse cx="80" cy="155" rx="10" ry="5" fill="#C0B0A0" />
        <ellipse cx="120" cy="155" rx="10" ry="5" fill="#C0B0A0" />
      </>
    ),
  },
};

export function getAnimalForOctave(octave: number) {
  return ANIMALS[octave] ?? ANIMALS[4];
}

/** Renders an animal SVG at the given size. */
export function AnimalSvg({ octave, size }: { octave: number; size: number }) {
  const animal = getAnimalForOctave(octave);
  return (
    <svg viewBox="0 0 200 200" width={size} height={size}>
      {animal.children}
    </svg>
  );
}

interface AnimalPromptProps {
  note: Note | null;
}

export function AnimalPrompt({ note }: AnimalPromptProps) {
  if (!note) return null;

  return (
    <motion.div
      key={note.octave}
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div
        style={{
          filter: "drop-shadow(0 0 20px rgba(251,191,36,0.25))",
        }}
      >
        <AnimalSvg octave={note.octave} size={200} />
      </div>
      <span className="text-muted text-lg font-display">
        Which animal is this?
      </span>
    </motion.div>
  );
}
