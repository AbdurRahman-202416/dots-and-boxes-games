"use client";

import { useSettings } from "@/lib/SettingsContext";
import { useEffect } from "react";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace("#", "");
  if (m.length !== 3 && m.length !== 6) return null;
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function tint(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function ColorTheme() {
  const { settings, hydrated } = useSettings();
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    const { p1, p2, accent } = settings.colors;
    root.style.setProperty("--p1", p1);
    root.style.setProperty("--p2", p2);
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--p1-15", tint(p1, 0.15));
    root.style.setProperty("--p2-15", tint(p2, 0.15));
    root.style.setProperty("--p1-06", tint(p1, 0.06));
    root.style.setProperty("--p2-06", tint(p2, 0.06));
    root.style.setProperty("--accent-12", tint(accent, 0.12));
  }, [settings.colors, hydrated]);
  return null;
}
