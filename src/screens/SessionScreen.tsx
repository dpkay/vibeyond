import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSessionStore } from "../store/sessionStore";
import { useCardStore } from "../store/cardStore";
import { useSettingsStore } from "../store/settingsStore";
import { noteFromId } from "../logic/noteUtils";
import { resolveMission } from "../missions";
import { StaffDisplay } from "../components/StaffDisplay";
import { PianoKeyboard } from "../components/PianoKeyboard";
import { AnimalPrompt } from "../components/AnimalPrompt";
import { OctaveButtons } from "../components/OctaveButtons";
import { ProgressionBar } from "../components/ProgressionBar";
import { FeedbackOverlay } from "../components/FeedbackOverlay";
import { Celebration } from "../components/Celebration";
import { StarField } from "../components/StarField";
import * as Tone from "tone";
import type { MissionId, Note } from "../types";

function IconButton({
  onClick,
  children,
  label,
}: {
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      className="flex items-center justify-center rounded-full cursor-pointer"
      style={{
        width: 44,
        height: 44,
        background: "rgba(42,48,80,0.7)",
      }}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  );
}

export function SessionScreen() {
  const navigate = useNavigate();
  const { missionId: missionIdParam } = useParams<{ missionId: string }>();
  const missionId = missionIdParam as MissionId;
  const mission = resolveMission(missionId);

  const { loaded: settingsLoaded } = useSettingsStore();
  const { loaded: cardsLoaded, ensureCardsForMission } = useCardStore();
  const {
    session,
    phase,
    currentCard,
    progression,
    lastAnswerCorrect,
    startSession,
    submitAnswer,
    advanceToNext,
    endSession,
  } = useSessionStore();

  const [muted, setMuted] = useState(false);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    Tone.getDestination().mute = next;
  };

  useEffect(() => {
    if (!settingsLoaded || !cardsLoaded) return;

    const init = async () => {
      await ensureCardsForMission(missionId);
      startSession(missionId);
    };
    init();
  }, [settingsLoaded, cardsLoaded, ensureCardsForMission, startSession, missionId]);

  const currentNote: Note | null = currentCard
    ? noteFromId(currentCard.noteId)
    : null;

  const handleKeyPress = async (note: Note) => {
    if (phase !== "playing") return;
    await submitAnswer(note);
  };

  const handleFeedbackComplete = () => {
    advanceToNext();
  };

  const handleCelebrationDone = async () => {
    await endSession();
    navigate("/");
  };

  const handleQuit = async () => {
    await endSession();
    navigate("/");
  };

  if (!settingsLoaded || !cardsLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-muted text-lg animate-pulse">Loading...</span>
      </div>
    );
  }

  const isAnimal = mission.promptType === "animal";

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      <StarField parallaxOffset={progression} />

      {/* Progress track */}
      <div
        className="relative z-10 flex-shrink-0"
        style={{ padding: "20px 32px 8px" }}
      >
        <ProgressionBar progress={progression} />
      </div>

      {/* Prompt area — staff or animal */}
      <div className="relative z-10 flex-1 flex items-center justify-center min-h-0" style={{ padding: "0 32px" }}>
        {isAnimal ? (
          <AnimalPrompt note={currentNote} />
        ) : (
          <StaffDisplay note={currentNote} />
        )}

        {/* Side buttons */}
        <div
          className="absolute flex flex-col items-center gap-3"
          style={{ right: 16, top: "50%", transform: "translateY(-50%)" }}
        >
          <IconButton onClick={handleQuit} label="Quit">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </IconButton>
          <IconButton onClick={toggleMute} label={muted ? "Unmute" : "Mute"}>
            {muted ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 010 14.14" />
                <path d="M15.54 8.46a5 5 0 010 7.07" />
              </svg>
            )}
          </IconButton>
          <IconButton onClick={() => navigate("/settings")} label="Settings">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </IconButton>
        </div>
      </div>

      {/* Spacer */}
      <div style={{ height: 24 }} />

      {/* Input area — piano (with optional octave button overlay) */}
      <div className="relative z-10 flex-shrink-0">
        <PianoKeyboard
          onKeyPress={handleKeyPress}
          disabled={isAnimal || phase !== "playing"}
        />
        {isAnimal && (
          <OctaveButtons
            onPress={handleKeyPress}
            disabled={phase !== "playing"}
          />
        )}
      </div>

      {/* Feedback overlay */}
      {phase === "feedback" && (
        <FeedbackOverlay
          correct={lastAnswerCorrect}
          onComplete={handleFeedbackComplete}
        />
      )}

      {/* Celebration overlay */}
      {phase === "complete" && (
        <Celebration
          onDone={handleCelebrationDone}
          correctCount={session?.totalCorrect}
          totalCount={
            session
              ? session.totalCorrect + session.totalIncorrect
              : undefined
          }
        />
      )}
    </div>
  );
}
