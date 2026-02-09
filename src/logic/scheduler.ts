import {
  fsrs,
  generatorParameters,
  createEmptyCard,
  Rating,
  type Card as FSRSCard,
} from "ts-fsrs";
import type { AppCard, NoteId } from "../types";

/** Child-tuned FSRS parameters for a 5-year-old learner. */
const params = generatorParameters({
  request_retention: 0.95,
  maximum_interval: 30,
  enable_fuzz: true,
  enable_short_term: true,
});

const scheduler = fsrs(params);

/** Create a new FSRS card for a note. */
export function createCard(noteId: NoteId): AppCard {
  const base = createEmptyCard(new Date());
  return { ...base, noteId };
}

/** Review a card after the learner answers. Returns the updated card. */
export function reviewCard(card: AppCard, correct: boolean): AppCard {
  const now = new Date();
  const rating = correct ? Rating.Good : Rating.Again;
  const result = scheduler.next(card, now, rating);
  return { ...result.card, noteId: card.noteId };
}

/**
 * Pick the next card to show based on FSRS scheduling.
 * Cards due soonest come first; new cards mixed in.
 * Limits new cards to ~2 per session via newCardsSeen count.
 */
export function selectNextCard(
  cards: AppCard[],
  newCardsSeenThisSession: number,
  maxNewPerSession: number = 2,
): AppCard | null {
  if (cards.length === 0) return null;

  const now = new Date();

  // Separate due cards and new cards
  const dueCards = cards
    .filter((c) => c.state !== 0 && c.due.getTime() <= now.getTime())
    .sort((a, b) => a.due.getTime() - b.due.getTime());

  const newCards = cards.filter((c) => c.state === 0);

  // Prefer due cards first
  if (dueCards.length > 0) return dueCards[0];

  // Then introduce new cards if under the limit
  if (newCards.length > 0 && newCardsSeenThisSession < maxNewPerSession) {
    return newCards[0];
  }

  // If no due cards and new limit reached, pick any card sorted by due date
  const sorted = [...cards].sort(
    (a, b) => a.due.getTime() - b.due.getTime(),
  );
  return sorted[0];
}

export { scheduler, Rating };
export type { FSRSCard };
