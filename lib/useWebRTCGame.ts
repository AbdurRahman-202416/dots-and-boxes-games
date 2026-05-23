"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DataConnection, Peer } from "peerjs";

/** Namespace prefix so our short codes don't collide with other PeerJS apps on the same cloud broker. */
const PEER_PREFIX = "dab-";

/** sessionStorage key used to recover a live room across page reloads. */
const SESSION_KEY = "dab.mp.session.v1";

interface PersistedSession {
  role: "host" | "joiner";
  roomCode: string;
  name: string;
  symbol: string;
}

function readSession(): PersistedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      (parsed.role === "host" || parsed.role === "joiner") &&
      typeof parsed.roomCode === "string"
    ) {
      return parsed as PersistedSession;
    }
  } catch {
    /* malformed — ignore */
  }
  return null;
}

function writeSession(s: PersistedSession) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* storage may be unavailable */
  }
}

function clearSession() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* no-op */
  }
}

/** Six-character code, no easily-confused glyphs (no I, O, 0, 1). */
export function generateRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6);
}

const codeToPeerId = (code: string) => `${PEER_PREFIX}${code}`;
const peerIdToCode = (peerId: string) =>
  peerId.startsWith(PEER_PREFIX) ? peerId.slice(PEER_PREFIX.length) : peerId;

/**
 * The wire format for every message exchanged between the two peers.
 * Keep this lean and explicit — it's the contract between host & joiner.
 */
export type WireMessage =
  | { type: "HELLO"; profile: { name: string; symbol: string } }
  | { type: "GRID"; gridSize: number }
  | { type: "MOVE"; lineId: string; clock: number }
  | { type: "RESET"; clock: number };

export type MultiplayerStatus =
  | "idle"
  | "hosting"
  | "waiting"
  | "joining"
  | "connected"
  | "disconnected"
  | "error";

export type MultiplayerRole = "host" | "joiner" | null;

export interface UseWebRTCGameOptions {
  onMove: (lineId: string, clock: number) => void;
  onReset: (clock: number) => void;
  onGridChange: (gridSize: number) => void;
  onPeerProfile: (profile: { name: string; symbol: string }) => void;
  myProfile: { name: string; symbol: string };
  gridSize: number;
}

export interface WebRTCGame {
  status: MultiplayerStatus;
  role: MultiplayerRole;
  myPlayerIndex: 0 | 1 | null;
  /** The short, user-facing code (e.g. "X7KR9P"). Equals `null` while idle. */
  roomCode: string | null;
  /** Internal peer ID — usually you want `roomCode`. */
  peerId: string | null;
  remotePeerId: string | null;
  shareUrl: string | null;
  error: string | null;
  hostGame: () => Promise<void>;
  joinGame: (codeOrPeerId: string) => Promise<void>;
  disconnect: () => void;
  sendMove: (lineId: string, clock: number) => void;
  sendReset: (clock: number) => void;
  sendGrid: (gridSize: number) => void;
}

/**
 * useWebRTCGame
 * ------------------
 * A self-contained hook that owns a PeerJS `Peer` and a single `DataConnection`.
 *
 *   • hostGame()  → creates a Peer, returns a peerId + share URL, waits for a connection
 *   • joinGame(id) → creates a Peer, opens a connection to the given peerId
 *   • Auto-joins if the current URL has `?room=<id>`
 *   • Role assignment is deterministic: host = Player 1 (index 0), joiner = Player 2 (index 1)
 *
 * Side-effects (move, reset, grid change) are delivered to the parent via callbacks,
 * so this hook never touches your game state directly.
 */
