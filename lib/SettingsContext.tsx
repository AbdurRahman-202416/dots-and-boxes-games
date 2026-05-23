"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DEFAULT_SETTINGS, GameSettings } from "./types";

interface SettingsContextValue {
  settings: GameSettings;
  setSettings: (s: GameSettings) => void;
  updateSettings: (partial: Partial<GameSettings>) => void;
  hydrated: boolean;
}

const STORAGE_KEY = "dab.settings.v1";

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.player1 && parsed.player2 && parsed.gridSize) {
          // Migrate older settings missing the colors block
          const merged: GameSettings = {
            ...DEFAULT_SETTINGS,
            ...parsed,
            colors: { ...DEFAULT_SETTINGS.colors, ...(parsed.colors ?? {}) },
          };
          setSettingsState(merged);
        }
      }
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  const setSettings = useCallback((s: GameSettings) => {
    setSettingsState(s);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      // storage may be unavailable (private mode, quota); the in-memory state still updates
    }
  }, []);

  const updateSettings = useCallback(
    (partial: Partial<GameSettings>) => {
      setSettings({ ...settingsRef.current, ...partial });
    },
    [setSettings]
  );

  const value = useMemo(
    () => ({ settings, setSettings, updateSettings, hydrated }),
    [settings, setSettings, updateSettings, hydrated]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
