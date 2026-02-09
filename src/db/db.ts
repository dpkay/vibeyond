import Dexie, { type EntityTable } from "dexie";
import type { AppCard, Session } from "../types";

interface SettingsRow {
  key: string;
  value: string;
}

const db = new Dexie("VibeyondDB") as Dexie & {
  cards: EntityTable<AppCard, "noteId">;
  sessions: EntityTable<Session, "id">;
  settings: EntityTable<SettingsRow, "key">;
};

db.version(1).stores({
  cards: "noteId, due, state",
  sessions: "id, startedAt",
  settings: "key",
});

export { db };
export type { SettingsRow };