export function useWebRTCGame({
  onMove,
  onReset,
  onGridChange,
  onPeerProfile,
  myProfile,
  gridSize,
}: UseWebRTCGameOptions): WebRTCGame {
  const [status, setStatus] = useState<MultiplayerStatus>("idle");
  const [role, setRole] = useState<MultiplayerRole>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [remotePeerId, setRemotePeerId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const roleRef = useRef<MultiplayerRole>(null);
  const roomCodeRef = useRef<string | null>(null);
  const profileRef = useRef(myProfile);
  const gridRef = useRef(gridSize);

  // Keep callback refs current so we never bind stale closures into PeerJS handlers.
  const cbRef = useRef({ onMove, onReset, onGridChange, onPeerProfile });
  useEffect(() => {
    cbRef.current = { onMove, onReset, onGridChange, onPeerProfile };
  }, [onMove, onReset, onGridChange, onPeerProfile]);

  useEffect(() => {
    const prev = profileRef.current;
    profileRef.current = myProfile;
    // If we're already connected and the local user edited their name / symbol,
    // push the new profile to the peer so their UI updates in real time.
    const changed = prev.name !== myProfile.name || prev.symbol !== myProfile.symbol;
    if (changed) {
      const conn = connRef.current;
      if (conn && conn.open) {
        conn.send({ type: "HELLO", profile: myProfile } satisfies WireMessage);
      }
      // Keep the persisted session in sync with the latest profile.
      if (roleRef.current && roomCodeRef.current) {
        writeSession({
          role: roleRef.current,
          roomCode: roomCodeRef.current,
          name: myProfile.name,
          symbol: myProfile.symbol,
        });
      }
    }
  }, [myProfile]);
  useEffect(() => {
    gridRef.current = gridSize;
  }, [gridSize]);

  const safeSend = useCallback((msg: WireMessage) => {
    const conn = connRef.current;
    if (conn && conn.open) {
      conn.send(msg);
    }
  }, []);

  const persistIfPossible = useCallback(() => {
    const role = roleRef.current;
    const code = roomCodeRef.current;
    if (!role || !code) return;
    writeSession({
      role,
      roomCode: code,
      name: profileRef.current.name,
      symbol: profileRef.current.symbol,
    });
  }, []);

  const attachConnection = useCallback((conn: DataConnection) => {
    connRef.current = conn;
    setRemotePeerId(conn.peer);

    conn.on("open", () => {
      setStatus("connected");
      // Always tell the peer who you are
      safeSend({ type: "HELLO", profile: profileRef.current });
      // The host is the source of truth for grid size — push it after handshake.
      if (roleRef.current === "host") {
        safeSend({ type: "GRID", gridSize: gridRef.current });
      }
      persistIfPossible();
    });

    conn.on("data", (raw) => {
      if (!raw || typeof raw !== "object") return;
      const msg = raw as WireMessage;
      switch (msg.type) {
        case "HELLO":
          cbRef.current.onPeerProfile(msg.profile);
          break;
        case "GRID":
          cbRef.current.onGridChange(msg.gridSize);
          break;
        case "MOVE":
          cbRef.current.onMove(msg.lineId, msg.clock);
          break;
        case "RESET":
          cbRef.current.onReset(msg.clock);
          break;
      }
    });

    conn.on("close", () => {
      setStatus("disconnected");
    });

    conn.on("error", (err) => {
      setError(err?.message || String(err));
      setStatus("error");
    });
  }, [safeSend]);

  const hostGameWithCode = useCallback(
    async (code: string) => {
      setError(null);
      setStatus("hosting");
      try {
        const { default: Peer } = await import("peerjs");
        const peer = new Peer(codeToPeerId(code));
        peerRef.current = peer;

        peer.on("open", (id: string) => {
          setPeerId(id);
          const shortCode = peerIdToCode(id);
          setRoomCode(shortCode);
          roomCodeRef.current = shortCode;
          roleRef.current = "host";
          setRole("host");
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("room", shortCode);
            setShareUrl(url.toString());
          }
          setStatus("waiting");
          // Persist now so a refresh while waiting can resume hosting.
          persistIfPossible();
        });

        peer.on("connection", (conn) => {
          attachConnection(conn);
        });

        peer.on("error", (err: Error) => {
          setError(err?.message || String(err));
          setStatus("error");
          // The broker may still hold the old peer ID right after a refresh;
          // drop the session so the user can host fresh instead of looping.
          clearSession();
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    },
    [attachConnection, persistIfPossible]
  );

  const hostGame = useCallback(
    () => hostGameWithCode(generateRoomCode()),
    [hostGameWithCode]
  );

  const joinGame = useCallback(
    async (codeOrPeerId: string) => {
      if (!codeOrPeerId) return;
      setError(null);
      setStatus("joining");
      try {
        const { default: Peer } = await import("peerjs");
        const peer = new Peer();
        peerRef.current = peer;

        // Accept either a room code or a fully-qualified peer ID
        const remoteIsPeerId = codeOrPeerId.startsWith(PEER_PREFIX);
        const normalized = remoteIsPeerId
          ? codeOrPeerId
          : codeToPeerId(normalizeRoomCode(codeOrPeerId));

        peer.on("open", (id: string) => {
          setPeerId(id);
          const shortCode = peerIdToCode(normalized);
          setRoomCode(shortCode);
          roomCodeRef.current = shortCode;
          roleRef.current = "joiner";
          setRole("joiner");
          const conn = peer.connect(normalized, { reliable: true });
          attachConnection(conn);
        });

        peer.on("error", (err: Error) => {
          setError(err?.message || String(err));
          setStatus("error");
          // Host probably gone — clear the session so refresh won't keep retrying.
          clearSession();
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    },
    [attachConnection]
  );

  const disconnect = useCallback(() => {
    try { connRef.current?.close(); } catch { /* already closed */ }
    try { peerRef.current?.destroy(); } catch { /* already destroyed */ }
    connRef.current = null;
    peerRef.current = null;
    roleRef.current = null;
    roomCodeRef.current = null;
    setRole(null);
    setStatus("idle");
    setPeerId(null);
    setRoomCode(null);
    setRemotePeerId(null);
    setShareUrl(null);
    setError(null);
    clearSession();
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("room")) {
        url.searchParams.delete("room");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);

  // Resume an in-flight room after a page reload, then fall back to URL-based auto-join.
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStartedRef.current) return;
    if (typeof window === "undefined") return;
    autoStartedRef.current = true;

    const stored = readSession();
    if (stored) {
      if (stored.role === "host") {
        hostGameWithCode(stored.roomCode);
      } else {
        joinGame(stored.roomCode);
      }
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    if (room) {
      joinGame(room);
    }
  }, [joinGame, hostGameWithCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { connRef.current?.close(); } catch { /* connection may already be closed */ }
      try { peerRef.current?.destroy(); } catch { /* peer may already be destroyed */ }
    };
  }, []);

  const sendMove = useCallback(
    (lineId: string, clock: number) => safeSend({ type: "MOVE", lineId, clock }),
    [safeSend]
  );
  const sendReset = useCallback(
    (clock: number) => safeSend({ type: "RESET", clock }),
    [safeSend]
  );
  const sendGrid = useCallback(
    (size: number) => safeSend({ type: "GRID", gridSize: size }),
    [safeSend]
  );

  const myPlayerIndex: 0 | 1 | null =
    role === "host" ? 0 : role === "joiner" ? 1 : null;

  return {
    status,
    role,
    myPlayerIndex,
    roomCode,
    peerId,
    remotePeerId,
    shareUrl,
    error,
    hostGame,
    joinGame,
    disconnect,
    sendMove,
    sendReset,
    sendGrid,
  };
}
