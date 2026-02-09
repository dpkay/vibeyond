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

type SessionPhase = "idle" | "playing" | "feedback" | "complete";

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
