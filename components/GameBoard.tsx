"use client";

import { useGame } from "@/lib/GameContext";
import { useSettings } from "@/lib/SettingsContext";
import { useMultiplayer } from "@/lib/MultiplayerContext";
import { lineId, parseLineId } from "@/lib/gameLogic";
import { LineId, PlayerIndex } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  PointerEvent as ReactPointerEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

const PAD = 0.6;
const DOT_R = 0.07;
const DOT_HIT_R = 0.22;
const LINE_W = 0.07;
const HIT_W = 0.28;

const playerColor = (p: PlayerIndex) => (p === 0 ? "var(--p1)" : "var(--p2)");

export function GameBoard() {
  const { state } = useGame();
  const { settings } = useSettings();
  const mp = useMultiplayer();
  const N = state.gridSize;
  const VIEW = N + PAD * 2;
  const locked = !mp.isMyTurn;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverLine, setHoverLine] = useState<LineId | null>(null);
  const [dragStart, setDragStart] = useState<{ r: number; c: number } | null>(null);
  const [dragPreview, setDragPreview] = useState<LineId | null>(null);

  const lineOwners = useMemo(() => {
    const m = new Map<LineId, PlayerIndex>();
    state.history.forEach((move) => m.set(move.lineId, move.player));
    return m;
  }, [state.history]);

  const clientToSvg = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return null;
      const rect = svgRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * VIEW - PAD;
      const y = ((clientY - rect.top) / rect.height) * VIEW - PAD;
      return { x, y };
    },
    [VIEW]
  );

  const computeDragLine = useCallback(
    (r0: number, c0: number, x: number, y: number): LineId | null => {
      const dx = x - c0;
      const dy = y - r0;
      const threshold = 0.18;
      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return null;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && c0 < N) return lineId("h", r0, c0);
        if (dx < 0 && c0 > 0) return lineId("h", r0, c0 - 1);
      } else {
        if (dy > 0 && r0 < N) return lineId("v", r0, c0);
        if (dy < 0 && r0 > 0) return lineId("v", r0 - 1, c0);
      }
      return null;
    },
    [N]
  );

  const onDotDown = (r: number, c: number) => (e: ReactPointerEvent<SVGCircleElement>) => {
    if (state.isGameOver || locked) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      svgRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // synthetic events can't be captured by the browser; harmless
    }
    setDragStart({ r, c });
    setDragPreview(null);
  };

  const onSvgPointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (!dragStart) return;
      e.preventDefault();
      const p = clientToSvg(e.clientX, e.clientY);
      if (!p) return;
      const id = computeDragLine(dragStart.r, dragStart.c, p.x, p.y);
      const next = id && !state.lines.has(id) ? id : null;
      setDragPreview((prev) => (prev === next ? prev : next));
    },
    [dragStart, clientToSvg, computeDragLine, state.lines]
  );

  const endDrag = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragStart) return;
    e.preventDefault();
    if (dragPreview && !state.lines.has(dragPreview)) {
      mp.submitMove(dragPreview);
    }
    try {
      svgRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // pointer may already be released by the browser if the gesture was cancelled
    }
    setDragStart(null);
    setDragPreview(null);
  };

  const hLineCoords = (r: number, c: number) => ({ x1: c, y1: r, x2: c + 1, y2: r });
  const vLineCoords = (r: number, c: number) => ({ x1: c, y1: r, x2: c, y2: r + 1 });

  const handleLineClick = (id: LineId) => {
    if (state.isGameOver || locked || state.lines.has(id)) return;
    if (dragStart) return;
    mp.submitMove(id);
  };

  const lastMoveLineId = state.lastMove?.lineId;
  const lastBoxes = useMemo(
    () => new Set((state.lastMove?.boxesCompleted ?? []).map((b) => `${b.row}-${b.col}`)),
    [state.lastMove]
  );

  const { hLines, vLines } = useMemo(() => {
    const h: { id: LineId; r: number; c: number }[] = [];
    const v: { id: LineId; r: number; c: number }[] = [];
    for (let r = 0; r <= N; r++) {
      for (let c = 0; c < N; c++) h.push({ id: lineId("h", r, c), r, c });
    }
    for (let r = 0; r < N; r++) {
      for (let c = 0; c <= N; c++) v.push({ id: lineId("v", r, c), r, c });
    }
    return { hLines: h, vLines: v };
  }, [N]);

  const turnColor = playerColor(state.currentPlayer);

  // Midpoint coordinates of a given line for marker placement.
  const lineMid = (id: LineId) => {
    const { orientation, r, c } = parseLineId(id);
    return orientation === "h"
      ? { x: c + 0.5, y: r, perpDx: 0, perpDy: 1 }
      : { x: c, y: r + 0.5, perpDx: 1, perpDy: 0 };
  };

  return (
    <div
      className="board-surface relative w-full aspect-square max-w-[640px] max-h-full mx-auto p-2 sm:p-3 md:p-4"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* corner brackets — paper editorial framing, in warm tan */}
      <Brackets />

      <svg
        ref={svgRef}
        viewBox={`${-PAD} ${-PAD} ${VIEW} ${VIEW}`}
        className="w-full h-full relative"
        onPointerMove={onSvgPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={(e) => {
          if (dragStart) endDrag(e);
        }}
        style={{ touchAction: "none" }}
      >
        {/* faint pencil grid trace between undrawn dots */}
        {hLines.map(({ id, r, c }) => {
          const coords = hLineCoords(r, c);
          const drawn = state.lines.has(id);
          return !drawn ? (
            <line
              key={`hg-${id}`}
              {...coords}
              stroke="var(--grid)"
              strokeOpacity={0.45}
              strokeWidth={0.01}
              strokeDasharray="0.04 0.08"
              strokeLinecap="round"
            />
          ) : null;
        })}
        {vLines.map(({ id, r, c }) => {
          const coords = vLineCoords(r, c);
          const drawn = state.lines.has(id);
          return !drawn ? (
            <line
              key={`vg-${id}`}
              {...coords}
              stroke="var(--grid)"
              strokeOpacity={0.45}
              strokeWidth={0.01}
              strokeDasharray="0.04 0.08"
              strokeLinecap="round"
            />
          ) : null;
        })}

        {/* Box fills (completed) */}
        <AnimatePresence>
          {state.boxes.map((row, r) =>
            row.map((owner, c) =>
              owner !== null ? (
                <motion.g key={`box-${r}-${c}-${owner}`}>
                  <motion.rect
                    x={c}
                    y={r}
                    width={1}
                    height={1}
                    fill={playerColor(owner)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: lastBoxes.has(`${r}-${c}`) ? 0.22 : 0.14 }}
                    transition={{ duration: 0.4 }}
                  />
                  <motion.text
                    x={c + 0.5}
                    y={r + 0.54}
                    fill={playerColor(owner)}
                    fontSize={0.46}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontWeight: 700,
                    }}
                    initial={{ scale: 0, opacity: 0, rotate: -8 }}
                    animate={{
                      scale: [0, 1.25, 1],
                      opacity: 1,
                      rotate: 0,
                    }}
                    transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    {owner === 0 ? mp.player1Symbol : mp.player2Symbol}
                  </motion.text>
                </motion.g>
              ) : null
            )
          )}
        </AnimatePresence>

        {/* Drawn lines (colored by player) */}
        {hLines.map(({ id, r, c }) => {
          if (!state.lines.has(id)) return null;
          const owner = lineOwners.get(id) ?? 0;
          const isLast = id === lastMoveLineId;
          const { x1, y1, x2, y2 } = hLineCoords(r, c);
          return (
            <motion.line
              key={`hl-${id}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={playerColor(owner)}
              strokeWidth={LINE_W}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.4 }}
              animate={{
                pathLength: 1,
                opacity: 1,
                filter: isLast ? "drop-shadow(0 0 3px currentColor)" : "none",
              }}
              transition={{ duration: 0.28 }}
            />
          );
        })}
        {vLines.map(({ id, r, c }) => {
          if (!state.lines.has(id)) return null;
          const owner = lineOwners.get(id) ?? 0;
          const isLast = id === lastMoveLineId;
          const { x1, y1, x2, y2 } = vLineCoords(r, c);
          return (
            <motion.line
              key={`vl-${id}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={playerColor(owner)}
              strokeWidth={LINE_W}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.4 }}
              animate={{
                pathLength: 1,
                opacity: 1,
                filter: isLast ? "drop-shadow(0 0 3px currentColor)" : "none",
              }}
              transition={{ duration: 0.28 }}
            />
          );
        })}

        {/* Per-player "last move" markers — each player's most recent line
            gets a bright color disc with a paper-white ring at its midpoint,
            so the opponent immediately sees what was just played. The very
            most recent move (overall) pulses with an animated halo. */}
        {([0, 1] as PlayerIndex[]).map((idx) => {
          const move = state.lastMovePerPlayer[idx];
          if (!move) return null;
          const { x, y } = lineMid(move.lineId);
          const color = playerColor(idx);
          const isLatest = move.lineId === lastMoveLineId;
          return (
            <g key={`lastmark-${idx}`} style={{ pointerEvents: "none" }}>
              {isLatest && (
                <motion.circle
                  cx={x}
                  cy={y}
                  fill="none"
                  stroke={color}
                  strokeWidth={0.028}
                  initial={{ r: 0.16, opacity: 0.85 }}
                  animate={{
                    r: [0.16, 0.38, 0.16],
                    opacity: [0.85, 0, 0.85],
                  }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              )}
              {/* paper-colored ring to lift the badge off the line */}
              <circle
                cx={x}
                cy={y}
                r={0.135}
                fill="#FBF4DD"
                stroke={color}
                strokeWidth={0.018}
                opacity={0.95}
              />
              {/* solid color disc in player color */}
              <motion.circle
                cx={x}
                cy={y}
                r={0.105}
                fill={color}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
              />
              {/* tiny paper-white dot to mark the badge clearly */}
              <circle
                cx={x}
                cy={y}
                r={0.035}
                fill="#FBF4DD"
              />
            </g>
          );
        })}

        {/* Hover / drag preview line */}
        {(() => {
          const previewId = dragPreview ?? hoverLine;
          if (!previewId || state.lines.has(previewId)) return null;
          const { orientation, r, c } = parseLineId(previewId);
          const { x1, y1, x2, y2 } =
            orientation === "h" ? hLineCoords(r, c) : vLineCoords(r, c);
          return (
            <motion.line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={turnColor}
              strokeWidth={LINE_W}
              strokeLinecap="round"
              strokeDasharray="0.06 0.06"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ duration: 0.12 }}
            />
          );
        })()}

        {/* Hit areas (transparent, big stroke) for line tap */}
        {hLines.map(({ id, r, c }) => {
          const { x1, y1, x2, y2 } = hLineCoords(r, c);
          const drawn = state.lines.has(id);
          return (
            <line
              key={`hh-${id}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="transparent"
              strokeWidth={HIT_W}
              strokeLinecap="round"
              style={{ cursor: drawn || state.isGameOver ? "default" : "pointer" }}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse" && !drawn) setHoverLine(id);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse" && hoverLine === id) setHoverLine(null);
              }}
              onClick={() => handleLineClick(id)}
            />
          );
        })}
        {vLines.map(({ id, r, c }) => {
          const { x1, y1, x2, y2 } = vLineCoords(r, c);
          const drawn = state.lines.has(id);
          return (
            <line
              key={`vh-${id}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="transparent"
              strokeWidth={HIT_W}
              strokeLinecap="round"
              style={{ cursor: drawn || state.isGameOver ? "default" : "pointer" }}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse" && !drawn) setHoverLine(id);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse" && hoverLine === id) setHoverLine(null);
              }}
              onClick={() => handleLineClick(id)}
            />
          );
        })}

        {/* Dots — small dark pen pokes on the paper */}
        {Array.from({ length: N + 1 }).map((_, r) =>
          Array.from({ length: N + 1 }).map((_, c) => {
            const isActive = dragStart?.r === r && dragStart?.c === c;
            return (
              <g key={`d-${r}-${c}`}>
                {/* Invisible larger hit area */}
                <circle
                  cx={c}
                  cy={r}
                  r={DOT_HIT_R}
                  fill="transparent"
                  style={{
                    cursor: state.isGameOver ? "default" : "grab",
                    touchAction: "none",
                  }}
                  onPointerDown={onDotDown(r, c)}
                />
                <motion.circle
                  cx={c}
                  cy={r}
                  r={DOT_R}
                  fill={isActive ? turnColor : "var(--bone)"}
                  initial={false}
                  animate={{
                    scale: isActive ? 1.6 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  style={{ pointerEvents: "none" }}
                />
                {isActive && (
                  <motion.circle
                    cx={c}
                    cy={r}
                    r={DOT_R}
                    fill="none"
                    stroke={turnColor}
                    strokeWidth={0.015}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 4, opacity: 0 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "easeOut" }}
                    style={{ pointerEvents: "none" }}
                  />
                )}
              </g>
            );
          })
        )}
      </svg>

      {/* Waiting overlay — only in multiplayer when it's not our turn */}
      <AnimatePresence>
        {mp.enabled && mp.status === "connected" && locked && !state.isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div
              className="px-4 py-2 rounded-full border flex items-center gap-2.5 text-[11px] uppercase tracking-[0.18em] text-bone"
              style={{
                borderColor: "var(--border-strong)",
                background: "rgba(247, 239, 214, 0.85)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                boxShadow: "0 8px 24px -16px rgba(60, 40, 10, 0.45)",
              }}
            >
              <motion.span
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="glow-dot"
                style={{
                  background: settings.colors.p2,
                  boxShadow: `0 0 10px ${settings.colors.p2}`,
                }}
              />
              waiting for {mp.peerProfile?.name ?? "opponent"}…
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Brackets() {
  const cls =
    "absolute w-3 h-3 pointer-events-none";
  return (
    <>
      <span
        className={`${cls} top-1.5 left-1.5 border-t border-l`}
        style={{ borderColor: "var(--border-strong)" }}
      />
      <span
        className={`${cls} top-1.5 right-1.5 border-t border-r`}
        style={{ borderColor: "var(--border-strong)" }}
      />
      <span
        className={`${cls} bottom-1.5 left-1.5 border-b border-l`}
        style={{ borderColor: "var(--border-strong)" }}
      />
      <span
        className={`${cls} bottom-1.5 right-1.5 border-b border-r`}
        style={{ borderColor: "var(--border-strong)" }}
      />
    </>
  );
}
