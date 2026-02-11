import { create } from "zustand";
import type { AppCard, MissionId } from "../types";
import { db } from "../db/db";
import { createCard, cardId } from "../logic/scheduler";
import { noteToId, noteRange } from "../logic/noteUtils";
import { resolveMission } from "../missions";

interface CardState {
  cards: AppCard[];
  loaded: boolean;
  loadCards: () => Promise<void>;
  ensureCardsForMission: (missionId: MissionId) => Promise<void>;
  getCardsForMission: (missionId: MissionId) => AppCard[];
  updateCard: (card: AppCard) => Promise<void>;
}

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  loaded: false,

  loadCards: async () => {
    const cards = await db.cards.toArray();
    const parsed = cards.map((c) => ({
      ...c,
      due: new Date(c.due),
      last_review: c.last_review ? new Date(c.last_review) : undefined,
    }));
    set({ cards: parsed, loaded: true });
  },

  ensureCardsForMission: async (missionId: MissionId) => {
    const mission = resolveMission(missionId);
    const { minNote, maxNote } = mission.challengeRange;

    if (missionId === "animal-octaves") {
      // One card per octave: C2, C3, C4, C5
      const octaves = [2, 3, 4, 5];
      for (const octave of octaves) {
        const note = { pitch: "C" as const, accidental: "natural" as const, octave, clef: "treble" as const };
        const noteKey = noteToId(note);
        const compoundId = cardId(missionId, noteKey);
        const existing = await db.cards.get(compoundId);
        if (!existing) {
          const card = createCard(noteKey, missionId);
          await db.cards.put(card);
        }
      }
    } else {
      for (const clef of mission.enabledClefs) {
        const notes = noteRange(
          { ...minNote, clef },
          { ...maxNote, clef },
          clef,
        );
        const filtered = mission.includeAccidentals
          ? notes
          : notes.filter((n) => n.accidental === "natural");
        for (const note of filtered) {
          const noteKey = noteToId(note);
          const compoundId = cardId(missionId, noteKey);
          const existing = await db.cards.get(compoundId);
          if (!existing) {
            const card = createCard(noteKey, missionId);
            await db.cards.put(card);
          }
        }
      }
    }

    await get().loadCards();
  },

  getCardsForMission: (missionId: MissionId) => {
    return get().cards.filter((c) => c.missionId === missionId);
  },

  updateCard: async (card: AppCard) => {
    await db.cards.put(card);
    set((state) => ({
      cards: state.cards.map((c) => (c.id === card.id ? card : c)),
    }));
  },
}));
