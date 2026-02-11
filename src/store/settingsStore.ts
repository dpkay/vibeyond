/**
 * @file settingsStore.ts — Zustand store for parent-configurable application settings.
 *
 * This store manages every setting that a parent can adjust in the
 * ParentSettingsScreen: which keys appear on the on-screen piano, which notes
 * are eligible for challenges, which clefs are active, and how many correct
 * answers constitute a complete session.
 *
 * **Persistence:** Settings are persisted to IndexedDB via Dexie as a single
 * JSON-serialized row keyed by `"appSettings"` in the `settings` table. This
 * keeps the schema trivial (one key-value row) while still surviving page
 * reloads and offline use. On load, stored settings are shallow-merged with
 * {@link DEFAULT_SETTINGS} so that newly-added fields (introduced in future
 * code changes) automatically receive sensible defaults without requiring a
 * database migration.
 *
 * **Initialization:** Consumers must call {@link SettingsState.loadSettings}
 * once at app startup (typically in a top-level `useEffect`) before the
 * settings values are meaningful. Until that call resolves, `loaded` is
 * `false` and `settings` holds the compile-time defaults.
 */

import { create } from "zustand";
import type { Settings } from "../types";
import { DEFAULT_MIN_NOTE, DEFAULT_MAX_NOTE } from "../logic/noteUtils";
import { DEFAULT_ANIMALS_CONFIG, DEFAULT_NOTES_CONFIG } from "../missions";
import { db } from "../db/db";

/**
 * Compile-time default settings used when no persisted settings exist yet
 * (first launch) and as a base for merging when loading stored settings.
 *
 * - `noteRange`: The full range of keys rendered on the piano keyboard
 *   (C2--B5, four octaves). This is purely visual; it does not restrict
 *   which notes can appear as challenges.
 * - `sessionLength`: Number of correct answers needed to complete a session.
 *   Missions define their own defaults; this is the global override.
 */
const DEFAULT_SETTINGS: Settings = {
  noteRange: {
    minNote: DEFAULT_MIN_NOTE,
    maxNote: DEFAULT_MAX_NOTE,
  },
  sessionLength: 20,
  animalsConfig: DEFAULT_ANIMALS_CONFIG,
  notesConfig: DEFAULT_NOTES_CONFIG,
};

/**
 * Shape of the settings Zustand store.
 *
 * @property settings - The current resolved settings object. Always contains
 *   every field defined in {@link Settings} (defaults are filled in on load).
 * @property loaded - `true` once the async load from IndexedDB has completed.
 *   UI components should gate on this to avoid rendering with stale defaults.
 * @property loadSettings - One-time async initializer that reads persisted
 *   settings from IndexedDB and merges them with defaults.
 * @property updateSettings - Applies a partial patch to the current settings,
 *   persists the result, and updates the in-memory state atomically.
 */
interface SettingsState {
  settings: Settings;
  loaded: boolean;
  dbError: string | null;
  loadSettings: () => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  dbError: null,

  /**
   * Load settings from IndexedDB and merge with compile-time defaults.
   *
   * If a persisted row exists, its values take precedence, but any keys
   * missing from the stored JSON (e.g., a field added in a newer app version)
   * are filled in from {@link DEFAULT_SETTINGS}. The merged result is then
   * written back to the database so the new defaults are persisted for next
   * time --- this avoids the need for explicit schema migrations when adding
   * new settings fields.
   *
   * If no persisted row exists (first launch), the defaults are written to
   * IndexedDB so that subsequent loads find them.
   */
  loadSettings: async () => {
    try {
      const row = await db.settings.get("appSettings");
      if (row) {
        // Merge with defaults so new fields (e.g. challengeRange) get populated
        const stored = JSON.parse(row.value);
        const merged: Settings = { ...DEFAULT_SETTINGS, ...stored };
        // Persist the merged version so new defaults are saved
        await db.settings.put({
          key: "appSettings",
          value: JSON.stringify(merged),
        });
        set({ settings: merged, loaded: true });
      } else {
        await db.settings.put({
          key: "appSettings",
          value: JSON.stringify(DEFAULT_SETTINGS),
        });
        set({ loaded: true });
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      set({ loaded: true, dbError: String(err) });
    }
  },

  /**
   * Apply a partial update to the current settings.
   *
   * The patch is shallow-merged with the existing settings, persisted to
   * IndexedDB, and then committed to in-memory state. Because the database
   * write happens before `set()`, a crash between the two would at worst
   * leave the UI showing stale values until the next page load (the DB is
   * the source of truth).
   *
   * @param patch - A partial {@link Settings} object. Only the keys present
   *   in the patch are overwritten; all other settings remain unchanged.
   */
  updateSettings: async (patch) => {
    const merged = { ...get().settings, ...patch };
    await db.settings.put({
      key: "appSettings",
      value: JSON.stringify(merged),
    });
    set({ settings: merged });
  },
}));
