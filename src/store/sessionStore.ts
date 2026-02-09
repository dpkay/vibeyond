/**
 * @file sessionStore.ts — Zustand store that drives the core gameplay loop.
 *
 * A "session" is one play-through: the child sees notes on the staff, taps
 * piano keys, and a rocket progresses toward the Moon with each correct
 * answer. This store owns the entire lifecycle of that loop:
 *
 *   idle --> playing --> feedback --> playing --> ... --> complete
 *                                                  \--> idle (early quit)
 *
 * **Phase machine:**
 * - `idle`     — No active session. The HomeScreen is shown.
 * - `playing`  — A note is displayed on the staff; waiting for a key press.
 * - `feedback` — The answer has been evaluated and a brief correct/incorrect
 *                animation is playing before the next note is shown.
 * - `complete` — The child reached the required number of correct answers;
 *                the celebration screen is displayed.
 *
 * **Cross-store dependencies:**
 * - Reads FSRS cards from {@link useCardStore} to select the next prompt and
 *   to persist updated scheduling metadata after each review.
 * - Reads `sessionLength` from {@link useSettingsStore} to determine when the
 *   session is complete and to compute the progression percentage.
 *
 * **Persistence:** Completed (and early-quit) sessions are persisted to the
 * `sessions` IndexedDB table via Dexie for future analytics. The in-flight
 * session itself is *not* persisted — if the app crashes mid-session the
 * child simply starts a new one. Individual card reviews *are* persisted
 * immediately via the card store, so FSRS state is never lost.
 */

import { create } from "zustand";
import type { AppCard, Challenge, Note, Session } from "../types";
import { evaluateAnswer } from "../logic/evaluate";
import { reviewCard, selectNextCard } from "../logic/scheduler";
import {
  calculateProgression,
  isSessionComplete,
} from "../logic/progression";
import { noteFromId } from "../logic/noteUtils";
import { useCardStore } from "./cardStore";
import { useSettingsStore } from "./settingsStore";
import { db } from "../db/db";

/**
 * The four phases of the session lifecycle.
 *
 * Transitions: idle -> playing -> feedback -> playing -> ... -> complete | idle
 */
type SessionPhase = "idle" | "playing" | "feedback" | "complete";

/**
 * Shape of the session Zustand store.
 *
 * @property session - The active {@link Session} record, or `null` when idle.
 *   Accumulates every challenge attempted during this play-through.
 * @property currentCard - The FSRS card for the note currently displayed on
 *   the staff, or `null` when no session is active.
 * @property phase - Current point in the session lifecycle state machine.
 * @property progression - A 0--1 float representing how far the rocket has
 *   traveled. Computed as `(correct - incorrect) / sessionLength`, clamped.
 *   Incorrect answers push the rocket backward, which adds a gentle stakes
 *   element without harsh punishment.
 * @property lastAnswerCorrect - `true`/`false` after the most recent answer
 *   (drives the feedback animation), or `null` before any answer is given.
 * @property newCardsSeen - How many never-before-reviewed cards have been
 *   introduced this session. The FSRS scheduler uses this to cap new-card
 *   introductions (default 2 per session) so the child is not overwhelmed.
 * @property startSession - Begin a new session and select the first card.
 * @property submitAnswer - Evaluate a key press, update FSRS, and advance
 *   the session state.
 * @property advanceToNext - Move from the feedback phase to the next prompt.
 * @property endSession - Persist and tear down the session (early quit or
 *   post-celebration cleanup).
 */
interface SessionState {
  session: Session | null;
  currentCard: AppCard | null;
  phase: SessionPhase;
  progression: number;
  lastAnswerCorrect: boolean | null;
  newCardsSeen: number;

  startSession: () => void;
  submitAnswer: (responseNote: Note) => Promise<void>;
  advanceToNext: () => void;
  endSession: () => Promise<void>;
}

