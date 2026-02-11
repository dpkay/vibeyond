import { motion } from "framer-motion";
import type { Note } from "../types";

/** Maps octave number to an animal name and its image path in /public. */
const ANIMALS: Record<number, { name: string; image: string }> = {
  2: { name: "Elephant", image: "/elephant.png" },
  3: { name: "Penguin",  image: "/penguin.png" },
  4: { name: "Hedgehog", image: "/hedgehog.png" },
  5: { name: "Mouse",    image: "/mouse.png" },
};

/** Chord voicings per octave animal. Each is a rich, characteristic chord. */
const ANIMAL_CHORDS: Record<number, string[]> = {
  2: ["C2", "E2", "G2", "C3"],       // Elephant — deep C major
  3: ["B2", "G#3", "E4"],             // Penguin — E major (second inversion)
  4: ["D4", "G4", "B4"],             // Hedgehog — G major (second inversion)
  5: ["D#5", "F#5", "B5"],           // Mouse — B major (first inversion)
};

export function getAnimalChord(octave: number): string[] {
  return ANIMAL_CHORDS[octave] ?? [`C${octave}`];
}

export function getAnimalForOctave(octave: number) {
  return ANIMALS[octave] ?? ANIMALS[4];
}

/** Renders an animal image at the given size. */
export function AnimalSvg({ octave, size }: { octave: number; size: number }) {
  const animal = getAnimalForOctave(octave);
  return (
    <img
      src={animal.image}
      alt={animal.name}
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
      draggable={false}
    />
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
