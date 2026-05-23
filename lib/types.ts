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
  { id: "atelier", name: "Atelier", mood: "house default", colors: { p1: "#C8FF00", p2: "#FF4D6D", accent: "#5CE5FF" } },
  { id: "midnight", name: "Midnight Carnival", mood: "neon & gold", colors: { p1: "#5CE5FF", p2: "#FFB627", accent: "#C8FF00" } },
  { id: "rosewood", name: "Rosewood", mood: "warm dusk", colors: { p1: "#FF8A4C", p2: "#E84A5F", accent: "#FFD166" } },
  { id: "spirit", name: "Spirit Bloom", mood: "soft contrast", colors: { p1: "#3FE4A6", p2: "#FF6B9D", accent: "#A4B8FF" } },
  { id: "velvet", name: "Velvet Vault", mood: "royal calm", colors: { p1: "#BC9CFF", p2: "#FF7A45", accent: "#7DD3FC" } },
  { id: "glacier", name: "Glacier", mood: "cool minimal", colors: { p1: "#7DD3FC", p2: "#FB7185", accent: "#A4B8FF" } },
  { id: "bone", name: "Bone & Coral", mood: "editorial", colors: { p1: "#F5F1E8", p2: "#FF4D6D", accent: "#FFB627" } },
  { id: "atomic", name: "Atomic", mood: "duel of greens", colors: { p1: "#C8FF00", p2: "#5CE5FF", accent: "#FFB627" } },
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
}

export interface DotCoord {
  r: number;
  c: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  player1: { name: "Player One", symbol: "◆" },
  player2: { name: "Player Two", symbol: "✦" },
  gridSize: 5,
  colors: THEME_PRESETS[0].colors,
};

export const SYMBOL_PRESETS = ["◆", "✦", "✿", "★", "♥", "♠", "▲", "●", "■", "✚", "✱", "❖"];

export const GRID_SIZES = [3, 4, 5, 6, 7, 8];
