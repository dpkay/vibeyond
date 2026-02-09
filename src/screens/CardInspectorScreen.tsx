/**
 * @file CardInspectorScreen.tsx -- Developer/parent FSRS card browser.
 *
 * This screen (route `/cards`) provides a detailed view of every FSRS
 * flashcard in the system. It is reached from the "Card Inspector"
 * tile on the `ParentSettingsScreen`.
 *
 * **What it shows:**
 * - A summary row with total card count and per-state breakdowns
 *   (New / Learning / Review / Relearning), each color-coded.
 * - A sortable 2-column grid where each tile shows:
 *   - Note name (e.g. "C4", "F#5").
 *   - FSRS state badge (color-coded).
 *   - Total reps completed.
 *   - Historical success rate percentage (green/amber/red).
 *   - Time until next review is due.
 * - Three sort modes: by pitch (semitone order), by FSRS state, or
 *   by success rate (ascending, so struggling notes appear first).
 *
 * **Key state:**
 * - `cards` from `useCardStore` (Zustand, already hydrated by `AppLoader`).
 * - `sessions` loaded directly from IndexedDB on mount to compute
 *   per-note accuracy statistics.
 * - `sortMode` (local) controls the current sort order.
 *
 * **Navigation:**
 * - Back arrow  -->  `/settings` (ParentSettingsScreen).
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { State } from "ts-fsrs";
import { useCardStore } from "../store/cardStore";
import { noteFromId, noteToId, noteToString, noteToSemitone } from "../logic/noteUtils";
import { db } from "../db/db";
import { StarField } from "../components/StarField";
import type { AppCard, Session, NoteId } from "../types";

/** The three available sort modes for the card grid. */
type SortMode = "note" | "state" | "success";

/** Human-readable labels for each FSRS card state. */
const STATE_LABELS: Record<number, string> = {
  [State.New]: "New",
  [State.Learning]: "Learning",
  [State.Review]: "Review",
  [State.Relearning]: "Relearning",
};

/**
 * Color tokens for each FSRS state, used for badge backgrounds and text.
 * - New: muted gray (hasn't been seen yet).
 * - Learning: blue (actively being learned).
 * - Review: green (graduated to spaced review).
 * - Relearning: orange (lapsed, being re-learned).
 */
const STATE_COLORS: Record<number, string> = {
  [State.New]: "#8890a8",
  [State.Learning]: "#60a5fa",
  [State.Review]: "#34d399",
  [State.Relearning]: "#fb923c",
};

/** Aggregated accuracy statistics for a single note. */
interface NoteStats {
  attempts: number;
  correct: number;
}

/**
 * Aggregates per-note accuracy statistics from all historical sessions.
 *
 * Iterates every challenge in every session and tallies the number of
 * attempts and correct answers for each unique `NoteId`.
 *
 * @param sessions - All sessions loaded from IndexedDB.
 * @returns A map from NoteId to its cumulative NoteStats.
 */
function computeNoteStats(sessions: Session[]): Map<NoteId, NoteStats> {
  const stats = new Map<NoteId, NoteStats>();
  for (const session of sessions) {
    for (const challenge of session.challenges) {
      const id = noteToId(challenge.promptNote);
      const entry = stats.get(id) ?? { attempts: 0, correct: 0 };
      entry.attempts++;
      if (challenge.correct) entry.correct++;
      stats.set(id, entry);
    }
  }
  return stats;
}

/**
 * Formats a card's `due` date as a human-readable relative time string.
 *
 * @param due - The date when the card is next due for review.
 * @returns "due now" if overdue, "in Xh" if less than 24 hours, or "in Xd" otherwise.
 */
function dueLabel(due: Date): string {
  const now = Date.now();
  const diff = due.getTime() - now;
  if (diff <= 0) return "due now";
  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours < 24) return `in ${hours}h`;
  const days = Math.round(hours / 24);
  return `in ${days}d`;
}

/**
 * Converts a NoteId to a numeric semitone value for chromatic sorting.
 * Lower notes get lower values, enabling pitch-ascending sort order.
 */
function noteOrderValue(noteId: NoteId): number {
  return noteToSemitone(noteFromId(noteId));
}

/**
 * Card inspector screen component.
 *
 * Loads session history on mount to compute accuracy stats, then
 * renders a sortable grid of all FSRS cards with their state, reps,
 * success rate, and due date.
 */
