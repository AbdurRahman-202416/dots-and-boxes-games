"use client";

import { ReactNode } from "react";
import { SettingsProvider } from "@/lib/SettingsContext";
import { GameProvider } from "@/lib/GameContext";
import { MultiplayerProvider } from "@/lib/MultiplayerContext";
import { ColorTheme } from "@/components/ColorTheme";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <ColorTheme />
      <GameProvider>
        <MultiplayerProvider>{children}</MultiplayerProvider>
      </GameProvider>
    </SettingsProvider>
  );
}
