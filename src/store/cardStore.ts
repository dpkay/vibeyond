/**
 * @file cardStore.ts — Zustand store for FSRS spaced-repetition cards.
 *
 * Every note that can appear as a challenge is backed by an {@link AppCard},
 * which wraps the standard ts-fsrs `Card` type with a `noteId` key (e.g.,
 * `"treble:C:natural:4"`). The FSRS algorithm uses each card's scheduling
 * metadata (`due`, `stability`, `difficulty`, `state`, etc.) to decide when
 * the note should next be reviewed and how to update the card after a review.
 *
 * **Persistence:** Cards are stored in the `cards` IndexedDB table (via Dexie)
 * and keyed by `noteId`. The in-memory array is a mirror of that table,
 * reloaded whenever cards are created or modified.
 *
 * **Initialization flow:**
 * 1. Call {@link CardState.loadCards} to hydrate the in-memory array from
 *    IndexedDB.
 * 2. Call {@link CardState.ensureCardsForRange} to create any missing cards
 *    for the current challenge range and enabled clefs. This is idempotent ---
 *    existing cards are left untouched so their FSRS history is preserved.
 *
 * **Cross-store dependency:** `ensureCardsForRange` reads the current
 * `challengeRange` and `enabledClefs` from {@link useSettingsStore}, so
 * settings must be loaded first.
 */

import { create } from "zustand";
import type { AppCard } from "../types";
import { db } from "../db/db";
import { createCard } from "../logic/scheduler";
import { noteToId, noteRange } from "../logic/noteUtils";
import { useSettingsStore } from "./settingsStore";

/**
 * Shape of the card Zustand store.
 *
 * @property cards - In-memory mirror of all FSRS cards from IndexedDB.
 *   Each element is an {@link AppCard} with fully hydrated `Date` fields.
 * @property loaded - `true` once the initial load from IndexedDB has finished.
 *   The session store should not attempt to select a card until this is `true`.
 * @property loadCards - Reads all cards from IndexedDB into memory, converting
 *   serialized date strings back to `Date` objects.
 * @property ensureCardsForRange - Idempotent card seeder: creates new FSRS
 *   cards for every note in the current challenge range that does not already
 *   have one.
 * @property updateCard - Persists an updated card to IndexedDB and patches the
 *   in-memory array. Called after each FSRS review.
 */
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

  /**
   * Hydrate the in-memory card array from IndexedDB.
   *
   * Dexie may store `Date` fields as ISO strings depending on the storage
   * backend, so every card's `due` and `last_review` are explicitly wrapped
   * in `new Date()` to guarantee they are real `Date` objects. This prevents
   * subtle bugs in FSRS scheduling and date comparisons downstream.
   */
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

  /**
   * Ensure every note in the configured challenge range has a corresponding
   * FSRS card in IndexedDB, creating new cards only where none exist.
   *
   * This is the bridge between the parent's settings and the spaced-repetition
   * system: when the parent widens the challenge range or enables bass clef,
   * calling this method seeds fresh cards for the newly-included notes without
   * disturbing the scheduling history of existing cards.
   *
   * After creating any missing cards, the in-memory array is reloaded from
   * the database to pick up the additions.
   *
   * **Note:** This reads `challengeRange` and `enabledClefs` from the
   * settings store at call time, so {@link useSettingsStore} must already be
   * loaded.
   */
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

  /**
   * Persist an updated card to IndexedDB and patch the in-memory array.
   *
   * Called by the session store after each answer is submitted and the FSRS
   * algorithm produces an updated card (with new `due`, `stability`,
   * `difficulty`, `reps`, etc.). The database write happens first; the
   * in-memory update is a map-replace by `noteId` so that other components
   * (e.g., the scheduler in `selectNextCard`) immediately see the latest
   * scheduling state without a full reload.
   *
   * @param card - The fully-updated {@link AppCard} to persist and store.
   */
  updateCard: async (card: AppCard) => {
    await db.cards.put(card);
    set((state) => ({
      cards: state.cards.map((c) => (c.noteId === card.noteId ? card : c)),
    }));
  },
}));