export function CardInspectorScreen() {
  const navigate = useNavigate();
  const { cards } = useCardStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("note");

  /** Load all historical sessions from IndexedDB on mount for stats computation. */
  useEffect(() => {
    db.sessions.toArray().then(setSessions);
  }, []);

  /** Memoized per-note accuracy stats derived from session history. */
  const noteStats = useMemo(() => computeNoteStats(sessions), [sessions]);

  /** Memoized count of cards in each FSRS state for the summary badges. */
  const stateCounts = useMemo(() => {
    const counts = { [State.New]: 0, [State.Learning]: 0, [State.Review]: 0, [State.Relearning]: 0 };
    for (const card of cards) {
      counts[card.state as number] = (counts[card.state as number] || 0) + 1;
    }
    return counts;
  }, [cards]);

  /**
   * Memoized sorted copy of the cards array.
   *
   * Sort strategies:
   * - "note": chromatic pitch order (C2 -> B6) via semitone value.
   * - "state": FSRS state enum order (New=0, Learning=1, Review=2, Relearning=3).
   * - "success": ascending success rate so struggling notes appear first.
   *   Cards with no attempts sort to the top (rate = -1).
   */
  const sortedCards = useMemo(() => {
    const sorted = [...cards];
    switch (sortMode) {
      case "note":
        sorted.sort((a, b) => noteOrderValue(a.noteId) - noteOrderValue(b.noteId));
        break;
      case "state":
        sorted.sort((a, b) => (a.state as number) - (b.state as number));
        break;
      case "success":
        sorted.sort((a, b) => {
          const sa = noteStats.get(a.noteId);
          const sb = noteStats.get(b.noteId);
          const ra = sa && sa.attempts > 0 ? sa.correct / sa.attempts : -1;
          const rb = sb && sb.attempts > 0 ? sb.correct / sb.attempts : -1;
          return ra - rb;
        });
        break;
    }
    return sorted;
  }, [cards, sortMode, noteStats]);

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      <StarField />

      <div
        className="relative z-10 flex flex-col h-full"
        style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}
      >
        {/* Header */}
        <div
          className="flex items-center"
          style={{ padding: "20px 24px 16px" }}
        >
          <motion.button
            className="flex items-center justify-center rounded-full cursor-pointer"
            style={{
              width: 44,
              height: 44,
              background: "rgba(42,48,80,0.7)",
            }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/settings")}
            aria-label="Back"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </motion.button>
          <h1
            className="flex-1 text-center font-display font-extrabold text-white text-2xl"
            style={{ marginRight: 44 }}
          >
            Card Inspector
          </h1>
        </div>

        {/* Summary + Sort row */}
        <div
          className="flex items-center justify-between"
          style={{ padding: "0 24px 16px" }}
        >
          <div className="flex flex-wrap gap-2">
            <span className="text-white font-display font-extrabold text-lg" style={{ marginRight: 8 }}>
              {cards.length} cards
            </span>
            {([State.New, State.Learning, State.Review, State.Relearning] as number[]).map((state) => (
              <span
                key={state}
                className="rounded-full text-xs font-semibold"
                style={{
                  background: `${STATE_COLORS[state]}20`,
                  color: STATE_COLORS[state],
                  padding: "4px 12px",
                }}
              >
                {stateCounts[state]} {STATE_LABELS[state]}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            {(["note", "state", "success"] as SortMode[]).map((mode) => (
              <button
                key={mode}
                className="rounded-lg text-sm font-semibold cursor-pointer"
                style={{
                  padding: "4px 12px",
                  ...(sortMode === mode
                    ? { background: "rgba(251,191,36,0.2)", color: "#FBBF24" }
                    : { background: "rgba(42,48,80,0.5)", color: "#8890a8" }),
                }}
                onClick={() => setSortMode(mode)}
              >
                {mode === "note" ? "Note" : mode === "state" ? "State" : "Success %"}
              </button>
            ))}
          </div>
        </div>

        {/* Card grid — two columns */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: "0 24px 24px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            {sortedCards.map((card) => (
              <CardRow key={card.noteId} card={card} stats={noteStats.get(card.noteId)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A single card tile in the inspector grid.
 *
 * Displays the note name, FSRS state badge, rep count, historical
 * success rate (color-coded: green >= 80%, amber >= 50%, red < 50%),
 * and a relative due-date label.
 *
 * @param card - The FSRS AppCard to display.
 * @param stats - Optional aggregated accuracy stats for this note.
 *                Undefined if the note has never been practiced.
 */
function CardRow({ card, stats }: { card: AppCard; stats?: NoteStats }) {
  const note = noteFromId(card.noteId);
  const name = noteToString(note);
  const stateNum = card.state as number;
  /** Percentage success rate, or null if the note has never been attempted. */
  const successRate =
    stats && stats.attempts > 0
      ? Math.round((stats.correct / stats.attempts) * 100)
      : null;

  return (
    <div
      className="flex items-center rounded-xl"
      style={{
        background: "rgba(37,43,74,0.35)",
        border: "1px solid rgba(54,61,92,0.5)",
        padding: "10px 14px",
      }}
    >
      {/* Note name */}
      <span
        className="font-display font-extrabold text-white"
        style={{ fontSize: 16, width: 44 }}
      >
        {name}
      </span>

      {/* State badge */}
      <span
        className="rounded-full text-xs font-semibold"
        style={{
          background: `${STATE_COLORS[stateNum]}20`,
          color: STATE_COLORS[stateNum],
          padding: "2px 8px",
          marginRight: "auto",
        }}
      >
        {STATE_LABELS[stateNum]}
      </span>

      {/* Reps */}
      <span className="text-muted text-xs" style={{ width: 48, textAlign: "right" }}>
        {card.reps} reps
      </span>

      {/* Success rate */}
      <span
        className="text-xs font-semibold"
        style={{
          width: 36,
          textAlign: "right",
          color:
            successRate === null
              ? "#8890a8"
              : successRate >= 80
                ? "#34d399"
                : successRate >= 50
                  ? "#fbbf24"
                  : "#f87171",
        }}
      >
        {successRate !== null ? `${successRate}%` : "—"}
      </span>

      {/* Due status */}
      <span className="text-muted text-xs" style={{ width: 52, textAlign: "right" }}>
        {dueLabel(new Date(card.due))}
      </span>
    </div>
  );
}
