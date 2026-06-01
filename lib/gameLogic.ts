import { GameSettings, GameState, LineId, Move, PlayerIndex } from "./types";

export function lineId(orientation: "h" | "v", r: number, c: number): LineId {
  return `${orientation}-${r}-${c}`;
}

export function parseLineId(id: LineId): { orientation: "h" | "v"; r: number; c: number } {
  const [o, r, c] = id.split("-");
  return { orientation: o as "h" | "v", r: parseInt(r, 10), c: parseInt(c, 10) };
}

export function createInitialState(gridSize: number): GameState {
  return {
    gridSize,
    lines: new Set<LineId>(),
    boxes: Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => null as PlayerIndex | null)
    ),
    currentPlayer: 0,
    scores: [0, 0],
    history: [],
    isGameOver: false,
    lastMove: null,
    lastMovePerPlayer: [null, null],
  };
}

function isBoxComplete(
  r: number,
  c: number,
  lines: Set<LineId>
): boolean {
  return (
    lines.has(lineId("h", r, c)) &&
    lines.has(lineId("h", r + 1, c)) &&
    lines.has(lineId("v", r, c)) &&
    lines.has(lineId("v", r, c + 1))
  );
}

function adjacentBoxes(id: LineId, gridSize: number): { r: number; c: number }[] {
  const { orientation, r, c } = parseLineId(id);
  const result: { r: number; c: number }[] = [];
  if (orientation === "h") {
    if (r - 1 >= 0) result.push({ r: r - 1, c });
    if (r < gridSize) result.push({ r, c });
  } else {
    if (c - 1 >= 0) result.push({ r, c: c - 1 });
    if (c < gridSize) result.push({ r, c });
  }
  return result;
}

export function applyMove(state: GameState, id: LineId): GameState {
  if (state.isGameOver || state.lines.has(id)) return state;

  const newLines = new Set(state.lines);
  newLines.add(id);

  const newBoxes = state.boxes.map((row) => [...row]);
  const boxesCompleted: { r: number; c: number }[] = [];

  for (const { r, c } of adjacentBoxes(id, state.gridSize)) {
    if (newBoxes[r][c] === null && isBoxComplete(r, c, newLines)) {
      newBoxes[r][c] = state.currentPlayer;
      boxesCompleted.push({ r, c });
    }
  }

  const newScores: [number, number] = [state.scores[0], state.scores[1]];
  newScores[state.currentPlayer] += boxesCompleted.length;

  const totalBoxes = state.gridSize * state.gridSize;
  const filled = newScores[0] + newScores[1];
  const isGameOver = filled === totalBoxes;

  const move: Move = {
    lineId: id,
    player: state.currentPlayer,
    boxesCompleted: boxesCompleted.map((b) => ({ row: b.r, col: b.c })),
  };

  // Completing a box buys another turn; otherwise the turn passes.
  const nextPlayer: PlayerIndex =
    boxesCompleted.length > 0 ? state.currentPlayer : ((1 - state.currentPlayer) as PlayerIndex);

  const lastMovePerPlayer: [Move | null, Move | null] = [
    state.lastMovePerPlayer[0],
    state.lastMovePerPlayer[1],
  ];
  lastMovePerPlayer[state.currentPlayer] = move;

  return {
    ...state,
    lines: newLines,
    boxes: newBoxes,
    scores: newScores,
    currentPlayer: nextPlayer,
    history: [...state.history, move],
    isGameOver,
    lastMove: move,
    lastMovePerPlayer,
  };
}

export function totalLines(gridSize: number): number {
  return 2 * gridSize * (gridSize + 1);
}

export function winner(state: GameState): PlayerIndex | "tie" | null {
  if (!state.isGameOver) return null;
  if (state.scores[0] > state.scores[1]) return 0;
  if (state.scores[1] > state.scores[0]) return 1;
  return "tie";
}
