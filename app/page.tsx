"use client";

import { GameBoard } from "@/components/GameBoard";
import { GameOverModal } from "@/components/GameOverModal";
import { MultiplayerPanel } from "@/components/MultiplayerPanel";
import { Scoreboard } from "@/components/Scoreboard";
import { useGame } from "@/lib/GameContext";
import { useMultiplayer } from "@/lib/MultiplayerContext";

export default function Home() {
  const { state } = useGame();
  const mp = useMultiplayer();

  const hintText =
    mp.enabled && mp.status === "connected"
      ? mp.isMyTurn
        ? "your turn · tap a line or swipe between dots"
        : "opponent is thinking…"
      : "tap a line · or swipe between dots";

  return (
    <div className="px-4 sm:px-5 md:px-10 pt-2 pb-4 sm:pb-6 flex-1 flex flex-col gap-2 sm:gap-3 min-h-0">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-bone-mute gap-3">
        <span
          className="px-2 py-1 rounded-full border tabular shrink-0"
          style={{
            borderColor: "var(--border-strong)",
            background: "rgba(247, 239, 214, 0.5)",
          }}
        >
          {state.gridSize} × {state.gridSize}
        </span>
        <span className="tabular">
          move {String(state.history.length).padStart(3, "0")}
        </span>
      </div>

      <MultiplayerPanel />

      <Scoreboard />

      <div className="flex-1 flex items-center justify-center min-h-0 py-1">
        <GameBoard />
      </div>

      <div className="text-center text-[10px] uppercase tracking-[0.18em] text-bone-mute pointer-events-none">
        {hintText}
      </div>

      <GameOverModal />
    </div>
  );
}
