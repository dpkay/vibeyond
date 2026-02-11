import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { StarField } from "../components/StarField";
import { useSettingsStore } from "../store/settingsStore";
import { notesConfigToMissionId } from "../missions";
import type { NotesConfig } from "../types";

function MoonIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1 }}
    >
      <svg
        viewBox="0 0 96 96"
        width="80"
        height="80"
        style={{ filter: "drop-shadow(0 0 24px rgba(251,191,36,0.45))" }}
      >
        <circle cx="48" cy="48" r="36" fill="#FBBF24" opacity="0.9" />
        <circle cx="38" cy="48" r="32" fill="#1A2140" />
      </svg>
    </motion.div>
  );
}

const AnimalIcon = (
  <svg viewBox="0 0 48 48" width="36" height="36">
    <circle cx="24" cy="28" r="10" fill="#FBBF24" opacity="0.8" />
    <circle cx="16" cy="16" r="5" fill="#FBBF24" opacity="0.6" />
    <circle cx="32" cy="16" r="5" fill="#FBBF24" opacity="0.6" />
    <circle cx="10" cy="24" r="4" fill="#FBBF24" opacity="0.5" />
    <circle cx="38" cy="24" r="4" fill="#FBBF24" opacity="0.5" />
  </svg>
);

const NotesIcon = (
  <svg viewBox="0 0 48 48" width="36" height="36">
    <path
      d="M 24 8 C 18 14 14 22 14 28 C 14 36 20 40 26 38 C 30 36 32 32 30 28 C 28 24 22 24 20 28 C 18 32 20 36 24 38"
      fill="none"
      stroke="#FBBF24"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.8"
    />
  </svg>
);

function ToggleChip({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className="rounded-full text-sm font-semibold cursor-pointer transition-colors"
      style={{
        padding: "5px 14px",
        background: active ? "rgba(251,191,36,0.25)" : "rgba(42,48,80,0.5)",
        color: active ? "#FBBF24" : "#8890a8",
        border: active
          ? "1px solid rgba(251,191,36,0.4)"
          : "1px solid rgba(54,61,92,0.5)",
      }}
      onClick={onToggle}
    >
      {label}
    </button>
  );
}

export function HomeScreen() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettingsStore();
  const { animalsConfig, notesConfig } = settings;

  const handleToggle = (key: keyof NotesConfig) => {
    if (key === "accidentals") {
      updateSettings({
        notesConfig: { ...notesConfig, accidentals: !notesConfig.accidentals },
      });
      return;
    }
    // Guard: can't disable both clefs
    const next = !notesConfig[key];
    if (!next && key === "treble" && !notesConfig.bass) return;
    if (!next && key === "bass" && !notesConfig.treble) return;
    updateSettings({ notesConfig: { ...notesConfig, [key]: next } });
  };

  const handlePlayNotes = () => {
    const missionId = notesConfigToMissionId(notesConfig);
    navigate(`/play/${missionId}`);
  };

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

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-5"
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
          <h1 className="font-display font-extrabold text-white text-4xl md:text-5xl mb-1">
            Vibeyond
          </h1>
          <p className="text-muted text-lg md:text-xl">
            Choose your mission!
          </p>
        </motion.div>

        {/* Mission cards — side by side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{ maxWidth: 520, width: "100%", padding: "0 16px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              alignItems: "stretch",
            }}
          >
            {/* Animals card */}
            <div
              className="rounded-2xl"
              style={{
                padding: "18px 16px",
                background: "rgba(37,43,74,0.45)",
                border: "1px solid rgba(251,191,36,0.15)",
                backdropFilter: "blur(8px)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div className="flex flex-col items-center text-center" style={{ marginBottom: 12 }}>
                {AnimalIcon}
                <span className="font-display font-extrabold text-white text-lg mt-2" style={{ lineHeight: 1.2 }}>
                  Animals
                </span>
                <span className="text-muted text-xs mt-1" style={{ lineHeight: 1.3 }}>
                  Match the animal to its octave
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 flex-wrap" style={{ marginBottom: 14 }}>
                <ToggleChip
                  label="Show Icons"
                  active={animalsConfig.showIcons}
                  onToggle={() => updateSettings({ animalsConfig: { ...animalsConfig, showIcons: !animalsConfig.showIcons } })}
                />
              </div>

              <motion.button
                className="w-full rounded-xl font-display font-extrabold text-base cursor-pointer"
                style={{
                  marginTop: "auto",
                  padding: "10px 0",
                  background: "rgba(251,191,36,0.2)",
                  color: "#FBBF24",
                  border: "1px solid rgba(251,191,36,0.3)",
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/play/animal-octaves")}
              >
                Play
              </motion.button>
            </div>

            {/* Notes card */}
            <div
              className="rounded-2xl"
              style={{
                padding: "18px 16px",
                background: "rgba(37,43,74,0.45)",
                border: "1px solid rgba(251,191,36,0.15)",
                backdropFilter: "blur(8px)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div className="flex flex-col items-center text-center" style={{ marginBottom: 12 }}>
                {NotesIcon}
                <span className="font-display font-extrabold text-white text-lg mt-2" style={{ lineHeight: 1.2 }}>
                  Notes
                </span>
                <span className="text-muted text-xs mt-1" style={{ lineHeight: 1.3 }}>
                  Read notes on the staff
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 flex-wrap" style={{ marginBottom: 14 }}>
                <ToggleChip label="Treble" active={notesConfig.treble} onToggle={() => handleToggle("treble")} />
                <ToggleChip label="Bass" active={notesConfig.bass} onToggle={() => handleToggle("bass")} />
                <ToggleChip label="Accidentals" active={notesConfig.accidentals} onToggle={() => handleToggle("accidentals")} />
              </div>

              <motion.button
                className="w-full rounded-xl font-display font-extrabold text-base cursor-pointer"
                style={{
                  marginTop: "auto",
                  padding: "10px 0",
                  background: "rgba(251,191,36,0.2)",
                  color: "#FBBF24",
                  border: "1px solid rgba(251,191,36,0.3)",
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handlePlayNotes}
              >
                Play
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
