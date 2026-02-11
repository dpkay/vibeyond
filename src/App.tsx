/**
 * @file App.tsx -- Root application component and async data loader.
 *
 * This file defines two things:
 *
 * 1. **`AppLoader`** -- A wrapper component that hydrates Zustand stores
 *    (settings and FSRS cards) from IndexedDB on startup. Until both
 *    stores report `loaded === true`, a pulsing loading indicator is
 *    shown instead of child routes.
 *
 * 2. **`App`** (default export) -- Sets up the React Router `BrowserRouter`
 *    and declares all client-side routes:
 *
 *    | Path         | Screen                  | Purpose                                   |
 *    |--------------|-------------------------|-------------------------------------------|
 *    | `/`          | `HomeScreen`            | Landing / title screen                    |
 *    | `/play`      | `SessionScreen`         | Active note-recognition practice session  |
 *    | `/settings`  | `ParentSettingsScreen`  | Parent-facing configuration panel         |
 *    | `/cards`     | `CardInspectorScreen`   | Developer/parent FSRS card browser        |
 *    | `/celebrate` | `Celebration`           | Standalone celebration (dev/testing only)  |
 *
 *    Three decorative nebula `<div>` layers are rendered behind the
 *    router to produce the app-wide cosmic background glow effect.
 */

import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSettingsStore } from "./store/settingsStore";
import { useCardStore } from "./store/cardStore";
import { db } from "./db/db";
import { HomeScreen } from "./screens/HomeScreen";
import { SessionScreen } from "./screens/SessionScreen";
import { ParentSettingsScreen } from "./screens/ParentSettingsScreen";
import { CardInspectorScreen } from "./screens/CardInspectorScreen";
import { Celebration } from "./components/Celebration";

/**
 * Async data gate that loads persisted state before rendering children.
 *
 * On mount, kicks off parallel loads for:
 * - `loadSettings()` -- reads the `Settings` record from IndexedDB (or
 *   creates defaults if this is a fresh install).
 * - `loadCards()` -- reads all `AppCard` records from IndexedDB.
 *
 * While either store is still loading, a full-screen pulsing placeholder
 * is rendered instead of `children`. Once both are ready the child route
 * tree is rendered normally.
 *
 * @param children - The route tree to render once data is ready.
 */
function DbErrorDialog() {
  const handleReset = async () => {
    try {
      await db.delete();
    } catch {
      // If delete fails, try nuking via the native API
      indexedDB.deleteDatabase("VibeyondDB");
    }
    window.location.reload();
  };

  return (
    <div className="h-full flex items-center justify-center" style={{ padding: 32 }}>
      <div
        className="flex flex-col items-center gap-5 rounded-2xl max-w-sm text-center"
        style={{ background: "rgba(30,30,60,0.85)", padding: "40px 32px" }}
      >
        <div style={{ fontSize: 40, lineHeight: 1 }}>🔧</div>
        <p className="text-lg text-white" style={{ lineHeight: 1.5 }}>
          Something went wrong loading your saved data.
        </p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
          This can happen after an app update. Resetting will clear your
          progress but fix the problem.
        </p>
        <button
          onClick={handleReset}
          className="rounded-xl text-white font-medium cursor-pointer"
          style={{
            background: "rgba(251,191,36,0.8)",
            padding: "14px 32px",
            marginTop: 8,
          }}
        >
          Reset &amp; Reload
        </button>
      </div>
    </div>
  );
}

function AppLoader({ children }: { children: React.ReactNode }) {
  const { loaded: settingsLoaded, loadSettings, dbError: settingsDbError } = useSettingsStore();
  const { loaded: cardsLoaded, loadCards, dbError: cardsDbError } = useCardStore();

  useEffect(() => {
    loadSettings();
    loadCards();
  }, [loadSettings, loadCards]);

  const dbError = settingsDbError || cardsDbError;

  if (dbError) {
    return <DbErrorDialog />;
  }

  if (!settingsLoaded || !cardsLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-2xl text-nebula-400 animate-pulse">🚀 Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Root application component.
 *
 * Renders the BrowserRouter, decorative nebula background layers, and
 * wraps all routes inside `AppLoader` so that no screen renders until
 * IndexedDB state is fully hydrated.
 */
export default function App() {
  return (
    <BrowserRouter>
      {/* Nebula glow layers -- CSS-animated radial gradients for the
          space-themed background. Defined in index.css. */}
      <div className="nebula nebula-1" />
      <div className="nebula nebula-2" />
      <div className="nebula nebula-3" />
      <AppLoader>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/play/:missionId" element={<SessionScreen />} />
          <Route path="/settings" element={<ParentSettingsScreen />} />
          <Route path="/cards" element={<CardInspectorScreen />} />
          {/* Dev/test route: renders the Celebration screen directly with
              hardcoded score values so it can be viewed in isolation. */}
          <Route path="/celebrate" element={<Celebration onDone={() => window.location.href = "/"} correctCount={27} totalCount={30} />} />
        </Routes>
      </AppLoader>
    </BrowserRouter>
  );
}
