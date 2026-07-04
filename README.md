# Study Mog — Multiplayer Pomodoro Accountability

> Stay locked in. Catch your friends slacking.

A real-time multiplayer study app where you and your friends hold each other accountable with **Mog Checks** — surprise webcam challenges that prove you're actually studying.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS v4, Glassmorphism dark UI |
| **Backend** | Node.js, Express, TypeScript |
| **Real-time** | Socket.IO v4 (WebSockets) |
| **Webcam** | Browser MediaDevices API |
| **Extras** | canvas-confetti, UUID |

---

## Features

- **Synced Pomodoro timer** — server-authoritative, all clients stay in lockstep
- **Mog Check system** — send a surprise 60s webcam challenge to any participant
- **Aura leaderboard** — live score tracking for the full room session
- **Webcam selfie proof** — photo captured and shown as a thumbnail on your card
- **Session recap** — MVP crown, Aura breakdown, and host controls after each round
- **Host migration** — room stays alive if the host disconnects
- **Confetti + alarm SFX** — because vibes matter

---

## Aura Scoring

| Action | Aura |
|---|---|
| Finish a focus session | +50 |
| Pass a Mog Check | +25 |
| Fail / cancel a Mog Check | −30 |
| Your check target passes | +10 |

---

## Getting Started

**Requirements:** Node 20+, npm

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

Open **http://localhost:3000** in your browser.

---

## Quick Demo (two windows)

### Window A — Host
1. Click **"Create Study Room"**
2. Enter a name (e.g. `Academic Weapon`)
3. Set Focus to **1 min**, Mog Check Cooldown to **0 min**
4. Click **"Create Room"** — copy the 6-char room code

### Window B — Joiner
1. Click **"Join Study Room"**
2. Enter a different name (e.g. `Doomscroller`)
3. Paste the room code → **"Join Room"**

### Run it
1. **Window A:** Click **"▶ Start Focus"** — both windows show the synced countdown
2. **Window A:** Click **"🚨 Mog Check"** on Window B's card
3. **Window B:** Gets a fullscreen modal with webcam + 60s to respond
4. **Pass:** Take Photo → Submit Proof → confetti fires, Aura goes up
5. **Fail:** Click Cancel → "Bro folded" toast, −30 Aura
6. **Timer expires:** Recap screen with MVP crown and host controls
