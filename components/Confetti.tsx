"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const SHAPES = ["square", "circle", "bar", "triangle"] as const;
type Shape = (typeof SHAPES)[number];

function Piece({ colors }: { colors: string[] }) {
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const left = rand(-10, 110);
  const delay = rand(0, 0.6);
  const dur = rand(2.2, 3.8);
  const xDrift = rand(-40, 40);
  const rot = rand(-720, 720);
  const size = rand(6, 14);
  const shape: Shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];

  const style: React.CSSProperties = {
    position: "absolute",
    top: -20,
    left: `${left}%`,
    width: size,
    height: shape === "bar" ? size / 3 : size,
    backgroundColor: shape === "triangle" ? "transparent" : color,
    borderRadius: shape === "circle" ? "50%" : shape === "bar" ? 1 : 0,
  };

  if (shape === "triangle") {
    style.width = 0;
    style.height = 0;
    style.borderLeft = `${size / 2}px solid transparent`;
    style.borderRight = `${size / 2}px solid transparent`;
    style.borderBottom = `${size}px solid ${color}`;
  }

  return (
    <motion.span
      style={style}
      initial={{ y: -40, x: 0, rotate: 0, opacity: 1 }}
      animate={{
        y: "120vh",
        x: xDrift,
        rotate: rot,
        opacity: [1, 1, 0.9, 0],
      }}
      transition={{ duration: dur, delay, ease: "easeIn" }}
    />
  );
}

export function Confetti({ active, count = 90 }: { active: boolean; count?: number }) {
  const [themeColors, setThemeColors] = useState<string[]>([]);

  useEffect(() => {
    if (!active) return;
    const styles = getComputedStyle(document.documentElement);
    const get = (k: string) => styles.getPropertyValue(k).trim();
    setThemeColors(
      [get("--p1"), get("--p2"), get("--accent"), "#1C1605", "#B45309"].filter(Boolean)
    );
  }, [active]);

  if (!active || themeColors.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-[60]">
      {Array.from({ length: count }).map((_, i) => (
        <Piece key={i} colors={themeColors} />
      ))}
    </div>
  );
}
