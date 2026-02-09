import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import type { Note } from "../types";
import { useAudio } from "./useAudio";
import { useSettingsStore } from "../store/settingsStore";

interface PianoKeyboardProps {
  onKeyPress: (note: Note) => void;
  disabled?: boolean;
}

const PITCHES = ["C", "D", "E", "F", "G", "A", "B"] as const;
type Pitch = (typeof PITCHES)[number];

const BLACK_KEY_MAP: Record<string, Pitch> = {
  C: "C",
  D: "D",
  F: "F",
  G: "G",
  A: "A",
};

interface KeyDef {
  pitch: Pitch;
  accidental: "natural" | "sharp";
  octave: number;
  isBlack: boolean;
  whiteIndex?: number;
}

function buildKeyboard(minNote: Note, maxNote: Note): KeyDef[] {
  const startOctave = minNote.octave;
  const endOctave = maxNote.octave;

  const keys: KeyDef[] = [];
  let whiteIdx = 0;

  for (let oct = startOctave; oct <= endOctave; oct++) {
    for (const pitch of PITCHES) {
      keys.push({
        pitch,
        accidental: "natural",
        octave: oct,
        isBlack: false,
        whiteIndex: whiteIdx,
      });
      whiteIdx++;

      if (pitch in BLACK_KEY_MAP) {
        keys.push({
          pitch,
          accidental: "sharp",
          octave: oct,
          isBlack: true,
          whiteIndex: whiteIdx - 1,
        });
      }
    }
  }

  return keys;
}

function toToneName(pitch: string, accidental: string, octave: number): string {
  const acc = accidental === "sharp" ? "#" : "";
  return `${pitch}${acc}${octave}`;
}

export function PianoKeyboard({ onKeyPress, disabled }: PianoKeyboardProps) {
  const { playNote } = useAudio();
  const { settings } = useSettingsStore();
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const keys = useMemo(
    () => buildKeyboard(settings.noteRange.minNote, settings.noteRange.maxNote),
    [settings.noteRange.minNote, settings.noteRange.maxNote],
  );

  const whiteKeys = useMemo(() => keys.filter((k) => !k.isBlack), [keys]);
  const blackKeys = useMemo(() => keys.filter((k) => k.isBlack), [keys]);
  const whiteCount = whiteKeys.length;

  const handlePress = useCallback(
    (key: KeyDef) => {
      if (disabled) return;

      const keyId = `${key.pitch}${key.accidental === "sharp" ? "#" : ""}${key.octave}`;
      setPressedKey(keyId);
      setTimeout(() => setPressedKey(null), 200);

      playNote(toToneName(key.pitch, key.accidental, key.octave));

      const note: Note = {
        pitch: key.pitch,
        accidental: key.accidental === "sharp" ? "sharp" : "natural",
        octave: key.octave,
        clef: "treble",
      };
      onKeyPress(note);
    },
    [disabled, playNote, onKeyPress],
  );

  const keyId = (k: KeyDef) =>
    `${k.pitch}${k.accidental === "sharp" ? "#" : ""}${k.octave}`;

  return (
    <div className="w-full">
      {/* Atmospheric fog — fades from transparent to warm dark above the ledge */}
      <div
        className="pointer-events-none"
        style={{
          height: 40,
          marginBottom: -1,
          background: `linear-gradient(
            180deg,
            transparent 0%,
            rgba(30, 25, 40, 0.3) 50%,
            rgba(40, 30, 35, 0.5) 100%
          )`,
        }}
      />

      {/* Piano ledge — warm dark strip evoking a real piano's fallboard */}
      <div
        style={{
          height: 20,
          background: "linear-gradient(180deg, #2a2030 0%, #1f1828 40%, #1a1420 100%)",
          boxShadow: `
            inset 0 1px 0 0 rgba(255, 255, 255, 0.08),
            0 2px 8px rgba(0, 0, 0, 0.3)
          `,
        }}
      />

      {/* Keyboard shelf — extends to screen bottom */}
      <div
        className="relative pt-1"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          /* Extend below viewport to avoid bottom gap */
          paddingBottom: 20,
          marginBottom: -12,
        }}
      >
        <div
          className="relative"
          style={{ height: "clamp(130px, 22vh, 180px)" }}
        >
          {/* White keys */}
          {whiteKeys.map((key) => {
            const id = keyId(key);
            const isPressed = pressedKey === id;
            return (
              <motion.button
                key={id}
                className="absolute top-0 bottom-0 cursor-pointer"
                style={{
                  left: `${((key.whiteIndex ?? 0) / whiteCount) * 100}%`,
                  width: `${(1 / whiteCount) * 100}%`,
                  background: isPressed
                    ? "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)"
                    : "linear-gradient(180deg, #f8f8f8 0%, #ececec 50%, #ddd 100%)",
                  borderRadius: "0 0 6px 6px",
                  zIndex: 1,
                  borderRight: "1px solid rgba(180,180,180,0.4)",
                  boxShadow: isPressed
                    ? "0 0 20px rgba(251,191,36,0.5), inset 0 -2px 4px rgba(0,0,0,0.1)"
                    : "inset 0 -4px 8px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.12)",
                }}
                whileTap={disabled ? {} : { y: 3 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                onClick={() => handlePress(key)}
                disabled={disabled}
              />
            );
          })}

          {/* Black keys */}
          {blackKeys.map((key) => {
            const id = keyId(key);
            const isPressed = pressedKey === id;
            const leftPercent =
              (((key.whiteIndex ?? 0) + 0.65) / whiteCount) * 100;
            const widthPercent = (0.65 / whiteCount) * 100;

            return (
              <motion.button
                key={id}
                className="absolute top-0 cursor-pointer"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  height: "62%",
                  background: isPressed
                    ? "linear-gradient(180deg, #fbbf24 0%, #d97706 100%)"
                    : "linear-gradient(180deg, #404040 0%, #1a1a1a 60%, #0a0a0a 100%)",
                  borderRadius: "0 0 5px 5px",
                  zIndex: 2,
                  boxShadow: isPressed
                    ? "0 0 16px rgba(251,191,36,0.4)"
                    : "0 4px 8px rgba(0,0,0,0.6), inset 0 -2px 4px rgba(255,255,255,0.06)",
                }}
                whileTap={disabled ? {} : { y: 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                onClick={() => handlePress(key)}
                disabled={disabled}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
