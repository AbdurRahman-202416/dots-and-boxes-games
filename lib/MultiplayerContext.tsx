"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useGame } from "./GameContext";
import { useSettings } from "./SettingsContext";
import {
  MultiplayerRole,
  MultiplayerStatus,
  useWebRTCGame,
} from "./useWebRTCGame";
import { PlayerIndex } from "./types";

interface MultiplayerContextValue {
  enabled: boolean;
  status: MultiplayerStatus;
  role: MultiplayerRole;
  myPlayerIndex: PlayerIndex | null;
  roomCode: string | null;
  peerId: string | null;
  remotePeerId: string | null;
  shareUrl: string | null;
  peerProfile: { name: string; symbol: string } | null;
  error: string | null;
  isMyTurn: boolean;
  /** Returns true if the action was accepted (your turn, line valid). */
  submitMove: (lineId: string) => boolean;
  submitReset: () => void;
  hostGame: () => void;
  joinGame: (codeOrPeerId: string) => void;
  disconnect: () => void;
}

const MultiplayerContext = createContext<MultiplayerContextValue | null>(null);

/**
 * MultiplayerProvider
 * ------------------
 * Sits *inside* SettingsProvider + GameProvider, wires the WebRTC hook into the
 * local game state, and exposes a small, intentional API to the rest of the app:
 *
 *   • `submitMove(lineId)`   — turn-locked: applies locally + sends to peer
 *   • `submitReset()`        — applies locally + sends to peer
 *   • `isMyTurn`             — what GameBoard reads to lock interactions
 *
 * Incoming peer messages are applied via the raw `drawLine` / `resetGame` from
 * GameContext, so there is no feedback loop: local moves go out via `submitMove`,
 * remote moves come in via the hook callbacks.
 */
export function MultiplayerProvider({ children }: { children: ReactNode }) {
  const { state, drawLine, resetGame } = useGame();
  const { settings, updateSettings } = useSettings();
  const [peerProfile, setPeerProfile] = useState<{ name: string; symbol: string } | null>(null);

  // Monotonic clock so out-of-order messages can be ignored if we add it later
  const clockRef = useRef(0);

  const myProfile = useMemo(
    () => ({
      // Until we know the role, default to whichever side they currently see locally.
      name: settings.player1.name,
      symbol: settings.player1.symbol,
    }),
    [settings.player1.name, settings.player1.symbol]
  );

  const rtc = useWebRTCGame({
    myProfile,
    gridSize: settings.gridSize,
    onMove: (lineId) => {
      // Remote peer drew a line — apply directly, no echo
      drawLine(lineId);
    },
    onReset: () => {
      resetGame();
    },
    onGridChange: (size) => {
      if (size !== settings.gridSize) {
        updateSettings({ gridSize: size });
      }
    },
    onPeerProfile: (profile) => {
      setPeerProfile(profile);
    },
  });

  const enabled = rtc.status !== "idle";
  const isMyTurn = useMemo(() => {
    if (!enabled) return true; // local play — always your turn
    if (rtc.status !== "connected") return false; // still negotiating
    return rtc.myPlayerIndex === state.currentPlayer;
  }, [enabled, rtc.status, rtc.myPlayerIndex, state.currentPlayer]);

  const submitMove = useCallback(
    (lineId: string): boolean => {
      // Local play — just apply
      if (!enabled || rtc.status !== "connected") {
        if (enabled) return false; // negotiating — block input
        drawLine(lineId);
        return true;
      }
      // Multiplayer — turn lock
      if (rtc.myPlayerIndex !== state.currentPlayer) return false;
      if (state.lines.has(lineId)) return false;
      const clock = ++clockRef.current;
      drawLine(lineId);
      rtc.sendMove(lineId, clock);
      return true;
    },
    [enabled, rtc, state.currentPlayer, state.lines, drawLine]
  );

  const submitReset = useCallback(() => {
    const clock = ++clockRef.current;
    resetGame();
    if (enabled && rtc.status === "connected") {
      rtc.sendReset(clock);
    }
  }, [enabled, rtc, resetGame]);

  const value: MultiplayerContextValue = {
    enabled,
    status: rtc.status,
    role: rtc.role,
    myPlayerIndex: rtc.myPlayerIndex,
    roomCode: rtc.roomCode,
    peerId: rtc.peerId,
    remotePeerId: rtc.remotePeerId,
    shareUrl: rtc.shareUrl,
    peerProfile,
    error: rtc.error,
    isMyTurn,
    submitMove,
    submitReset,
    hostGame: rtc.hostGame,
    joinGame: rtc.joinGame,
    disconnect: rtc.disconnect,
  };

  return (
    <MultiplayerContext.Provider value={value}>{children}</MultiplayerContext.Provider>
  );
}

export function useMultiplayer() {
  const ctx = useContext(MultiplayerContext);
  if (!ctx) throw new Error("useMultiplayer must be used within MultiplayerProvider");
  return ctx;
}
