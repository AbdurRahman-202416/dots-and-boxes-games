import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pipopipette — a modern dots & boxes",
  description:
    "A clean, fast, two-player dots & boxes game. Play across the table or live across the web.",
  keywords: [
    "dots and boxes",
    "pipopipette",
    "two player game",
    "online multiplayer",
    "strategy game",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#E9DDB7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <Providers>
          <div className="relative min-h-[100dvh] flex flex-col">
            <Nav />
            <main className="flex-1 flex flex-col min-h-0">{children}</main>
            <footer className="px-5 md:px-10 py-4 sm:py-6 text-center text-[11px] text-bone-mute">
              © {new Date().getFullYear()} Pipopipette. All rights reserved.
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
