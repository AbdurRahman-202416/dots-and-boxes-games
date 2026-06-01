"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DataConnection, Peer } from "peerjs";

/** Namespace prefix so our short codes don't collide with other PeerJS apps on the same cloud broker. */
const PEER_PREFIX = "dab-";

/**
 * localStorage key used to recover a live room across page reloads — and
 * even across tab close / reopen, so a refresh on either side picks up
 * exactly where the player left off.
 */
const SESSION_KEY = "dab.mp.session.v1";

/** How long a stored session is considered fresh enough to auto-resume. */
const SESSION_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

/** Backoff schedule for re-claiming a peer ID after a refresh — the broker
 *  may briefly still hold the previous registration, so we retry quietly. */
const RESUME_RETRY_DELAYS_MS = [800, 1800, 3500, 6000];

interface PersistedSession {
  role: "host" | "joiner";
  roomCode: string;
  name: string;
  symbol: string;
  /** Timestamp the session was last written — used to expire stale rooms. */
  savedAt: number;
}

function readSession(): PersistedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      (parsed.role === "host" || parsed.role === "joiner") &&
      typeof parsed.roomCode === "string"
    ) {
      const savedAt = typeof parsed.savedAt === "number" ? parsed.savedAt : 0;
      if (savedAt && Date.now() - savedAt > SESSION_TTL_MS) {
        // expired — drop it so the next mount starts clean
        window.localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return { ...parsed, savedAt } as PersistedSession;
    }
  } catch {
    /* malformed — ignore */
  }
  return null;
}

function writeSession(s: Omit<PersistedSession, "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedSession = { ...s, savedAt: Date.now() };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* storage may be unavailable */
  }
}

function clearSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
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
  | "reconnecting"
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
 *   • Live rooms are persisted to `localStorage` so a page refresh — on
 *     either side — reconnects the same player back to the same room without
 *     manual intervention. The user can still leave at any time via
 *     `disconnect()`, which is the only thing that erases the saved session.
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

  // Tracks whether the current host/join call originated from an auto-resume,
  // so we can quietly retry transient broker errors before surfacing them.
  const resumingRef = useRef(false);
  const resumeAttemptRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  /** Tear down any existing Peer / DataConnection without touching state — used
   *  before retrying an auto-resume so we don't leak peers. */
  const teardownPeerOnly = useCallback(() => {
    try { connRef.current?.close(); } catch { /* already closed */ }
    try { peerRef.current?.destroy(); } catch { /* already destroyed */ }
    connRef.current = null;
    peerRef.current = null;
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
      // Resume succeeded — clear the retry bookkeeping.
      resumingRef.current = false;
      resumeAttemptRef.current = 0;
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
  }, [safeSend, persistIfPossible]);

  /** Common error handler shared by host / join — during an auto-resume we
   *  retry quietly with backoff, otherwise we surface the error and clear
   *  the persisted session so the user can recover manually. */
  const handlePeerError = useCallback(
    (err: Error, retry: () => void) => {
      const isResuming = resumingRef.current;
      const attempt = resumeAttemptRef.current;
      if (isResuming && attempt < RESUME_RETRY_DELAYS_MS.length) {
        resumeAttemptRef.current = attempt + 1;
        setStatus("reconnecting");
        const delay = RESUME_RETRY_DELAYS_MS[attempt];
        // Tear down the failed peer before retrying so we don't leak it.
        teardownPeerOnly();
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = setTimeout(retry, delay);
        return;
      }
      resumingRef.current = false;
      setError(err?.message || String(err));
      setStatus("error");
      clearSession();
    },
    [teardownPeerOnly]
  );

  const hostGameWithCode = useCallback(
    async (code: string) => {
      setError(null);
      setStatus(resumingRef.current ? "reconnecting" : "hosting");
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
          // If a peer was already connected (mid-game refresh on host),
          // attachConnection has already flipped to "connected" — don't
          // clobber it with "waiting".
          setStatus((s) => (s === "connected" ? s : "waiting"));
          // Persist now so a refresh while waiting can resume hosting.
          persistIfPossible();
        });

        peer.on("connection", (conn) => {
          attachConnection(conn);
        });

        peer.on("error", (err: Error) => {
          handlePeerError(err, () => {
            hostGameWithCode(code);
          });
        });
      } catch (e) {
        handlePeerError(
          e instanceof Error ? e : new Error(String(e)),
          () => hostGameWithCode(code)
        );
      }
    },
    [attachConnection, persistIfPossible, handlePeerError]
  );

  const hostGame = useCallback(
    () => hostGameWithCode(generateRoomCode()),
    [hostGameWithCode]
  );

  const joinGame = useCallback(
    async (codeOrPeerId: string) => {
      if (!codeOrPeerId) return;
      setError(null);
      setStatus(resumingRef.current ? "reconnecting" : "joining");
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
          handlePeerError(err, () => {
            joinGame(codeOrPeerId);
          });
        });
      } catch (e) {
        handlePeerError(
          e instanceof Error ? e : new Error(String(e)),
          () => joinGame(codeOrPeerId)
        );
      }
    },
    [attachConnection, handlePeerError]
  );

  const disconnect = useCallback(() => {
    // Cancel any pending auto-resume retry — the user has explicitly opted out.
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    resumingRef.current = false;
    resumeAttemptRef.current = 0;

    teardownPeerOnly();
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
  }, [teardownPeerOnly]);

  // Resume an in-flight room after a page reload, then fall back to URL-based auto-join.
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStartedRef.current) return;
    if (typeof window === "undefined") return;
    autoStartedRef.current = true;

    const stored = readSession();
    if (stored) {
      // Mark this as a resume so transient broker errors get retried quietly
      // instead of dropping the session on the first failure.
      resumingRef.current = true;
      resumeAttemptRef.current = 0;
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
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
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