/**
 * Generate a unique session ID.
 *
 * Combines a millisecond timestamp with a short random suffix to produce IDs
 * that are both sortable by creation time and collision-resistant, without
 * pulling in a UUID library.
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  currentCard: null,
  phase: "idle",
  progression: 0,
  lastAnswerCorrect: null,
  newCardsSeen: 0,

  /**
   * Initialize a new session and transition to the `playing` phase.
   *
   * Creates a fresh {@link Session} record, asks the FSRS scheduler to pick
   * the first card from the current card pool, and resets all session-scoped
   * counters (progression, newCardsSeen, etc.).
   *
   * If the selected first card has FSRS state 0 (New — never reviewed), it
   * is counted toward the new-card cap immediately so the scheduler knows
   * one introduction slot has been used.
   */
  startSession: () => {
    const session: Session = {
      id: generateId(),
      startedAt: new Date(),
      completedAt: null,
      challenges: [],
      totalCorrect: 0,
      totalIncorrect: 0,
      completed: false,
    };

    const { cards } = useCardStore.getState();
    const nextCard = selectNextCard(cards, 0);

    set({
      session,
      currentCard: nextCard,
      phase: "playing",
      progression: 0,
      lastAnswerCorrect: null,
      newCardsSeen: nextCard?.state === 0 ? 1 : 0,
    });
  },

  /**
   * Process the child's answer to the current challenge.
   *
   * This is the most complex action in the store. In order, it:
   * 1. Decodes the prompt note from the current card's `noteId`.
   * 2. Compares the response note to the prompt (enharmonic-aware).
   * 3. Builds a {@link Challenge} record and appends it to the session.
   * 4. Runs the FSRS review algorithm on the current card (`Rating.Good` for
   *    correct, `Rating.Again` for incorrect) and persists the updated card
   *    to IndexedDB via the card store.
   * 5. Recalculates the rocket's progression percentage.
   * 6. Checks whether the session is now complete (enough correct answers).
   *    If so, marks the session as completed and persists it to IndexedDB.
   * 7. Transitions the phase to either `feedback` (more to go) or `complete`
   *    (celebration time).
   *
   * The FSRS card update is `await`ed before the state transition so that,
   * if the child answers rapidly, the next card selection will always see up-
   * to-date scheduling data.
   *
   * @param responseNote - The {@link Note} corresponding to the piano key the
   *   child pressed.
   */
  submitAnswer: async (responseNote: Note) => {
    const { session, currentCard, newCardsSeen } = get();
    if (!session || !currentCard) return;

    const promptNote = noteFromId(currentCard.noteId);
    const { correct } = evaluateAnswer(promptNote, responseNote);

    const challenge: Challenge = {
      promptNote,
      responseNote,
      correct,
      responseTimeMs: null,
      timestamp: new Date(),
    };

    const updatedSession: Session = {
      ...session,
      challenges: [...session.challenges, challenge],
      totalCorrect: session.totalCorrect + (correct ? 1 : 0),
      totalIncorrect: session.totalIncorrect + (correct ? 0 : 1),
    };

    // Update FSRS card
    const updatedCard = reviewCard(currentCard, correct);
    await useCardStore.getState().updateCard(updatedCard);

    const { sessionLength } = useSettingsStore.getState().settings;
    const prog = calculateProgression(
      updatedSession.totalCorrect,
      updatedSession.totalIncorrect,
      sessionLength,
    );

    const complete = isSessionComplete(
      updatedSession.totalCorrect,
      sessionLength,
    );

    if (complete) {
      updatedSession.completed = true;
      updatedSession.completedAt = new Date();
      await db.sessions.put(updatedSession);
    }

    set({
      session: updatedSession,
      progression: prog,
      lastAnswerCorrect: correct,
      phase: complete ? "complete" : "feedback",
      newCardsSeen:
        currentCard.state === 0 ? newCardsSeen : newCardsSeen,
    });
  },

  /**
   * Transition from the `feedback` phase to `playing` with a new card.
   *
   * Called after the correct/incorrect feedback animation has finished. Asks
   * the FSRS scheduler to pick the next card, passing the running
   * `newCardsSeen` count so the scheduler can enforce its per-session cap on
   * newly-introduced notes.
   *
   * If the selected card is a New card (state 0), the `newCardsSeen` counter
   * is incremented so subsequent selections respect the limit.
   */
  advanceToNext: () => {
    const { newCardsSeen } = get();
    const { cards } = useCardStore.getState();
    const nextCard = selectNextCard(cards, newCardsSeen);

    const updatedNewSeen =
      nextCard?.state === 0 ? newCardsSeen + 1 : newCardsSeen;

    set({
      currentCard: nextCard,
      phase: "playing",
      lastAnswerCorrect: null,
      newCardsSeen: updatedNewSeen,
    });
  },

  /**
   * Persist the session to IndexedDB and reset all state back to `idle`.
   *
   * Used both for early quits (child or parent presses "stop") and for
   * post-celebration cleanup. If a session exists, it is saved with a
   * `completedAt` timestamp regardless of whether it was fully completed,
   * so that analytics can distinguish completed sessions from abandoned ones
   * by checking the `completed` boolean.
   *
   * After persisting, every piece of session state is reset to its initial
   * value so the store is ready for the next `startSession()` call.
   */
  endSession: async () => {
    const { session } = get();
    if (session) {
      const final = { ...session, completedAt: new Date() };
      await db.sessions.put(final);
    }
    set({
      session: null,
      currentCard: null,
      phase: "idle",
      progression: 0,
      lastAnswerCorrect: null,
      newCardsSeen: 0,
    });
  },
}));
