/**
 * @file FSRS-based spaced-repetition scheduler for note flashcards.
 *
 * Wraps the `ts-fsrs` library with child-tuned parameters suitable for
 * a 5-year-old learner (high retention target, short maximum interval,
 * fuzzing enabled to avoid predictable sequences). Provides three main
 * operations:
 *
 * 1. **createCard** — mint a new FSRS card for a note entering the pool.
 * 2. **reviewCard** — update a card after the child answers (correct/incorrect).
 * 3. **selectNextCard** — pick the optimal next card from the pool based on
 *    due dates and new-card rate limiting.
 *
 * All functions are pure (they return new objects rather than mutating)
 * and have no dependency on stores or the database.
 */

import {
  fsrs,
  generatorParameters,
  createEmptyCard,
  Rating,
  type Card as FSRSCard,
} from "ts-fsrs";
import type { AppCard, MissionId, NoteId } from "../types";

/**
 * Child-tuned FSRS parameters for a 5-year-old learner.
 *
 * - `request_retention: 0.95` — aim for 95% recall (high, because young
 *   children need frequent reinforcement and frustration tolerance is low).
 * - `maximum_interval: 30` — cap review intervals at 30 days (the child
 *   may not use the app daily, so very long gaps would cause forgetting).
 * - `enable_fuzz: true` — add small random jitter to intervals so that
 *   reviews don't cluster on the same day.
 * - `enable_short_term: true` — use FSRS's short-term scheduling for new
 *   and learning cards (sub-day intervals).
 */
const params = generatorParameters({
  request_retention: 0.95,
  maximum_interval: 30,
  enable_fuzz: true,
  enable_short_term: true,
});

/** The configured FSRS scheduler instance. Exported for advanced use. */
const scheduler = fsrs(params);

/**
 * Create a new FSRS card for a note entering the learning pool.
 *
 * The card starts in state `New` (state === 0) with its `due` date set
 * to now, meaning it is immediately eligible for review. The returned
 * card includes our custom `noteId` field linking it to the note.
 *
 * @param noteId - The unique note identifier (e.g. `"treble:C:natural:4"`).
 * @returns A fresh {@link AppCard} ready to be stored in the database.
 */
export function cardId(missionId: MissionId, noteId: NoteId): string {
  return `${missionId}::${noteId}`;
}

export function createCard(noteId: NoteId, missionId: MissionId): AppCard {
  const base = createEmptyCard(new Date());
  return { ...base, id: cardId(missionId, noteId), noteId, missionId };
}

/**
 * Review a card after the child answers a challenge.
 *
 * Maps the boolean `correct` to an FSRS rating:
 * - `true`  -> `Rating.Good` (the child knew it — advance the interval).
 * - `false` -> `Rating.Again` (the child missed it — reset to short-term).
 *
 * We intentionally use only two ratings (Good/Again) rather than the full
 * four-point scale because a 5-year-old's answer is binary: either they
 * pressed the right key or they didn't.
 *
 * @param card - The current card state before the review.
 * @param correct - Whether the child's answer was correct.
 * @returns A new {@link AppCard} with updated FSRS scheduling fields.
 */
export function reviewCard(card: AppCard, correct: boolean): AppCard {
  const now = new Date();
  const rating = correct ? Rating.Good : Rating.Again;
  const result = scheduler.next(card, now, rating);
  return { ...result.card, id: card.id, noteId: card.noteId, missionId: card.missionId };
}

/**
 * Select the next card to present from the available pool.
 *
 * Selection priority:
 * 1. **Due cards** — cards in states Learning/Review/Relearning whose
 *    `due` date has passed. Sorted earliest-due first.
 * 2. **New cards** — cards in state New (state === 0), introduced at a
 *    controlled rate (`maxNewPerSession`) to avoid overwhelming the child.
 * 3. **Fallback** — if no due cards remain and the new-card cap is reached,
 *    pick whichever card is due soonest (even if still in the future). This
 *    ensures the session never stalls.
 *
 * @param cards - The full pool of AppCards to choose from.
 * @param newCardsSeenThisSession - How many new (state === 0) cards have
 *   already been introduced in the current session. Used to enforce the
 *   new-card rate limit.
 * @param maxNewPerSession - Maximum number of brand-new cards to introduce
 *   per session. Defaults to 2 to keep cognitive load manageable.
 * @returns The next {@link AppCard} to present, or `null` if the pool is empty.
 */
/**
 * Pick a random element from an array.
 * Used to break ties when multiple cards have the same priority.
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function selectNextCard(
  cards: AppCard[],
  newCardsSeenThisSession: number,
  maxNewPerSession: number = 2,
): AppCard | null {
  if (cards.length === 0) return null;

  const now = new Date();

  // Separate due cards (non-new cards whose due date has passed) from new cards
  const dueCards = cards
    .filter((c) => c.state !== 0 && c.due.getTime() <= now.getTime())
    .sort((a, b) => a.due.getTime() - b.due.getTime());

  const newCards = cards.filter((c) => c.state === 0);

  // Priority 1: review cards that are already due — pick randomly among
  // the most-overdue cards (those due within 1 minute of the earliest)
  if (dueCards.length > 0) {
    const earliest = dueCards[0].due.getTime();
    const similar = dueCards.filter(
      (c) => c.due.getTime() - earliest < 60_000,
    );
    return pickRandom(similar);
  }

  // Priority 2: introduce a random new card if the per-session cap allows
  if (newCards.length > 0 && newCardsSeenThisSession < maxNewPerSession) {
    return pickRandom(newCards);
  }

  // Fallback: no due cards and new-card limit reached — pick randomly among
  // the soonest-due cards so the session doesn't stall
  const sorted = [...cards].sort(
    (a, b) => a.due.getTime() - b.due.getTime(),
  );
  const soonest = sorted[0].due.getTime();
  const similar = sorted.filter(
    (c) => c.due.getTime() - soonest < 60_000,
  );
  return pickRandom(similar);
}

export { scheduler, Rating };
export type { FSRSCard };
