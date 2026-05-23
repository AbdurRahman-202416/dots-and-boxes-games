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
import { applyMove, createInitialState } from "./gameLogic";
import { GameState, LineId } from "./types";
import { useSettings } from "./SettingsContext";

interface GameContextValue {
  state: GameState;
  drawLine: (id: LineId) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { settings, hydrated } = useSettings();
  const [state, setState] = useState<GameState>(() => createInitialState(settings.gridSize));
  const seenSizeRef = useRef(settings.gridSize);

  // When grid size changes via settings, reset the game.
  useEffect(() => {
    if (!hydrated) return;
    if (settings.gridSize !== seenSizeRef.current) {
      seenSizeRef.current = settings.gridSize;
      setState(createInitialState(settings.gridSize));
    }
  }, [settings.gridSize, hydrated]);

  const drawLine = useCallback((id: LineId) => {
    setState((s) => applyMove(s, id));
  }, []);

  const resetGame = useCallback(() => {
    setState(createInitialState(settings.gridSize));
  }, [settings.gridSize]);

  const value = useMemo(
    () => ({ state, drawLine, resetGame }),
    [state, drawLine, resetGame]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
