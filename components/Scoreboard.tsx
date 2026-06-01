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

function PlayerSide({
  name,
  symbol,
  score,
  active,
  color,
  badge,
  align,
}: {
  name: string;
  symbol: string;
  score: number;
  active: boolean;
  color: string;
  badge: string;
  align: "left" | "right";
}) {
  const isLeft = align === "left";
  return (
    <div
      className={`flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 ${
        isLeft ? "" : "flex-row-reverse text-right"
      }`}
    >
      <motion.span
        animate={{
          scale: active ? [1, 1.3, 1] : 1,
          opacity: active ? 1 : 0.45,
        }}
        transition={{
          duration: 1.2,
          repeat: active ? Infinity : 0,
          ease: "easeInOut",
        }}
        className="glow-dot shrink-0"
        style={{
          background: color,
          boxShadow: active ? `0 0 10px ${color}` : "none",
        }}
      />
      <div
        className={`min-w-0 flex-1 ${isLeft ? "" : "flex flex-col items-end"}`}
      >
        <div
          className={`flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.16em] text-bone-mute truncate ${
            isLeft ? "" : "flex-row-reverse"
          }`}
        >
          <span className="truncate" title={name}>
            {name}
          </span>
          {badge && (
            <span className="hidden sm:inline opacity-60">· {badge}</span>
          )}
        </div>
        <div
          className={`flex items-baseline gap-1.5 ${
            isLeft ? "" : "flex-row-reverse"
          }`}
        >
          <div
            className="text-2xl sm:text-[28px] font-light leading-none tabular"
            style={{ color }}
          >
            <AnimatedNumber value={score} color={color} />
          </div>
        </div>
      </div>
      <div
        className="text-base sm:text-lg leading-none shrink-0 select-none no-liga"
        style={{ color, fontWeight: 600 }}
        aria-hidden
      >
        {symbol}
      </div>
    </div>
  );
}

export function Scoreboard() {
  const { state } = useGame();
  const { settings } = useSettings();
  const mp = useMultiplayer();
  const total = state.gridSize * state.gridSize;
  const remaining = total - (state.scores[0] + state.scores[1]);

  const badgeFor = (idx: PlayerIndex): string => {
    if (!mp.enabled) return "";
    if (mp.myPlayerIndex == null) return "";
    return mp.myPlayerIndex === idx ? "you" : "opponent";
  };

  const turnIdx = state.isGameOver ? null : state.currentPlayer;

  return (
    <div className="w-full max-w-[660px] mx-auto">
      <div
        className="relative rounded-full border overflow-hidden flex items-stretch px-3 py-2 sm:py-2.5 gap-2 sm:gap-3"
        style={{
          borderColor: "var(--border)",
          background:
            "linear-gradient(180deg, rgba(255,248,220,0.55) 0%, rgba(247,239,214,0.35) 100%)",
          boxShadow:
            "0 1px 0 rgba(255, 248, 220, 0.6) inset, 0 1px 2px rgba(60, 40, 10, 0.06), 0 8px 22px -18px rgba(60, 40, 10, 0.25)",
        }}
      >
        {/* active-side soft wash */}
        <motion.div
          aria-hidden
          className="absolute inset-y-0 pointer-events-none"
          initial={false}
          animate={{
            left: turnIdx === 0 ? "0%" : turnIdx === 1 ? "50%" : "25%",
            opacity: turnIdx == null ? 0 : 1,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 26 }}
          style={{
            width: "50%",
            background: `linear-gradient(${
              turnIdx === 1 ? "270deg" : "90deg"
            }, ${
              turnIdx === 0 ? settings.colors.p1 : settings.colors.p2
            }22, transparent)`,
          }}
        />

        <div className="relative flex items-center w-full gap-2 sm:gap-3">
          <PlayerSide
            name={mp.player1Name}
            symbol={mp.player1Symbol}
            score={state.scores[0]}
            active={turnIdx === 0}
            color={settings.colors.p1}
            badge={badgeFor(0)}
            align="left"
          />

          <div className="flex flex-col items-center justify-center shrink-0 px-1">
            <div className="text-[9px] uppercase tracking-[0.16em] text-bone-mute tabular">
              {remaining}
            </div>
            <div className="text-[8px] uppercase tracking-[0.18em] text-bone-mute/70">
              left
            </div>
          </div>

          <PlayerSide
            name={mp.player2Name}
            symbol={mp.player2Symbol}
            score={state.scores[1]}
            active={turnIdx === 1}
            color={settings.colors.p2}
            badge={badgeFor(1)}
            align="right"
          />
        </div>
      </div>
    </div>
  );
}
