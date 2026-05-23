"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSettings } from "@/lib/SettingsContext";

const fade = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
};

export default function AboutPage() {
  const { settings } = useSettings();
  const { p1, p2, accent } = settings.colors;

  return (
    <div className="px-5 md:px-10 pt-2 pb-20">
      <article className="max-w-3xl mx-auto">
        {/* ── hero ─────────────────────────────────────────────────── */}
        <header className="mt-2 mb-14">
          <div className="text-[10px] uppercase tracking-[0.14em] text-bone-mute">
            about
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="italic-display text-5xl md:text-7xl mt-3 tracking-[-0.03em] leading-[0.95]"
          >
            <span style={{ color: p1 }}>Pipopipette</span>
            <br />
            <span className="text-bone-dim">a modern two-player game.</span>
          </motion.h1>
          <p className="mt-6 text-base md:text-lg text-bone-dim max-w-prose leading-relaxed">
            A clean, fast, distraction-free version of dots &amp; boxes built
            for the modern web. Play on the same device or share a link and
            play in real time with a friend.
          </p>
          <div className="mt-7 dashed-edge" />
        </header>

        {/* ── what's in the app ────────────────────────────────────── */}
        <motion.section {...fade} className="mb-14">
          <SectionTag>what&apos;s in it</SectionTag>
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <Feature kicker="local play" title="Same device, two players" color={p1}>
              The default mode. Pass the phone, slide the laptop. No accounts,
              no signup — open the app and start.
            </Feature>
            <Feature kicker="online play" title="Live multiplayer" color={p2}>
              Share a room code or link to play live with a friend across the
              web. Direct peer-to-peer connection — no server in the middle.
            </Feature>
            <Feature kicker="theming" title="Palettes &amp; players" color={accent}>
              Choose from a set of curated themes or build your own. Name
              your players and pick a glyph for each.
            </Feature>
            <Feature kicker="grid sizes" title="From 3×3 to 8×8" color="#FFB627">
              Pick a quick 3×3 round or settle in for an 8×8 game. Six board
              sizes covering everything from a coffee-break match to a long
              evening.
            </Feature>
          </div>
        </motion.section>

        {/* ── how to play ──────────────────────────────────────────── */}
        <motion.section {...fade} className="mb-14">
          <SectionTag>how to play</SectionTag>
          <ol className="mt-6 space-y-4">
            <Rule n={1} accent={p1}>
              Players alternate turns. On your turn, draw a single line between
              two adjacent dots — horizontally or vertically.
            </Rule>
            <Rule n={2} accent={p1}>
              If your line closes the fourth side of a box, you{" "}
              <span style={{ color: p1 }}>claim it</span> and{" "}
              <span style={{ color: p1 }}>play again</span>.
            </Rule>
            <Rule n={3} accent={p1}>
              A single line can close two boxes at once — both are yours and
              you still play again.
            </Rule>
            <Rule n={4} accent={p1}>
              The game ends when every line has been drawn. Whoever owns the
              most boxes wins.
            </Rule>
          </ol>

          <div className="mt-7 card-flat p-5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-bone-mute mb-2">
              <span className="glow-dot" style={{ background: accent }} />
              quick reference
            </div>
            <ul className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-bone-dim">
              <li>
                <strong className="text-bone">drag</strong> between two dots to
                draw a line
              </li>
              <li>
                <strong className="text-bone">close a box</strong> → take it,
                play again
              </li>
              <li>
                <strong className="text-bone">close two</strong> → both yours,
                still your turn
              </li>
              <li>
                <strong className="text-bone">change board</strong> in Studio
                anytime
              </li>
            </ul>
          </div>
        </motion.section>

        {/* ── scoring ──────────────────────────────────────────────── */}
        <motion.section {...fade} className="mb-14">
          <SectionTag>scoring</SectionTag>
          <p className="mt-4 text-base md:text-lg text-bone leading-relaxed">
            Each box is worth one point. On an N×N board there are N² boxes in
            total — so on the default 5×5 board, the scores always sum to 25.
          </p>
          <div className="mt-5 grid sm:grid-cols-3 gap-3 text-sm">
            <ScoreCard label="3×3" total={9} note="a quick round" color={p1} />
            <ScoreCard label="5×5" total={25} note="the default" color={p2} />
            <ScoreCard label="8×8" total={64} note="for a long match" color={accent} />
          </div>
        </motion.section>

        {/* ── tips ─────────────────────────────────────────────────── */}
        <motion.section {...fade} className="mb-14">
          <SectionTag>tips</SectionTag>
          <ul className="mt-6 space-y-3 text-sm md:text-base text-bone-dim leading-relaxed">
            <Tip color={p1}>
              Try not to draw the third side of any box — your opponent will
              take the fourth.
            </Tip>
            <Tip color={p2}>
              Don&apos;t always take every box you can. Sometimes giving up
              two boxes forces your opponent into a worse spot.
            </Tip>
            <Tip color={accent}>
              Start on a small 3×3 board to get the feel. The larger sizes
              play the same — just with longer endings.
            </Tip>
          </ul>
        </motion.section>

        {/* ── why ──────────────────────────────────────────────────── */}
        <motion.section {...fade} className="mb-14">
          <SectionTag>why we built this</SectionTag>
          <p className="mt-4 text-base md:text-lg leading-relaxed text-bone-dim max-w-prose">
            Most digital versions of this game feel like worksheets — flat,
            joyless, full of menus. We wanted something that loads fast, feels
            calm, and gets out of your way. Drag your finger between two dots.
            Watch the line snap. That&apos;s the whole game.
          </p>
        </motion.section>

        <div className="dashed-edge mb-8" />

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="btn-primary">
            <span className="relative z-10">start a round →</span>
            <span className="sweep" style={{ background: p2 }} />
          </Link>
          <Link href="/settings" className="btn-ghost">
            open studio
          </Link>
        </div>
      </article>
    </div>
  );
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-bone-mute font-medium">
        {children}
      </div>
      <div className="flex-1 h-px bg-ink-500" />
    </div>
  );
}

