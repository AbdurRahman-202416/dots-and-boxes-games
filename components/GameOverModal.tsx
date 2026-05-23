"use client";

import { useGame } from "@/lib/GameContext";
import { useSettings } from "@/lib/SettingsContext";
import { useMultiplayer } from "@/lib/MultiplayerContext";
import { winner } from "@/lib/gameLogic";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Confetti } from "./Confetti";

export function GameOverModal() {
  const { state } = useGame();
  const { settings } = useSettings();
  const mp = useMultiplayer();
  const [open, setOpen] = useState(false);
  const w = useMemo(() => winner(state), [state]);

  useEffect(() => {
    if (state.isGameOver) {
      const t = setTimeout(() => setOpen(true), 380);
      return () => clearTimeout(t);
    }
    setOpen(false);
  }, [state.isGameOver]);

  const winnerLabel =
    w === "tie"
      ? "a draw"
      : w === 0
      ? mp.player1Name
      : w === 1
      ? mp.player2Name
      : "";
  const winnerColor =
    w === 0 ? settings.colors.p1 : w === 1 ? settings.colors.p2 : "var(--text)";

  const onPlayAgain = () => {
    setOpen(false);
    setTimeout(() => mp.submitReset(), 220);
  };

  return (
    <>
      <Confetti active={open && w !== "tie"} />
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-over-title"
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: "rgba(7, 7, 11, 0.78)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
              }}
              onClick={onPlayAgain}
            />

            <motion.div
              initial={{ y: -60, scale: 0.94, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 40, scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 24 }}
              className="relative w-full max-w-[520px] card p-7 md:p-9 overflow-hidden"
            >
              {/* radial bloom in the winner's hue */}
              <div
                aria-hidden
                className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none"
                style={{ background: winnerColor, opacity: 0.18 }}
              />

              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-bone-mute mb-6 relative">
                <span>round complete</span>
                <span className="tabular">
                  {String(state.scores[0]).padStart(2, "0")} ·{" "}
                  {String(state.scores[1]).padStart(2, "0")}
                </span>
              </div>

              <motion.h2
                id="game-over-title"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="italic-display text-5xl md:text-6xl leading-[0.95] tracking-[-0.035em] relative"
              >
                {w === "tie" ? (
                  <>
                    a perfectly
                    <br />
                    balanced draw.
                  </>
                ) : (
                  <>
                    <span style={{ color: winnerColor }}>{winnerLabel}</span>
                    <br />
                    <span className="text-bone-dim">claims the round.</span>
                  </>
                )}
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-7 hairline"
              />

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm relative">
                <ResultBlock
                  label={mp.player1Name}
                  symbol={mp.player1Symbol}
                  score={state.scores[0]}
                  color={settings.colors.p1}
                  emphasized={w === 0}
                />
                <ResultBlock
                  label={mp.player2Name}
                  symbol={mp.player2Symbol}
                  score={state.scores[1]}
                  color={settings.colors.p2}
                  emphasized={w === 1}
                />
              </div>

              <div className="mt-8 flex gap-3 relative">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onPlayAgain}
                  className="btn-primary flex-1 justify-center"
                >
                  <span className="relative z-10">play again →</span>
                  <span className="sweep" style={{ background: winnerColor }} />
                </motion.button>
                <button onClick={onPlayAgain} className="btn-ghost">
                  close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ResultBlock({
  label,
  symbol,
  score,
  color,
  emphasized,
}: {
  label: string;
  symbol: string;
  score: number;
  color: string;
  emphasized: boolean;
}) {
  return (
    <div
      className="relative p-3.5 rounded-xl border"
      style={{
        borderColor: emphasized ? color : "var(--border)",
        background: emphasized ? "rgba(255,255,255,0.025)" : "transparent",
      }}
    >
      <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-bone-mute">
        <span className="glow-dot inline-block" style={{ background: color }} />
        {emphasized ? "winner" : "rival"}
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-2">
        <span className="italic-display text-lg truncate" title={label}>
          {label}
        </span>
        <span style={{ color, fontWeight: 600 }} className="text-xl no-liga">
          {symbol}
        </span>
      </div>
      <div className="text-4xl mt-1 tabular leading-none" style={{ color }}>
        {String(score).padStart(2, "0")}
      </div>
    </div>
  );
}
