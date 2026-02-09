import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { State } from "ts-fsrs";
import { useCardStore } from "../store/cardStore";
import { noteFromId, noteToId, noteToString, noteToSemitone } from "../logic/noteUtils";
import { db } from "../db/db";
import { StarField } from "../components/StarField";
import type { AppCard, Session, NoteId } from "../types";

type SortMode = "note" | "state" | "success";

const STATE_LABELS: Record<number, string> = {
  [State.New]: "New",
  [State.Learning]: "Learning",
  [State.Review]: "Review",
  [State.Relearning]: "Relearning",
};

const STATE_COLORS: Record<number, string> = {
  [State.New]: "#8890a8",
  [State.Learning]: "#60a5fa",
  [State.Review]: "#34d399",
  [State.Relearning]: "#fb923c",
};

interface NoteStats {
  attempts: number;
  correct: number;
}

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

function dueLabel(due: Date): string {
  const now = Date.now();
  const diff = due.getTime() - now;
  if (diff <= 0) return "due now";
  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours < 24) return `in ${hours}h`;
  const days = Math.round(hours / 24);
  return `in ${days}d`;
}

function noteOrderValue(noteId: NoteId): number {
  return noteToSemitone(noteFromId(noteId));
}

export function CardInspectorScreen() {
  const navigate = useNavigate();
  const { cards } = useCardStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("note");

  useEffect(() => {
    db.sessions.toArray().then(setSessions);
  }, []);

  const noteStats = useMemo(() => computeNoteStats(sessions), [sessions]);

  const stateCounts = useMemo(() => {
    const counts = { [State.New]: 0, [State.Learning]: 0, [State.Review]: 0, [State.Relearning]: 0 };
    for (const card of cards) {
      counts[card.state as number] = (counts[card.state as number] || 0) + 1;
    }
    return counts;
  }, [cards]);

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

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center px-5 py-4">
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
          <h1 className="flex-1 text-center font-display font-extrabold text-white text-2xl mr-11">
            Card Inspector
          </h1>
        </div>

        {/* Summary bar */}
        <div className="px-5 pb-4">
          <div
            className="rounded-2xl p-4 backdrop-blur-sm"
            style={{
              background: "rgba(37,43,74,0.5)",
              border: "1px solid #363d5c",
            }}
          >
            <div className="text-white font-display font-extrabold text-lg mb-3">
              {cards.length} cards total
            </div>
            <div className="flex flex-wrap gap-2">
              {([State.New, State.Learning, State.Review, State.Relearning] as number[]).map((state) => (
                <span
                  key={state}
                  className="px-3 py-1 rounded-full text-sm font-semibold"
                  style={{
                    background: `${STATE_COLORS[state]}20`,
                    color: STATE_COLORS[state],
                  }}
                >
                  {stateCounts[state]} {STATE_LABELS[state]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sort controls */}
        <div className="flex gap-2 px-5 pb-3">
          {(["note", "state", "success"] as SortMode[]).map((mode) => (
            <button
              key={mode}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
              style={
                sortMode === mode
                  ? { background: "rgba(251,191,36,0.2)", color: "#FBBF24" }
                  : { background: "rgba(42,48,80,0.5)", color: "#8890a8" }
              }
              onClick={() => setSortMode(mode)}
            >
              {mode === "note" ? "Note" : mode === "state" ? "State" : "Success %"}
            </button>
          ))}
        </div>

        {/* Card list */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <div className="flex flex-col gap-1.5">
            {sortedCards.map((card) => (
              <CardRow key={card.noteId} card={card} stats={noteStats.get(card.noteId)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CardRow({ card, stats }: { card: AppCard; stats?: NoteStats }) {
  const note = noteFromId(card.noteId);
  const name = noteToString(note);
  const stateNum = card.state as number;
  const successRate =
    stats && stats.attempts > 0
      ? Math.round((stats.correct / stats.attempts) * 100)
      : null;

  return (
    <div
      className="flex items-center rounded-xl px-4 py-3"
      style={{
        background: "rgba(37,43,74,0.35)",
        border: "1px solid rgba(54,61,92,0.5)",
      }}
    >
      {/* Note name */}
      <span className="font-display font-extrabold text-white text-lg w-14">
        {name}
      </span>

      {/* State badge */}
      <span
        className="px-2.5 py-0.5 rounded-full text-xs font-semibold mr-auto"
        style={{
          background: `${STATE_COLORS[stateNum]}20`,
          color: STATE_COLORS[stateNum],
        }}
      >
        {STATE_LABELS[stateNum]}
      </span>

      {/* Reps */}
      <span className="text-muted text-sm w-16 text-right">
        {card.reps} reps
      </span>

      {/* Success rate */}
      <span
        className="text-sm font-semibold w-14 text-right"
        style={{
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
      <span className="text-muted text-xs w-16 text-right">
        {dueLabel(new Date(card.due))}
      </span>
    </div>
  );
}