function Rule({ n, accent, children }: { n: number; accent: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-5 items-start">
      <span
        className="italic-display text-3xl leading-none mt-1 shrink-0 tabular"
        style={{ color: accent }}
      >
        {n}.
      </span>
      <span className="text-base md:text-lg text-bone leading-relaxed">{children}</span>
    </li>
  );
}

function Feature({
  kicker,
  title,
  body,
  color,
  children,
}: {
  kicker: string;
  title: string;
  body?: string;
  color: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card-flat p-5 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none"
        style={{ background: color, opacity: 0.12 }}
      />
      <div
        className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] relative font-medium"
        style={{ color }}
      >
        <span className="glow-dot inline-block" style={{ background: color }} />
        {kicker}
      </div>
      <h3 className="italic-display text-xl mt-2 relative">{title}</h3>
      <p className="mt-2 text-sm text-bone-dim leading-relaxed relative">
        {body ?? children}
      </p>
    </div>
  );
}

function ScoreCard({
  label,
  total,
  note,
  color,
}: {
  label: string;
  total: number;
  note: string;
  color: string;
}) {
  return (
    <div className="card-flat p-4 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl pointer-events-none"
        style={{ background: color, opacity: 0.14 }}
      />
      <div
        className="text-[10px] uppercase tracking-[0.14em] relative font-medium"
        style={{ color }}
      >
        {label}
      </div>
      <div className="italic-display text-3xl mt-1 tabular relative">{total}</div>
      <div className="text-[11px] text-bone-mute relative mt-0.5">{note}</div>
    </div>
  );
}

function Tip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 items-start">
      <span
        aria-hidden
        className="mt-2 w-2 h-2 rounded-full shrink-0"
        style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
      />
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
