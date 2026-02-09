import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSettingsStore } from "./store/settingsStore";
import { useCardStore } from "./store/cardStore";
import { HomeScreen } from "./screens/HomeScreen";
import { SessionScreen } from "./screens/SessionScreen";
import { ParentSettingsScreen } from "./screens/ParentSettingsScreen";
import { CardInspectorScreen } from "./screens/CardInspectorScreen";

function AppLoader({ children }: { children: React.ReactNode }) {
  const { loaded: settingsLoaded, loadSettings } = useSettingsStore();
  const { loaded: cardsLoaded, loadCards } = useCardStore();

  useEffect(() => {
    loadSettings();
    loadCards();
  }, [loadSettings, loadCards]);

  if (!settingsLoaded || !cardsLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-2xl text-nebula-400 animate-pulse">🚀 Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Nebula glow layers */}
      <div className="nebula nebula-1" />
      <div className="nebula nebula-2" />
      <div className="nebula nebula-3" />
      <AppLoader>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/play" element={<SessionScreen />} />
          <Route path="/settings" element={<ParentSettingsScreen />} />
          <Route path="/cards" element={<CardInspectorScreen />} />
        </Routes>
      </AppLoader>
    </BrowserRouter>
  );
}
