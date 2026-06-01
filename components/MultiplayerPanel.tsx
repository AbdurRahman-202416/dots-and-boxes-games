"use client";

import { useMultiplayer } from "@/lib/MultiplayerContext";
import { useSettings } from "@/lib/SettingsContext";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { SYMBOL_PRESETS } from "@/lib/types";

type ModeChoice = "local" | "remote";

const NAME_MAX = 18;

export function MultiplayerPanel() {
  const mp = useMultiplayer();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ModeChoice>("local");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [symbolPickerOpen, setSymbolPickerOpen] = useState(false);

  const myColor =
    mp.role === "joiner" ? settings.colors.p2 : settings.colors.p1;
  const opponentColor =
    mp.role === "joiner" ? settings.colors.p1 : settings.colors.p2;

  const statusLabel: Record<typeof mp.status, string> = {
    idle: "same phone · pass & play",
    hosting: "creating secret code…",
    waiting: "waiting for your friend to join",
    joining: "joining…",
    reconnecting: "reconnecting to your room…",
    connected: "live · two phones",
    disconnected: "your friend left",
    error: "connection error",
  };

  const dotColor =
    mp.status === "connected"
      ? settings.colors.p1
      : mp.status === "error" || mp.status === "disconnected"
      ? settings.colors.p2
      : "var(--text-mute)";

  const copy = async (text: string, kind: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1400);
    } catch {
      // Clipboard blocked — the input remains selectable for manual copy
    }
  };

  return (
    <div className="w-full max-w-[660px] mx-auto">
      {/* status pill */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 h-11 card-flat hover:border-bone-mute/40 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <motion.span
            animate={{ scale: mp.status === "connected" ? [1, 1.3, 1] : 1 }}
            transition={{
              duration: 1.2,
              repeat: mp.status === "connected" ? Infinity : 0,
            }}
            className="glow-dot shrink-0"
            style={{
              background: dotColor,
              boxShadow: mp.status === "connected" ? `0 0 10px ${dotColor}` : "none",
            }}
          />
          <div className="text-left min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-bone-mute">
              session
            </div>
            <div className="text-[12px] text-bone truncate">
              {statusLabel[mp.status]}
              {mp.peerProfile && mp.status === "connected"
                ? ` · ${mp.myName} vs ${mp.peerProfile.name}`
                : ""}
            </div>
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-[0.18em] text-bone-dim">
          {open ? "hide" : mp.status === "idle" ? "choose mode" : "manage"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-2 card p-4 md:p-5">
              {mp.status === "idle" && (
                <div className="space-y-5">
                  {/* Mode switcher */}
                  <div className="grid grid-cols-2 gap-3">
                    <ModeCard
                      title="same phone"
                      caption="pass & play together"
                      active={mode === "local"}
                      color={settings.colors.p1}
                      onClick={() => setMode("local")}
                      icon={
                        <div className="flex gap-1">
                          <div
                            className="w-6 h-9 rounded-md border"
                            style={{ borderColor: settings.colors.p1 }}
                          />
                        </div>
                      }
                    />
                    <ModeCard
                      title="different phones"
                      caption="play with a secret code"
                      active={mode === "remote"}
                      color={settings.colors.p2}
                      onClick={() => setMode("remote")}
                      icon={
                        <div className="flex gap-1.5 items-center">
                          <div
                            className="w-5 h-8 rounded-sm border"
                            style={{ borderColor: settings.colors.p1 }}
                          />
                          <div className="w-3 h-px bg-bone-mute" />
                          <div
                            className="w-5 h-8 rounded-sm border"
                            style={{ borderColor: settings.colors.p2 }}
                          />
                        </div>
                      }
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    {mode === "local" ? (
                      <motion.div
                        key="local"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="text-[12px] text-bone-dim leading-relaxed"
                      >
                        You&apos;re already set. Hand the phone back and forth — Player&nbsp;1 plays,
                        then Player&nbsp;2. Names &amp; colours come straight from the studio settings.
                      </motion.div>
                    ) : (
                      <motion.div
                        key="remote"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <NameEditor
                          name={mp.myName}
                          symbol={mp.mySymbol}
                          color={settings.colors.p1}
                          onName={mp.setMyName}
                          onSymbol={mp.setMySymbol}
                          symbolOpen={symbolPickerOpen}
                          setSymbolOpen={setSymbolPickerOpen}
                          caption="how you'll appear on the other phone"
                        />
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* HOST */}
                          <div className="flex-1 p-4 rounded-xl border border-ink-500 bg-ink-900/50">
                            <div className="text-[10px] uppercase tracking-[0.18em] text-bone-mute mb-2">
                              option A · create the room
                            </div>
                            <p className="text-[12px] text-bone-dim leading-relaxed mb-3">
                              Tap below — we&apos;ll give you a short secret code. Share it
                              with your opponent on the other phone.
                            </p>
                            <button onClick={mp.hostGame} className="btn-primary w-full justify-center">
                              <span className="relative z-10">create secret code →</span>
                              <span className="sweep" style={{ background: settings.colors.p1 }} />
                            </button>
                          </div>

                          {/* JOIN */}
                          <div className="flex-1 p-4 rounded-xl border border-ink-500 bg-ink-900/50">
                            <div className="text-[10px] uppercase tracking-[0.18em] text-bone-mute mb-2">
                              option B · join with a code
                            </div>
                            <p className="text-[12px] text-bone-dim leading-relaxed mb-3">
                              Got a code from your opponent? Type the six letters and we&apos;ll
                              connect you instantly.
                            </p>
                            <div className="flex gap-2">
                              <input
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="e.g. X7KR9P"
                                maxLength={6}
                                className="flex-1 h-11 px-3 bg-ink-900/60 border border-ink-500 rounded-full text-center tabular text-base text-bone tracking-[0.18em] focus:border-bone-mute outline-none"
                              />
                              <button
                                onClick={() => joinCode && mp.joinGame(joinCode)}
                                disabled={joinCode.length < 4}
                                className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                join
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {(mp.status === "hosting" || mp.status === "waiting") && (
                <div className="space-y-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="italic-display text-xl">your secret code</h3>
                    <span
                      className="text-[10px] uppercase tracking-[0.18em] shrink-0"
                      style={{ color: settings.colors.p1 }}
                    >
                      hosting as {mp.myName || "—"}
                    </span>
                  </div>

                  <NameEditor
                    name={mp.myName}
                    symbol={mp.mySymbol}
                    color={settings.colors.p1}
                    onName={mp.setMyName}
                    onSymbol={mp.setMySymbol}
                    symbolOpen={symbolPickerOpen}
                    setSymbolOpen={setSymbolPickerOpen}
                    caption="this is the name your opponent will see"
                  />

                  {mp.roomCode ? (
                    <div
                      className="flex flex-col items-center text-center py-4 rounded-xl border"
                      style={{
                        borderColor: settings.colors.p1,
                        background: `linear-gradient(180deg, transparent, ${settings.colors.p1}10)`,
                      }}
                    >
                      <div className="text-[10px] uppercase tracking-[0.18em] text-bone-mute mb-2">
                        share this with your friend
                      </div>
                      <div
                        className="text-4xl md:text-5xl tracking-[0.18em] tabular select-all"
                        style={{ color: settings.colors.p1, fontWeight: 600 }}
                      >
                        {mp.roomCode}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => copy(mp.roomCode!, "code")}
                          className="btn-ghost"
                        >
                          {copied === "code" ? "copied ✓" : "copy code"}
                        </button>
                        {mp.shareUrl && (
                          <button
                            onClick={() => copy(mp.shareUrl!, "link")}
                            className="btn-ghost"
                          >
                            {copied === "link" ? "copied ✓" : "copy link"}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-[12px] text-bone-dim">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 rounded-full border-2 border-bone-mute border-t-transparent"
                      />
                      generating code…
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-bone-dim">
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                      className="glow-dot inline-block"
                      style={{ background: settings.colors.p1 }}
                    />
                    waiting for your friend to enter the code on their phone…
                  </div>

                  <button
                    onClick={mp.disconnect}
                    className="text-[10px] uppercase tracking-[0.18em] text-bone-mute hover:text-bone underline-offset-4 hover:underline"
                  >
                    cancel room
                  </button>
                </div>
              )}

              {mp.status === "joining" && (
                <div className="space-y-4">
                  <NameEditor
                    name={mp.myName}
                    symbol={mp.mySymbol}
                    color={settings.colors.p2}
                    onName={mp.setMyName}
                    onSymbol={mp.setMySymbol}
                    symbolOpen={symbolPickerOpen}
                    setSymbolOpen={setSymbolPickerOpen}
                    caption="how you'll show up to the host"
                  />
                  <div className="flex items-center gap-3 text-[12px] text-bone-dim">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-3 h-3 rounded-full border-2 border-bone-mute border-t-transparent"
                    />
                    shaking hands with the host…
                  </div>
                </div>
              )}

              {mp.status === "connected" && (
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="italic-display text-xl">
                      live ·{" "}
                      <span style={{ color: myColor }}>{mp.myName || "you"}</span>
                      <span className="text-bone-dim"> vs </span>
                      <span style={{ color: opponentColor }}>
                        {mp.peerProfile?.name || "opponent"}
                      </span>
                    </h3>
                    <button
                      onClick={mp.disconnect}
                      className="text-[10px] uppercase tracking-[0.18em] text-bone-mute hover:text-bone"
                    >
                      leave room
                    </button>
                  </div>

                  <NameEditor
                    name={mp.myName}
                    symbol={mp.mySymbol}
                    color={myColor}
                    onName={mp.setMyName}
                    onSymbol={mp.setMySymbol}
                    symbolOpen={symbolPickerOpen}
                    setSymbolOpen={setSymbolPickerOpen}
                    caption="editing here updates instantly on the other phone"
                  />

                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <PlayerChip
                      label="you"
                      name={mp.myName || "—"}
                      symbol={mp.mySymbol}
                      color={myColor}
                    />
                    <PlayerChip
                      label="opponent"
                      name={mp.peerProfile?.name ?? "waiting…"}
                      symbol={mp.peerProfile?.symbol ?? "·"}
                      color={opponentColor}
                    />
                  </div>

                  {mp.roomCode && (
                    <div className="text-[10px] uppercase tracking-[0.18em] text-bone-mute">
                      code <span className="text-bone tabular">{mp.roomCode}</span>
                    </div>
                  )}
                </div>
              )}

              {(mp.status === "disconnected" || mp.status === "error") && (
                <div className="space-y-3">
                  <p className="text-[12px] text-bone">
                    {mp.error
                      ? `Connection failed: ${mp.error}`
                      : "Your opponent has disconnected."}
                  </p>
                  <div className="flex gap-3">
                    <button onClick={mp.disconnect} className="btn-ghost">
                      reset
                    </button>
                    <button onClick={mp.hostGame} className="btn-primary">
                      <span className="relative z-10">host a new room →</span>
                      <span className="sweep" style={{ background: settings.colors.p1 }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModeCard({
  title,
  caption,
  active,
  color,
  icon,
  onClick,
}: {
  title: string;
  caption: string;
  active: boolean;
  color: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative text-left p-4 rounded-xl border transition-colors overflow-hidden"
      style={{
        borderColor: active ? color : "var(--border)",
        background: active ? "rgba(255, 248, 220, 0.55)" : "transparent",
      }}
    >
      <div
        aria-hidden
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none"
        style={{ background: color, opacity: active ? 0.15 : 0.04 }}
      />
      <div className="flex items-center gap-3 relative">
        <div className="shrink-0">{icon}</div>
        <div>
          <div className="italic-display text-base leading-tight">{title}</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-bone-mute mt-1">
            {caption}
          </div>
        </div>
      </div>
    </button>
  );
}

function PlayerChip({
  label,
  name,
  symbol,
  color,
}: {
  label: string;
  name: string;
  symbol: string;
  color: string;
}) {
  return (
    <div
      className="card-flat p-3 relative overflow-hidden"
      style={{ borderColor: color }}
    >
      <div
        aria-hidden
        className="absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl pointer-events-none"
        style={{ background: color, opacity: 0.08 }}
      />
      <div className="flex items-center justify-between gap-2 relative">
        <div className="text-[9px] uppercase tracking-[0.18em] text-bone-mute">
          {label}
        </div>
        <span
          className="text-base leading-none no-liga"
          style={{ color, fontWeight: 600 }}
        >
          {symbol}
        </span>
      </div>
      <div className="text-bone mt-1 truncate" title={name}>
        {name}
      </div>
    </div>
  );
}

function NameEditor({
  name,
  symbol,
  color,
  onName,
  onSymbol,
  symbolOpen,
  setSymbolOpen,
  caption,
}: {
  name: string;
  symbol: string;
  color: string;
  onName: (next: string) => void;
  onSymbol: (next: string) => void;
  symbolOpen: boolean;
  setSymbolOpen: (next: boolean) => void;
  caption: string;
}) {
  return (
    <div
      className="p-3 rounded-xl border bg-ink-900/40"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="text-[9px] uppercase tracking-[0.18em] text-bone-mute mb-2">
        your name
      </div>
      <div className="flex gap-2 items-stretch">
        <button
          type="button"
          onClick={() => setSymbolOpen(!symbolOpen)}
          className="w-11 h-11 rounded-full border flex items-center justify-center no-liga text-xl shrink-0"
          style={{ borderColor: color, color, fontWeight: 600 }}
          aria-label="change symbol"
          title="change symbol"
        >
          {symbol}
        </button>
        <input
          value={name}
          onChange={(e) => onName(e.target.value.slice(0, NAME_MAX))}
          placeholder="your name"
          maxLength={NAME_MAX}
          className="flex-1 h-11 px-3 bg-ink-900/60 border border-ink-500 rounded-full text-bone text-[14px] focus:border-bone-mute outline-none"
        />
      </div>
      <AnimatePresence initial={false}>
        {symbolOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="pt-3 grid grid-cols-6 gap-1.5">
              {SYMBOL_PRESETS.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => {
                    onSymbol(s);
                    setSymbolOpen(false);
                  }}
                  className="h-9 rounded-md border no-liga text-lg flex items-center justify-center transition-colors"
                  style={{
                    borderColor: s === symbol ? color : "var(--border)",
                    color: s === symbol ? color : "var(--text)",
                    background:
                      s === symbol ? "rgba(255, 248, 220, 0.6)" : "transparent",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-bone-mute">
        {caption}
      </div>
    </div>
  );
}
