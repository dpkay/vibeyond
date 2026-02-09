import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { db } from "../db/db";
import { StarField } from "../components/StarField";

export function ParentSettingsScreen() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettingsStore();
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSessionLengthChange = (delta: number) => {
    const newLength = Math.max(5, Math.min(30, settings.sessionLength + delta));
    updateSettings({ sessionLength: newLength });
  };

  return (
    <div className="relative h-full flex flex-col items-center justify-center overflow-y-auto">
      <StarField />

      <div
        className="relative z-10 w-full"
        style={{ maxWidth: 720, padding: "32px 24px" }}
      >
        {/* Header */}
        <div
          className="relative flex items-center justify-center"
          style={{ marginBottom: 28 }}
        >
          <motion.button
            className="absolute left-0 flex items-center justify-center rounded-full cursor-pointer"
            style={{
              width: 44,
              height: 44,
              background: "rgba(42,48,80,0.7)",
            }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/")}
            aria-label="Back"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </motion.button>
          <h1 className="font-display font-extrabold text-white text-2xl">
            Settings
          </h1>
        </div>

        {/* 2-column grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {/* Session Length */}
          <div
            className="rounded-2xl backdrop-blur-sm flex flex-col"
            style={{
              background: "rgba(37,43,74,0.5)",
              border: "1px solid #363d5c",
              padding: 20,
            }}
          >
            <h2 className="text-lg font-display font-extrabold text-gold-400 mb-1">
              Session Length
            </h2>
            <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
              Correct answers to reach the Moon
            </p>
            <div className="flex items-center justify-center gap-4 mt-auto">
              <motion.button
                className="w-11 h-11 rounded-full flex items-center justify-center text-white text-2xl font-bold cursor-pointer"
                style={{ background: "#363d5c" }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSessionLengthChange(-1)}
              >
                &minus;
              </motion.button>
              <span className="text-3xl font-display font-extrabold text-white w-12 text-center">
                {settings.sessionLength}
              </span>
              <motion.button
                className="w-11 h-11 rounded-full flex items-center justify-center text-white text-2xl font-bold cursor-pointer"
                style={{ background: "#363d5c" }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSessionLengthChange(1)}
              >
                +
              </motion.button>
            </div>
          </div>

          {/* Clef Selection */}
          <div
            className="rounded-2xl backdrop-blur-sm flex flex-col"
            style={{
              background: "rgba(37,43,74,0.5)",
              border: "1px solid #363d5c",
              padding: 20,
            }}
          >
            <h2 className="text-lg font-display font-extrabold text-gold-400 mb-1">
              Clef
            </h2>
            <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
              Which clefs to practice
            </p>
            <div className="flex gap-3 mt-auto">
              {(["treble", "bass"] as const).map((clef) => {
                const enabled = settings.enabledClefs.includes(clef);
                return (
                  <motion.button
                    key={clef}
                    className="flex-1 py-3 rounded-xl font-display font-extrabold text-lg cursor-pointer"
                    style={
                      enabled
                        ? {
                            background:
                              "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
                            color: "white",
                            boxShadow: "0 0 16px rgba(251,191,36,0.25)",
                          }
                        : {
                            background: "#363d5c",
                            color: "#8890a8",
                          }
                    }
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (enabled && settings.enabledClefs.length <= 1) return;
                      const updated = enabled
                        ? settings.enabledClefs.filter((c) => c !== clef)
                        : [...settings.enabledClefs, clef];
                      updateSettings({ enabledClefs: updated });
                    }}
                  >
                    {clef === "treble" ? "Treble" : "Bass"}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Note Range */}
          <div
            className="rounded-2xl backdrop-blur-sm flex flex-col"
            style={{
              background: "rgba(37,43,74,0.5)",
              border: "1px solid #363d5c",
              padding: 20,
            }}
          >
            <h2 className="text-lg font-display font-extrabold text-gold-400 mb-1">
              Note Range
            </h2>
            <p className="text-sm text-muted" style={{ marginBottom: 8 }}>
              Currently practicing treble clef
            </p>
            <p className="text-white font-semibold text-lg mt-auto">
              {settings.noteRange.minNote.pitch}
              {settings.noteRange.minNote.octave}
              <span className="text-muted" style={{ margin: "0 8px" }}>&rarr;</span>
              {settings.noteRange.maxNote.pitch}
              {settings.noteRange.maxNote.octave}
            </p>
          </div>

          {/* Card Inspector link */}
          <motion.button
            className="rounded-2xl backdrop-blur-sm text-left cursor-pointer flex flex-col"
            style={{
              background: "rgba(37,43,74,0.5)",
              border: "1px solid #363d5c",
              padding: 20,
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/cards")}
          >
            <h2 className="text-lg font-display font-extrabold text-gold-400 mb-1">
              Card Inspector
            </h2>
            <p className="text-sm text-muted">
              View all cards, FSRS state, and success rates
            </p>
            <div className="flex justify-end mt-auto" style={{ paddingTop: 8 }}>
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.5"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </motion.button>

          {/* Reset Data — spans both columns */}
          <div
            className="rounded-2xl backdrop-blur-sm"
            style={{
              gridColumn: "1 / -1",
              background: "rgba(37,43,74,0.5)",
              border: "1px solid #363d5c",
              padding: 20,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-display font-extrabold text-gold-400 mb-1">
                  Reset Data
                </h2>
                <p className="text-sm text-muted">
                  Clear all progress, cards, and settings
                </p>
              </div>
              {!confirmReset ? (
                <motion.button
                  className="rounded-xl font-display font-extrabold cursor-pointer"
                  style={{ background: "#5c363a", color: "#f87171", padding: "10px 20px" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmReset(true)}
                >
                  Reset All
                </motion.button>
              ) : (
                <div className="flex gap-2">
                  <motion.button
                    className="rounded-xl font-display font-extrabold cursor-pointer"
                    style={{ background: "#363d5c", color: "#8890a8", padding: "10px 16px" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setConfirmReset(false)}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    className="rounded-xl font-display font-extrabold cursor-pointer"
                    style={{ background: "#dc2626", color: "white", padding: "10px 16px" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      await db.delete();
                      window.location.href = "/";
                    }}
                  >
                    Confirm
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
