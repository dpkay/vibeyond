/**
 * @file SessionScreen.tsx -- Active note-recognition practice session.
 *
 * This screen (route `/play`) is the core gameplay loop. It is reached
 * by tapping "Play!" on the `HomeScreen`.
 *
 * **Layout (top to bottom):**
 * 1. `ProgressionBar` -- horizontal progress track showing how close
 *    the rocket is to reaching the Moon.
 * 2. `StaffDisplay` -- renders the current note on a musical staff
 *    using VexFlow.
 * 3. Control buttons (quit / mute / settings) -- absolutely positioned
 *    on the right side, vertically centered alongside the staff.
 * 4. `PianoKeyboard` -- full-width interactive piano at the bottom.
 *
 * **Session lifecycle (managed by `useSessionStore`):**
 *
 * ```
 * mount --> ensureCardsForRange() --> startSession()
 *   |
 *   v
 * phase: "playing"  -- user sees a note, taps a piano key
 *   |
 *   v  submitAnswer(note)
 * phase: "feedback"  -- FeedbackOverlay shows correct/incorrect
 *   |
 *   v  advanceToNext()
 * phase: "playing"   -- next card is drawn (loops back)
 *   ...
 *   v  (when session goal reached)
 * phase: "complete"  -- Celebration overlay is shown
 *   |
 *   v  endSession() --> navigate("/")
 * ```
 *
 * **Key state:**
 * - `phase` ("playing" | "feedback" | "complete") drives which overlay
 *   is visible and whether the piano accepts input.
 * - `progression` (0-1) tracks correct-answer progress toward the
 *   session goal; also used for StarField parallax offset.
 * - `muted` (local) toggles Tone.js master output.
 *
 * **Navigation:**
 * - Quit button  -->  `/` (HomeScreen), after persisting the session.
 * - Settings gear -->  `/settings` (ParentSettingsScreen).
 * - Celebration done -->  `/` (HomeScreen).
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "../store/sessionStore";
import { useCardStore } from "../store/cardStore";
import { useSettingsStore } from "../store/settingsStore";
import { noteFromId } from "../logic/noteUtils";
import { StaffDisplay } from "../components/StaffDisplay";
import { PianoKeyboard } from "../components/PianoKeyboard";
import { ProgressionBar } from "../components/ProgressionBar";
import { FeedbackOverlay } from "../components/FeedbackOverlay";
import { Celebration } from "../components/Celebration";
import { StarField } from "../components/StarField";
import * as Tone from "tone";
import type { Note } from "../types";

/**
 * Reusable 44x44 circular icon button with a translucent dark background.
 *
 * Used for the quit, mute, and settings controls that float alongside
 * the staff display during a session.
 *
 * @param onClick - Click handler.
 * @param children - SVG icon content to render inside the button.
 * @param label - Accessible aria-label describing the button's action.
 */
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

/**
 * Main session screen component.
 *
 * Orchestrates the gameplay loop by wiring together the session store
 * (which manages FSRS card selection and answer evaluation) with the
 * visual components (staff, keyboard, progress bar, overlays).
 */
export function SessionScreen() {
  const navigate = useNavigate();
  const { loaded: settingsLoaded } = useSettingsStore();
  const { loaded: cardsLoaded, ensureCardsForRange } = useCardStore();
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

  /** Toggles Tone.js master mute and syncs local state. */
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    Tone.getDestination().mute = next;
  };

  /**
   * Session initialization effect.
   *
   * Waits for both Zustand stores to finish hydrating from IndexedDB,
   * then ensures FSRS cards exist for every note in the configured
   * range (creating new cards for any gaps), and finally starts the
   * session which picks the first card to display.
   */
  useEffect(() => {
    if (!settingsLoaded || !cardsLoaded) return;

    const init = async () => {
      await ensureCardsForRange();
      startSession();
    };
    init();
  }, [settingsLoaded, cardsLoaded, ensureCardsForRange, startSession]);

  /** Derive the `Note` object from the current card's noteId for the staff display. */
  const currentNote: Note | null = currentCard
    ? noteFromId(currentCard.noteId)
    : null;

  /**
   * Handles a piano key press during the "playing" phase.
   * Ignored if the session is currently showing feedback or the
   * celebration screen. Delegates to the session store's
   * `submitAnswer`, which evaluates correctness and updates FSRS state.
   */
  const handleKeyPress = async (note: Note) => {
    if (phase !== "playing") return;
    await submitAnswer(note);
  };

  /** Called when the feedback overlay's animation finishes; advances to the next card. */
  const handleFeedbackComplete = () => {
    advanceToNext();
  };

  /** Called when the celebration animation finishes; persists session data and returns home. */
  const handleCelebrationDone = async () => {
    await endSession();
    navigate("/");
  };

  /** Quit button handler: persists the current (incomplete) session and returns home. */
  const handleQuit = async () => {
    await endSession();
    navigate("/");
  };

  // Show a loading indicator until both stores are hydrated.
  if (!settingsLoaded || !cardsLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-muted text-lg animate-pulse">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      {/* StarField background with parallax: as the player progresses
          (0 -> 1), stars shift upward to simulate forward motion. */}
      <StarField parallaxOffset={progression} />

      {/* Progress track -- horizontal bar showing how close the rocket
          is to the Moon (session goal). Sits at the very top. */}
      <div
        className="relative z-10 flex-shrink-0"
        style={{ padding: "20px 32px 8px" }}
      >
        <ProgressionBar progress={progression} />
      </div>

      {/* Staff area — fills space between progress and keyboard */}
      <div className="relative z-10 flex-1 flex items-center justify-center min-h-0" style={{ padding: "0 32px" }}>
        <StaffDisplay note={currentNote} />

        {/* Buttons — absolutely positioned, vertically centered on the right */}
        <div
          className="absolute flex flex-col items-center gap-3"
          style={{ right: 16, top: "50%", transform: "translateY(-50%)" }}
        >
          <IconButton onClick={handleQuit} label="Quit">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white" opacity="0.8">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
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

      {/* Spacer to push keyboard lower */}
      <div style={{ height: 24 }} />

      {/* Piano keyboard — full width at bottom */}
      <div className="relative z-10 flex-shrink-0">
        <PianoKeyboard
          onKeyPress={handleKeyPress}
          disabled={phase !== "playing"}
        />
      </div>

      {/* Feedback overlay -- shown briefly after each answer.
          Displays a correct/incorrect indicator, then auto-dismisses
          via onComplete callback to advance to the next card. */}
      {phase === "feedback" && (
        <FeedbackOverlay
          correct={lastAnswerCorrect}
          onComplete={handleFeedbackComplete}
        />
      )}

      {/* Celebration overlay -- shown when the session goal is reached.
          Renders a full-screen animation with the final score.
          totalCount includes both correct and incorrect attempts. */}
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
