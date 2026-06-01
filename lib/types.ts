export type PlayerIndex = 0 | 1;

export interface Player {
  name: string;
  symbol: string;
}

export interface ColorScheme {
  p1: string;
  p2: string;
  accent: string;
}

export interface GameSettings {
  player1: Player;
  player2: Player;
  gridSize: number;
  colors: ColorScheme;
}

export interface ThemePreset {
  id: string;
  name: string;
  mood: string;
  colors: ColorScheme;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "inkwell", name: "Inkwell", mood: "classic two-pen", colors: { p1: "#1E40AF", p2: "#B91C1C", accent: "#B45309" } },
  { id: "atelier", name: "Atelier", mood: "soft editorial", colors: { p1: "#0F766E", p2: "#BE123C", accent: "#B45309" } },
  { id: "rosewood", name: "Rosewood", mood: "warm dusk", colors: { p1: "#9A3412", p2: "#BE123C", accent: "#A16207" } },
  { id: "spirit", name: "Spirit Bloom", mood: "soft contrast", colors: { p1: "#047857", p2: "#BE185D", accent: "#7C3AED" } },
  { id: "velvet", name: "Velvet Vault", mood: "royal calm", colors: { p1: "#5B21B6", p2: "#C2410C", accent: "#0369A1" } },
  { id: "glacier", name: "Glacier", mood: "cool minimal", colors: { p1: "#0369A1", p2: "#BE123C", accent: "#475569" } },
  { id: "field", name: "Field Notes", mood: "earthy", colors: { p1: "#365314", p2: "#9A3412", accent: "#92400E" } },
  { id: "midnight", name: "Midnight", mood: "moody ink", colors: { p1: "#1E1B4B", p2: "#7F1D1D", accent: "#78350F" } },
];

export type LineId = string;

export interface Move {
  lineId: LineId;
  player: PlayerIndex;
  boxesCompleted: { row: number; col: number }[];
}

export interface GameState {
  gridSize: number;
  lines: Set<LineId>;
  boxes: (PlayerIndex | null)[][];
  currentPlayer: PlayerIndex;
  scores: [number, number];
  history: Move[];
  isGameOver: boolean;
  lastMove: Move | null;
  /** Most recent move made by each player, indexed by player slot. */
  lastMovePerPlayer: [Move | null, Move | null];
}

export interface DotCoord {
  r: number;
  c: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  player1: { name: "Mina", symbol: "◆" },
  player2: { name: "Raju", symbol: "✦" },
  gridSize: 5,
  colors: THEME_PRESETS[0].colors,
};

export const SYMBOL_PRESETS = ["◆", "✦", "✿", "★", "♥", "♠", "▲", "●", "■", "✚", "✱", "❖"];

export const GRID_SIZES = [3, 4, 5, 6, 7, 8];
