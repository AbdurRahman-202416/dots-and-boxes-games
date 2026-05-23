"use client";

import { useGame } from "@/lib/GameContext";
import { useSettings } from "@/lib/SettingsContext";
import { useMultiplayer } from "@/lib/MultiplayerContext";
import { AnimatePresence, motion } from "framer-motion";
import { PlayerIndex } from "@/lib/types";

function AnimatedNumber({ value, color }: { value: number; color: string }) {
  return (
    <div className="relative h-[1em] overflow-hidden tabular leading-none">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="block"
          style={{ color }}
        >
          {value.toString().padStart(2, "0")}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function PlayerCard({
  name,
  symbol,
  score,
  active,
  totalNeeded,
  color,
  badge,
}: {
  name: string;
  symbol: string;
  score: number;
  active: boolean;
  totalNeeded: number;
  color: string;
  badge: string;
}) {
  return (
    <motion.div
      style={{
        borderColor: active ? color : "var(--border)",
        backgroundColor: active ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0)",
        boxShadow: active ? `0 0 0 1px ${color}33, 0 10px 30px -18px ${color}` : "none",
      }}
      animate={{
        borderColor: active ? color : "rgba(35, 35, 48, 1)",
        backgroundColor: active ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0)",
      }}
      transition={{ duration: 0.4 }}
      className="relative p-4 md:p-5 border rounded-2xl flex-1 min-w-0 overflow-hidden"
    >
      {/* radial color hint */}
      {active && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: color, opacity: 0.12 }}
        />
      )}

      <div className="flex items-start justify-between gap-3 relative">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <motion.span
              animate={{
                scale: active ? [1, 1.25, 1] : 1,
                opacity: active ? 1 : 0.5,
              }}
              transition={{ duration: 1, repeat: active ? Infinity : 0, ease: "easeInOut" }}
              className="glow-dot inline-block"
              style={{ background: color, boxShadow: active ? `0 0 10px ${color}` : "none" }}
            />
            <span className="text-[10px] uppercase tracking-[0.18em] text-bone-dim truncate">
              {active ? "in turn" : "waiting"}
              {badge ? ` · ${badge}` : ""}
            </span>
          </div>
          <div className="italic-display text-2xl md:text-[28px] truncate" title={name}>
            {name}
          </div>
        </div>
        <div
          className="text-3xl md:text-4xl leading-none shrink-0 select-none no-liga"
          style={{ color, fontWeight: 600 }}
        >
          {symbol}
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3 relative">
        <div
          className="text-[44px] md:text-[60px] font-light leading-none tabular"
          style={{ color }}
        >
          <AnimatedNumber value={score} color={color} />
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-bone-mute mb-1.5 tabular">
          of {totalNeeded}
        </div>
      </div>
    </motion.div>
  );
}

export function Scoreboard() {
  const { state } = useGame();
  const { settings } = useSettings();
  const mp = useMultiplayer();
  const total = state.gridSize * state.gridSize;
  const remaining = total - (state.scores[0] + state.scores[1]);

  // In multiplayer, badge shows "you" / "opponent" relative to local user.
  // In local play, no badge — names alone are enough.
  const badgeFor = (idx: PlayerIndex): string => {
    if (!mp.enabled) return "";
    if (mp.myPlayerIndex == null) return "";
    return mp.myPlayerIndex === idx ? "you" : "opponent";
  };

  return (
    <div className="w-full max-w-[660px] mx-auto">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-bone-mute mb-3">
        <span>scoreboard</span>
        <motion.span
          key={state.history.length}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="tabular"
        >
          move {String(state.history.length).padStart(3, "0")}
        </motion.span>
        <span className="tabular">{remaining} boxes left</span>
      </div>

      <div className="flex gap-3 md:gap-4">
        <PlayerCard
          name={mp.player1Name}
          symbol={mp.player1Symbol}
          score={state.scores[0]}
          active={!state.isGameOver && state.currentPlayer === 0}
          totalNeeded={total}
          color={settings.colors.p1}
          badge={badgeFor(0)}
        />
        <PlayerCard
          name={mp.player2Name}
          symbol={mp.player2Symbol}
          score={state.scores[1]}
          active={!state.isGameOver && state.currentPlayer === 1}
          totalNeeded={total}
          color={settings.colors.p2}
          badge={badgeFor(1)}
        />
      </div>
    </div>
  );
}
