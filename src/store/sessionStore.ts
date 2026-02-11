import { create } from "zustand";
import type { AppCard, Challenge, MissionId, Note, Session } from "../types";
import { evaluateAnswer } from "../logic/evaluate";
import { reviewCard, selectNextCard } from "../logic/scheduler";
import {
  calculateProgression,
  isSessionComplete,
} from "../logic/progression";
import { noteFromId } from "../logic/noteUtils";
import { useCardStore } from "./cardStore";
import { useSettingsStore } from "./settingsStore";
import { resolveMission } from "../missions";
import { db } from "../db/db";

type SessionPhase = "idle" | "playing" | "feedback" | "complete";

interface SessionState {
  session: Session | null;
  currentCard: AppCard | null;
  phase: SessionPhase;
  progression: number;
  lastAnswerCorrect: boolean | null;
  newCardsSeen: number;
  missionId: MissionId | null;
  hintActive: boolean;
  hintUsedForCard: boolean;

  startSession: (missionId: MissionId) => void;
  submitAnswer: (responseNote: Note) => Promise<void>;
  advanceToNext: () => void;
  endSession: () => Promise<void>;
  useHint: () => void;
  dismissHint: () => void;
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
  missionId: null,
  hintActive: false,
  hintUsedForCard: false,

  startSession: (missionId: MissionId) => {
    const session: Session = {
      id: generateId(),
      missionId,
      startedAt: new Date(),
      completedAt: null,
      challenges: [],
      totalCorrect: 0,
      totalIncorrect: 0,
      score: 0,
      completed: false,
    };

    const { getCardsForMission } = useCardStore.getState();
    const cards = getCardsForMission(missionId);
    const nextCard = selectNextCard(cards, 0);

    set({
      session,
      missionId,
      currentCard: nextCard,
      phase: "playing",
      progression: 0,
      lastAnswerCorrect: null,
      newCardsSeen: nextCard?.state === 0 ? 1 : 0,
    });
  },

  submitAnswer: async (responseNote: Note) => {
    const { session, currentCard, newCardsSeen, missionId } = get();
    if (!session || !currentCard || !missionId) return;

    const mission = resolveMission(missionId);
    const promptNote = noteFromId(currentCard.noteId);

    // For animal-octaves, compare octave only; for staff missions use full eval
    let correct: boolean;
    if (mission.promptType === "animal") {
      correct = promptNote.octave === responseNote.octave;
    } else {
      correct = evaluateAnswer(promptNote, responseNote).correct;
    }

    const challenge: Challenge = {
      promptNote,
      responseNote,
      correct,
      responseTimeMs: null,
      timestamp: new Date(),
    };

    const newScore = correct
      ? session.score + 1
      : Math.max(0, session.score - 1);

    const updatedSession: Session = {
      ...session,
      challenges: [...session.challenges, challenge],
      totalCorrect: session.totalCorrect + (correct ? 1 : 0),
      totalIncorrect: session.totalIncorrect + (correct ? 0 : 1),
      score: newScore,
    };

    const updatedCard = reviewCard(currentCard, correct);
    await useCardStore.getState().updateCard(updatedCard);

    const { sessionLength } = useSettingsStore.getState().settings;
    const effectiveLength = sessionLength || mission.defaultSessionLength;
    const prog = calculateProgression(newScore, effectiveLength);
    const complete = isSessionComplete(newScore, effectiveLength);

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
    const { newCardsSeen, missionId } = get();
    if (!missionId) return;
    const { getCardsForMission } = useCardStore.getState();
    const cards = getCardsForMission(missionId);
    const nextCard = selectNextCard(cards, newCardsSeen);

    const updatedNewSeen =
      nextCard?.state === 0 ? newCardsSeen + 1 : newCardsSeen;

    set({
      currentCard: nextCard,
      phase: "playing",
      lastAnswerCorrect: null,
      newCardsSeen: updatedNewSeen,
      hintUsedForCard: false,
    });
  },

  useHint: () => {
    const { session, missionId, hintUsedForCard } = get();
    if (!session || !missionId) return;

    // Only deduct a point the first time hint is used per challenge
    const shouldDeduct = !hintUsedForCard;
    const newScore = shouldDeduct
      ? Math.max(0, session.score - 1)
      : session.score;
    const mission = resolveMission(missionId);
    const { sessionLength } = useSettingsStore.getState().settings;
    const effectiveLength = sessionLength || mission.defaultSessionLength;
    const prog = calculateProgression(newScore, effectiveLength);

    set({
      session: { ...session, score: newScore },
      progression: prog,
      hintActive: true,
      hintUsedForCard: true,
    });
  },

  dismissHint: () => {
    set({ hintActive: false });
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
      missionId: null,
      hintActive: false,
      hintUsedForCard: false,
    });
  },
}));
