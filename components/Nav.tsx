"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useSettings } from "@/lib/SettingsContext";

const items = [
  { href: "/", label: "play" },
  { href: "/settings", label: "studio" },
  { href: "/about", label: "story" },
];

export function Nav() {
  const pathname = usePathname();
  const { settings } = useSettings();
  return (
    <header className="px-5 md:px-10 py-5 flex items-center justify-between gap-6">
      <Link href="/" className="group flex items-center gap-3 select-none">
        <svg
          viewBox="0 0 32 32"
          aria-hidden
          className="w-9 h-9 shrink-0 transition-transform duration-500 group-hover:rotate-[8deg]"
        >
          <rect width="32" height="32" rx="7" fill="rgba(255,255,255,0.03)" />
          {/* captured top-left box (player one) */}
          <rect
            x="7"
            y="7"
            width="9"
            height="9"
            fill={settings.colors.p1}
            fillOpacity={0.18}
          />
          <path
            d="M7 7 L16 7 M16 7 L16 16 M16 16 L7 16 M7 16 L7 7"
            stroke={settings.colors.p1}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {/* a partial line by player two */}
          <line
            x1="16"
            y1="25"
            x2="25"
            y2="25"
            stroke={settings.colors.p2}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {/* 3×3 dot lattice */}
          <g fill="currentColor" className="text-bone">
            <circle cx="7" cy="7" r="1.5" />
            <circle cx="16" cy="7" r="1.5" />
            <circle cx="25" cy="7" r="1.5" />
            <circle cx="7" cy="16" r="1.5" />
            <circle cx="16" cy="16" r="1.5" />
            <circle cx="25" cy="16" r="1.5" />
            <circle cx="7" cy="25" r="1.5" />
            <circle cx="16" cy="25" r="1.5" />
            <circle cx="25" cy="25" r="1.5" />
          </g>
        </svg>
        <div className="flex items-baseline gap-2.5">
          <span className="italic-display text-xl leading-none tracking-tight">
            Pipopipette
          </span>
        </div>
      </Link>

      <nav className="flex items-center p-1 rounded-full border border-ink-500/60 bg-ink-800/60 backdrop-blur-md text-[11px] uppercase tracking-[0.18em]">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative px-3.5 md:px-4 py-1.5 text-bone-dim hover:text-bone transition-colors"
            >
              <span className="relative z-10">{item.label}</span>
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
