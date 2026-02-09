import { create } from "zustand";
import type { Settings } from "../types";
import { DEFAULT_MIN_NOTE, DEFAULT_MAX_NOTE, DEFAULT_CHALLENGE_MIN, DEFAULT_CHALLENGE_MAX } from "../logic/noteUtils";
import { db } from "../db/db";

const DEFAULT_SETTINGS: Settings = {
  noteRange: {
    minNote: DEFAULT_MIN_NOTE,
    maxNote: DEFAULT_MAX_NOTE,
  },
  challengeRange: {
    minNote: DEFAULT_CHALLENGE_MIN,
    maxNote: DEFAULT_CHALLENGE_MAX,
  },
  enabledClefs: ["treble"],
  sessionLength: 30,
};

interface SettingsState {
  settings: Settings;
  loaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  loadSettings: async () => {
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
  },

  updateSettings: async (patch) => {
    const merged = { ...get().settings, ...patch };
    await db.settings.put({
      key: "appSettings",
      value: JSON.stringify(merged),
    });
    set({ settings: merged });
  },
}));
