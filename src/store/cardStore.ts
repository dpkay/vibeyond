import { create } from "zustand";
import type { AppCard } from "../types";
import { db } from "../db/db";
import { createCard } from "../logic/scheduler";
import { noteToId, noteRange } from "../logic/noteUtils";
import { useSettingsStore } from "./settingsStore";

interface CardState {
  cards: AppCard[];
  loaded: boolean;
  loadCards: () => Promise<void>;
  ensureCardsForRange: () => Promise<void>;
  updateCard: (card: AppCard) => Promise<void>;
}

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  loaded: false,

  loadCards: async () => {
    const cards = await db.cards.toArray();
    // Ensure dates are Date objects (Dexie may serialize as strings)
    const parsed = cards.map((c) => ({
      ...c,
      due: new Date(c.due),
      last_review: c.last_review ? new Date(c.last_review) : undefined,
    }));
    set({ cards: parsed, loaded: true });
  },

  ensureCardsForRange: async () => {
    const { settings } = useSettingsStore.getState();
    const { minNote, maxNote } = settings.challengeRange;

    for (const clef of settings.enabledClefs) {
      const notes = noteRange(
        { ...minNote, clef },
        { ...maxNote, clef },
        clef,
      );
      for (const note of notes) {
        const id = noteToId(note);
        const existing = await db.cards.get(id);
        if (!existing) {
          const card = createCard(id);
          await db.cards.put(card);
        }
      }
    }

    // Reload after ensuring
    await get().loadCards();
  },

  updateCard: async (card: AppCard) => {
    await db.cards.put(card);
    set((state) => ({
      cards: state.cards.map((c) => (c.noteId === card.noteId ? card : c)),
    }));
  },
}));
