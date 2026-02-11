import { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import type { Note } from "../types";
import { getAnimalForOctave, getAnimalChord, AnimalSvg } from "./AnimalPrompt";
import { useAudio } from "./useAudio";
import { useSettingsStore } from "../store/settingsStore";

interface OctaveButtonsProps {
  onPress: (note: Note) => void;
  disabled: boolean;
}

/**
 * Transparent animal buttons overlaid on top of the PianoKeyboard.
 *
 * Each button spans exactly one octave (7 white keys) and is positioned
 * to align with the corresponding octave on the piano below. Pressing a
 * button plays the C of that octave and submits the answer.
 */
export function OctaveButtons({ onPress, disabled }: OctaveButtonsProps) {
  const { playChord } = useAudio();
  const { settings } = useSettingsStore();

  const startOctave = settings.noteRange.minNote.octave;
  const endOctave = settings.noteRange.maxNote.octave;
  const totalOctaves = endOctave - startOctave + 1;

  const octaves = useMemo(() => {
    const result: number[] = [];
    for (let o = startOctave; o <= endOctave; o++) result.push(o);
    return result;
  }, [startOctave, endOctave]);

  const handlePress = useCallback(
    (octave: number) => {
      if (disabled) return;
      playChord(getAnimalChord(octave));
      const note: Note = {
        pitch: "C",
        accidental: "natural",
        octave,
        clef: "treble",
      };
      onPress(note);
    },
    [disabled, playChord, onPress],
  );

  return (
    <div
      className="absolute inset-0 flex"
      style={{ zIndex: 10 }}
    >
      {octaves.map((octave) => {
        const animal = getAnimalForOctave(octave);
        return (
          <motion.button
            key={octave}
            className="relative flex items-center justify-center cursor-pointer"
            style={{
              width: `${(1 / totalOctaves) * 100}%`,
              height: "100%",
              background: "transparent",
              opacity: disabled ? 0.5 : 1,
            }}
            whileTap={disabled ? {} : { scale: 0.92 }}
            onClick={() => handlePress(octave)}
            disabled={disabled}
          >
            {/* Glass-effect badge — shows animal icon + name, or empty */}
            <div
              className="flex flex-col items-center justify-center rounded-2xl"
              style={{
                width: "85%",
                maxWidth: 110,
                padding: settings.animalsConfig.showIcons ? "10px 4px 8px" : "24px 4px",
                background: "rgba(20, 24, 50, 0.65)",
                border: "1px solid rgba(251, 191, 36, 0.25)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              }}
            >
              {settings.animalsConfig.showIcons && (
                <>
                  <AnimalSvg octave={octave} size={52} />
                  <span
                    className="font-display font-extrabold text-xs mt-1"
                    style={{ color: "#FBBF24" }}
                  >
                    {animal.name}
                  </span>
                </>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
