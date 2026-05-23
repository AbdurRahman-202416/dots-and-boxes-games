"use client";

import { GameBoard } from "@/components/GameBoard";
import { GameOverModal } from "@/components/GameOverModal";
import { MultiplayerPanel } from "@/components/MultiplayerPanel";
import { Scoreboard } from "@/components/Scoreboard";
import { useGame } from "@/lib/GameContext";
import { useSettings } from "@/lib/SettingsContext";
import { useMultiplayer } from "@/lib/MultiplayerContext";
import { motion } from "framer-motion";

export default function Home() {
  const { state } = useGame();
  const { settings } = useSettings();
  const mp = useMultiplayer();
  const turnColor =
    state.currentPlayer === 0 ? settings.colors.p1 : settings.colors.p2;
  const turnName =
    state.currentPlayer === 0 ? settings.player1.name : settings.player2.name;

  return (
    <div className="px-5 md:px-10 pt-2 pb-10 flex-1 flex flex-col gap-5">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-bone-mute">
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 rounded-full border border-ink-500/70 bg-ink-800/40 tabular">
            {state.gridSize} × {state.gridSize}
          </span>
          <span className="hidden sm:inline">
            {mp.enabled && mp.status === "connected" ? "live arena" : "arena"}
          </span>
        </div>
        <motion.div
          key={state.currentPlayer}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <span
            style={{ color: turnColor }}
            className="italic-display text-sm tracking-tight"
          >
            {turnName}&apos;s
          </span>
          <span>turn</span>
          <motion.span
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="glow-dot"
            style={{ background: turnColor, boxShadow: `0 0 10px ${turnColor}` }}
          />
        </motion.div>
      </div>

      <MultiplayerPanel />

      <Scoreboard />

      <div className="flex-1 flex items-center justify-center py-2">
        <GameBoard />
      </div>

      <GameOverModal />
    </div>
  );
}
