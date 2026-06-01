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
  /** Local user's display name for this multiplayer session. */
  myName: string;
  /** Local user's symbol for this multiplayer session. */
  mySymbol: string;
  /** Update the local user's session name; pushed live to the peer if connected. */
  setMyName: (name: string) => void;
  /** Update the local user's session symbol; pushed live to the peer if connected. */
  setMySymbol: (symbol: string) => void;
  /** Resolved name for player slot 0 (host) — peer-aware when in MP, settings otherwise. */
  player1Name: string;
  /** Resolved name for player slot 1 (joiner) — peer-aware when in MP, settings otherwise. */
  player2Name: string;
  /** Resolved symbol for player slot 0 — peer-aware in MP. */
  player1Symbol: string;
  /** Resolved symbol for player slot 1 — peer-aware in MP. */
  player2Symbol: string;
  /** Returns true if the action was accepted (your turn, line valid). */
  submitMove: (lineId: string) => boolean;
  submitReset: () => void;
  hostGame: () => void;
  joinGame: (codeOrPeerId: string) => void;
  disconnect: () => void;
}

const MultiplayerContext = createContext<MultiplayerContextValue | null>(null);

const NAME_STORAGE_KEY = "dab.mp.name.v1";

function readPersistedName(): { name: string; symbol: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(NAME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.name === "string" && typeof parsed.symbol === "string") {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writePersistedName(name: string, symbol: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NAME_STORAGE_KEY, JSON.stringify({ name, symbol }));
  } catch {
    /* ignore */
  }
}

export function MultiplayerProvider({ children }: { children: ReactNode }) {
  const { state, drawLine, resetGame } = useGame();
  const { settings, updateSettings } = useSettings();
  const [peerProfile, setPeerProfile] = useState<{ name: string; symbol: string } | null>(null);

  // Per-session display name & symbol. Starts from settings, but the user can override
  // it from the multiplayer panel. We persist it in sessionStorage so a page reload
  // keeps the same identity throughout the room.
  const [myName, setMyNameState] = useState<string>(settings.player1.name);
  const [mySymbol, setMySymbolState] = useState<string>(settings.player1.symbol);
  const hydratedRef = useRef(false);

  // Refs to read latest values inside the setters without retriggering them.
  const myNameRef = useRef(myName);
  const mySymbolRef = useRef(mySymbol);
  useEffect(() => {
    myNameRef.current = myName;
  }, [myName]);
  useEffect(() => {
    mySymbolRef.current = mySymbol;
  }, [mySymbol]);

  // Hydrate the session name on mount. Falls back to current settings if there
  // is nothing stored yet — that way first-time hosts get a sensible default.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const stored = readPersistedName();
    if (stored) {
      setMyNameState(stored.name);
      setMySymbolState(stored.symbol);
    } else {
      setMyNameState(settings.player1.name);
      setMySymbolState(settings.player1.symbol);
    }
    // Intentionally only running once at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMyName = useCallback((name: string) => {
    setMyNameState(name);
    writePersistedName(name, mySymbolRef.current);
  }, []);

  const setMySymbol = useCallback((symbol: string) => {
    setMySymbolState(symbol);
    writePersistedName(myNameRef.current, symbol);
  }, []);

  // Monotonic clock so out-of-order messages can be ignored if we add it later
  const clockRef = useRef(0);

  const myProfile = useMemo(
    () => ({ name: myName, symbol: mySymbol }),
    [myName, mySymbol]
  );

  const rtc = useWebRTCGame({
    myProfile,
    gridSize: settings.gridSize,
    onMove: (lineId) => {
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

  // Whenever connection drops back to idle, forget the peer profile.
  useEffect(() => {
    if (rtc.status === "idle") {
      setPeerProfile(null);
    }
  }, [rtc.status]);

  const enabled = rtc.status !== "idle";
  const isMyTurn = useMemo(() => {
    if (!enabled) return true;
    if (rtc.status !== "connected") return false;
    return rtc.myPlayerIndex === state.currentPlayer;
  }, [enabled, rtc.status, rtc.myPlayerIndex, state.currentPlayer]);

  const submitMove = useCallback(
    (lineId: string): boolean => {
      if (!enabled || rtc.status !== "connected") {
        if (enabled) return false;
        drawLine(lineId);
        return true;
      }
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

  // Resolve per-slot display names. In multiplayer:
  //   slot 0 = host, slot 1 = joiner.
  // The local user's name lives in whichever slot matches their role; the
  // other slot is filled from the peer profile (with a friendly placeholder
  // until HELLO arrives).
  const { player1Name, player2Name, player1Symbol, player2Symbol } = useMemo(() => {
    if (!enabled) {
      return {
        player1Name: settings.player1.name,
        player2Name: settings.player2.name,
        player1Symbol: settings.player1.symbol,
        player2Symbol: settings.player2.symbol,
      };
    }
    const peerName = peerProfile?.name ?? "waiting…";
    const peerSymbol = peerProfile?.symbol ?? settings.player2.symbol;
    if (rtc.role === "host") {
      return {
        player1Name: myName,
        player2Name: peerName,
        player1Symbol: mySymbol,
        player2Symbol: peerSymbol,
      };
    }
    if (rtc.role === "joiner") {
      return {
        player1Name: peerName,
        player2Name: myName,
        player1Symbol: peerSymbol,
        player2Symbol: mySymbol,
      };
    }
    return {
      player1Name: settings.player1.name,
      player2Name: settings.player2.name,
      player1Symbol: settings.player1.symbol,
      player2Symbol: settings.player2.symbol,
    };
  }, [
    enabled,
    rtc.role,
    myName,
    mySymbol,
    peerProfile,
    settings.player1.name,
    settings.player1.symbol,
    settings.player2.name,
    settings.player2.symbol,
  ]);

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
    myName,
    mySymbol,
    setMyName,
    setMySymbol,
    player1Name,
    player2Name,
    player1Symbol,
    player2Symbol,
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
