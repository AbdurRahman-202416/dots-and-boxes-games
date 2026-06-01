# Pipopipette — Dots & Boxes Games

A clean, fast, two-player **dots & boxes** game built with Next.js 15 and
React 19. Play across the same device or live across the web with a
friend over a direct peer-to-peer connection.

![status](https://img.shields.io/badge/status-production-ready-green)
![next](https://img.shields.io/badge/next.js-15.1-black)
![react](https://img.shields.io/badge/react-19-blue)
![typescript](https://img.shields.io/badge/typescript-strict-blue)

---

## Features

- **Local play** — pass-and-play on a single device. No accounts, no
  signup.
- **Live multiplayer** — share a room code or link to play in real time
  over WebRTC (peer-to-peer, no server in the middle).
- **Six grid sizes** — from a quick `3×3` round to a full `8×8` match.
- **Themes & palettes** — eight curated palettes or build your own from
  scratch.
- **Custom players** — name each player and pick a glyph from a preset
  list or any character you like.
- **Touch-first** — drag between two dots to draw a line. Designed
  primarily for phones and tablets, fully responsive on desktop.
- **Confetti & game-over modal** — a small flourish when a round ends.
- **Persisted settings** — everything saves itself to local storage.

---

## How to Play

1. Players alternate turns. On your turn, draw a single line between
   two **adjacent** dots — horizontally or vertically only.
2. If your line completes the fourth side of a `1×1` box, you **claim
   it** with your symbol and **play again**.
3. A single line can close **two** boxes at once. Both are yours and
   you still play again.
4. The game ends when every line has been drawn. Whoever owns the most
   boxes wins.

Scoring: every box is worth **one point**. On an `N×N` board there are
`N²` boxes in total, so on the default `5×5` board the scores always
sum to `25`.

---

## Tech Stack

| Layer       | Tech                                |
| ----------- | ----------------------------------- |
| Framework   | [Next.js 15](https://nextjs.org/) (App Router) |
| Language    | TypeScript (strict mode)            |
| UI          | React 19                            |
| Styling     | Tailwind CSS 3                      |
| Animation   | Framer Motion 11                    |
| Multiplayer | [PeerJS](https://peerjs.com/) (WebRTC) |
| Typography  | Inter (Google Fonts)                |

---

## Getting Started

### Prerequisites

- Node.js **18.18+** (or 20+)
- npm / pnpm / yarn

### Installation

```bash
git clone <your-repo-url> dots-and-boxes-games
cd dots-and-boxes-games
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

---

## Project Structure

```
.
├── app/                      # Next.js App Router pages
│   ├── about/page.tsx        # About page
│   ├── settings/page.tsx     # Studio — themes, players, grid
│   ├── globals.css           # Global styles, design tokens
│   ├── icon.svg              # Favicon (3×3 lattice)
│   ├── layout.tsx            # Root layout, fonts, footer
│   ├── page.tsx              # Game arena (home)
│   └── providers.tsx         # Context providers
├── components/
│   ├── ColorTheme.tsx        # Applies live theme CSS vars
│   ├── Confetti.tsx          # Win celebration
│   ├── GameBoard.tsx         # The lattice + drag-to-draw input
│   ├── GameOverModal.tsx     # End-of-round dialog
│   ├── MultiplayerPanel.tsx  # Room create/join UI
│   ├── Nav.tsx               # Top navigation
│   └── Scoreboard.tsx        # Live score cards
├── lib/
│   ├── GameContext.tsx       # Game state + moves
│   ├── SettingsContext.tsx   # Persisted settings
│   ├── MultiplayerContext.tsx
│   ├── useWebRTCGame.ts      # PeerJS hook
│   ├── gameLogic.ts          # Pure rules engine
│   └── types.ts              # Shared types & presets
├── tailwind.config.ts
└── next.config.mjs
```

---

## Deployment

The app is a standard Next.js project and deploys to any host that
supports Node.js or static export.

### Vercel (recommended)

1. Push the repo to GitHub / GitLab / Bitbucket.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Accept the defaults — Vercel auto-detects Next.js.

### Self-hosted

```bash
npm run build
npm start                  # default: http://localhost:3000
PORT=8080 npm start        # custom port
```

Run behind a reverse proxy (nginx, Caddy) or in a Node container.

### Static export

The app uses only client components for stateful pages, so a static
export works:

```bash
npm run build
npx next export             # generates ./out
```

> Note: live multiplayer needs a working PeerJS signaling server.
> PeerJS uses its public broker by default — for production you may
> want to host your own.

---

## Settings & Persistence

Settings are stored in `localStorage` under the keys used by
`SettingsContext`. Clearing browser storage resets to defaults
(`Inkwell` palette, `5×5` grid, players "Tom" and "Jerry").

---

## Roadmap

- [ ] AI opponent (easy / medium / hard)
- [ ] Move history & undo
- [ ] PWA install + offline play
- [ ] Spectator mode for live rooms
- [ ] Tournament mode (best-of-N)

---

## License

© 2026 Pipopipette. All rights reserved.
# dots-and-boxes-games
