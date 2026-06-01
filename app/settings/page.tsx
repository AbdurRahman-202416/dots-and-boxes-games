"use client";

import { useSettings } from "@/lib/SettingsContext";
import { useGame } from "@/lib/GameContext";
import { GRID_SIZES, SYMBOL_PRESETS, THEME_PRESETS, ColorScheme } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function SettingsPage() {
  const { settings, updateSettings, hydrated } = useSettings();
  const { resetGame } = useGame();

  if (!hydrated) {
    return <div className="px-5 md:px-10 py-10 text-bone-dim">Loading…</div>;
  }

  const setColors = (next: Partial<ColorScheme>) =>
    updateSettings({ colors: { ...settings.colors, ...next } });

  return (
    <div className="px-5 md:px-10 pt-2 pb-16 flex-1">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 md:mb-14">
          <div className="text-[10px] uppercase tracking-[0.18em] text-bone-mute">
            section / studio
          </div>
          <h1 className="italic-display text-5xl md:text-7xl mt-2 tracking-[-0.04em] leading-[0.9]">
            tune the
            <br />
            <span className="text-bone-dim">arena</span>.
          </h1>
          <p className="mt-5 max-w-prose text-bone-dim text-sm md:text-[15px] leading-relaxed">
            Set the players, claim a palette, and pick a grid that suits your evening.
            Every change saves itself.
          </p>
        </header>

        {/* THEME / COLORS */}
        <section className="mb-12">
          <SectionHead title="palette" hint="pick a mood — or compose your own" />
          <ThemeStudio
            colors={settings.colors}
            onPick={(scheme) => updateSettings({ colors: scheme })}
            onAdjust={setColors}
          />
        </section>

        {/* PLAYERS */}
        <section className="mb-12">
          <SectionHead title="players" hint="name & glyph" />
          <div className="grid md:grid-cols-2 gap-5">
            <PlayerEditor
              index={0}
              color={settings.colors.p1}
              name={settings.player1.name}
              symbol={settings.player1.symbol}
              onName={(n) => updateSettings({ player1: { ...settings.player1, name: n } })}
              onSymbol={(s) => updateSettings({ player1: { ...settings.player1, symbol: s } })}
            />
            <PlayerEditor
              index={1}
              color={settings.colors.p2}
              name={settings.player2.name}
              symbol={settings.player2.symbol}
              onName={(n) => updateSettings({ player2: { ...settings.player2, name: n } })}
              onSymbol={(s) => updateSettings({ player2: { ...settings.player2, symbol: s } })}
            />
          </div>
        </section>

        {/* GRID SIZE */}
        <section className="mb-12">
          <SectionHead title="grid scale" hint="changing size resets the round" />
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
            {GRID_SIZES.map((s) => {
              const active = settings.gridSize === s;
              return (
                <motion.button
                  key={s}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => updateSettings({ gridSize: s })}
                  className="relative h-[88px] md:h-24 rounded-xl border transition-colors flex flex-col items-center justify-center gap-1 overflow-hidden"
                  style={{
                    borderColor: active ? settings.colors.p1 : "var(--border)",
                    background: active ? "rgba(255, 248, 220, 0.55)" : "transparent",
                  }}
                >
                  <MiniGrid n={s} accent={settings.colors.p1} active={active} />
                  <div className="italic-display text-2xl md:text-2xl relative z-10">
                    {s}×{s}
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.18em] text-bone-mute tabular relative z-10">
                    {s * s} boxes
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        <div className="dashed-edge mb-8" />

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" onClick={() => resetGame()} className="btn-primary">
            <span className="relative z-10">start fresh round →</span>
            <span className="sweep" style={{ background: settings.colors.p1 }} />
          </Link>
          <Link href="/about" className="btn-ghost">
            learn the game
          </Link>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-4 md:mb-5 gap-4">
      <div className="flex items-baseline gap-3">
        <h2 className="italic-display text-2xl md:text-[28px]">{title}</h2>
      </div>
      {hint && (
        <div className="text-[10px] uppercase tracking-[0.18em] text-bone-mute text-right">
          {hint}
        </div>
      )}
    </div>
  );
}

function MiniGrid({ n, accent, active }: { n: number; accent: string; active: boolean }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 grid p-3 gap-[2px] opacity-30"
      style={{
        gridTemplateColumns: `repeat(${n}, 1fr)`,
        gridTemplateRows: `repeat(${n}, 1fr)`,
      }}
    >
      {Array.from({ length: n * n }).map((_, i) => (
        <div
          key={i}
          className="border-[0.5px]"
          style={{
            borderColor: active ? accent : "var(--border)",
            background: active && i === 0 ? `${accent}33` : "transparent",
          }}
        />
      ))}
    </div>
  );
}

function ThemeStudio({
  colors,
  onPick,
  onAdjust,
}: {
  colors: ColorScheme;
  onPick: (c: ColorScheme) => void;
  onAdjust: (partial: Partial<ColorScheme>) => void;
}) {
  const [tab, setTab] = useState<"presets" | "custom">("presets");

  const activePreset = useMemo(
    () =>
      THEME_PRESETS.find(
        (t) =>
          t.colors.p1.toLowerCase() === colors.p1.toLowerCase() &&
          t.colors.p2.toLowerCase() === colors.p2.toLowerCase() &&
          t.colors.accent.toLowerCase() === colors.accent.toLowerCase()
      )?.id ?? null,
    [colors]
  );

  return (
    <div className="card p-4 md:p-6">
      {/* live preview */}
      <ThemePreview colors={colors} />

      {/* tab strip */}
      <div className="mt-5 mb-4 flex items-center gap-1 p-1 rounded-full border border-ink-500/60 bg-ink-800/40 w-fit text-[11px] uppercase tracking-[0.18em]">
        {(["presets", "custom"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="relative px-4 py-1.5 rounded-full text-bone-dim hover:text-bone transition-colors"
          >
            <span className="relative z-10">{t}</span>
            {tab === t && (
              <motion.span
                layoutId="theme-tab"
                className="absolute inset-0 rounded-full"
                style={{
                  background: "rgba(28,22,5,0.07)",
                  border: "1px solid rgba(28,22,5,0.12)",
                }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "presets" ? (
          <motion.div
            key="presets"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {THEME_PRESETS.map((preset) => {
              const isActive = activePreset === preset.id;
              return (
                <motion.button
                  key={preset.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onPick(preset.colors)}
                  className="text-left p-3 rounded-xl border transition-all relative overflow-hidden group"
                  style={{
                    borderColor: isActive ? preset.colors.p1 : "var(--border)",
                    background: isActive ? "rgba(255, 248, 220, 0.6)" : "transparent",
                  }}
                >
                  <div className="flex gap-1 mb-2.5">
                    <span
                      className="swatch w-7 h-7"
                      style={{ background: preset.colors.p1 }}
                    />
                    <span
                      className="swatch w-7 h-7"
                      style={{ background: preset.colors.p2 }}
                    />
                    <span
                      className="swatch w-4 h-7"
                      style={{ background: preset.colors.accent }}
                    />
                  </div>
                  <div className="italic-display text-base leading-tight">
                    {preset.name}
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.18em] text-bone-mute mt-1">
                    {preset.mood}
                  </div>
                  {isActive && (
                    <motion.span
                      layoutId="theme-active"
                      className="absolute top-2 right-2 text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded-full"
                      style={{ background: preset.colors.p1, color: "#F7EFD6" }}
                    >
                      on
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="custom"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid sm:grid-cols-3 gap-3"
          >
            <ColorInput
              label="player one"
              caption="primary"
              value={colors.p1}
              onChange={(v) => onAdjust({ p1: v })}
            />
            <ColorInput
              label="player two"
              caption="rival"
              value={colors.p2}
              onChange={(v) => onAdjust({ p2: v })}
            />
            <ColorInput
              label="accent"
              caption="highlights"
              value={colors.accent}
              onChange={(v) => onAdjust({ accent: v })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThemePreview({ colors }: { colors: ColorScheme }) {
  return (
    <div className="relative rounded-xl border border-ink-500/70 bg-ink-900/60 p-4 md:p-5 overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl pointer-events-none"
        style={{ background: colors.p1, opacity: 0.18 }}
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -left-12 w-60 h-60 rounded-full blur-3xl pointer-events-none"
        style={{ background: colors.p2, opacity: 0.15 }}
      />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-bone-mute mb-1">
            live preview
          </div>
          <div className="italic-display text-xl md:text-2xl">arena · 5×5</div>
        </div>
        <div className="flex gap-2.5">
          <PreviewChip color={colors.p1} label="P/01" symbol="◆" />
          <PreviewChip color={colors.p2} label="P/02" symbol="✦" />
        </div>
      </div>

      {/* mini board preview */}
      <div
        className="relative mt-4 grid grid-cols-5 gap-[3px] p-2 rounded-lg border border-ink-500/60 max-w-[260px]"
        style={{ background: "rgba(255, 248, 220, 0.6)" }}
      >
        {Array.from({ length: 25 }).map((_, i) => {
          const fillIdx = [0, 1, 5, 6, 12, 18].includes(i);
          const isP1 = [0, 5, 12].includes(i);
          const owner = fillIdx ? (isP1 ? colors.p1 : colors.p2) : null;
          return (
            <div
              key={i}
              className="aspect-square rounded-[3px] border-[0.5px]"
              style={{
                borderColor: "var(--border-strong)",
                background: owner ? `${owner}25` : "transparent",
              }}
            >
              {owner && (
                <div
                  className="w-full h-full grid place-items-center text-[10px] tabular"
                  style={{ color: owner }}
                >
                  {isP1 ? "◆" : "✦"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PreviewChip({ color, label, symbol }: { color: string; label: string; symbol: string }) {
  return (
    <div
      className="px-2.5 py-1.5 rounded-full border flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em]"
      style={{ borderColor: color, color, background: `${color}10` }}
    >
      <span className="no-liga text-sm leading-none" style={{ fontWeight: 600 }}>
        {symbol}
      </span>
      <span>{label}</span>
    </div>
  );
}

function ColorInput({
  label,
  caption,
  value,
  onChange,
}: {
  label: string;
  caption: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block p-3 rounded-xl border border-ink-500/70 bg-ink-900/40">
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-ink-400 shrink-0">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={`${label} color`}
          />
          <span
            className="absolute inset-0 pointer-events-none"
            style={{ background: value }}
          />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-bone-mute">
            {label}
          </div>
          <div className="italic-display text-base leading-tight">{caption}</div>
          <div className="text-[11px] text-bone-dim tabular uppercase mt-0.5">
            {value}
          </div>
        </div>
      </div>
    </label>
  );
}

function PlayerEditor({
  index,
  color,
  name,
  symbol,
  onName,
  onSymbol,
}: {
  index: 0 | 1;
  color: string;
  name: string;
  symbol: string;
  onName: (n: string) => void;
  onSymbol: (s: string) => void;
}) {
  return (
    <div
      className="card p-5 md:p-6 relative overflow-hidden"
      style={{ borderColor: "var(--border)" }}
    >
      <div
        aria-hidden
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: color, opacity: 0.1 }}
      />

      <div className="relative">
        <div
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] mb-3"
          style={{ color }}
        >
          <span className="glow-dot inline-block" style={{ background: color }} />
          Player / 0{index + 1}
        </div>

        <label className="block">
          <div className="text-[10px] uppercase tracking-[0.18em] text-bone-mute mb-1.5">
            display name
          </div>
          <input
            value={name}
            onChange={(e) => onName(e.target.value.slice(0, 18))}
            placeholder="Enter a name"
            className="w-full bg-transparent border-b border-ink-500 focus:border-bone outline-none py-2 text-2xl italic-display tracking-[-0.035em]"
            style={{ color }}
          />
        </label>

        <div className="mt-5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-bone-mute mb-2.5">
            symbol — emoji, initial, or pick a glyph
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 no-liga border"
              style={{
                borderColor: color,
                color,
                background: `${color}10`,
                fontWeight: 600,
              }}
            >
              {symbol || "?"}
            </div>
            <input
              value={symbol}
              onChange={(e) => {
                const val = Array.from(e.target.value)[0] ?? "";
                onSymbol(val);
              }}
              placeholder="Type any character"
              className="flex-1 bg-transparent border-b border-ink-500 focus:border-bone outline-none py-2 text-lg"
              maxLength={4}
            />
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {SYMBOL_PRESETS.map((s) => {
              const active = s === symbol;
              return (
                <button
                  key={s}
                  onClick={() => onSymbol(s)}
                  className="aspect-square rounded-lg text-lg transition-colors no-liga border"
                  style={{
                    borderColor: active ? color : "var(--border)",
                    color: active ? color : "var(--text)",
                    background: active ? "rgba(255, 248, 220, 0.6)" : "transparent",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
