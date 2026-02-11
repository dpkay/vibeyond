/**
 * @file Dexie (IndexedDB) database setup for offline-first persistence.
 *
 * Vibeyond stores all data locally on the device — there is no server.
 * This module defines the database schema, creates the singleton `db`
 * instance, and exports it for use by the Zustand stores.
 *
 * ### Tables
 *
 * | Table      | Primary Key | Indexed Fields    | Purpose                                  |
 * |------------|-------------|-------------------|------------------------------------------|
 * | `cards`    | `noteId`    | `due`, `state`    | FSRS flashcard state for each note       |
 * | `sessions` | `id`        | `startedAt`       | Completed and in-progress practice runs  |
 * | `settings` | `key`       | —                 | Key-value store for parent settings      |
 *
 * ### Migration strategy
 *
 * Currently at version 1 (initial schema). When the schema changes,
 * add a new `db.version(N).stores({...}).upgrade(...)` block **below**
 * the existing version — Dexie handles forward migration automatically.
 */

import Dexie, { type EntityTable } from "dexie";
import type { AppCard, Session } from "../types";

/**
 * A single row in the `settings` table.
 *
 * Settings are stored as serialized JSON strings keyed by a human-readable
 * name (e.g. `"noteRange"`, `"sessionLength"`). This simple key-value
 * approach avoids schema changes when new settings are added.
 */
interface SettingsRow {
  /** The setting name, e.g. `"noteRange"` or `"enabledClefs"`. Also the primary key. */
  key: string;

  /** The setting value, serialized as a JSON string. */
  value: string;
}

/**
 * The singleton Dexie database instance.
 *
 * Typed with `EntityTable` generics so that `db.cards`, `db.sessions`,
 * and `db.settings` have full TypeScript support for put/get/where etc.
 */
const db = new Dexie("VibeyondDB") as Dexie & {
  cards: EntityTable<AppCard, "id">;
  sessions: EntityTable<Session, "id">;
  settings: EntityTable<SettingsRow, "key">;
};

/**
 * Version 1 — initial schema.
 *
 * Index design rationale:
 * - `cards`: indexed on `due` (for "which cards are due now?" queries) and
 *   `state` (for separating new vs. learning vs. review cards).
 * - `sessions`: indexed on `startedAt` for chronological listing.
 * - `settings`: primary key only — small table, no queries beyond key lookup.
 */
// Version 1 was the pre-mission schema (cards keyed by noteId).
// Version 2 changes the cards PK to a compound id (missionId::noteId).
// Dexie cannot change primary keys, so we delete old cards in the upgrade.
db.version(1).stores({
  cards: "noteId, due, state",
  sessions: "id, startedAt",
  settings: "key",
});

db.version(2)
  .stores({
    cards: "id, noteId, missionId, due, state",
    sessions: "id, missionId, startedAt",
    settings: "key",
  })
  .upgrade((tx) => {
    // Wipe old cards — they lack missionId and have the wrong PK.
    // Fresh cards will be seeded by ensureCardsForMission on next session start.
    return tx.table("cards").clear();
  });

export { db };
export type { SettingsRow };
