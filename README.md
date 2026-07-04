# 😤 Study Mog — Multiplayer Pomodoro Accountability

> Stay locked in. Catch your friends slacking.

## Setup

**Requirements:** Node 20+, npm

### 1. Install & run the backend (port 3001)
```bash
cd backend
npm install
npm run dev
```

### 2. Install & run the frontend (port 3000)
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** in your browser (or two windows for multiplayer).

---

## Demo Script (two-window happy path for judges)

### Window A (Host)
1. Go to http://localhost:3000
2. Click **"Create Study Room"**
3. Enter a display name (e.g. `Academic Weapon`)
4. Set Focus to **1 min** and Mog Check Cooldown to **0 min** for demo speed
5. Click **"Create Room"** — note the 6-character room code in the header

### Window B (Joiner)
1. Go to http://localhost:3000 in a second browser window
2. Click **"Join Study Room"**
3. Enter a different display name (e.g. `Doomscroller`)
4. Enter the room code from Window A
5. Click **"Join Room"**

### Run the demo
6. **Window A (host):** Click **"▶ Start Focus"** — both windows show the same synced countdown
7. **Send a Mog Check:** Window A clicks **"🚨 Mog Check"** on Window B's card
8. **Window B** gets a fullscreen 🚨 MOG CHECK modal with webcam + 60s countdown
9. **Pass path:** Click "Take Photo" → "Submit Proof" → confetti fires, status → 📸 Mog Certified, Aura updates
10. **Fail path:** Send another check (after cooldown) → in Window B, click "✕ Cancel" → "Bro folded" toast, −30 Aura
11. **Timer expires** (or host resets) → Recap screen with Aura breakdown, Session MVP crown, and host controls to start break or new session

---

## Scoring
| Action | Aura |
|---|---|
| Finish a focus session | +50 |
| Pass a Mog Check | +25 |
| Fail a Mog Check | −30 |
| Target passes your check | +10 |

## Features
- Server-authoritative Pomodoro timer (all clients synced)
- Mog Check system with 60s server-enforced timeout
- Webcam selfie capture and Base64 thumbnail on participant card
- Aura leaderboard (persists for room lifetime)
- Session recap with MVP tiebreakers
- Host migration on disconnect
- Confetti on check pass, alarm sound on check received
- Glassmorphism dark-mode UI
