# Study Mog — Multiplayer Pomodoro Accountability

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=for-the-badge&logo=socketdotio)](https://socket.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

> Stay locked in. Catch your friends slacking.

---

## Overview

**Study Mog** is a real-time multiplayer Pomodoro app built around social accountability. Studying alone is easy to fake — studying with Mog Checks isn't.

Any participant can send a **Mog Check** to another at any time: a fullscreen alert with a 60-second countdown and a live webcam feed. The target has to snap a photo proving they're actually at their desk. Pass, and you earn Aura. Fold, and you lose it. The server enforces every timer, every timeout, and every score — no client-side cheating.

At the end of each session, a recap screen crowns the **Session MVP**, breaks down each player's Aura gain/loss, and gives the host controls to kick off a break or start fresh.

---

## Features

- **Server-authoritative Pomodoro timer** — all clients share one canonical countdown; no drift, no desync
- **Mog Check system** — send a surprise 60s webcam challenge to any participant at any time
- **Webcam selfie proof** — photo captured in-browser and displayed as a live thumbnail on the sender's card
- **Aura leaderboard** — real-time score tracking across the full room session with tiebreaker logic
- **Session recap** — MVP crown, per-player Aura breakdown, and host controls after every round
- **Host migration** — room stays alive and fully functional if the original host disconnects
- **Confetti + alarm SFX** — pass a check and confetti fires; receive one and an alarm sounds

---

## Aura Scoring

| Action | Aura |
|---|---|
| Finish a focus session | +50 |
| Pass a Mog Check | +25 |
| Fail / cancel a Mog Check | −30 |
| Your check target passes | +10 |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | [Next.js 16](https://nextjs.org/) |
| UI Library | [React 19](https://react.dev/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/), Glassmorphism dark UI |
| Real-time | [Socket.IO v4](https://socket.io/) (WebSockets) |
| Backend | [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) |
| Language | TypeScript 5 (frontend + backend) |
| Webcam | Browser MediaDevices API |
| Extras | canvas-confetti, UUID |

---

## Project Structure

```
.
├── backend/
│   └── src/
│       └── index.ts          # Express server, Socket.IO event handlers, game state
└── frontend/
    └── src/
        └── app/              # Next.js app directory — pages, components, styles
```

---

## Getting Started

**Requirements:** Node.js 20+, npm

### 1. Backend (port 3001)

```bash
cd backend
npm install
npm run dev
```

### 2. Frontend (port 3000)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Quick Demo (two windows)

### Window A — Host
1. Click **"Create Study Room"**
2. Enter a name (e.g. `Academic Weapon`)
3. Set Focus to **1 min**, Mog Check Cooldown to **0 min**
4. Click **"Create Room"** — copy the 6-char room code from the header

### Window B — Joiner
1. Click **"Join Study Room"**
2. Enter a different name (e.g. `Doomscroller`)
3. Paste the room code → **"Join Room"**

### Run it
1. **Window A:** Click **"▶ Start Focus"** — both windows show the synced countdown
2. **Window A:** Click **"🚨 Mog Check"** on Window B's card
3. **Window B:** Gets a fullscreen modal with live webcam + 60s to respond
4. **Pass path:** Take Photo → Submit Proof → confetti fires, Aura goes up
5. **Fail path:** Click Cancel → "Bro folded" toast, −30 Aura
6. **Timer expires:** Recap screen with MVP crown and host controls to continue

---

## Controls

| Action | Result |
|---|---|
| ▶ Start Focus | Starts the synced countdown for all participants |
| 🚨 Mog Check | Sends a 60s webcam challenge to the target player |
| Take Photo | Captures a still from the webcam feed as proof |
| Submit Proof | Passes the check — earns Aura for both players |
| ✕ Cancel | Fails the check — loses Aura, "Bro folded" toast fires |

---

*Study hard. Mog harder.*
